import { Router } from "express";

import { createUser, updateUser } from "../controllers/user.controller.js";
import { requireAuth, requireUserManagementAccess } from "../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.post("/api/v1/users", requireAuth, requireUserManagementAccess, createUser);
userRouter.patch("/api/v1/users/:id", requireAuth, requireUserManagementAccess, updateUser);
