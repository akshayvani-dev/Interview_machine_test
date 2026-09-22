/** Sends the standard API error response used across controllers and middleware. */
export function sendError(response, status, message) {
    response.status(status).json({ message, status });
}
//# sourceMappingURL=response.js.map