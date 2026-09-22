export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Status = "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";

export type DashboardDateRange =
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS";

export interface DashboardFilterState {
  severity: Severity | "ALL";
  status: Status | "ALL";
  assignee: string;
  dateRange: DashboardDateRange;
}

export interface DashboardIncident {
  id: string;
  title: string;
  severity: Severity;
  status: Status;
  assignee: string;
  createdAt: string;
}

export interface BreakdownItem {
  label: string;
  value: number;
}
