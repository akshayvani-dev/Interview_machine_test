import React from "react";
import {
  CalendarDays,
  Filter,
  X,
} from "lucide-react";

import type {
  DashboardDateRange,
  DashboardFilterState,
  Severity,
  Status,
} from "../types/dashboardTypes.ts";

interface DashboardFiltersProps {
  filters: DashboardFilterState;
  onChange: React.Dispatch<
    React.SetStateAction<DashboardFilterState>
  >;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const selectClassName =
  "h-9 min-w-[145px] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition hover:bg-zinc-50 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200";

export const DashboardFilters: React.FC<
  DashboardFiltersProps
> = ({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}) => {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <Filter className="h-4 w-4 text-zinc-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Filters
            </p>

            <p className="text-xs text-zinc-400">
              Refine dashboard metrics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.severity}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                severity: event.target.value as
                  | Severity
                  | "ALL",
              }))
            }
            className={selectClassName}
            aria-label="Filter by severity"
          >
            <option value="ALL">All severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                status: event.target.value as
                  | Status
                  | "ALL",
              }))
            }
            className={selectClassName}
            aria-label="Filter by status"
          >
            <option value="ALL">All status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">
              Investigating
            </option>
            <option value="MITIGATED">Mitigated</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={filters.assignee}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                assignee: event.target.value,
              }))
            }
            className={selectClassName}
            aria-label="Filter by assignee"
          >
            <option value="ALL">All assignees</option>
            <option value="Akshay Vani">Akshay Vani</option>
            <option value="Rahul Sharma">Rahul Sharma</option>
            <option value="Jane Smith">Jane Smith</option>
          </select>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

            <select
              value={filters.dateRange}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  dateRange: event.target.value as DashboardDateRange,
                }))
              }
              className={`${selectClassName} pl-9`}
              aria-label="Filter by date range"
            >
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">
                Last 7 days
              </option>
              <option value="LAST_30_DAYS">
                Last 30 days
              </option>
              <option value="LAST_90_DAYS">
                Last 90 days
              </option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};