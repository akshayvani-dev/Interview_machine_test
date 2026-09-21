import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";

import { UserRole } from "../constants/user.js";
import { prisma } from "../lib/prisma.js";
import { loginSchema } from "../schemas/auth.schema.js";
import type { AuthPayload } from "../types/auth.js";

const jwtSecret = getJwtSecret();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET must be set before using authentication.");
  }

  return secret;
}

export async function login(request: Request, response: Response): Promise<void> {
  const validation = loginSchema.safeParse(request.body);

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

  const { email, password } = validation.data;

  try {
    const organization = await prisma.organization.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (organization) {
      if (!(await bcrypt.compare(password, organization.passwordHash))) {
        sendInvalidCredentials(response);
        return;
      }

      await prisma.organization.update({
        where: { id: organization.id },
        data: { lastLogin: new Date() },
      });

      const token = signToken({ type: "org", orgId: organization.id });
      response.status(200).json({
        token,
        type: "org",
        id: organization.id,
        name: organization.name,
        email: organization.email,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, orgId: true, name: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      sendInvalidCredentials(response);
      return;
    }

    if (!isUserRole(user.role)) {
      console.error("User has an invalid role", { userId: user.id });
      response.status(500).json({ error: { message: "Unable to sign in" } });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = signToken({ type: "user", orgId: user.orgId, userId: user.id, role: user.role });
    response.status(200).json({
      token,
      type: "user",
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login failed", error);
    response.status(500).json({ error: { message: "Unable to sign in" } });
  }
}

export async function getCurrentProfile(request: Request, response: Response): Promise<void> {
  const auth = request.auth;

  if (!auth) {
    response.status(401).json({ error: { message: "Authentication token is required" } });
    return;
  }

  try {
    if (auth.type === "org") {
      const organization = await prisma.organization.findUnique({
        where: { id: auth.orgId },
        select: { id: true, name: true, email: true, createdAt: true, lastLogin: true },
      });

      if (!organization) {
        response.status(404).json({ error: { message: "Profile not found" } });
        return;
      }

      response.status(200).json({ type: "org", ...organization });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id: auth.userId, orgId: auth.orgId },
      select: { id: true, orgId: true, name: true, email: true, role: true, createdAt: true, lastLogin: true },
    });

    if (!user) {
      response.status(404).json({ error: { message: "Profile not found" } });
      return;
    }

    response.status(200).json({ type: "user", ...user });
  } catch (error) {
    console.error("Profile lookup failed", error);
    response.status(500).json({ error: { message: "Unable to retrieve profile" } });
  }
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, jwtSecret, { algorithm: "HS256" });
}

function sendInvalidCredentials(response: Response): void {
  response.status(401).json({ error: { message: "Invalid credentials" } });
}

function isUserRole(role: string): role is Extract<AuthPayload, { type: "user" }>["role"] {
  return Object.values(UserRole).includes(role as UserRole);
}
