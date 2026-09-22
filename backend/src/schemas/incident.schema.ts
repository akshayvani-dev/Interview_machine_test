import { z } from "zod";

const severitySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const statusSchema = z.enum(["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"]);

const titleSchema = z
  .string({ error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(255, "Title must not exceed 255 characters");

const descriptionSchema = z
  .string({ error: "Description is required" })
  .trim()
  .min(1, "Description is required");

export const incidentIdParamsSchema = z.object({
  id: z.string().uuid("Incident ID must be a valid UUID"),
});

export const createIncidentSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    severity: severitySchema,
    status: statusSchema.default("OPEN"),
    assignedTo: z
      .string()
      .uuid("Assigned user ID must be a valid UUID")
      .optional(),
  })
  .strict();

export const updateIncidentSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    severity: severitySchema.optional(),
    status: statusSchema.optional(),
    assignedTo: z
      .string()
      .uuid("Assigned user ID must be a valid UUID")
      .nullable()
      .optional(),
    version: z
      .number({ error: "Version is required" })
      .int("Version must be an integer")
      .min(1),
  })
  .strict();

export const assignIncidentSchema = z
  .object({
    assignedTo: z
      .string({ error: "Assigned user ID is required" })
      .uuid("Assigned user ID must be a valid UUID"),
    version: z.number().int().positive(),
  })
  .strict();

export const listIncidentsQuerySchema = z.object({
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

  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),

  status: z.enum(["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"]).optional(),

  assignedTo: z.string().optional(),

  from: z.coerce.date().optional(),

  to: z.coerce.date().optional(),
});
