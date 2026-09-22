import * as jwt from "jsonwebtoken";
import { UserRole } from "../constants/user.js";
const jwtSecret = getJwtSecret();
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET must be set before using authentication.");
    }
    return secret;
}
export function requireAuth(request, response, next) {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        response.status(401).json({ error: { message: "Authentication token is required" } });
        return;
    }
    try {
        const payload = jwt.verify(authorization.slice(7), jwtSecret, {
            algorithms: ["HS256"],
        });
        if (!isAuthPayload(payload)) {
            response.status(401).json({ error: { message: "Invalid authentication token" } });
            return;
        }
        request.auth = payload;
        next();
    }
    catch {
        response.status(401).json({ error: { message: "Invalid authentication token" } });
    }
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