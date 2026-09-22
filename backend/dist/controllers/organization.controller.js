import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { registerOrganizationSchema } from "../schemas/organization.schema.js";
const SALT_ROUNDS = 10;
export async function registerOrganization(request, response) {
    const validation = registerOrganizationSchema.safeParse(request.body);
    if (!validation.success) {
        const issue = validation.error.issues[0];
        response.status(400).json({
            status: 400,
            message: issue?.message ?? "Invalid request body",
        });
        return;
    }
    const { name, email, password } = validation.data;
    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const organization = await prisma.organization.create({
            data: { name, email, passwordHash },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        response.status(201).json(organization);
    }
    catch (error) {
        const uniqueField = getUniqueConstraintField(error);
        if (uniqueField) {
            response.status(409).json({
                error: {
                    message: `An organization with this ${uniqueField} already exists`,
                    field: uniqueField,
                },
            });
            return;
        }
        if (isPrismaError(error, "P2002")) {
            response.status(409).json({
                error: { message: "An organization with this name or email already exists" },
            });
            return;
        }
        if (isDatabaseError(error)) {
            console.error("Organization registration database error", error);
            response.status(503).json({
                error: { message: "Organization registration is temporarily unavailable" },
            });
            return;
        }
        console.error("Organization registration failed", error);
        response.status(500).json({
            error: { message: "Unable to register organization" },
        });
    }
}
function getUniqueConstraintField(error) {
    if (!isPrismaError(error, "P2002")) {
        return undefined;
    }
    const target = getPrismaMetaTarget(error);
    if (target?.includes("email")) {
        return "email";
    }
    if (target?.includes("name")) {
        return "name";
    }
    return undefined;
}
function isDatabaseError(error) {
    return ["P1000", "P1001", "P1002", "P1010"].some((code) => isPrismaError(error, code));
}
function isPrismaError(error, code) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === code);
}
function getPrismaMetaTarget(error) {
    if (typeof error !== "object" ||
        error === null ||
        !("meta" in error) ||
        typeof error.meta !== "object" ||
        error.meta === null ||
        !("target" in error.meta) ||
        !(typeof error.meta.target === "string" || Array.isArray(error.meta.target))) {
        return undefined;
    }
    const target = error.meta.target;
    if (typeof target === "string") {
        return [target];
    }
    return target.filter((value) => typeof value === "string");
}
//# sourceMappingURL=organization.controller.js.map