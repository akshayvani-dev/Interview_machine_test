import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import { registerOrganizationSchema } from "../schemas/organization.schema.js";

const SALT_ROUNDS = 10;

export async function registerOrganization(
  request: Request,
  response: Response
): Promise<void> {
  const validation = registerOrganizationSchema.safeParse(request.body);

  if (!validation.success) {
    const issue = validation.error.issues[0];
    response.status(400).json({
      error: {
        message: issue?.message ?? "Invalid request body",
        field: typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
      },
    });
    return;
  }

  const { name, email, password } = validation.data;

  try {
    const existingOrganization = await prisma.organization.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingOrganization) {
      response.status(409).json({
        error: { message: "An organization already uses this email", field: "email" },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const organization = await prisma.organization.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    response.status(201).json(organization);
  } catch (error) {
    // A second request can pass the lookup before the first one inserts.
    if (isUniqueEmailError(error)) {
      response.status(409).json({
        error: { message: "An organization already uses this email", field: "email" },
      });
      return;
    }

    console.error("Organization registration failed", error);
    response.status(500).json({
      error: { message: "Unable to register organization" },
    });
  }
}

function isUniqueEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
