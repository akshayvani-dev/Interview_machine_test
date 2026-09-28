import React, { useEffect, useState } from "react";
import { ChevronRight, Search, ShieldAlert, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getIncidentEventOrgs,
  type IncidentEvent,
} from "../api/incidentApis.ts";

type IncidentMetadata = {
  title?: string;
  status?: string;
  severity?: string;
  fields?: string[];
  from?: string | null;
  to?: string | null;
};

const severityStyles: Record<string, string> = {
  LOW: "bg-zinc-100 text-zinc-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-rose-50 text-rose-700",
};

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  INVESTIGATING: "bg-violet-50 text-violet-700",
  MITIGATED: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
};

const getEventTitle = (incident: IncidentEvent) => {
  const metadata = incident.metadata as IncidentMetadata;

  if (incident.message) {
    return incident.message;
  }

  switch (incident.type) {
    case "CREATED":
      return metadata.title ?? "Incident created";
    case "UPDATED":
      return "Incident details updated";
    case "ASSIGNED":
      return "Incident assigned";
    case "SEVERITY_CHANGED":
      return "Incident severity changed";
    default:
      return incident.type.replace(/_/g, " ");
  }
};

const getEventDescription = (incident: IncidentEvent) => {
  const metadata = incident.metadata as IncidentMetadata;

  switch (incident.type) {
    case "CREATED":
      return metadata.title ?? "New incident created";

    case "UPDATED":
      return metadata.fields?.length
        ? `Updated: ${metadata.fields.join(", ")}`
        : "Incident details updated";

    case "ASSIGNED":
      return metadata.to
        ? "Incident assigned to a user"
        : "Incident assignment updated";

    case "SEVERITY_CHANGED":
      return metadata.from && metadata.to
        ? `${metadata.from} → ${metadata.to}`
        : "Incident severity updated";

    default:
      return "Incident event";
  }
};

export const RecentIncidents: React.FC = () => {
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        setLoading(true);

        const response = await getIncidentEventOrgs(1, 10);
        console.log(response)

        setIncidents(response.events);
        setTotal(response.pagination.total);
      } catch (error) {
        console.error("Failed to load incidents", error);
      } finally {
        setLoading(false);
      }
    };

    loadIncidents();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Recent incidents
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            Latest incident events
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Search className="h-3.5 w-3.5" />
          {total} shown
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-400">
            Loading incidents...
          </div>
        ) : (
          incidents.map((incident) => {
            const metadata = incident.metadata as IncidentMetadata;

            return (
              <div
                key={incident.id}
                onClick={() => navigate(`/incidents/${incident.incidentId}`)}
                className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition hover:bg-zinc-50/70 sm:flex-row sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <ShieldAlert className="h-4 w-4 text-zinc-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-800 underline">
                      {getEventTitle(incident)}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span>{getEventDescription(incident)}</span>

                      <span>·</span>

                      <span>
                        {new Date(incident.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                    {incident.type.replace(/_/g, " ")}
                  </span>

                  {metadata.severity && (
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                        severityStyles[metadata.severity] ??
                        "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {metadata.severity}
                    </span>
                  )}

                  {metadata.status && (
                    <span
                      className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                        statusStyles[metadata.status] ??
                        "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {metadata.status}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    {incident.user.name}
                  </span>

                  <ChevronRight className="ml-1 h-4 w-4 text-zinc-400" />
                </div>
              </div>
            );
          })
        )}

        {!loading && incidents.length === 0 && (
          <div className="px-6 py-12 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-zinc-300" />

            <p className="mt-3 text-sm font-medium text-zinc-700">
              No incidents found
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Try changing or clearing your filters.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 sm:px-6">
        <p className="text-xs text-zinc-400">
          Showing {incidents.length} of {total} incidents
        </p>
      </div>
    </div>
  );
};
