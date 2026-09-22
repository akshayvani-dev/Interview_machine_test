import "dotenv/config";

import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, beforeEach, describe, it } from "node:test";
import jwt from "jsonwebtoken";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const jwtSecret = process.env.JWT_SECRET?.trim() || "test-secret";
const jwtSign = (jwt as any).sign || (jwt as any).default?.sign;

const testOrgId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const testUserId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const testIncidentId = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
const otherUserId = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";

function createTestUserToken(payload: {
  orgId: string;
  userId: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
}): string {
  return jwtSign({ type: "user", ...payload }, jwtSecret, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

function createTestOrgToken(payload: { orgId: string }): string {
  return jwtSign({ type: "org", ...payload }, jwtSecret, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

describe("Incident Routes - GET /incident and GET /incident/:id", () => {
  let server: Server;
  let baseUrl: string;

  const originalFindMany = prisma.incident.findMany;
  const originalCount = prisma.incident.count;
  const originalFindFirst = prisma.incident.findFirst;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    prisma.incident.findMany = originalFindMany;
    prisma.incident.count = originalCount;
    prisma.incident.findFirst = originalFindFirst;

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    prisma.incident.findMany = originalFindMany;
    prisma.incident.count = originalCount;
    prisma.incident.findFirst = originalFindFirst;
  });

  describe("Authentication & Role Authorization", () => {
    it("should return 401 when no token is provided for GET /incident", async () => {
      const res = await fetch(`${baseUrl}/incident`);
      assert.equal(res.status, 401);
      const data = (await res.json()) as { message: string; status: number };
      assert.equal(data.message, "Authentication token is required");
    });

    it("should return 401 when no token is provided for GET /incident/:id", async () => {
      const res = await fetch(`${baseUrl}/incident/${testIncidentId}`);
      assert.equal(res.status, 401);
      const data = (await res.json()) as { message: string; status: number };
      assert.equal(data.message, "Authentication token is required");
    });

    it("should return 403 when an org token is used for GET /incident", async () => {
      const token = createTestOrgToken({ orgId: testOrgId });
      const res = await fetch(`${baseUrl}/incident`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });

    it("should return 403 when an org token is used for GET /incident/:id", async () => {
      const token = createTestOrgToken({ orgId: testOrgId });
      const res = await fetch(`${baseUrl}/incident/${testIncidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(res.status, 403);
    });
  });

  describe("Parameter Validation & Security", () => {
    const validToken = createTestUserToken({
      orgId: testOrgId,
      userId: testUserId,
      role: "MEMBER",
    });

    it("should reject with 400 if orgId is passed in query params for GET /incident", async () => {
      const res = await fetch(`${baseUrl}/incident?orgId=evil-org`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(res.status, 400);
      const data = (await res.json()) as { message: string };
      assert.equal(data.message, "orgId cannot be provided in request parameters or body");
    });

    it("should reject with 400 if orgId is passed in query params for GET /incident/:id", async () => {
      const res = await fetch(`${baseUrl}/incident/${testIncidentId}?orgId=evil-org`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(res.status, 400);
      const data = (await res.json()) as { message: string };
      assert.equal(data.message, "orgId cannot be provided in request parameters or body");
    });

    it("should return 400 for invalid UUID in GET /incident/:id", async () => {
      const res = await fetch(`${baseUrl}/incident/not-a-valid-uuid`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(res.status, 400);
      const data = (await res.json()) as { message: string };
      assert.match(data.message, /Incident ID must be a valid UUID/);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      const res = await fetch(`${baseUrl}/incident?page=0`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(res.status, 400);
    });
  });

  describe("GET /incident - List Incidents with Pagination", () => {
    const token = createTestUserToken({
      orgId: testOrgId,
      userId: testUserId,
      role: "MEMBER",
    });

    it("should list incidents scoped to auth user orgId with pagination metadata", async () => {
      let capturedArgs: any = null;

      prisma.incident.findMany = (async (args: any) => {
        capturedArgs = args;
        return [
          {
            id: testIncidentId,
            orgId: testOrgId,
            title: "Database latency spike",
            description: "High latency on replica",
            severity: "HIGH",
            status: "OPEN",
            createdBy: testUserId,
            assignedTo: testUserId,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }) as any;

      prisma.incident.count = (async () => 1) as any;

      const res = await fetch(`${baseUrl}/incident?page=2&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 200);
      const data = (await res.json()) as any;

      // Verify organization scoping
      assert.equal(capturedArgs?.where?.orgId, testOrgId);
      assert.equal(capturedArgs?.skip, 5); // (2-1) * 5
      assert.equal(capturedArgs?.take, 5);

      // Verify response shape
      assert.equal(data.pagination.page, 2);
      assert.equal(data.pagination.limit, 5);
      assert.equal(data.pagination.total, 1);
      assert.equal(data.pagination.totalPages, 1);
      assert.equal(data.incidents.length, 1);
      assert.equal(data.incidents[0].title, "Database latency spike");
    });

    it("should support alias routes /api/v1/incidents", async () => {
      prisma.incident.findMany = (async () => []) as any;
      prisma.incident.count = (async () => 0) as any;

      const res = await fetch(`${baseUrl}/api/v1/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 200);
      const data = (await res.json()) as any;
      assert.deepEqual(data.incidents, []);
      assert.equal(data.pagination.page, 1);
      assert.equal(data.pagination.limit, 10);
    });
  });

  describe("GET /incident/:id - Single Incident Authorization", () => {
    const token = createTestUserToken({
      orgId: testOrgId,
      userId: testUserId,
      role: "MEMBER",
    });

    it("should return 404 if incident does not exist in the authenticated user's organization", async () => {
      let capturedArgs: any = null;
      prisma.incident.findFirst = (async (args: any) => {
        capturedArgs = args;
        return null;
      }) as any;

      const res = await fetch(`${baseUrl}/incident/${testIncidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 404);
      const data = (await res.json()) as { message: string };
      assert.equal(data.message, "Incident not found");
      // Enforce organization scoping in query
      assert.equal(capturedArgs?.where?.id, testIncidentId);
      assert.equal(capturedArgs?.where?.orgId, testOrgId);
    });

    it("should return 403 if incident belongs to org but is NOT assigned to authenticated user", async () => {
      prisma.incident.findFirst = (async () => ({
        id: testIncidentId,
        orgId: testOrgId,
        title: "Assigned to someone else",
        description: "Not for you",
        severity: "MEDIUM",
        status: "OPEN",
        createdBy: otherUserId,
        assignedTo: otherUserId, // Different assignee!
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;

      const res = await fetch(`${baseUrl}/incident/${testIncidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 403);
      const data = (await res.json()) as { message: string };
      assert.equal(data.message, "You do not have permission to access this incident");
    });

    it("should return 403 if incident is unassigned (assignedTo is null)", async () => {
      prisma.incident.findFirst = (async () => ({
        id: testIncidentId,
        orgId: testOrgId,
        title: "Unassigned incident",
        description: "Nobody assigned",
        severity: "LOW",
        status: "OPEN",
        createdBy: testUserId,
        assignedTo: null, // null!
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any;

      const res = await fetch(`${baseUrl}/incident/${testIncidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 403);
      const data = (await res.json()) as { message: string };
      assert.equal(data.message, "You do not have permission to access this incident");
    });

    it("should return 200 and incident when incident belongs to org AND is assigned to authenticated user", async () => {
      const mockIncident = {
        id: testIncidentId,
        orgId: testOrgId,
        title: "My Assigned Issue",
        description: "Working on it",
        severity: "CRITICAL",
        status: "INVESTIGATING",
        createdBy: otherUserId,
        assignedTo: testUserId, // Matches auth userId!
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      prisma.incident.findFirst = (async () => mockIncident) as any;

      const res = await fetch(`${baseUrl}/incident/${testIncidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 200);
      const data = (await res.json()) as any;
      assert.equal(data.id, testIncidentId);
      assert.equal(data.orgId, testOrgId);
      assert.equal(data.assignedTo, testUserId);
      assert.equal(data.title, "My Assigned Issue");
    });

    it("should also work via alias /api/v1/incidents/:id", async () => {
      const mockIncident = {
        id: testIncidentId,
        orgId: testOrgId,
        title: "Alias test",
        description: "Works on /api/v1/incidents/:id",
        severity: "LOW",
        status: "OPEN",
        createdBy: testUserId,
        assignedTo: testUserId,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      prisma.incident.findFirst = (async () => mockIncident) as any;

      const res = await fetch(`${baseUrl}/api/v1/incidents/${testIncidentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(res.status, 200);
      const data = (await res.json()) as any;
      assert.equal(data.id, testIncidentId);
      assert.equal(data.assignedTo, testUserId);
    });
  });
});
