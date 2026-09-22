import { z } from "zod";
const userRoleSchema = z.enum(["ADMIN", "MANAGER", "MEMBER"]);
export const createUserSchema = z
    .object({
    orgId: z.string({ error: "Organization ID is required" }).uuid("Organization ID must be a valid UUID"),
    name: z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(255, "Name must not exceed 255 characters"),
    email: z
        .string({ error: "Email is required" })
        .trim()
        .email("Email must be a valid email address")
        .max(255, "Email must not exceed 255 characters"),
    password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters"),
    role: userRoleSchema,
})
    .strict();
export const updateUserSchema = z
    .object({
    orgId: z.string({ error: "Organization ID is required" }).uuid("Organization ID must be a valid UUID"),
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(255, "Name must not exceed 255 characters")
        .optional(),
    role: userRoleSchema.optional(),
})
    .strict()
    .refine((data) => data.name !== undefined || data.role !== undefined, {
    message: "Provide a name or role to update",
});
export const userIdParamsSchema = z.object({
    id: z.string().uuid("User ID must be a valid UUID"),
});
//# sourceMappingURL=user.schema.js.map