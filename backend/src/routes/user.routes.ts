import { Router } from "express";

import { createUser, listUsers, updateUser } from "../controllers/user.controller.js";
import {
	requireAuth,
	requireIncidentReadAccess,
	requireUserManagementAccess,
} from "../middlewares/auth.middleware.js";

export const userRouter = Router();

userRouter.get("/api/v1/users", requireAuth, requireIncidentReadAccess, listUsers);
userRouter.post("/api/v1/users", requireAuth, requireUserManagementAccess, createUser);
userRouter.patch("/api/v1/users/:id", requireAuth, requireUserManagementAccess, updateUser);
