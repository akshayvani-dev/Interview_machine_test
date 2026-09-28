import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";

import { UserRole } from "../constants/user.js";
import { prisma } from "../lib/prisma.js";

import {
  assignIncidentSchema,
  createIncidentSchema,
  incidentIdParamsSchema,
  listIncidentsQuerySchema,
  updateIncidentSchema,
} from "../schemas/incident.schema.js";

import {
  getAuthenticatedAuth,
  getAuthenticatedUser,
} from "../utils/auth.js";

import { sendError } from "../utils/response.js";

import { createIncidentEvent } from "../services/incident-event.service.js";

import { IncidentEventType } from "../constants/incident.js";

const incidentAssigneeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

function mapIncidentWithAssignee<T extends { assignee: unknown }>({
  assignee,
  ...incident
}: T) {
  return {
    ...incident,
    assignedTo: assignee,
  };
}

/**
 * Create Incident
 *
 * MEMBER behavior:
 * - If assignedTo is not provided, automatically assign the incident
 *   to the member who created it.
 *
 * ADMIN / MANAGER behavior:
 * - If assignedTo is not provided, incident remains unassigned.
 */
export async function createIncident(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createIncidentSchema.safeParse(request.body);

  if (!validation.success) {
    sendValidationError(response, validation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const idempotencyKey = request.header("Idempotency-Key");

  if (!idempotencyKey) {
    sendError(response, 400, "Idempotency-Key header is required");
    return;
  }

  try {
    const existingIncident = await prisma.incident.findFirst({
      where: {
        orgId: auth.orgId,
        idempotencyKey,
      },
      include: {
        assignee: {
          select: incidentAssigneeSelect,
        },
      },
    });

    if (existingIncident) {
      response
        .status(200)
        .json(mapIncidentWithAssignee(existingIncident));
      return;
    }

    const { assignedTo, ...incidentData } = validation.data;

    /**
     * If a MEMBER creates an incident without assigning it,
     * automatically assign it to themselves.
     *
     * ADMIN/MANAGER keep the existing behavior:
     * no assignedTo means the incident remains unassigned.
     */
    const effectiveAssignedTo =
      auth.role === UserRole.MEMBER && !assignedTo
        ? auth.userId
        : assignedTo;

    /**
     * Validate that the final assignee belongs to the same organization.
     */
    if (effectiveAssignedTo) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: effectiveAssignedTo,
          orgId: auth.orgId,
        },
        select: {
          id: true,
        },
      });

      if (!assignee) {
        sendError(
          response,
          400,
          "Assigned user must belong to this organization",
        );
        return;
      }
    }

    const incident = await prisma.incident.create({
      data: {
        ...incidentData,
        assignedTo: effectiveAssignedTo ?? null,
        orgId: auth.orgId,
        createdBy: auth.userId,
        idempotencyKey,
      },
      include: {
        assignee: {
          select: incidentAssigneeSelect,
        },
      },
    });

    /**
     * Created event.
     */
    await createIncidentEvent({
      incidentId: incident.id,
      orgId: auth.orgId,
      userId: auth.userId,
      type: IncidentEventType.CREATED,
      metadata: {
        title: incident.title,
        severity: incident.severity,
        status: incident.status,
      },
    });

    /**
     * If the MEMBER was automatically assigned to themselves,
     * record the assignment as an event too.
     */
    if (
      auth.role === UserRole.MEMBER &&
      !assignedTo &&
      effectiveAssignedTo
    ) {
      await createIncidentEvent({
        incidentId: incident.id,
        orgId: auth.orgId,
        userId: auth.userId,
        type: IncidentEventType.ASSIGNED,
        metadata: {
          from: null,
          to: effectiveAssignedTo,
        },
      });
    }

    response
      .status(201)
      .json(mapIncidentWithAssignee(incident));
  } catch (error) {
    console.error("Incident creation failed", error);
    sendError(response, 500, "Unable to create incident");
  }
}

/**
 * Update Incident
 *
 * Optimistic concurrency:
 * Client sends the version it originally loaded.
 * Update succeeds only if DB version still matches.
 *
 * Event behavior:
 * - No actual change -> no event, no notification, no version increment.
 * - Only status changed -> STATUS_CHANGED event.
 * - Only severity changed -> SEVERITY_CHANGED event.
 * - Only assignment changed -> ASSIGNED event.
 * - Only title/description changed -> UPDATED event.
 * - Multiple change categories -> ONE UPDATED event.
 */
