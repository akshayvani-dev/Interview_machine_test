import type { Response } from "express";

/** Sends the standard API error response used across controllers and middleware. */
export function sendError(response: Response, status: number, message: string): void {
  response.status(status).json({ message, status });
}
