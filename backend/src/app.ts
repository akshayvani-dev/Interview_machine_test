import "dotenv/config";

import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";

import { organizationRouter } from "./routes/organization.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";

/**
 * Builds the HTTP application without opening a port. Keeping this separate
 * from server.ts makes the app easy to import in integration tests.
 */
export const app = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = tools like Postman/curl. Allow those + whitelisted origins.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Catch malformed JSON body errors from body-parser before they reach routes.
app.use(
  (error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400 &&
      "body" in error
    ) {
      response.status(400).json({
        message: "Invalid JSON in request body",
        status: 400,
      });
      return;
    }

    next(error);
  }
);

app.get("/health", (_request: Request, response: Response) => {
  response.status(200).json({ status: "ok tested" });
});

app.use(organizationRouter);
app.use(userRouter);
app.use(authRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    message: "Route not found",
    status: 404,
  });
});

// Centralized error handler — must be defined last, with 4 args.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err.message === "Not allowed by CORS") {
    res.status(403).json({
      message: "CORS: origin not allowed",
      status: 403,
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error",
    status: 500,
  });
});