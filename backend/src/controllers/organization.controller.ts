import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import { registerOrganizationSchema } from "../schemas/organization.schema.js";
import { sendError } from "../utils/response.js";

const SALT_ROUNDS = 10;

export async function registerOrganization(
  request: Request,
  response: Response
): Promise<void> {
  const validation = registerOrganizationSchema.safeParse(request.body);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    sendError(response, 400, issue?.message ?? "Invalid request body");
    return;
  }

  const { name, email, password } = validation.data;
  const { confirmPassword } = request.body as { confirmPassword?: unknown };

  if (confirmPassword === undefined || confirmPassword === null || confirmPassword === "") {
    sendError(response, 400, "Confirm password is required");
    return;
  }

  if (typeof confirmPassword !== "string") {
    sendError(response, 400, "Confirm password must be a string");
    return;
  }

  if (confirmPassword !== password) {
    sendError(response, 400, "Passwords do not match");
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const organization = await prisma.organization.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    response.status(201).json({
      message: "Organization registered successfully",
      status: 201,
      data: organization,
    });
  } catch (error) {
    const uniqueField = getUniqueConstraintField(error);

    if (uniqueField) {
      sendError(response, 409, `An organization with this ${uniqueField} already exists`);
      return;
    }

    if (isPrismaError(error, "P2002")) {
      sendError(response, 409, "An organization with this name or email already exists");
      return;
    }

    if (isDatabaseError(error)) {
      console.error("Organization registration database error", error);
      sendError(response, 503, "Organization registration is temporarily unavailable");
      return;
    }

    console.error("Organization registration failed", error);
    sendError(response, 500, "Unable to register organization");
  }
}

function getUniqueConstraintField(error: unknown): "name" | "email" | undefined {
  if (!isPrismaError(error, "P2002")) {
    return undefined;
  }

  const target = getPrismaMetaTarget(error);
  if (target?.includes("email")) {
    return "email";
  }

  if (target?.includes("name")) {
    return "name";
  }

  return undefined;
}

function isDatabaseError(error: unknown): boolean {
  return ["P1000", "P1001", "P1002", "P1010"].some((code) =>
    isPrismaError(error, code)
  );
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function getPrismaMetaTarget(error: unknown): string[] | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("meta" in error) ||
    typeof error.meta !== "object" ||
    error.meta === null ||
    !("target" in error.meta) ||
    !(typeof error.meta.target === "string" || Array.isArray(error.meta.target))
  ) {
    return undefined;
  }

  const target = error.meta.target;
  if (typeof target === "string") {
    return [target];
  }

  return target.filter((value): value is string => typeof value === "string");
}
