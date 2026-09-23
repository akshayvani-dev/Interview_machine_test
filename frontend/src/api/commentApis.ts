import { fetchApi } from "./fetchClient.ts";
import { apiRoutes } from "./routes.ts";

export interface IncidentComment {
  id: string;
  incidentId: string;
  orgId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface IncidentCommentsResponse {
  data: IncidentComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateIncidentCommentRequest {
  content: string;
}

export async function getIncidentComments(
  incidentId: string,
  page = 1,
  limit = 10,
): Promise<IncidentCommentsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return fetchApi<IncidentCommentsResponse>(
    `${apiRoutes.incidents.comments(incidentId)}?${query.toString()}`,
  );
}

export async function createIncidentComment(
  incidentId: string,
  payload: CreateIncidentCommentRequest,
): Promise<IncidentComment> {
  return fetchApi<IncidentComment>(apiRoutes.incidents.comments(incidentId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
