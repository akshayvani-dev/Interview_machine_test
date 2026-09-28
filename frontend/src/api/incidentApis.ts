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

export interface IncidentEvent {
  id: string;
  incidentId: string;
  orgId: string;
  userId: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface IncidentEventsResponse {
  events: IncidentEvent[];
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

export async function getIncidentEvents(
  incidentId: string,
  page = 1,
  limit = 10,
): Promise<IncidentEventsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return fetchApi<IncidentEventsResponse>(
    `${apiRoutes.incidents.eventListing(incidentId)}?${query.toString()}`,
  );
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

export async function getIncidentEventOrgs(
  page = 1,
  limit = 10,
): Promise<IncidentEventsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return fetchApi<IncidentEventsResponse>(
    `${apiRoutes.incidents.listByOrg}?${query.toString()}`,
  );
}

export async function deleteIncident(id: string): Promise<void> {
  await fetchApi<void>(apiRoutes.incidents.byId(id), {
    method: "DELETE",
  });
}
