import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DashboardFilters } from "../components/DashboardFilters.tsx";
import { DashboardStatCard } from "../components/DashboardStatCard.tsx";
import { IncidentBreakdown } from "../components/IncidentBreakdown.tsx";
import { RecentIncidents } from "../components/RecentIncidents.tsx";
import { getDashboard, type DashboardResponse } from "../api/dashboardApis.ts";
import type {
  DashboardFilterState,
  Severity,
  Status,
} from "../types/dashboardTypes.ts";

export const Dashboard: React.FC = () => {
  const [filters, setFilters] = React.useState<DashboardFilterState>({
    severity: "ALL",
    status: "ALL",
    assignee: "ALL",
    dateRange: "LAST_30_DAYS",
  });

  const timeMap = {
    TODAY: "today",
    LAST_7_DAYS: "7d",
    LAST_30_DAYS: "30d",
    LAST_90_DAYS: "90d",
  } as const;

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: [
      "dashboard",
      filters.severity,
      filters.status,
      filters.assignee,
      filters.dateRange,
    ],
    queryFn: () =>
      getDashboard({
        time: timeMap[filters.dateRange],
        ...(filters.severity !== "ALL"
          ? { severity: filters.severity as Severity }
          : {}),
        ...(filters.status !== "ALL"
          ? { status: filters.status as Status }
          : {}),
        ...(filters.assignee !== "ALL" ? { assignedTo: filters.assignee } : {}),
      }),
  });

  const hasActiveFilters =
    filters.severity !== "ALL" ||
    filters.status !== "ALL" ||
    filters.assignee !== "ALL" ||
    filters.dateRange !== "LAST_30_DAYS";

  const clearFilters = () => {
    setFilters({
      severity: "ALL",
      status: "ALL",
      assignee: "ALL",
      dateRange: "LAST_30_DAYS",
    });
  };

  const dashboard = dashboardQuery.data;

  return (
    <div className="min-h-full bg-zinc-50/60 p-4 sm:p-6">
      <div className="mx-auto space-y-6">
        <DashboardHeader />

        <DashboardFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {dashboardQuery.isLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
            Loading dashboard...
          </div>
        ) : dashboardQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-rose-600">
              Unable to load dashboard
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : "Something went wrong while loading dashboard data."}
            </p>

            <button
              type="button"
              onClick={() => void dashboardQuery.refetch()}
              className="mt-3 text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950"
            >
              Try again
            </button>
          </div>
        ) : dashboard ? (
          <>
            <DashboardStats counts={dashboard.counts} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <IncidentBreakdown
                title="Incidents by severity"
                description="Distribution across severity levels"
                icon={AlertTriangle}
                items={dashboard.severityData}
                type="severity"
                totalIncidents={dashboard.counts.totalIncidents}
              />

              <IncidentBreakdown
                title="Incidents by status"
                description="Current incident lifecycle distribution"
                icon={BarChart3}
                items={dashboard.statusData}
                type="status"
                totalIncidents={dashboard.counts.totalIncidents}
              />
            </div>

            <RecentIncidents />
          </>
        ) : null}
      </div>
    </div>
  );
};

const DashboardHeader: React.FC = () => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
        <BarChart3 className="h-4 w-4" />
        Overview
      </div>

      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
        Dashboard
      </h1>

      <p className="mt-1 text-sm text-zinc-500">
        Monitor incident activity and operational health.
      </p>
    </div>
  </div>
);

interface DashboardStatsProps {
  counts: DashboardResponse["counts"];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ counts }) => {
  const getPercentage = (value: number) => {
    if (counts.totalIncidents === 0) {
      return 0;
    }

    return Math.round((value / counts.totalIncidents) * 100);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardStatCard
        label="Total incidents"
        value={String(counts.totalIncidents)}
        description="Across selected period"
        icon={ShieldAlert}
        iconClassName="bg-zinc-100 text-zinc-600"
      />

      <DashboardStatCard
        label="Open incidents"
        value={String(counts.openIncidents)}
        description={`${getPercentage(counts.openIncidents)}% of total incidents`}
        icon={AlertCircle}
        iconClassName="bg-blue-50 text-blue-600"
      />

      <DashboardStatCard
        label="Critical incidents"
        value={String(counts.criticalIncidents)}
        description={`${getPercentage(counts.criticalIncidents)}% of total incidents`}
        icon={Flame}
        iconClassName="bg-rose-50 text-rose-600"
      />

      <DashboardStatCard
        label="Resolved incidents"
        value={String(counts.resolvedIncidents)}
        description={`${getPercentage(counts.resolvedIncidents)}% of total incidents`}
        icon={CheckCircle2}
        iconClassName="bg-emerald-50 text-emerald-600"
      />
    </div>
  );
};
