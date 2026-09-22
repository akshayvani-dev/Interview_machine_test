import type { Request, Response } from "express";

import { getIncidentEvents } from "../services/incident-event.service.js";
import { getAuthenticatedUser } from "../utils/auth.js";
import { sendError } from "../utils/response.js";

export async function getIncidentEventsController(
  request: Request,
  response: Response
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { incidentId } = request.params;
  const { userId } = request.query;

  if (!incidentId || Array.isArray(incidentId)) {
    sendError(response, 400, "Invalid incident ID");
    return;
  }

  try {
    const events = await getIncidentEvents({
      incidentId,
      orgId: auth.orgId,
      ...(typeof userId === "string" ? { userId } : {}),
    });

    response.status(200).json(events);
  } catch (error) {
    console.error("Incident events retrieval failed", error);
    sendError(response, 500, "Unable to retrieve incident events");
  }
}
