import { rateLimit } from "express-rate-limit";

export const createRateLimiter = ({
  windowMs,
  limit,
  message = "Too many requests. Please try again later.",
}: {
  windowMs: number;
  limit: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    handler: (_req, res) => {
      return res.status(429).json({
        success: false,
        message,
      });
    },
  });
};