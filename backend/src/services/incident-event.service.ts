import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { IncidentEventType } from "../constants/incident.js";
import { createIncidentNotification } from "./notification.service.js";

type EventActor = {
  id: string;
  name: string;
  role: string;
};

function generateIncidentEventMessage(
  type: IncidentEventType,
  actor: EventActor,
  metadata?: Prisma.InputJsonValue,
): string {
  const actorLabel = `${actor.name} (${actor.role})`;

  const data =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  switch (type) {
    case IncidentEventType.CREATED:
      return `${actorLabel} created incident`;

    case IncidentEventType.UPDATED:
      return `${actorLabel} updated incident details`;

    case IncidentEventType.STATUS_CHANGED:
      return `${actorLabel} changed incident status from ${String(
        data.from ?? "",
      )} to ${String(data.to ?? "")}`;

    case IncidentEventType.SEVERITY_CHANGED:
      return `${actorLabel} changed incident severity from ${String(
        data.from ?? "",
      )} to ${String(data.to ?? "")}`;

    case IncidentEventType.ASSIGNED:
      if (!data.from && data.to) {
        return `${actorLabel} assigned incident`;
      }

      if (data.from && !data.to) {
        return `${actorLabel} unassigned incident`;
      }

      return `${actorLabel} changed incident assignment`;

    default:
      return `${actorLabel} recorded an incident event`;
  }
}

export async function createIncidentEvent({
  incidentId,
  orgId,
  userId,
  type,
  metadata,
}: {
  incidentId: string;
  orgId: string;
  userId: string;
  type: IncidentEventType;
  metadata?: Prisma.InputJsonValue;
}) {
  const actor = await prisma.user.findFirst({
    where: {
      id: userId,
      orgId,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!actor) {
    throw new Error("Event actor not found");
  }

  const message = generateIncidentEventMessage(type, actor, metadata);

  const event = await prisma.incidentEvent.create({
    data: {
      orgId,
      incidentId,
      userId,
      type,
      message,
      ...(metadata !== undefined ? { metadata } : {}),
    },
  });

  /*

* Notifications are handled separately from incident events.
*
* The event is persisted first. Then the notification service:
* 1. Determines recipients
* 2. Persists notifications
* 3. Emits Socket.IO notifications
*
* If Socket.IO emission fails, the notification remains persisted
* in the database for the user to fetch later.
  */
  await createIncidentNotification({
    event,
    orgId,
    actorUserId: userId,
    ...(metadata !== undefined ? { metadata } : {}),
  });

  return event;
}

export async function getOrganizationIncidentEvents({
  orgId,
  page = 1,
  limit = 20,
}: {
  orgId: string;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.incidentEvent.findMany({
      where: {
        incident: {
          orgId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        incident: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.incidentEvent.count({
      where: {
        incident: {
          orgId,
        },
      },
    }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getIncidentEvents({
  incidentId,
  orgId,
  page = 1,
  limit = 20,
}: {
  incidentId: string;
  orgId: string;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.incidentEvent.findMany({
      where: {
        incidentId,
        incident: {
          orgId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),

    prisma.incidentEvent.count({
      where: {
        incidentId,
        incident: {
          orgId,
        },
      },
    }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
