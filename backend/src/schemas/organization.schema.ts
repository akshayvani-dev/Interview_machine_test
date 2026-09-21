import { z } from "zod";

export const registerOrganizationSchema = z.object({
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
});

export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationSchema
>;