export async function updateIncident(
  request: Request,
  response: Response,
): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(
    request.params,
  );

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const bodyValidation = updateIncidentSchema.safeParse(
    request.body,
  );

  if (!bodyValidation.success) {
    sendValidationError(response, bodyValidation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { id } = paramsValidation.data;
  const { version, assignedTo, ...data } = bodyValidation.data;

  try {
    /**
     * Load the current incident state before deciding whether
     * anything actually changed.
     */
    const currentIncident = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      select: {
        title: true,
        description: true,
        status: true,
        severity: true,
        assignedTo: true,
        version: true,
      },
    });

    if (!currentIncident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    /**
     * Optimistic concurrency check.
     *
     * Do this before the no-change check so a stale client
     * still receives VERSION_CONFLICT.
     */
    if (currentIncident.version !== version) {
      response.status(409).json({
        error: {
          message: "VERSION_CONFLICT",
          currentVersion: currentIncident.version,
        },
      });

      return;
    }

    /**
     * Validate assignee before performing the update.
     */
    if (assignedTo !== undefined && assignedTo !== null) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedTo,
          orgId: auth.orgId,
        },
        select: {
          id: true,
        },
      });

      if (!assignee) {
        sendError(
          response,
          400,
          "Assigned user must belong to this organization",
        );
        return;
      }
    }

    /**
     * Determine ACTUAL changes.
     *
     * A field being present in the request does not mean
     * that the incident actually changed.
     */
    const titleChanged =
      data.title !== undefined &&
      data.title !== currentIncident.title;

    const descriptionChanged =
      data.description !== undefined &&
      data.description !== currentIncident.description;

    const statusChanged =
      data.status !== undefined &&
      data.status !== currentIncident.status;

    const severityChanged =
      data.severity !== undefined &&
      data.severity !== currentIncident.severity;

    const assignmentChanged =
      assignedTo !== undefined &&
      assignedTo !== currentIncident.assignedTo;

    const hasActualChanges =
      titleChanged ||
      descriptionChanged ||
      statusChanged ||
      severityChanged ||
      assignmentChanged;

    /**
     * Nothing actually changed.
     *
     * Do not:
     * - update the database
     * - increment version
     * - create an incident event
     * - create a notification
     */
    if (!hasActualChanges) {
      const incident = await prisma.incident.findFirst({
        where: {
          id,
          orgId: auth.orgId,
        },
        include: {
          assignee: {
            select: incidentAssigneeSelect,
          },
        },
      });

      if (!incident) {
        sendError(response, 404, "Incident not found");
        return;
      }

      response
        .status(200)
        .json(mapIncidentWithAssignee(incident));

      return;
    }

    /**
     * Build only the fields that actually changed.
     */
  const updateData: Prisma.IncidentUpdateManyMutationInput & { assignedTo?: string | null; } = { version: { increment: 1, }, }; if (titleChanged && data.title !== undefined) { updateData.title = data.title; } 
  if (descriptionChanged && data.description !== undefined) { updateData.description = data.description; } 
  if (severityChanged && data.severity !== undefined) { updateData.severity = data.severity; } if (statusChanged && data.status !== undefined) { updateData.status = data.status; }
   if (assignmentChanged && assignedTo !== undefined) { updateData.assignedTo = assignedTo; }

    /**
     * Update using optimistic concurrency.
     */
    const result = await prisma.incident.updateMany({
      where: {
        id,
        orgId: auth.orgId,
        version,
      },
      data: updateData,
    });

    if (result.count === 0) {
      const current = await prisma.incident.findFirst({
        where: {
          id,
          orgId: auth.orgId,
        },
        select: {
          version: true,
        },
      });

      if (!current) {
        sendError(response, 404, "Incident not found");
        return;
      }

      response.status(409).json({
        error: {
          message: "VERSION_CONFLICT",
          currentVersion: current.version,
        },
      });

      return;
    }

    /**
     * Determine how many categories changed.
     *
     * Example:
     *
     * severity only
     *   -> 1
     *
     * status only
     *   -> 1
     *
     * title + description
     *   -> 1
     *
     * severity + title
     *   -> 2
     */
    const changeCategories = [
      statusChanged,
      severityChanged,
      assignmentChanged,
      titleChanged || descriptionChanged,
    ].filter(Boolean).length;

    /**
     * Create EXACTLY ONE incident event per API update.
     */
    if (changeCategories === 1) {
      /**
       * Status changed only.
       */
      if (statusChanged) {
        await createIncidentEvent({
          incidentId: id,
          orgId: auth.orgId,
          userId: auth.userId,
          type: IncidentEventType.STATUS_CHANGED,
          metadata: {
            from: currentIncident.status,
            to: data.status,
          },
        });
      }

      /**
       * Severity changed only.
       */
      else if (severityChanged) {
        await createIncidentEvent({
          incidentId: id,
          orgId: auth.orgId,
          userId: auth.userId,
          type: IncidentEventType.SEVERITY_CHANGED,
          metadata: {
            from: currentIncident.severity,
            to: data.severity,
          },
        });
      }

      /**
       * Assignment changed only.
       */
      else if (assignmentChanged) {
        await createIncidentEvent({
          incidentId: id,
          orgId: auth.orgId,
          userId: auth.userId,
          type: IncidentEventType.ASSIGNED,
          metadata: {
            from: currentIncident.assignedTo,
            to: assignedTo,
          },
        });
      }

      /**
       * Title or description changed only.
       */
      else {
        await createIncidentEvent({
          incidentId: id,
          orgId: auth.orgId,
          userId: auth.userId,
          type: IncidentEventType.UPDATED,
          metadata: {
            fields: [
              ...(titleChanged ? ["title"] : []),
              ...(descriptionChanged ? ["description"] : []),
            ],
          },
        });
      }
    } else {
      /**
       * Multiple change categories happened in the same API
       * request.
       *
       * Still create exactly ONE event and ONE notification.
       */
      await createIncidentEvent({
        incidentId: id,
        orgId: auth.orgId,
        userId: auth.userId,
        type: IncidentEventType.UPDATED,
        metadata: {
          fields: [
            ...(titleChanged ? ["title"] : []),
            ...(descriptionChanged ? ["description"] : []),
            ...(statusChanged ? ["status"] : []),
            ...(severityChanged ? ["severity"] : []),
            ...(assignmentChanged ? ["assignedTo"] : []),
          ],
        },
      });
    }

    /**
     * Return updated incident.
     */
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      include: {
        assignee: {
          select: incidentAssigneeSelect,
        },
      },
    });

    if (!incident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    response
      .status(200)
      .json(mapIncidentWithAssignee(incident));
  } catch (error) {
    console.error("Incident update failed", error);
    sendError(response, 500, "Unable to update incident");
  }
}

