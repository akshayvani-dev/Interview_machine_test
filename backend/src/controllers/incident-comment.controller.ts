import type { Request, Response } from "express";
import {
  createIncidentComment,
  getIncidentComments,
} from "../services/incident-comment.service.js";
import { getAuthenticatedUser } from "../utils/auth.js";
import { sendError } from "../utils/response.js";

export async function createIncidentCommentController(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { incidentId } = request.params;

  if (typeof incidentId !== "string") {
    sendError(response, 400, "Invalid incident ID");
    return;
  }

  const { content } = request.body;

  if (typeof content !== "string" || !content.trim()) {
    sendError(response, 400, "Comment content is required");
    return;
  }

  try {
    const comment = await createIncidentComment({
      incidentId,
      orgId: auth.orgId,
      userId: auth.userId,
      content: content.trim(),
    });

    response.status(201).json(comment);
  } catch (error) {
    if (error instanceof Error && error.message === "Incident not found") {
      sendError(response, 404, "Incident not found");
      return;
    }

    console.error("Comment creation failed", error);
    sendError(response, 500, "Unable to create comment");
  }
}

export async function getIncidentCommentsController(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { incidentId } = request.params;

  if (typeof incidentId !== "string") {
    sendError(response, 400, "Invalid incident ID");
    return;
  }

  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    sendError(response, 400, "Invalid pagination parameters");
    return;
  }

  try {
    const result = await getIncidentComments({
      incidentId,
      orgId: auth.orgId,
      page,
      limit,
    });

    response.status(200).json(result);
  } catch (error) {
    console.error("Incident comments retrieval failed", error);
    sendError(response, 500, "Unable to retrieve comments");
  }
}
