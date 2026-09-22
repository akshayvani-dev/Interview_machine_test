import type { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import type {
  IncidentSeverity,
  IncidentStatus,
} from "../constants/incident.js";

interface GetDashboardParams {
  orgId: string;
  time: "today" | "7d" | "30d" | "90d";
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  assignedTo?: string;
}

const getStartDate = (time: GetDashboardParams["time"]): Date => {
  const now = new Date();

  switch (time) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
};

export const getDashboard = async ({
  orgId,
  time,
  severity,
  status,
  assignedTo,
}: GetDashboardParams) => {
  const startDate = getStartDate(time);

  const where: Prisma.IncidentWhereInput = {
    orgId,
    createdAt: {
      gte: startDate,
    },
    ...(severity ? { severity } : {}),
    ...(status ? { status } : {}),
    ...(assignedTo ? { assignedTo } : {}),
  };

  const [
    totalIncidents,
    openIncidents,
    criticalIncidents,
    resolvedIncidents,
    severityBreakdown,
    statusBreakdown,
  ] = await Promise.all([
    prisma.incident.count({
      where,
    }),

    prisma.incident.count({
      where: {
        ...where,
        status: "OPEN",
      },
    }),

    prisma.incident.count({
      where: {
        ...where,
        severity: "CRITICAL",
      },
    }),

    prisma.incident.count({
      where: {
        ...where,
        status: "RESOLVED",
      },
    }),

    prisma.incident.groupBy({
      by: ["severity"],
      where,
      _count: {
        _all: true,
      },
    }),

    prisma.incident.groupBy({
      by: ["status"],
      where,
      _count: {
        _all: true,
      },
    }),
  ]);

  const severityData = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((value) => ({
    label: value.charAt(0) + value.slice(1).toLowerCase(),
    value:
      severityBreakdown.find((item) => item.severity === value)?._count._all ??
      0,
  }));

  const statusData = ["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"].map(
    (value) => ({
      label: value.charAt(0) + value.slice(1).toLowerCase(),
      value:
        statusBreakdown.find((item) => item.status === value)?._count._all ?? 0,
    }),
  );

  return {
    counts: {
      totalIncidents,
      openIncidents,
      criticalIncidents,
      resolvedIncidents,
    },
    severityData,
    statusData,
    time,
  };
};