/**
 * Delete Incident
 */
export async function deleteIncident(
  request: Request,
  response: Response,
): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(
    request.params,
  );

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  try {
    const result = await prisma.incident.deleteMany({
      where: {
        id: paramsValidation.data.id,
        orgId: auth.orgId,
      },
    });

    if (result.count === 0) {
      sendError(response, 404, "Incident not found");
      return;
    }

    response.status(204).send();
  } catch (error) {
    console.error("Incident deletion failed", error);
    sendError(response, 500, "Unable to delete incident");
  }
}

/**
 * Assign Incident
 *
 * Uses optimistic concurrency exactly like updateIncident.
 */
export async function assignIncident(
  request: Request,
  response: Response,
): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(
    request.params,
  );

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const bodyValidation = assignIncidentSchema.safeParse(
    request.body,
  );

  if (!bodyValidation.success) {
    sendValidationError(response, bodyValidation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { id } = paramsValidation.data;
  const { assignedTo, version } = bodyValidation.data;

  try {
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignedTo,
        orgId: auth.orgId,
      },
      select: {
        id: true,
      },
    });

    if (!assignee) {
      sendError(
        response,
        400,
        "Assigned user must belong to this organization",
      );
      return;
    }

    const currentIncident = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      select: {
        assignedTo: true,
        version: true,
      },
    });

    if (!currentIncident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    /**
     * If assignment is already the requested assignment,
     * do not create an event or notification.
     */
    if (currentIncident.assignedTo === assignedTo) {
      if (currentIncident.version !== version) {
        response.status(409).json({
          error: {
            message: "VERSION_CONFLICT",
            currentVersion: currentIncident.version,
          },
        });

        return;
      }

      const incident = await prisma.incident.findFirst({
        where: {
          id,
          orgId: auth.orgId,
        },
        include: {
          assignee: {
            select: incidentAssigneeSelect,
          },
        },
      });

      if (!incident) {
        sendError(response, 404, "Incident not found");
        return;
      }

      response
        .status(200)
        .json(mapIncidentWithAssignee(incident));

      return;
    }

    const result = await prisma.incident.updateMany({
      where: {
        id,
        orgId: auth.orgId,
        version,
      },
      data: {
        assignedTo,
        version: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      const current = await prisma.incident.findFirst({
        where: {
          id,
          orgId: auth.orgId,
        },
        select: {
          version: true,
        },
      });

      if (!current) {
        sendError(response, 404, "Incident not found");
        return;
      }

      response.status(409).json({
        error: {
          message: "VERSION_CONFLICT",
          currentVersion: current.version,
        },
      });

      return;
    }

    await createIncidentEvent({
      incidentId: id,
      orgId: auth.orgId,
      userId: auth.userId,
      type: IncidentEventType.ASSIGNED,
      metadata: {
        from: currentIncident.assignedTo,
        to: assignedTo,
      },
    });

    const incident = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      include: {
        assignee: {
          select: incidentAssigneeSelect,
        },
      },
    });

    if (!incident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    response
      .status(200)
      .json(mapIncidentWithAssignee(incident));
  } catch (error) {
    console.error("Incident assignment failed", error);
    sendError(response, 500, "Unable to assign incident");
  }
}

