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

const incidentAssigneeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} satisfies Prisma.UserSelect;

function mapIncidentWithAssignee<
  T extends { assignee: unknown }
>({ assignee, ...incident }: T) {
  return {
    ...incident,
    assignedTo: assignee,
  };
}

/**
 * Create Incident
 */
export async function createIncident(
  request: Request,
  response: Response
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
    // Check if this request was already processed
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
      response.status(200).json(
        mapIncidentWithAssignee(existingIncident)
      );
      return;
    }

    const { assignedTo, ...incidentData } = validation.data;

    if (assignedTo) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedTo,
          orgId: auth.orgId,
        },
        select: { id: true },
      });

      if (!assignee) {
        sendError(
          response,
          400,
          "Assigned user must belong to this organization"
        );
        return;
      }
    }

    const incident = await prisma.incident.create({
      data: {
        ...incidentData,
        assignedTo: assignedTo ?? null,
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

    response.status(201).json(
      mapIncidentWithAssignee(incident)
    );
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
 */
export async function updateIncident(
  request: Request,
  response: Response
): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(request.params);

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const bodyValidation = updateIncidentSchema.safeParse(request.body);

  if (!bodyValidation.success) {
    sendValidationError(response, bodyValidation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { id } = paramsValidation.data;
  const { version, assignedTo, ...data } = bodyValidation.data;

  try {
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
          "Assigned user must belong to this organization"
        );
        return;
      }
    }

    const updateData: Prisma.IncidentUpdateManyMutationInput & {
      assignedTo?: string | null;
    } = {
      version: {
        increment: 1,
      },
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.severity !== undefined) {
      updateData.severity = data.severity;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }

    const result = await prisma.incident.updateMany({
      where: {
        id,
        orgId: auth.orgId,
        version,
      },
      data: updateData,
    });

    /**
     * No row updated can mean:
     * 1. Incident doesn't exist
     * 2. Version is stale
     */
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

    response.status(200).json(mapIncidentWithAssignee(incident));
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
  response: Response
): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(request.params);

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
  response: Response
): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(request.params);

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const bodyValidation = assignIncidentSchema.safeParse(request.body);

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
        "Assigned user must belong to this organization"
      );
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

    response.status(200).json(mapIncidentWithAssignee(incident));
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
  response: Response
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
      "orgId cannot be provided in request parameters or body"
    );
    return;
  }

  const queryValidation = listIncidentsQuerySchema.safeParse(request.query);

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
  response: Response
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
      "orgId cannot be provided in request parameters or body"
    );
    return;
  }

  const paramsValidation = incidentIdParamsSchema.safeParse(request.params);

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
        "You do not have permission to access this incident"
      );
      return;
    }

    response.status(200).json(mapIncidentWithAssignee(incident));
  } catch (error) {
    console.error("Incident retrieval failed", error);
    sendError(response, 500, "Unable to retrieve incident");
  }
}

function sendValidationError(
  response: Response,
  issues: ReadonlyArray<{ message: string }>
): void {
  sendError(
    response,
    400,
    issues[0]?.message ?? "Invalid request body"
  );
}