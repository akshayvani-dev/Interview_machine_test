import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
} from "../schemas/user.schema.js";

const SALT_ROUNDS = 10;

export async function createUser(request: Request, response: Response): Promise<void> {
  const validation = createUserSchema.safeParse(request.body);

  if (!validation.success) {
    sendValidationError(response, validation.error.issues);
    return;
  }

  // TODO: Replace body.orgId with the organization ID derived from the JWT.
  const { orgId, name, email, password, role } = validation.data;

  try {
    const [organization, existingUser] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } }),
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    ]);

    if (!organization) {
      response.status(404).json({
        error: { message: "Organization not found", field: "orgId" },
      });
      return;
    }

    if (existingUser) {
      response.status(409).json({
        error: { message: "A user already uses this email", field: "email" },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { orgId, name, email, passwordHash, role },
      select: { id: true, orgId: true, name: true, email: true, role: true, createdAt: true },
    });

    response.status(201).json(user);
  } catch (error) {
    if (isUniqueEmailError(error)) {
      response.status(409).json({
        error: { message: "A user already uses this email", field: "email" },
      });
      return;
    }

    console.error("User creation failed", error);
    response.status(500).json({ error: { message: "Unable to create user" } });
  }
}

export async function updateUser(request: Request, response: Response): Promise<void> {
  const paramsValidation = userIdParamsSchema.safeParse(request.params);
  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const bodyValidation = updateUserSchema.safeParse(request.body);
  if (!bodyValidation.success) {
    sendValidationError(response, bodyValidation.error.issues);
    return;
  }

  // TODO: Replace body.orgId with the organization ID derived from the JWT.
  const { id } = paramsValidation.data;
  const { orgId, name, role } = bodyValidation.data;

  try {
    const user = await prisma.user.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!user) {
      response.status(404).json({ error: { message: "User not found" } });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { ...(name !== undefined ? { name } : {}), ...(role !== undefined ? { role } : {}) },
      select: { id: true, orgId: true, name: true, email: true, role: true, createdAt: true },
    });

    response.status(200).json(updatedUser);
  } catch (error) {
    console.error("User update failed", error);
    response.status(500).json({ error: { message: "Unable to update user" } });
  }
}

function sendValidationError(response: Response, issues: ReadonlyArray<{ message: string; path: PropertyKey[] }>): void {
  const issue = issues[0];
  response.status(400).json({
    error: {
      message: issue?.message ?? "Invalid request body",
      field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
    },
  });
}

function isUniqueEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