/**
 * List Incidents
 */
export async function listIncidents(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedAuth(request, response);
  if (!auth) return;

  if (
    "orgId" in request.query ||
    "orgId" in request.params ||
    (request.body &&
      typeof request.body === "object" &&
      "orgId" in request.body)
  ) {
    sendError(
      response,
      400,
      "orgId cannot be provided in request parameters or body",
    );
    return;
  }

  const queryValidation = listIncidentsQuerySchema.safeParse(
    request.query,
  );

  if (!queryValidation.success) {
    sendValidationError(response, queryValidation.error.issues);
    return;
  }

  const {
    page,
    pageSize,
    limit: queryLimit,
    severity,
    status,
    assignedTo,
    from,
    to,
  } = queryValidation.data;

  const limit = pageSize ?? queryLimit;
  const skip = (page - 1) * limit;

  const incidentWhere: Prisma.IncidentWhereInput = {
    orgId: auth.orgId,

    ...(auth.type === "user" && auth.role === UserRole.MEMBER
      ? {
          assignedTo: auth.userId,
        }
      : {}),

    ...(severity !== undefined
      ? {
          severity,
        }
      : {}),

    ...(status !== undefined
      ? {
          status,
        }
      : {}),

    ...(assignedTo !== undefined
      ? {
          assignedTo,
        }
      : {}),

    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  try {
    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where: incidentWhere,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          assignee: {
            select: incidentAssigneeSelect,
          },
        },
      }),

      prisma.incident.count({
        where: incidentWhere,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    response.status(200).json({
      data: incidents.map(mapIncidentWithAssignee),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Incidents listing failed", error);
    sendError(response, 500, "Unable to list incidents");
  }
}

/**
 * Get Incident By ID
 */
export async function getIncidentById(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  if (
    "orgId" in request.query ||
    (request.body &&
      typeof request.body === "object" &&
      "orgId" in request.body)
  ) {
    sendError(
      response,
      400,
      "orgId cannot be provided in request parameters or body",
    );
    return;
  }

  const paramsValidation = incidentIdParamsSchema.safeParse(
    request.params,
  );

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const { id } = paramsValidation.data;

  try {
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        orgId: auth.orgId,
      },
      include: {
        assignee: {
          select: incidentAssigneeSelect,
        },
      },
    });

    if (!incident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    if (
      auth.role === UserRole.MEMBER &&
      incident.assignedTo !== auth.userId
    ) {
      sendError(
        response,
        403,
        "You do not have permission to access this incident",
      );
      return;
    }

    response
      .status(200)
      .json(mapIncidentWithAssignee(incident));
  } catch (error) {
    console.error("Incident retrieval failed", error);
    sendError(response, 500, "Unable to retrieve incident");
  }
}

function sendValidationError(
  response: Response,
  issues: ReadonlyArray<{ message: string }>,
): void {
  sendError(
    response,
    400,
    issues[0]?.message ?? "Invalid request body",
  );
}

