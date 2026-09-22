import { fetchApi } from "./fetchClient.ts";
import { apiRoutes } from "./routes.ts";
import type { Severity, Status } from "../types/dashboardTypes.ts";

export type DashboardTime = "today" | "7d" | "30d" | "90d";

export interface DashboardRequest {
  time: DashboardTime;
  severity?: Severity;
  status?: Status;
  assignedTo?: string;
}

export interface DashboardBreakdownItem {
  label: string;
  value: number;
}

export interface DashboardResponse {
  counts: {
    totalIncidents: number;
    openIncidents: number;
    criticalIncidents: number;
    resolvedIncidents: number;
  };
  severityData: DashboardBreakdownItem[];
  statusData: DashboardBreakdownItem[];
  time: DashboardTime;
}

export async function getDashboard(
  params: DashboardRequest,
): Promise<DashboardResponse> {
  const query = new URLSearchParams({
    time: params.time,
  });

  if (params.severity) {
    query.set("severity", params.severity);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.assignedTo) {
    query.set("assignedTo", params.assignedTo);
  }

  return fetchApi<DashboardResponse>(
    `${apiRoutes.dashboard.summary}?${query.toString()}`,
  );
}