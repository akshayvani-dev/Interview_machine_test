import { Router } from "express";

import { getCurrentProfile, login } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { loginRateLimiter } from "../services/rate-limit.service.js";

export const authRouter = Router();

authRouter.post(
  "/api/v1/auth/login",
  loginRateLimiter,
  login
);

authRouter.get(
  "/api/v1/auth/me",
  requireAuth,
  getCurrentProfile
);