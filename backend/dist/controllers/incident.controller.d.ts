import type { Request, Response } from "express";
/**
 * Create Incident
 */
export declare function createIncident(request: Request, response: Response): Promise<void>;
/**
 * Update Incident
 *
 * Optimistic concurrency:
 * Client sends the version it originally loaded.
 * Update succeeds only if DB version still matches.
 */
export declare function updateIncident(request: Request, response: Response): Promise<void>;
/**
 * Delete Incident
 */
export declare function deleteIncident(request: Request, response: Response): Promise<void>;
/**
 * Assign Incident
 *
 * Uses optimistic concurrency exactly like updateIncident.
 */
export declare function assignIncident(request: Request, response: Response): Promise<void>;
/**
 * List Incidents
 */
export declare function listIncidents(request: Request, response: Response): Promise<void>;
/**
 * Get Incident By ID
 */
export declare function getIncidentById(request: Request, response: Response): Promise<void>;
//# sourceMappingURL=incident.controller.d.ts.map