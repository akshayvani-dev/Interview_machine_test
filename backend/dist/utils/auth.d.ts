import type { Request, Response } from "express";
import type { AuthPayload } from "../types/auth.js";
export declare function getAuthenticatedAuth(request: Request, response: Response): AuthPayload | undefined;
export declare function getAuthenticatedUser(request: Request, response: Response): Extract<AuthPayload, {
    type: "user";
}> | undefined;
export declare function getAuthenticatedOrganizationId(request: Request, response: Response): string | undefined;
//# sourceMappingURL=auth.d.ts.map