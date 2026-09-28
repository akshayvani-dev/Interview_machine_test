import type { Prisma } from "../generated/prisma/client.js";
import {
  NotificationType,
  IncidentEventType,
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { getSocket } from "../socket.js";
import { UserRole } from "../constants/user.js";

type CreateIncidentNotificationParams = {
  event: {
    id: string;
    type: IncidentEventType;
    incidentId: string;
    createdAt: Date;
  };
  orgId: string;
  actorUserId: string;
  metadata?: Prisma.InputJsonValue;
};

type NotificationPayload = {
  id: string;
  incidentId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
};

function getNotificationType(
  eventType: IncidentEventType,
): NotificationType | null {
  switch (eventType) {
    case IncidentEventType.CREATED:
      return NotificationType.INCIDENT_CREATED;

    case IncidentEventType.ASSIGNED:
      return NotificationType.INCIDENT_ASSIGNED;

    case IncidentEventType.UPDATED:
    case IncidentEventType.STATUS_CHANGED:
    case IncidentEventType.SEVERITY_CHANGED:
      return NotificationType.INCIDENT_UPDATED;

    default:
      return null;
  }
}

function getNotificationTitle(notificationType: NotificationType): string {
  switch (notificationType) {
    case NotificationType.INCIDENT_CREATED:
      return "New incident";

    case NotificationType.INCIDENT_ASSIGNED:
      return "Incident assigned";

    case NotificationType.INCIDENT_UPDATED:
      return "Incident updated";

    default:
      return "Incident notification";
  }
}

function getNotificationRecipients(
  eventType: IncidentEventType,
  users: Array<{
    id: string;
    role: string;
  }>,
  assignedTo: string | null,
  metadata?: Prisma.InputJsonValue,
): string[] {
  // Set prevents the same user from being added more than once
  // when they match multiple recipient rules.
  const recipientIds = new Set<string>();

  const data =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  switch (eventType) {
    case IncidentEventType.CREATED: {
      for (const user of users) {
        if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
          recipientIds.add(user.id);
        }
      }

      break;
    }

    case IncidentEventType.ASSIGNED: {
      const newAssignee = typeof data.to === "string" ? data.to : null;

      if (newAssignee) {
        recipientIds.add(newAssignee);
      }

      break;
    }

    case IncidentEventType.UPDATED:
    case IncidentEventType.STATUS_CHANGED:
    case IncidentEventType.SEVERITY_CHANGED: {
      for (const user of users) {
        if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
          recipientIds.add(user.id);
        }
      }

      if (assignedTo) {
        recipientIds.add(assignedTo);
      }

      break;
    }

    default:
      break;
  }

  return [...recipientIds];
}

export async function createIncidentNotification({
  event,
  orgId,
  actorUserId,
  metadata,
}: CreateIncidentNotificationParams): Promise<void> {
  const notificationType = getNotificationType(event.type);

  if (!notificationType) {
    return;
  }

  const [incident, users] = await Promise.all([
    prisma.incident.findFirst({
      where: {
        id: event.incidentId,
        orgId,
      },
      select: {
        id: true,
        title: true,
        assignedTo: true,
      },
    }),

    prisma.user.findMany({
      where: {
        orgId,
      },
      select: {
        id: true,
        role: true,
      },
    }),
  ]);

  if (!incident) {
    return;
  }

  const recipientIds = getNotificationRecipients(
    event.type,
    users,
    incident.assignedTo,
    metadata,
  );

  if (recipientIds.length === 0) {
    return;
  }

  const title = getNotificationTitle(notificationType);

  const message =
    metadata !== undefined
      ? buildNotificationMessage(event.type, metadata, actorUserId)
      : "Incident notification";

  /*

* Persist notification for EVERY eligible recipient,
* including the actor.
*
* The actor is excluded only from Socket.IO delivery.
  */
  await prisma.notification.createMany({
    data: recipientIds.map((userId) => ({
      orgId,
      userId,
      incidentId: incident.id,
      incidentEventId: event.id,
      type: notificationType,
      title,
      message,
    })),
    skipDuplicates: true,
  });

  /*

* Emit only to users other than the actor.
  */
  const socketRecipientIds = recipientIds.filter(
    (userId) => userId !== actorUserId,
  );

  if (socketRecipientIds.length === 0) {
    return;
  }

  emitIncidentNotification({
    event,
    notificationType,
    title,
    message,
    recipientIds: socketRecipientIds,
  });
}

function buildNotificationMessage(
  eventType: IncidentEventType,
  metadata: Prisma.InputJsonValue,
  actorUserId: string,
): string {
  const data =
    typeof metadata === "object" &&
    metadata !== null &&
    !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  switch (eventType) {
    case IncidentEventType.CREATED:
      return "A new incident was created";

    case IncidentEventType.UPDATED:
      return "Incident details were updated";

    case IncidentEventType.STATUS_CHANGED:
      return `Incident status changed from ${String(
        data.from ?? "",
      )} to ${String(data.to ?? "")}`;

    case IncidentEventType.SEVERITY_CHANGED:
      return `Incident severity changed from ${String(
        data.from ?? "",
      )} to ${String(data.to ?? "")}`;

    case IncidentEventType.ASSIGNED:
      if (!data.from && data.to) {
        return "Incident was assigned";
      }

      if (data.from && !data.to) {
        return "Incident was unassigned";
      }

      return "Incident assignment was changed";

    default:
      return `Incident event recorded by ${actorUserId}`;
  }
}

function emitIncidentNotification({
  event,
  notificationType,
  title,
  message,
  recipientIds,
}: {
  event: {
    id: string;
    incidentId: string;
    createdAt: Date;
  };
  notificationType: NotificationType;
  title: string;
  message: string;
  recipientIds: string[];
}): void {
  try {
    const io = getSocket();
    const payload: NotificationPayload = {
      id: event.id,
      incidentId: event.incidentId,
      type: notificationType,
      title,
      message,
      createdAt: event.createdAt,
    };

    /*
     * Each recipient gets the notification through their
     * personal room.
     *
     * This guarantees:
     * - actor does not receive the socket notification
     * - only eligible users receive it
     * - no organization-wide accidental broadcasts
     */
    for (const userId of recipientIds) {
      io.to(`user:${userId}`).emit("notification", payload);
    }
  } catch (error) {
    /*
     * Notification is already persisted in DB.
     * Socket failure must not fail the incident operation.
     */
    console.error("Failed to emit incident notification:", error);
  }
}
