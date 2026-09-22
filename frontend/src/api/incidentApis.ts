import { fetchApi } from './fetchClient.ts';
import { apiRoutes } from './routes.ts';
import type { IncidentSeverity, IncidentStatus } from '../enums/incident.ts';

export interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
}

export interface Incident {
  id: string;
  orgId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdBy: string;
  assignedTo: string | null;
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

export async function getIncidents(page: number, limit = 10): Promise<IncidentsResponse> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return fetchApi<IncidentsResponse>(`${apiRoutes.incidents.list}?${query.toString()}`);
}

export async function createIncident(payload: CreateIncidentRequest): Promise<Incident> {
  return fetchApi<Incident>(apiRoutes.incidents.list, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
