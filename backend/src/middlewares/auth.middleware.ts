import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { UserRole } from "../constants/user.js";
import type { AuthPayload } from "../types/auth.js";
import { sendError } from "../utils/response.js";

const jwtSecret = getJwtSecret();
const verifyJwt = (jwt as any).verify || (jwt as any).default?.verify;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET must be set before using authentication.");
  }

  return secret.trim();
}

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    sendError(response, 401, "Authentication token is required");
    return;
  }

  try {
    const payload = verifyJwt(authorization.slice(7), jwtSecret, {
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

/** Restricts a route to a user JWT with one of the supplied organization roles. */
export function requireUserRoles(...roles: readonly UserRole[]) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const auth = request.auth;

    if (!auth) {
      sendError(response, 401, "Authentication token is required");
      return;
    }

    if (auth.type !== "user" || !roles.includes(auth.role)) {
      sendError(response, 403, "You do not have permission to perform this action");
      return;
    }

    next();
  };
}

/** Allows organization owners and permitted users to view incidents. */
export function requireIncidentReadAccess(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const auth = request.auth;

  if (!auth) {
    sendError(response, 401, "Authentication token is required");
    return;
  }

  if (auth.type === "org" || [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER].includes(auth.role)) {
    next();
    return;
  }

  sendError(response, 403, "You do not have permission to view incidents");
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
