import React, { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  UserRound,
  ShieldAlert,
  CircleDot,
  GitCommitHorizontal,
  Pencil,
} from "lucide-react";
import { getIncidentById, type Incident } from "../api/incidentApis.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { Badge } from "../components/Badge.tsx";
import { Button } from "../components/Button.tsx";
import { EditIncidentModal } from "../components/EditIncidentModal.tsx";
import {
  getIncidentSeverityTone,
  getIncidentStatusTone,
} from "../utils/incident.ts";

export const IncidentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const canEditIncident = profile?.type === "user";

  const incidentFromState =
    (location.state as { incident?: Incident } | null)?.incident ?? null;

  const incidentQuery = useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncidentById(id as string),
    initialData: incidentFromState ?? undefined,
    enabled: Boolean(id),
  });

  const incident = incidentQuery.data ?? incidentFromState;
  const isInitialLoading = incidentQuery.isLoading && !incident;

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  if (!id) {
    return null;
  }

  if (isInitialLoading) {
    return (
      <div id="page-incident-details" className="space-y-6">
        <BackLink />
        <IncidentDetailsSkeleton />
      </div>
    );
  }

  if (incidentQuery.isError || !incident) {
    return (
      <div id="page-incident-details" className="space-y-6">
        <BackLink />
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-rose-600">
            Unable to load incident
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {incidentQuery.error instanceof Error
              ? incidentQuery.error.message
              : "The incident could not be found."}
          </p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => void incidentQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const createdDate = dateFormatter.format(new Date(incident.createdAt));
  const updatedDate = incident.updatedAt
    ? dateFormatter.format(new Date(incident.updatedAt))
    : null;
  const version = incident.version ?? null;

  return (
    <div id="page-incident-details" className="space-y-6">
      <BackLink />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
             <h2 className="mb-3 break-words font-semibold leading-snug text-zinc-950 sm:text-sm">
              {incident.title}
            </h2>
          </div>

          {canEditIncident && (
            <Button size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit incident
            </Button>
          )}
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <section className="border-zinc-100 p-5 sm:p-6 lg:border-r">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100">
                <ShieldAlert className="h-4 w-4 text-zinc-600" />
              </div>

              <h3 className="text-sm font-semibold text-zinc-900">
                Description
              </h3>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">
                {incident.description || "No description provided."}
              </p>
            </div>
          </section>

          {/* Right: incident information */}
          <section className="border-t border-zinc-100 bg-zinc-50/40 p-5 sm:p-6 lg:border-t-0">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              Incident information
            </h3>

            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {/* Severity */}
              <div className="flex items-start gap-3 border-b border-r border-zinc-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <ShieldAlert className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">Severity</p>

                  <div className="mt-1">
                    <Badge tone={getIncidentSeverityTone(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3 border-b border-zinc-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <CircleDot className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">Status</p>

                  <div className="mt-1">
                    <Badge tone={getIncidentStatusTone(incident.status)}>
                      {incident.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Assigned to */}
              <div className="flex items-start gap-3 border-b border-r border-zinc-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <UserRound className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">
                    Assigned to
                  </p>

                  <p className="mt-1 break-words text-sm font-medium text-zinc-800">
                    {incident.assignedTo?.name ?? "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Created */}
              <div className="flex items-start gap-3 border-b border-zinc-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <CalendarDays className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">Created</p>

                  <p className="mt-1 text-sm font-medium text-zinc-800">
                    {createdDate}
                  </p>
                </div>
              </div>

              {/* Updated */}
              <div className="flex items-start gap-3 border-r border-zinc-200 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <Clock className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">
                    Updated at
                  </p>

                  <p className="mt-1 text-sm font-medium text-zinc-800">
                    {updatedDate ?? "—"}
                  </p>
                </div>
              </div>

              {/* Version */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <GitCommitHorizontal className="h-4 w-4 text-zinc-500" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-400">Version</p>

                  <p className="mt-1 text-sm font-medium text-zinc-800">
                    {version !== null ? `v${version}` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {canEditIncident && (
        <EditIncidentModal
          incident={incident}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onUpdated={() => {
            void queryClient.invalidateQueries({ queryKey: ["incident", id] });
            void queryClient.invalidateQueries({ queryKey: ["incidents"] });
          }}
        />
      )}
    </div>
  );
};

const BackLink: React.FC = () => (
  <Link
    to="/incidents"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"
  >
    <ArrowLeft className="h-4 w-4" />
    Back to incidents
  </Link>
);

const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`animate-pulse rounded-md bg-zinc-200/70 ${className ?? ""}`}
  />
);

const IncidentDetailsSkeleton: React.FC = () => (
  <div
    role="status"
    aria-label="Loading incident details"
    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
  >
    {/* Header */}
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
      <div className="min-w-0 space-y-2">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-3.5 w-56" />
      </div>
      <SkeletonBlock className="h-9 w-32 rounded-lg" />
    </div>

    {/* Split layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2">
      {/* Left: title + description */}
      <section className="border-zinc-100 p-5 sm:p-6 lg:border-r">
        <SkeletonBlock className="mb-4 h-4 w-3/4" />

        <div className="mb-2 flex items-center gap-2">
          <SkeletonBlock className="h-7 w-7 rounded-lg" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
          <SkeletonBlock className="h-3.5 w-full" />
          <SkeletonBlock className="h-3.5 w-full" />
          <SkeletonBlock className="h-3.5 w-2/3" />
        </div>
      </section>

      {/* Right: incident information */}
      <section className="border-t border-zinc-100 bg-zinc-50/40 p-5 sm:p-6 lg:border-t-0">
        <SkeletonBlock className="mb-3 h-4 w-40" />

        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-4 ${
                index % 2 === 0 ? "border-r border-zinc-200" : ""
              } ${index < 4 ? "border-b border-zinc-200" : ""}`}
            >
              <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>

    <span className="sr-only">Loading incident details…</span>
  </div>
);
