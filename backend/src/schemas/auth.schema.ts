import { z } from "zod";

export const loginSchema = z
  .object({
    email: z
      .string({ error: "Email is required" })
      .trim()
      .email("Email must be a valid email address")
      .toLowerCase(),
    password: z.string({ error: "Password is required" }).min(1, "Password is required"),
  })
  .strict();
