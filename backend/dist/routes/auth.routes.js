import { Router } from "express";
import { getCurrentProfile, login } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
export const authRouter = Router();
authRouter.post("/api/v1/auth/login", login);
authRouter.get("/api/v1/auth/me", requireAuth, getCurrentProfile);
//# sourceMappingURL=auth.routes.js.map