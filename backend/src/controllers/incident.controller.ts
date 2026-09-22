import type { Request, Response } from "express";

import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  assignIncidentSchema,
  createIncidentSchema,
  incidentIdParamsSchema,
  listIncidentsQuerySchema,
  updateIncidentSchema,
} from "../schemas/incident.schema.js";
import { getAuthenticatedAuth, getAuthenticatedUser } from "../utils/auth.js";
import { sendError } from "../utils/response.js";

export async function createIncident(request: Request, response: Response): Promise<void> {
  const validation = createIncidentSchema.safeParse(request.body);
  if (!validation.success) {
    sendValidationError(response, validation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  try {
    const incident = await prisma.incident.create({
      data: { ...validation.data, orgId: auth.orgId, createdBy: auth.userId },
    });
    response.status(201).json(incident);
  } catch (error) {
    console.error("Incident creation failed", error);
    sendError(response, 500, "Unable to create incident");
  }
}

export async function updateIncident(request: Request, response: Response): Promise<void> {
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
  const { version, ...data } = bodyValidation.data;

  try {
    const updateData: Prisma.IncidentUpdateManyMutationInput = {
      version: { increment: 1 },
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.status !== undefined) updateData.status = data.status;

    const result = await prisma.incident.updateMany({
      where: { id, orgId: auth.orgId, version },
      data: updateData,
    });

    if (result.count === 0) {
      const current = await prisma.incident.findFirst({
        where: { id, orgId: auth.orgId },
        select: { version: true },
      });

      if (!current) {
        sendError(response, 404, "Incident not found");
        return;
      }

      response.status(409).json({
        error: { message: "VERSION_CONFLICT", currentVersion: current.version },
      });
      return;
    }

    const incident = await prisma.incident.findFirst({ where: { id, orgId: auth.orgId } });
    if (!incident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    response.status(200).json(incident);
  } catch (error) {
    console.error("Incident update failed", error);
    sendError(response, 500, "Unable to update incident");
  }
}

export async function deleteIncident(request: Request, response: Response): Promise<void> {
  const paramsValidation = incidentIdParamsSchema.safeParse(request.params);
  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  try {
    const result = await prisma.incident.deleteMany({
      where: { id: paramsValidation.data.id, orgId: auth.orgId },
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

export async function assignIncident(request: Request, response: Response): Promise<void> {
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
  const { assignedTo } = bodyValidation.data;

  try {
    const assignee = await prisma.user.findFirst({
      where: { id: assignedTo, orgId: auth.orgId },
      select: { id: true },
    });

    if (!assignee) {
      sendError(response, 400, "Assigned user must belong to this organization");
      return;
    }

    const result = await prisma.incident.updateMany({
      where: { id, orgId: auth.orgId },
      data: { assignedTo },
    });

    if (result.count === 0) {
      sendError(response, 404, "Incident not found");
      return;
    }

    const incident = await prisma.incident.findFirst({ where: { id, orgId: auth.orgId } });
    if (!incident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    response.status(200).json(incident);
  } catch (error) {
    console.error("Incident assignment failed", error);
    sendError(response, 500, "Unable to assign incident");
  }
}

export async function listIncidents(request: Request, response: Response): Promise<void> {
  const auth = getAuthenticatedAuth(request, response);
  if (!auth) return;

  if (
    "orgId" in request.query ||
    "orgId" in request.params ||
    (request.body && typeof request.body === "object" && "orgId" in request.body)
  ) {
    sendError(response, 400, "orgId cannot be provided in request parameters or body");
    return;
  }

  const queryValidation = listIncidentsQuerySchema.safeParse(request.query);
  if (!queryValidation.success) {
    sendValidationError(response, queryValidation.error.issues);
    return;
  }

  const page = queryValidation.data.page;
  const limit = queryValidation.data.pageSize ?? queryValidation.data.limit;
  const skip = (page - 1) * limit;

  try {
    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where: { orgId: auth.orgId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.incident.count({
        where: { orgId: auth.orgId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    response.status(200).json({
      data: incidents,
      incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Incidents listing failed", error);
    sendError(response, 500, "Unable to list incidents");
  }
}

export async function getIncidentById(request: Request, response: Response): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  if (
    "orgId" in request.query ||
    (request.body && typeof request.body === "object" && "orgId" in request.body)
  ) {
    sendError(response, 400, "orgId cannot be provided in request parameters or body");
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
      where: { id, orgId: auth.orgId },
    });

    if (!incident) {
      sendError(response, 404, "Incident not found");
      return;
    }

    if (incident.assignedTo !== auth.userId) {
      sendError(response, 403, "You do not have permission to access this incident");
      return;
    }

    response.status(200).json(incident);
  } catch (error) {
    console.error("Incident retrieval failed", error);
    sendError(response, 500, "Unable to retrieve incident");
  }
}

function sendValidationError(
  response: Response,
  issues: ReadonlyArray<{ message: string }>
): void {
  sendError(response, 400, issues[0]?.message ?? "Invalid request body");
}
