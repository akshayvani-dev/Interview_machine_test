import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Pencil,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { getIncidentEvents, type IncidentEvent } from "../api/incidentApis.ts";

type EventDisplayType = "status" | "severity" | "assignment" | "updated";

const eventIcons = {
  status: CircleDot,
  severity: ShieldAlert,
  assignment: UserRound,
  updated: Pencil,
};

const getEventDisplayType = (event: IncidentEvent): EventDisplayType => {
  switch (event.type) {
    case "STATUS_CHANGED":
      return "status";

    case "SEVERITY_CHANGED":
      return "severity";

    case "ASSIGNED":
    case "UNASSIGNED":
      return "assignment";

    case "CREATED":
    case "UPDATED":
    default:
      return "updated";
  }
};

const getEventTitle = (event: IncidentEvent): string => {
  switch (event.type) {
    case "CREATED":
      return "Incident created";

    case "STATUS_CHANGED":
      return "Status changed";

    case "SEVERITY_CHANGED":
      return "Severity updated";

    case "ASSIGNED":
      return "Incident assigned";

    case "UNASSIGNED":
      return "Incident unassigned";

    case "UPDATED":
      return "Incident updated";

    default:
      return event.type
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/^\w/, (char) => char.toUpperCase());
  }
};

const formatTimestamp = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const IncidentEventsSkeleton: React.FC = () => (
  <div className="divide-y divide-zinc-100">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="flex gap-3 px-5 py-4 sm:px-6">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-zinc-200" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex justify-between gap-3">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
          </div>

          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />

          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    ))}
  </div>
);

export const IncidentEventsListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [page, setPage] = React.useState(1);

  const limit = 10;

  const eventsQuery = useQuery({
    queryKey: ["incident-events", id, page, limit],
    queryFn: () => getIncidentEvents(id as string, page, limit),
    enabled: Boolean(id),
  });

  const events = eventsQuery.data?.data ?? [];
  const pagination = eventsQuery.data?.pagination;

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const handlePreviousPage = () => {
    if (!hasPreviousPage || eventsQuery.isFetching) {
      return;
    }

    setPage((currentPage) => currentPage - 1);
  };

  const handleNextPage = () => {
    if (!hasNextPage || eventsQuery.isFetching) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <Activity className="h-4 w-4 text-zinc-600" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Incident events
            </h3>

            <p className="mt-0.5 text-xs text-zinc-500">
              Activity and changes made to this incident
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {eventsQuery.isLoading && <IncidentEventsSkeleton />}

      {/* Error */}
      {eventsQuery.isError && (
        <div className="px-5 py-8 text-center sm:px-6">
          <p className="text-sm font-medium text-rose-600">
            Unable to load incident events
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {eventsQuery.error instanceof Error
              ? eventsQuery.error.message
              : "Something went wrong while loading the incident events."}
          </p>

          <button
            type="button"
            onClick={() => void eventsQuery.refetch()}
            className="mt-3 text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!eventsQuery.isLoading &&
        !eventsQuery.isError &&
        events.length === 0 && (
          <div className="px-5 py-8 text-center sm:px-6">
            <p className="text-sm font-medium text-zinc-700">No events yet</p>

            <p className="mt-1 text-xs text-zinc-500">
              Activity and changes for this incident will appear here.
            </p>
          </div>
        )}

      {/* Events */}
      {!eventsQuery.isLoading && !eventsQuery.isError && events.length > 0 && (
        <>
          <div className="divide-y divide-zinc-100">
            {events.map((event) => {
              const displayType = getEventDisplayType(event);
              const Icon = eventIcons[displayType];

              return (
                <div
                  key={event.id}
                  className={`flex gap-3 px-5 py-4 transition-opacity sm:px-6 ${
                    eventsQuery.isFetching ? "opacity-60" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                    <Icon className="h-2 w-2 text-zinc-500" />
                  </div>

                  {/* Event content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs font-medium text-zinc-800">
                        {getEventTitle(event)}
                      </p>

                      <time
                        dateTime={event.createdAt}
                        className="text-xs text-zinc-400"
                      >
                        {formatTimestamp(event.createdAt)}
                      </time>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      {event.message}
                    </p>

                    <p className="mt-2 text-xs text-zinc-400">
                      By{" "}
                      <span className="font-medium text-zinc-500">
                        {event.user.name}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-zinc-100 px-5 py-3 sm:px-6">
              <p className="text-xs text-zinc-500">
                Page <span className="font-medium text-zinc-700">{page}</span>{" "}
                of{" "}
                <span className="font-medium text-zinc-700">{totalPages}</span>
                <span className="hidden sm:inline"> · {total} events</span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!hasPreviousPage || eventsQuery.isFetching}
                  aria-label="Previous page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasNextPage || eventsQuery.isFetching}
                  aria-label="Next page"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
