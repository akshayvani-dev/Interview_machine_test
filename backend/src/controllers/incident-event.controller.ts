import type { Request, Response } from "express";

import { IncidentEventType } from "../constants/incident.js";
import { getIncidentEvents } from "../services/incident-event.service.js";
import { getAuthenticatedUser } from "../utils/auth.js";
import { sendError } from "../utils/response.js";

export async function getIncidentEventsController(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { incidentId } = request.params;

  if (!incidentId || Array.isArray(incidentId)) {
    sendError(response, 400, "Invalid incident ID");
    return;
  }

  const { page = "1", limit = "10", userId, type, from, to } = request.query;

  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    sendError(response, 400, "Page must be a positive integer");
    return;
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    sendError(response, 400, "Limit must be between 1 and 100");
    return;
  }

  if (userId !== undefined && typeof userId !== "string") {
    sendError(response, 400, "Invalid userId");
    return;
  }

  if (
    type !== undefined &&
    (typeof type !== "string" ||
      !Object.values(IncidentEventType).includes(type as IncidentEventType))
  ) {
    sendError(response, 400, "Invalid event type");
    return;
  }

  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (from !== undefined) {
    if (typeof from !== "string") {
      sendError(response, 400, "Invalid from date");
      return;
    }

    fromDate = new Date(from);

    if (Number.isNaN(fromDate.getTime())) {
      sendError(response, 400, "Invalid from date");
      return;
    }
  }

  if (to !== undefined) {
    if (typeof to !== "string") {
      sendError(response, 400, "Invalid to date");
      return;
    }

    toDate = new Date(to);

    if (Number.isNaN(toDate.getTime())) {
      sendError(response, 400, "Invalid to date");
      return;
    }
  }

  if (fromDate && toDate && fromDate > toDate) {
    sendError(response, 400, "from date cannot be after to date");
    return;
  }

  try {
    const result = await getIncidentEvents({
      incidentId,
      orgId: auth.orgId,
      ...(userId ? { userId } : {}),
      ...(type ? { type: type as IncidentEventType } : {}),
      ...(fromDate ? { from: fromDate } : {}),
      ...(toDate ? { to: toDate } : {}),
      page: parsedPage,
      limit: parsedLimit,
    });

    response.status(200).json(result);
  } catch (error) {
    console.error("Incident events retrieval failed", error);
    sendError(response, 500, "Unable to retrieve incident events");
  }
}
