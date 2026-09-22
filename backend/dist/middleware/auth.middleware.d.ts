import type { NextFunction, Request, Response } from "express";
import { UserRole } from "../constants/user.js";
export declare function requireAuth(request: Request, response: Response, next: NextFunction): void;
/** Allows organization owners and ADMIN users to manage users in their own organization. */
export declare function requireUserManagementAccess(request: Request, response: Response, next: NextFunction): void;
/** Restricts a route to a user JWT with one of the supplied organization roles. */
export declare function requireUserRoles(...roles: readonly UserRole[]): (request: Request, response: Response, next: NextFunction) => void;
/** Allows organization owners and permitted users to view incidents. */
export declare function requireIncidentReadAccess(request: Request, response: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map