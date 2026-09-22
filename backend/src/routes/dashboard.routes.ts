import { Router } from "express";

import { getDashboardController } from "../controllers/dashboard.controller.js";

import {
  requireAuth,
  requireIncidentReadAccess,
} from "../middleware/auth.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/api/v1/dashboard",
  requireAuth,
  requireIncidentReadAccess,
  getDashboardController,
);
