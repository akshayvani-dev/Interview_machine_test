import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  assignIncidentSchema,
  createIncidentSchema,
  incidentIdParamsSchema,
  updateIncidentSchema,
} from "../schemas/incident.schema.js";
import { sendError } from "../utils/response.js";

export async function createIncident(request: Request, response: Response): Promise<void> {
  const validation = createIncidentSchema.safeParse(request.body);
  if (!validation.success) {
    sendValidationError(response, validation.error.issues);
    return;
  }

  const auth = getUserAuth(request, response);
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

  const auth = getUserAuth(request, response);
  if (!auth) return;

  const { id } = paramsValidation.data;
  const { version, ...data } = bodyValidation.data;

  try {
    const result = await prisma.incident.updateMany({
      where: { id, orgId: auth.orgId, version },
      data: { ...data, version: { increment: 1 } },
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

  const auth = getUserAuth(request, response);
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

  const auth = getUserAuth(request, response);
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

function getUserAuth(
  request: Request,
  response: Response
): Extract<NonNullable<Request["auth"]>, { type: "user" }> | undefined {
  if (!request.auth) {
    sendError(response, 401, "Authentication token is required");
    return undefined;
  }

  if (request.auth.type !== "user") {
    sendError(response, 403, "A user authentication token is required");
    return undefined;
  }

  return request.auth;
}

function sendValidationError(
  response: Response,
  issues: ReadonlyArray<{ message: string }>
): void {
  sendError(response, 400, issues[0]?.message ?? "Invalid request body");
}
