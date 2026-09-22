import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRole } from "../constants/user.js";
import { prisma } from "../lib/prisma.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { getAuthenticatedAuth } from "../utils/auth.js";
import { sendError } from "../utils/response.js";
const jwtSecret = getJwtSecret();
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET must be set before using authentication.");
    }
    return secret;
}
export async function login(request, response) {
    const validation = loginSchema.safeParse(request.body);
    if (!validation.success) {
        const issue = validation.error.issues[0];
        sendError(response, 400, issue?.message ?? "Invalid request body");
        return;
    }
    const { email, password } = validation.data;
    try {
        const organization = await prisma.organization.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true, name: true, email: true, passwordHash: true },
        });
        if (organization) {
            const isMatch = await bcrypt.compare(password, organization.passwordHash);
            if (!isMatch) {
                sendInvalidCredentials(response);
                return;
            }
            await prisma.organization.update({
                where: { id: organization.id },
                data: { lastLogin: new Date() },
            });
            const token = signToken({ type: "org", orgId: organization.id });
            response.status(200).json({
                token,
                type: "org",
                id: organization.id,
                name: organization.name,
                email: organization.email,
            });
            return;
        }
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true, orgId: true, name: true, email: true, role: true, passwordHash: true },
        });
        if (!user) {
            sendInvalidCredentials(response);
            return;
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            sendInvalidCredentials(response);
            return;
        }
        if (!isUserRole(user.role)) {
            console.error("User has an invalid role", { userId: user.id });
            sendInvalidCredentials(response);
            return;
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const token = signToken({ type: "user", orgId: user.orgId, userId: user.id, role: user.role });
        response.status(200).json({
            token,
            type: "user",
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        console.error("Login failed", error);
        sendError(response, 500, "Unable to sign in");
    }
}
export async function getCurrentProfile(request, response) {
    const auth = getAuthenticatedAuth(request, response);
    if (!auth)
        return;
    try {
        if (auth.type === "org") {
            const organization = await prisma.organization.findUnique({
                where: { id: auth.orgId },
                select: { id: true, name: true, email: true, createdAt: true, lastLogin: true },
            });
            if (!organization) {
                sendError(response, 404, "Profile not found");
                return;
            }
            response.status(200).json({ type: "org", orgId: organization.id, ...organization });
            return;
        }
        const user = await prisma.user.findFirst({
            where: { id: auth.userId, orgId: auth.orgId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                organization: { select: { id: true, name: true, email: true } },
            },
        });
        if (!user) {
            sendError(response, 404, "Profile not found");
            return;
        }
        const { organization, ...userProfile } = user;
        response.status(200).json({ type: "user", orgId: organization, ...userProfile });
    }
    catch (error) {
        console.error("Profile lookup failed", error);
        sendError(response, 500, "Unable to retrieve profile");
    }
}
function signToken(payload) {
    return jwt.sign(payload, jwtSecret, { algorithm: "HS256", expiresIn: "7d" });
}
function sendInvalidCredentials(response) {
    sendError(response, 401, "Invalid credentials");
}
function isUserRole(role) {
    return Object.values(UserRole).includes(role);
}
//# sourceMappingURL=auth.controller.js.map