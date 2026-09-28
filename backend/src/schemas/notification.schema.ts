import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce.number().int().min(1).max(100).optional(),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  unreadOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(false),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().uuid("Invalid notification ID"),
});
