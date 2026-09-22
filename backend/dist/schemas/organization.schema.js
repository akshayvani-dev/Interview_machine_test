import { z } from "zod";
export const registerOrganizationSchema = z.object({
    name: z
        .string({
        error: (issue) => issue.input === undefined || issue.input === null
            ? "Name is required"
            : "Name must be a string",
    })
        .trim()
        .min(1, "Name is required")
        .min(2, "Name must be at least 2 characters")
        .max(255, "Name must not exceed 255 characters"),
    email: z
        .string({
        error: (issue) => issue.input === undefined || issue.input === null
            ? "Email is required"
            : "Email must be a string",
    })
        .trim()
        .min(1, "Email is required")
        .email("Email must be a valid email address")
        .toLowerCase()
        .max(255, "Email must not exceed 255 characters"),
    password: z
        .string({
        error: (issue) => issue.input === undefined || issue.input === null
            ? "Password is required"
            : "Password must be a string",
    })
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
});
//# sourceMappingURL=organization.schema.js.map