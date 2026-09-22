import React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Flame,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import { DashboardFilters } from "../components/DashboardFilters.tsx";
import { DashboardStatCard } from "../components/DashboardStatCard.tsx";
import { IncidentBreakdown } from "../components/IncidentBreakdown.tsx";
import { RecentIncidents } from "../components/RecentIncidents.tsx";
import { severityData, statusData } from "../data/dashboardDummyData.ts";
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

        <DashboardStats />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <IncidentBreakdown
            title="Incidents by severity"
            description="Distribution across severity levels"
            icon={AlertTriangle}
            items={severityData}
            type="severity"
          />

          <IncidentBreakdown
            title="Incidents by status"
            description="Current incident lifecycle distribution"
            icon={BarChart3}
            items={statusData}
            type="status"
          />
        </div>

        <RecentIncidents />
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

const DashboardStats: React.FC = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <DashboardStatCard
      label="Total incidents"
      value="80"
      description="Across selected period"
      icon={ShieldAlert}
      iconClassName="bg-zinc-100 text-zinc-600"
    />

    <DashboardStatCard
      label="Open incidents"
      value="28"
      description="35% of total incidents"
      icon={AlertCircle}
      iconClassName="bg-blue-50 text-blue-600"
    />

    <DashboardStatCard
      label="Critical incidents"
      value="12"
      description="15% of total incidents"
      icon={Flame}
      iconClassName="bg-rose-50 text-rose-600"
    />

    <DashboardStatCard
      label="Resolved incidents"
      value="18"
      description="22% of total incidents"
      icon={CheckCircle2}
      iconClassName="bg-emerald-50 text-emerald-600"
    />
  </div>
);
