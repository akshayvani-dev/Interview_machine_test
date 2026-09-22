import type { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import { IncidentEventType } from "../constants/incident.js";

interface GetIncidentEventsParams {
  incidentId: string;
  orgId: string;
  userId?: string;
}

interface CreateIncidentEventParams {
  incidentId: string;
  orgId: string;
  userId: string;
  type: IncidentEventType;
  metadata?: Prisma.InputJsonValue;
}

export const createIncidentEvent = async ({
  incidentId,
  orgId,
  userId,
  type,
  metadata,
}: CreateIncidentEventParams) => {
  return prisma.incidentEvent.create({
    data: {
      incidentId,
      orgId,
      userId,
      type,
      ...(metadata !== undefined ? { metadata } : {}),
    },
  });
};

export const getIncidentEvents = async ({
  incidentId,
  orgId,
  userId,
}: GetIncidentEventsParams) => {
  return prisma.incidentEvent.findMany({
    where: {
      incidentId,
      orgId,
      ...(userId ? { userId } : {}),
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

