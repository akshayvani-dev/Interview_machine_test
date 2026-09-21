import { Router } from "express";

import { registerOrganization } from "../controllers/organization.controller.js";

export const organizationRouter = Router();

organizationRouter.post("/api/v1/org/register", registerOrganization);
