import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Table } from "@radix-ui/themes";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";

import { getIncidents, updateIncident } from "../api/incidentApis.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { AddIncidentModal } from "../components/AddIncidentModal.tsx";
import { Button } from "../components/Button.tsx";
import {
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  IncidentSeverity,
  IncidentStatus,
} from "../enums/incident.ts";
import "../assets/styles/table-utilities.css";

export const Incidents: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false);

  // Track which row is currently being mutated so we don't freeze the
  // whole table when a single row's severity/status is being updated.
  const [pendingIncidentId, setPendingIncidentId] = useState<string | null>(
    null,
  );

  const [rowError, setRowError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const pageSize = 10;
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const updateIncidentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateIncident>[1];
    }) => updateIncident(id, payload),

    onMutate: ({ id }) => {
      setPendingIncidentId(id);
      setRowError(null);
    },

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });

      toast.success("Incident updated successfully");
    },

    onError: (error, { id }) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update incident";

      setRowError({
        id,
        message,
      });

      // Re-sync with the server state after a failed update.
      void queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });

      toast.error(message);
    },

    onSettled: () => {
      setPendingIncidentId(null);
    },
  });

  const incidentsQuery = useQuery({
    queryKey: ["incidents", page, pageSize],
    queryFn: () => getIncidents(page, pageSize),
    placeholderData: keepPreviousData,
  });

  const incidents = incidentsQuery.data?.data ?? [];
  const total = incidentsQuery.data?.pagination.total ?? 0;
  const totalPages = incidentsQuery.data?.pagination.totalPages ?? 0;

  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > 0 && page < totalPages;

  const canCreateIncident = profile?.type === "user";

  const formatDate = (date: string): string =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(date));

  return (
    <div id="page-incidents" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Incidents
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Track active operational events and system escalations
          </p>
        </div>

        {canCreateIncident && (
          <Button
            size="sm"
            onClick={() => setIsAddIncidentOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add incident
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {incidentsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-rose-600">
              Unable to load incidents
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {incidentsQuery.error.message}
            </p>

            <Button
              className="mt-4"
              size="sm"
              onClick={() => void incidentsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : incidentsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Loading incidents...
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center p-8 sm:p-12">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 ring-8 ring-zinc-50">
                <AlertCircle className="h-5 w-5" />
              </div>

              <h3 className="text-sm font-semibold text-zinc-900">
                No incidents yet
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Incidents created for this organization will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Organization incidents
                  </h3>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    {total} {total === 1 ? "incident" : "incidents"} recorded
                  </p>
                </div>

                {incidentsQuery.isFetching && (
                  <span className="text-xs text-zinc-400">
                    Updating...
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table.Root
                variant="surface"
                size="2"
                className="users-table u-table-fixed w-full min-w-[900px]"
              >
                <colgroup>
                  <col style={{ width: 200 }} />
                  <col style={{ width: 50 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 200 }} />
                  <col style={{ width: 200 }} />
                  <col style={{ width: 90 }} />
                </colgroup>

                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>
                      Incident
                    </Table.ColumnHeaderCell>

                    <Table.ColumnHeaderCell>
                      Version
                    </Table.ColumnHeaderCell>

                    <Table.ColumnHeaderCell>
                      Severity
                    </Table.ColumnHeaderCell>

                    <Table.ColumnHeaderCell>
                      Status
                    </Table.ColumnHeaderCell>

                    <Table.ColumnHeaderCell>
                      Assigned to
                    </Table.ColumnHeaderCell>

                    <Table.ColumnHeaderCell>
                      Last updated
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {incidents.map((incident) => {
                    const isRowPending =
                      updateIncidentMutation.isPending &&
                      pendingIncidentId === incident.id;

                    return (
                      <Table.Row key={incident.id}>
                        <Table.RowHeaderCell className="align-top">
                          <div className="max-w-[280px]">
                            <Link
                              to={`/incidents/${incident.id}`}
                              className="u-truncate block cursor-pointer rounded-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900 focus:outline-none focus-visible:decoration-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
                            >
                              {incident.title}
                            </Link>

                            <span className="u-clamp-2 mt-0.5 text-xs text-zinc-500">
                              {incident.description}
                            </span>
                          </div>
                        </Table.RowHeaderCell>

                        <Table.Cell className="align-top">
                          <span className="text-xs font-medium text-zinc-600">
                            {incident.version !== null &&
                            incident.version !== undefined
                              ? `v${incident.version}`
                              : "—"}
                          </span>
                        </Table.Cell>

                        <Table.Cell className="align-top">
                          <select
                            aria-label={`Change severity for ${incident.title}`}
                            value={incident.severity}
                            disabled={isRowPending}
                            onChange={(event) =>
                              updateIncidentMutation.mutate({
                                id: incident.id,
                                payload: {
                                  severity:
                                    event.target.value as IncidentSeverity,
                                  version: incident.version,
                                },
                              })
                            }
                            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {INCIDENT_SEVERITY_OPTIONS.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Table.Cell>

                        <Table.Cell className="align-top">
                          <select
                            aria-label={`Change status for ${incident.title}`}
                            value={incident.status}
                            disabled={isRowPending}
                            onChange={(event) =>
                              updateIncidentMutation.mutate({
                                id: incident.id,
                                payload: {
                                  status:
                                    event.target.value as IncidentStatus,
                                  version: incident.version,
                                },
                              })
                            }
                            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {INCIDENT_STATUS_OPTIONS.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>

                          {rowError?.id === incident.id && (
                            <p className="mt-1 text-[11px] text-rose-600">
                              {rowError.message}
                            </p>
                          )}
                        </Table.Cell>

                        <Table.Cell className="align-top">
                          {incident.assignedTo ? (
                            <div className="min-w-0 max-w-full">
                              <p className="u-truncate font-medium text-zinc-800">
                                {incident.assignedTo.name}
                              </p>

                              <p className="u-truncate text-xs text-zinc-500">
                                {incident.assignedTo.email}
                              </p>

                              <p className="u-truncate text-[11px] text-zinc-400">
                                {incident.assignedTo.role}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-zinc-400">
                              Unassigned
                            </span>
                          )}
                        </Table.Cell>

                        <Table.Cell className="u-nowrap align-top">
                          <span className="text-xs text-zinc-500">
                            {formatDate(incident.updatedAt)}
                          </span>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                Page {page} of {totalPages} · {total}{" "}
                {total === 1 ? "incident" : "incidents"}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Previous page"
                  disabled={
                    !hasPreviousPage ||
                    incidentsQuery.isFetching
                  }
                  onClick={() =>
                    setPage((currentPage) => currentPage - 1)
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
                    incidentsQuery.isFetching
                  }
                  onClick={() =>
                    setPage((currentPage) => currentPage + 1)
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

      {canCreateIncident && (
        <AddIncidentModal
          open={isAddIncidentOpen}
          onOpenChange={setIsAddIncidentOpen}
          onCreated={() => {
            void queryClient.invalidateQueries({
              queryKey: ["incidents"],
            });
          }}
        />
      )}
    </div>
  );
};
