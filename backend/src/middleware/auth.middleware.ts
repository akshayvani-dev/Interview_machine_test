import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";

import { UserRole } from "../constants/user.js";
import type { AuthPayload } from "../types/auth.js";
import { sendError } from "../utils/response.js";

const jwtSecret = getJwtSecret();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET must be set before using authentication.");
  }

  return secret;
}

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    sendError(response, 401, "Authentication token is required");
    return;
  }

  try {
    const payload = jwt.verify(authorization.slice(7), jwtSecret, {
      algorithms: ["HS256"],
    });

    if (!isAuthPayload(payload)) {
      sendError(response, 401, "Invalid authentication token");
      return;
    }

    request.auth = payload;
    next();
  } catch {
    sendError(response, 401, "Invalid authentication token");
  }
}

/** Allows organization owners and ADMIN users to manage users in their own organization. */
export function requireUserManagementAccess(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const auth = request.auth;

  if (!auth) {
    sendError(response, 401, "Authentication token is required");
    return;
  }

  if (auth.type === "org" || auth.role === UserRole.ADMIN) {
    next();
    return;
  }

  sendError(response, 403, "Only organization administrators can manage users");
}

function isAuthPayload(payload: string | jwt.JwtPayload): payload is AuthPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  if (payload.type === "org") {
    return typeof payload.orgId === "string";
  }

  return (
    payload.type === "user" &&
    typeof payload.orgId === "string" &&
    typeof payload.userId === "string" &&
    Object.values(UserRole).includes(payload.role as UserRole)
  );
}
