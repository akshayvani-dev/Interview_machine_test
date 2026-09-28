import React, { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from "../api/notificationApis.ts";
import { apiRoutes } from "../api/routes.ts";
import { Button } from "../components/Button.tsx";

export const NotificationList: React.FC = () => {
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", page, pageSize],
    queryFn: () => getNotifications(page, pageSize),
    placeholderData: keepPreviousData,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    },
  });

  const notifications: Notification[] =
    notificationsQuery.data?.data ?? [];

  const total =
    notificationsQuery.data?.pagination.total ?? 0;

  const totalPages =
    notificationsQuery.data?.pagination.totalPages ?? 0;

  const hasPreviousPage = page > 1;

  const hasNextPage =
    totalPages > 0 && page < totalPages;

  const unreadCount = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  const formatDate = (date: string): string =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));

  const handleNotificationClick = (
    notification: Notification,
  ) => {
    if (
      !notification.readAt &&
      !markAsReadMutation.isPending
    ) {
      markAsReadMutation.mutate(notification.id);
    }

    navigate(`/incidents/${notification.incidentId}`);
  };

  return (
    <div
      id="notification-list"
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-600" />

          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Notifications
            </h2>

            <p className="mt-0.5 text-xs text-zinc-500">
              {total}{" "}
              {total === 1
                ? "notification"
                : "notifications"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={
            unreadCount === 0 ||
            markAllAsReadMutation.isPending
          }
          onClick={() =>
            markAllAsReadMutation.mutate()
          }
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />

          {markAllAsReadMutation.isPending
            ? "Marking..."
            : "Mark all read"}
        </Button>
      </div>

      {notificationsQuery.isError ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-rose-600">
            Unable to load notifications
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {notificationsQuery.error.message}
          </p>

          <Button
            className="mt-4"
            size="sm"
            onClick={() =>
              void notificationsQuery.refetch()
            }
          >
            Try again
          </Button>
        </div>
      ) : notificationsQuery.isLoading ? (
        <div className="p-8 text-center text-sm text-zinc-500">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-[240px] items-center justify-center p-8">
          <div className="max-w-xs text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 ring-8 ring-zinc-50">
              <Bell className="h-5 w-5" />
            </div>

            <h3 className="text-sm font-semibold text-zinc-900">
              No notifications
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              You don't have any notifications yet.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-100">
            {notifications.map((notification) => {
              const isUnread = !notification.readAt;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  className={`block w-full cursor-pointer px-4 py-4 text-left transition-colors hover:bg-zinc-50 sm:px-5 ${
                    isUnread
                      ? "bg-zinc-50/80"
                      : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 shrink-0">
                      <span
                        className={`block h-2 w-2 rounded-full ${
                          isUnread
                            ? "bg-zinc-900"
                            : "bg-transparent"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-sm ${
                            isUnread
                              ? "font-semibold text-zinc-900"
                              : "font-medium text-zinc-700"
                          }`}
                        >
                          {notification.title}
                        </p>

                        <span className="shrink-0 text-[11px] text-zinc-400">
                          {formatDate(
                            notification.createdAt,
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Page {page} of {totalPages} · {total}{" "}
              {total === 1
                ? "notification"
                : "notifications"}
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                aria-label="Previous page"
                disabled={
                  !hasPreviousPage ||
                  notificationsQuery.isFetching
                }
                onClick={() =>
                  setPage(
                    (currentPage) => currentPage - 1,
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">
                  Previous
                </span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                aria-label="Next page"
                disabled={
                  !hasNextPage ||
                  notificationsQuery.isFetching
                }
                onClick={() =>
                  setPage(
                    (currentPage) => currentPage + 1,
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">
                  Next
                </span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
