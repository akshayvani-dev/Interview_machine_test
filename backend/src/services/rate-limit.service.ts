import { env } from "../config/env.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";

export const loginRateLimiter = createRateLimiter({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  message: "Too many login attempts. Please try again later.",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  limit: env.API_RATE_LIMIT_MAX,
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
  limit: env.PASSWORD_RESET_RATE_LIMIT_MAX,
  message: "Too many password reset attempts. Please try again later.",
});