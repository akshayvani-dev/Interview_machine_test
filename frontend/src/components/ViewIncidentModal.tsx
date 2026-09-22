import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  CalendarDays,
  Clock,
  UserRound,
  ShieldAlert,
  CircleDot,
  GitCommitHorizontal,
} from "lucide-react";
import type { Incident } from "../api/incidentApis.ts";
import { Badge } from "./Badge.tsx";
import {
  getIncidentSeverityTone,
  getIncidentStatusTone,
} from "../utils/incident.ts";

interface ViewIncidentModalProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewIncidentModal: React.FC<ViewIncidentModalProps> = ({
  incident,
  open,
  onOpenChange,
}) => {
  if (!incident) return null;

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const createdDate = dateFormatter.format(new Date(incident.createdAt));
  const updatedDate = incident.updatedAt
    ? dateFormatter.format(new Date(incident.updatedAt))
    : null;
  const version = incident.version ?? null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px]" />

        {/* Modal */}
        <Dialog.Content
          className="
            fixed left-1/2 top-1/2 z-50
            flex w-[calc(100%-2rem)] max-w-4xl
            -translate-x-1/2 -translate-y-1/2
            flex-col overflow-hidden
            rounded-2xl border border-zinc-200
            bg-white shadow-2xl
            focus:outline-none

            max-h-[calc(100vh-2rem)]
            sm:max-h-[85vh]
            lg:max-w-5xl
          "
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-zinc-950 sm:text-lg">
                Incident details
              </Dialog.Title>

              <Dialog.Description className="mt-1 text-sm text-zinc-500">
                Full description and current status
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close incident details"
                className="
                  shrink-0 rounded-lg p-2
                  text-zinc-400
                  transition-colors
                  hover:bg-zinc-100 hover:text-zinc-700
                  focus:outline-none focus:ring-2 focus:ring-zinc-900/20
                "
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable content — split layout */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: title + description */}
              <section className="border-zinc-100 p-5 sm:p-6 lg:border-r">
                <h2 className="mb-3 break-words font-semibold leading-snug text-zinc-950 sm:text-sm">
                  {incident.title}
                </h2>

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
                      <p className="text-xs font-medium text-zinc-400">
                        Severity
                      </p>

                      <div className="mt-1">
                        <Badge
                          tone={getIncidentSeverityTone(incident.severity)}
                        >
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
                      <p className="text-xs font-medium text-zinc-400">
                        Status
                      </p>

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
                      <p className="text-xs font-medium text-zinc-400">
                        Created
                      </p>

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
                      <p className="text-xs font-medium text-zinc-400">
                        Version
                      </p>

                      <p className="mt-1 text-sm font-medium text-zinc-800">
                        {version !== null ? `v${version}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 sm:px-6">
            <Dialog.Close asChild>
              <button
                type="button"
                className="
                  rounded-lg border border-zinc-200
                  bg-white px-4 py-2
                  text-sm font-medium text-zinc-700
                  shadow-sm
                  transition-colors
                  hover:bg-zinc-50 hover:text-zinc-900
                  focus:outline-none focus:ring-2 focus:ring-zinc-900/20
                "
              >
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};