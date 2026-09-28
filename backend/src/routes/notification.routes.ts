import { Router } from "express";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";

export const notificationRouter = Router();

notificationRouter.get("/api/v1/notifications", requireAuth, listNotifications);

notificationRouter.get(
  "/api/v1/notifications/unread-count",
  requireAuth,
  getUnreadNotificationCount,
);

notificationRouter.patch(
  "/api/v1/notifications/:id/read",
  requireAuth,
  markNotificationAsRead,
);

notificationRouter.patch(
  "/api/v1/notifications/read-all",
  requireAuth,
  markAllNotificationsAsRead,
);
