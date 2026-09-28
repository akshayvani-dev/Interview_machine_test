import { fetchApi } from "./fetchClient.ts";
import { apiRoutes } from "./routes.ts";

export type NotificationType =
  | "INCIDENT_CREATED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_UPDATED";

export interface Notification {
  id: string;
  incidentId: string;
  incidentEventId: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadNotificationCountResponse {
  data: {
    count: number;
  };
}

export interface NotificationResponse {
  data: Notification;
}

export interface MarkAllNotificationsAsReadResponse {
  data: {
    updatedCount: number;
  };
}

export async function getNotifications(
  page = 1,
  limit = 10,
  unreadOnly = false,
): Promise<NotificationsResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    unreadOnly: String(unreadOnly),
  });

  return fetchApi<NotificationsResponse>(
    `${apiRoutes.notifications.list}?${query.toString()}`,
  );
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await fetchApi<UnreadNotificationCountResponse>(
    apiRoutes.notifications.unreadCount,
  );

  return response.data.count;
}

export async function markNotificationAsRead(
  id: string,
): Promise<Notification> {
  const response = await fetchApi<NotificationResponse>(
    apiRoutes.notifications.markAsRead(id),
    {
      method: "PATCH",
    },
  );

  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await fetchApi<MarkAllNotificationsAsReadResponse>(
    apiRoutes.notifications.markAllAsRead,
    {
      method: "PATCH",
    },
  );

  return response.data.updatedCount;
}
