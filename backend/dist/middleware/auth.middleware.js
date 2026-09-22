import jwt from "jsonwebtoken";
import { UserRole } from "../constants/user.js";
import { sendError } from "../utils/response.js";
const jwtSecret = getJwtSecret();
const verifyJwt = jwt.verify || jwt.default?.verify;
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET must be set before using authentication.");
    }
    return secret.trim();
}
export function requireAuth(request, response, next) {
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
    }
    catch {
        sendError(response, 401, "Invalid authentication token");
    }
}
/** Allows organization owners and ADMIN users to manage users in their own organization. */
export function requireUserManagementAccess(request, response, next) {
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
export function requireUserRoles(...roles) {
    return (request, response, next) => {
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
function isAuthPayload(payload) {
    if (typeof payload !== "object" || payload === null) {
        return false;
    }
    if (payload.type === "org") {
        return typeof payload.orgId === "string";
    }
    return (payload.type === "user" &&
        typeof payload.orgId === "string" &&
        typeof payload.userId === "string" &&
        Object.values(UserRole).includes(payload.role));
}
//# sourceMappingURL=auth.middleware.js.map