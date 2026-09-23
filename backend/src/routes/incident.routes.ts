import { Router } from "express";

import {
  assignIncident,
  createIncident,
  deleteIncident,
  getIncidentById,
  listIncidents,
  updateIncident,
} from "../controllers/incident.controller.js";
import {
  createIncidentCommentController,
  getIncidentCommentsController,
} from "../controllers/incident-comment.controller.js";
import { UserRole } from "../constants/user.js";
import {
  requireAuth,
  requireIncidentReadAccess,
  requireUserRoles,
} from "../middleware/auth.middleware.js";
import {
  getIncidentEventsController,
  getOrganizationIncidentEventsController,
} from "../controllers/incident-event.controller.js";

export const incidentRouter = Router();

incidentRouter.get(
  "/api/v1/incidents",
  requireAuth,
  requireIncidentReadAccess,
  listIncidents,
);

incidentRouter.post(
  "/api/v1/incidents",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  createIncident,
);

incidentRouter.get(
  "/api/v1/incidents/:id",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  getIncidentById,
);

incidentRouter.patch(
  "/api/v1/incidents/:id",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  updateIncident,
);

incidentRouter.delete(
  "/api/v1/incidents/:id",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER),
  deleteIncident,
);

incidentRouter.patch(
  "/api/v1/incidents/:id/assign",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER),
  assignIncident,
);

//event routes
incidentRouter.get(
  "/api/v1/incidents/:incidentId/events",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  getIncidentEventsController,
);

incidentRouter.get(
  "/api/v1/incident-events",
  requireAuth,
  getOrganizationIncidentEventsController,
);

incidentRouter.post(
  "/api/v1/incidents/:incidentId/comments",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  createIncidentCommentController,
);

incidentRouter.get(
  "/api/v1/incidents/:incidentId/comments",
  requireAuth,
  requireUserRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER),
  getIncidentCommentsController,
);
