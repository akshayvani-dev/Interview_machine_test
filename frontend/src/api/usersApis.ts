import { fetchApi } from "./fetchClient.ts";
import { apiRoutes } from "./routes.ts";
import type { UserRole } from "../enums/user.ts";

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface GetUsersParams {
  page?: number;
  limit?: number;
  email?: string;
  role?: UserRole;
}
export async function getUsers({
  page = 1,
  limit = 10,
  email,
  role,
}: GetUsersParams = {}): Promise<UsersResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (email) {
    query.set("email", email);
  }
  if (role) {
    query.set("role", role);
  }
  return fetchApi<UsersResponse>(`${apiRoutes.users.list}?${query.toString()}`);
}

export async function createUser(payload: CreateUserRequest): Promise<User> {
  return fetchApi<User>(apiRoutes.users.list, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
