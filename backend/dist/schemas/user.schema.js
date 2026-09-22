import { z } from "zod";
const userRoleSchema = z.enum(["ADMIN", "MANAGER", "MEMBER"]);
export const createUserSchema = z
    .object({
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
export const listUsersQuerySchema = z.object({
    page: z.coerce
        .number({ error: "Page must be a number" })
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .default(1),
    limit: z.coerce
        .number({ error: "Limit must be a number" })
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit must not exceed 100")
        .default(10),
    pageSize: z.coerce
        .number({ error: "Page size must be a number" })
        .int("Page size must be an integer")
        .min(1, "Page size must be at least 1")
        .max(100, "Page size must not exceed 100")
        .optional(),
    email: z.string().trim().optional(),
    role: z.string().trim().optional(),
});
//# sourceMappingURL=user.schema.js.map