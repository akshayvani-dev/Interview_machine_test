import { Router } from "express";

import {
  assignIncident,
  createIncident,
  deleteIncident,
  updateIncident,
} from "../controllers/incident.controller.js";
import { UserRole } from "../constants/user.js";
import { requireAuth, requireUserRoles } from "../middleware/auth.middleware.js";

export const incidentRouter = Router();

incidentRouter.post(
  "/api/v1/incidents",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  createIncident
);
incidentRouter.patch(
  "/api/v1/incidents/:id",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  updateIncident
);
incidentRouter.delete(
  "/api/v1/incidents/:id",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER),
  deleteIncident
);
incidentRouter.patch(
  "/api/v1/incidents/:id/assign",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER),
  assignIncident
);
