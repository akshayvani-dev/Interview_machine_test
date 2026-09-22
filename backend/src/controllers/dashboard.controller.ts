import type { Request, Response } from "express";

import { getDashboard } from "../services/dashboard.service.js";
import type {
  IncidentSeverity,
  IncidentStatus,
} from "../constants/incident.js";

import { getAuthenticatedUser } from "../utils/auth.js";
import { sendError } from "../utils/response.js";

const VALID_TIMES = ["today", "7d", "30d", "90d"] as const;

export async function getDashboardController(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);

  if (!auth) return;

  const { time = "7d", severity, status, assignedTo } = request.query;

  if (
    typeof time !== "string" ||
    !VALID_TIMES.includes(time as (typeof VALID_TIMES)[number])
  ) {
    sendError(response, 400, "Invalid time filter");
    return;
  }

  if (severity !== undefined && typeof severity !== "string") {
    sendError(response, 400, "Invalid severity");
    return;
  }

  if (status !== undefined && typeof status !== "string") {
    sendError(response, 400, "Invalid status");
    return;
  }

  if (assignedTo !== undefined && typeof assignedTo !== "string") {
    sendError(response, 400, "Invalid assignedTo");
    return;
  }

  try {
    const result = await getDashboard({
      orgId: auth.orgId,
      time: time as "today" | "7d" | "30d" | "90d",
      ...(severity ? { severity: severity as IncidentSeverity } : {}),
      ...(status ? { status: status as IncidentStatus } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    });

    response.status(200).json(result);
  } catch (error) {
    console.error("Dashboard retrieval failed", error);
    sendError(response, 500, "Unable to retrieve dashboard data");
  }
}
