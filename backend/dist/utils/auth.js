import { sendError } from "./response.js";
export function getAuthenticatedAuth(request, response) {
    if (!request.auth) {
        sendError(response, 401, "Authentication token is required");
        return undefined;
    }
    return request.auth;
}
export function getAuthenticatedUser(request, response) {
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
export function getAuthenticatedOrganizationId(request, response) {
    const auth = getAuthenticatedAuth(request, response);
    return auth?.orgId;
}
//# sourceMappingURL=auth.js.map