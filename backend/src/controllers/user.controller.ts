import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamsSchema,
} from "../schemas/user.schema.js";
import { getAuthenticatedOrganizationId } from "../utils/auth.js";
import { sendError } from "../utils/response.js";

const SALT_ROUNDS = 10;

export async function listUsers(request: Request, response: Response): Promise<void> {
  const orgId = getAuthenticatedOrganizationId(request, response);
  if (!orgId) {
    return;
  }

  if ("orgId" in request.query) {
    sendError(response, 400, "orgId cannot be provided in request parameters or body");
    return;
  }

  const queryValidation = listUsersQuerySchema.safeParse(request.query);
  if (!queryValidation.success) {
    sendValidationError(response, queryValidation.error.issues);
    return;
  }

  const {
    page,
    pageSize,
    limit: queryLimit,
    email,
    role,
  } = queryValidation.data;

  const limit = pageSize ?? queryLimit;
  const skip = (page - 1) * limit;

  try {
    const where = {
      orgId,
      ...(email
        ? {
            email: {
              contains: email,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(role ? { role } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orgId: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLogin: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    response.status(200).json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Users listing failed", error);
    sendError(response, 500, "Unable to list users");
  }
}

export async function createUser(request: Request, response: Response): Promise<void> {
  const validation = createUserSchema.safeParse(request.body);

  if (!validation.success) {
    sendValidationError(response, validation.error.issues);
    return;
  }

  const orgId = getAuthenticatedOrganizationId(request, response);
  if (!orgId) {
    return;
  }

  const { name, email, password, role } = validation.data;

  try {
    const [organization, existingUser] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
    ]);

    if (!organization) {
      sendError(response, 404, "Organization not found");
      return;
    }

    if (existingUser) {
      sendError(response, 409, "A user with this email already exists");
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        orgId,
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    response.status(201).json(user);
  } catch (error) {
    if (isUniqueEmailError(error)) {
      sendError(response, 409, "A user with this email already exists");
      return;
    }

    console.error("User creation failed", error);
    sendError(response, 500, "Unable to create user");
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

  const { id } = paramsValidation.data;
  const orgId = getAuthenticatedOrganizationId(request, response);

  if (!orgId) {
    return;
  }

  const { name, role } = bodyValidation.data;

  try {
    const user = await prisma.user.findFirst({
      where: { id, orgId },
      select: { id: true },
    });

    if (!user) {
      sendError(response, 404, "User not found");
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    response.status(200).json(updatedUser);
  } catch (error) {
    console.error("User update failed", error);
    sendError(response, 500, "Unable to update user");
  }
}

function sendValidationError(
  response: Response,
  issues: ReadonlyArray<{ message: string; path: PropertyKey[] }>,
): void {
  const issue = issues[0];
  sendError(response, 400, issue?.message ?? "Invalid request body");
}

function isUniqueEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

