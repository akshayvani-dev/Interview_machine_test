import type { Request, Response } from "express";

import type { AuthPayload } from "../types/auth.js";
import { sendError } from "./response.js";

export function getAuthenticatedAuth(
  request: Request,
  response: Response
): AuthPayload | undefined {
  if (!request.auth) {
    sendError(response, 401, "Authentication token is required");
    return undefined;
  }

  return request.auth;
}

export function getAuthenticatedUser(
  request: Request,
  response: Response
): Extract<AuthPayload, { type: "user" }> | undefined {
  const auth = getAuthenticatedAuth(request, response);
  if (!auth) {
    return undefined;
  }

  if (auth.type !== "user") {
    sendError(response, 403, "A user authentication token is required");
    return undefined;
  }

  return auth;
}

export function getAuthenticatedOrganizationId(
  request: Request,
  response: Response
): string | undefined {
  const auth = getAuthenticatedAuth(request, response);
  return auth?.orgId;
}
