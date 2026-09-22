import { fetchApi } from "./fetchClient.ts";
import { apiRoutes } from "./routes.ts";
import type { IncidentSeverity, IncidentStatus } from "../enums/incident.ts";

export interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo?: string;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  assignedTo?: string | null;
  version: number;
}

export interface Incident {
  id: string;
  orgId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdBy: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentsResponse {
  data: Incident[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getIncidentById(id: string): Promise<Incident> {
  return fetchApi<Incident>(apiRoutes.incidents.byId(id));
}

export async function createIncident({
  payload,
  idempotencyKey,
}: {
  payload: CreateIncidentRequest;
  idempotencyKey: string;
}): Promise<Incident> {
  return fetchApi<Incident>(apiRoutes.incidents.list, {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
}

export async function getIncidents(
  page: number,
  limit = 10,
): Promise<IncidentsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return fetchApi<IncidentsResponse>(
    `${apiRoutes.incidents.list}?${query.toString()}`,
  );
}

export async function updateIncident(
  id: string,
  payload: UpdateIncidentRequest,
): Promise<Incident> {
  return fetchApi<Incident>(apiRoutes.incidents.byId(id), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
