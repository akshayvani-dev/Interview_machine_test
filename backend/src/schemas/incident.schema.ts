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
  })
  .strict();

export const updateIncidentSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    severity: severitySchema.optional(),
    status: statusSchema.optional(),
    version: z.number({ error: "Version is required" }).int("Version must be an integer").min(1),
  })
  .strict();

export const assignIncidentSchema = z
  .object({
    assignedTo: z.string({ error: "Assigned user ID is required" }).uuid("Assigned user ID must be a valid UUID"),
  })
  .strict();
