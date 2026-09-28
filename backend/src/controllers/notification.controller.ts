import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import { getAuthenticatedUser } from "../utils/auth.js";

import { sendError } from "../utils/response.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "../schemas/notification.schema.js";

/**

* List Notifications
*
* Returns only notifications belonging to the authenticated user
* within the authenticated organization.
  */
export async function listNotifications(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const queryValidation = listNotificationsQuerySchema.safeParse(request.query);

  if (!queryValidation.success) {
    sendValidationError(response, queryValidation.error.issues);
    return;
  }

  const {
    page,
    pageSize,
    limit: queryLimit,
    unreadOnly,
  } = queryValidation.data;

  const limit = pageSize ?? queryLimit;
  const skip = (page - 1) * limit;

  const notificationWhere: Prisma.NotificationWhereInput = {
    orgId: auth.orgId,
    userId: auth.userId,

    ...(unreadOnly === true
      ? {
          readAt: null,
        }
      : {}),
  };

  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: notificationWhere,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          incidentId: true,
          incidentEventId: true,
          type: true,
          title: true,
          message: true,
          readAt: true,
          createdAt: true,
        },
      }),

      prisma.notification.count({
        where: notificationWhere,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    response.status(200).json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Notifications listing failed", error);
    sendError(response, 500, "Unable to list notifications");
  }
}

/**

* Get Unread Notification Count
  */
export async function getUnreadNotificationCount(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  try {
    const count = await prisma.notification.count({
      where: {
        orgId: auth.orgId,
        userId: auth.userId,
        readAt: null,
      },
    });

    response.status(200).json({
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("Unread notification count failed", error);

    sendError(response, 500, "Unable to get unread notification count");
  }
}

/**

* Mark Notification As Read
  */
export async function markNotificationAsRead(
  request: Request,
  response: Response,
): Promise<void> {
  const paramsValidation = notificationIdParamsSchema.safeParse(request.params);

  if (!paramsValidation.success) {
    sendValidationError(response, paramsValidation.error.issues);
    return;
  }

  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  const { id } = paramsValidation.data;

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        orgId: auth.orgId,
        userId: auth.userId,
      },
      select: {
        id: true,
        readAt: true,
      },
    });

    if (!notification) {
      sendError(response, 404, "Notification not found");
      return;
    }

    if (notification.readAt) {
      response.status(200).json({
        data: notification,
      });
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        readAt: new Date(),
      },
      select: {
        id: true,
        incidentId: true,
        incidentEventId: true,
        type: true,
        title: true,
        message: true,
        readAt: true,
        createdAt: true,
      },
    });

    response.status(200).json({
      data: updatedNotification,
    });
  } catch (error) {
    console.error("Notification read update failed", error);

    sendError(response, 500, "Unable to mark notification as read");
  }
}

/**

* Mark All Notifications As Read
  */
export async function markAllNotificationsAsRead(
  request: Request,
  response: Response,
): Promise<void> {
  const auth = getAuthenticatedUser(request, response);
  if (!auth) return;

  try {
    const result = await prisma.notification.updateMany({
      where: {
        orgId: auth.orgId,
        userId: auth.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
    response.status(200).json({
      data: {
        updatedCount: result.count,
      },
    });
  } catch (error) {
    console.error("Mark all notifications as read failed", error);

    sendError(response, 500, "Unable to mark all notifications as read");
  }
}

function sendValidationError(
  response: Response,
  issues: ReadonlyArray<{ message: string }>,
): void {
  sendError(response, 400, issues[0]?.message ?? "Invalid request");
}
