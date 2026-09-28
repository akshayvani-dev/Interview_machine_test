import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { IncidentEventType } from "../constants/incident.js";
import { createIncidentNotification } from "./notification.service.js";

type EventActor = {
  id: string;
  name: string;
  role: string;
};

type AssignedUser = {
  id: string;
  name: string;
  role: string;
};

type EventMessageResult = {
  title: string;
  message: string;
};

function generateIncidentEventMessage(
  type: IncidentEventType,
  actor: EventActor,
  metadata?: Prisma.InputJsonValue,
  assignedUser?: AssignedUser | null,
): EventMessageResult {
  const actorLabel = `${actor.name} (${actor.role})`;

  const data =
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  switch (type) {
    case IncidentEventType.CREATED: {
      if (assignedUser) {
        const assignedUserLabel = `${assignedUser.name} (${assignedUser.role})`;

        return {
          title: "Incident created and assigned",
          message: `${actorLabel} created incident and assigned it to ${assignedUserLabel}`,
        };
      }

      return {
        title: "Incident created",
        message: `${actorLabel} created incident`,
      };
    }

    case IncidentEventType.UPDATED:
      return {
        title: "Incident updated",
        message: `${actorLabel} updated incident details`,
      };

    case IncidentEventType.STATUS_CHANGED:
      return {
        title: "Incident status changed",
        message: `${actorLabel} changed incident status from ${String(
          data.from ?? "",
        )} to ${String(data.to ?? "")}`,
      };

    case IncidentEventType.SEVERITY_CHANGED:
      return {
        title: "Incident severity changed",
        message: `${actorLabel} changed incident severity from ${String(
          data.from ?? "",
        )} to ${String(data.to ?? "")}`,
      };

    case IncidentEventType.ASSIGNED: {
      const fromUser = data.fromUser as
        | {
            id?: unknown;
            name?: unknown;
            role?: unknown;
          }
        | undefined;

      const toUser = data.toUser as
        | {
            id?: unknown;
            name?: unknown;
            role?: unknown;
          }
        | undefined;

      const fromLabel =
        typeof fromUser?.name === "string" &&
        typeof fromUser?.role === "string"
          ? `${fromUser.name} (${fromUser.role})`
          : null;

      const toLabel =
        typeof toUser?.name === "string" &&
        typeof toUser?.role === "string"
          ? `${toUser.name} (${toUser.role})`
          : null;

      if (!fromLabel && toLabel) {
        return {
          title: "Incident assigned",
          message: `${actorLabel} assigned incident to ${toLabel}`,
        };
      }

      if (fromLabel && !toLabel) {
        return {
          title: "Incident unassigned",
          message: `${actorLabel} unassigned ${fromLabel} from incident`,
        };
      }

      if (fromLabel && toLabel) {
        return {
          title: "Incident reassigned",
          message: `${actorLabel} reassigned incident from ${fromLabel} to ${toLabel}`,
        };
      }

      if (!data.from && data.to) {
        return {
          title: "Incident assigned",
          message: `${actorLabel} assigned incident`,
        };
      }

      if (data.from && !data.to) {
        return {
          title: "Incident unassigned",
          message: `${actorLabel} unassigned incident`,
        };
      }

      return {
        title: "Incident assignment changed",
        message: `${actorLabel} changed incident assignment`,
      };
    }

    default:
      return {
        title: "Incident updated",
        message: `${actorLabel} recorded an incident event`,
      };
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
  const [actor, incident] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: userId,
        orgId,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    }),

    prisma.incident.findFirst({
      where: {
        id: incidentId,
        orgId,
      },
      select: {
        id: true,
        assignedTo: true,
      },
    }),
  ]);

  if (!actor) {
    throw new Error("Event actor not found");
  }

  if (!incident) {
    throw new Error("Incident not found");
  }

  let assignedUser: AssignedUser | null = null;

  if (type === IncidentEventType.CREATED && incident.assignedTo) {
    assignedUser = await prisma.user.findFirst({
      where: {
        id: incident.assignedTo,
        orgId,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
  }

  const messageResult = generateIncidentEventMessage(
    type,
    actor,
    metadata,
    assignedUser,
  );

  const event = await prisma.incidentEvent.create({
    data: {
      orgId,
      incidentId,
      userId,
      type,
      message: messageResult.message,
      ...(metadata !== undefined ? { metadata } : {}),
    },
  });

  await createIncidentNotification({
    event,
    orgId,
    actorUserId: userId,
    title: messageResult.title,
    message: messageResult.message,
    ...(metadata !== undefined ? { metadata } : {}),
  });

  return event;
}

export async function getOrganizationIncidentEvents({
  orgId,
  assignedTo,
  userId,
  incidentId,
  type,
  from,
  to,
  page = 1,
  limit = 20,
}: {
  orgId: string;
  assignedTo?: string;
  userId?: string;
  incidentId?: string;
  type?: IncidentEventType;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.IncidentEventWhereInput = {
    incident: {
      orgId,

      ...(assignedTo
        ? {
            assignedTo,
          }
        : {}),

      ...(incidentId
        ? {
            id: incidentId,
          }
        : {}),
    },

    ...(userId
      ? {
          userId,
        }
      : {}),

    ...(type
      ? {
          type,
        }
      : {}),

    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.incidentEvent.findMany({
      where,
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
      where,
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
  assignedTo,
  userId,
  type,
  from,
  to,
  page = 1,
  limit = 20,
}: {
  incidentId: string;
  orgId: string;
  assignedTo?: string;
  userId?: string;
  type?: IncidentEventType;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const where: Prisma.IncidentEventWhereInput = {
    incident: {
      id: incidentId,
      orgId,

      ...(assignedTo
        ? {
            assignedTo,
          }
        : {}),
    },

    ...(userId
      ? {
          userId,
        }
      : {}),

    ...(type
      ? {
          type,
        }
      : {}),

    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.incidentEvent.findMany({
      where,
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
      where,
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

