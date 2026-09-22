import type { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import { IncidentEventType } from "../constants/incident.js";

interface GetIncidentEventsParams {
  incidentId: string;
  orgId: string;
  userId?: string;
  type?: IncidentEventType;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

interface CreateIncidentEventParams {
  incidentId: string;
  orgId: string;
  userId: string;
  type: IncidentEventType;
  metadata?: Prisma.InputJsonValue;
}

function generateIncidentEventMessage(
  type: IncidentEventType,
  metadata?: Prisma.InputJsonValue,
): string {
  switch (type) {
    case IncidentEventType.CREATED:
      return "Incident created";

    case IncidentEventType.UPDATED:
      return "Incident details updated";

    case IncidentEventType.STATUS_CHANGED: {
      const data = metadata as { from?: string; to?: string };

      return `Incident status changed from ${data.from} to ${data.to}`;
    }

    case IncidentEventType.SEVERITY_CHANGED: {
      const data = metadata as { from?: string; to?: string };

      return `Incident severity changed from ${data.from} to ${data.to}`;
    }

    case IncidentEventType.ASSIGNED: {
      const data = metadata as {
        from?: string | null;
        to?: string | null;
      };

      if (!data.from && data.to) {
        return "Incident assigned";
      }

      if (data.from && !data.to) {
        return "Incident unassigned";
      }

      return "Incident assignment changed";
    }

    default:
      return "Incident event recorded";
  }
}

interface GetOrganizationIncidentEventsParams {
  orgId: string;
  userId?: string;
  incidentId?: string;
  type?: IncidentEventType;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export const getOrganizationIncidentEvents = async ({
  orgId,
  userId,
  incidentId,
  type,
  from,
  to,
  page,
  limit,
}: GetOrganizationIncidentEventsParams) => {
  const where: Prisma.IncidentEventWhereInput = {
    orgId,

    ...(userId ? { userId } : {}),
    ...(incidentId ? { incidentId } : {}),
    ...(type ? { type } : {}),

    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.incidentEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.incidentEvent.count({
      where,
    }),
  ]);

  return {
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createIncidentEvent = async ({
  incidentId,
  orgId,
  userId,
  type,
  metadata,
}: CreateIncidentEventParams) => {
  const message = generateIncidentEventMessage(type, metadata);

  return prisma.incidentEvent.create({
    data: {
      incidentId,
      orgId,
      userId,
      type,
      message,
      ...(metadata !== undefined ? { metadata } : {}),
    },
  });
};

export const getIncidentEvents = async ({
  incidentId,
  orgId,
  userId,
  type,
  from,
  to,
  page,
  limit,
}: GetIncidentEventsParams) => {
  const where: Prisma.IncidentEventWhereInput = {
    incidentId,
    orgId,

    ...(userId ? { userId } : {}),

    ...(type ? { type } : {}),

    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.incidentEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.incidentEvent.count({
      where,
    }),
  ]);

  return {
    data: events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
