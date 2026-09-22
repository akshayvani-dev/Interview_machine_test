import type { BreakdownItem } from "../types/dashboardTypes.ts";

export const severityData: BreakdownItem[] = [
  {
    label: "Critical",
    value: 12,
  },
  {
    label: "High",
    value: 27,
  },
  {
    label: "Medium",
    value: 31,
  },
  {
    label: "Low",
    value: 10,
  },
];

export const statusData: BreakdownItem[] = [
  {
    label: "Open",
    value: 28,
  },
  {
    label: "Investigating",
    value: 19,
  },
  {
    label: "Mitigated",
    value: 15,
  },
  {
    label: "Resolved",
    value: 18,
  },
];

export const assignees = [
  "ALL",
  "Akshay Vani",
  "Rahul Sharma",
  "Jane Smith",
] as const;
