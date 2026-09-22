import React from "react";
import type { BreakdownItem } from "../types/dashboardTypes.ts";

interface IncidentBreakdownProps {
  title: string;
  description: string;
  icon: React.ElementType;
  items: BreakdownItem[];
  totalIncidents: number;
  type: "severity" | "status";
}

const severityBarClass: Record<string, string> = {
  Critical: "bg-rose-500",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-zinc-400",
};

export const IncidentBreakdown: React.FC<IncidentBreakdownProps> = ({
  title,
  description,
  icon: Icon,
  items,
  totalIncidents,
  type,
}) => {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            {title}
          </h2>

          <p className="mt-1 text-xs text-zinc-400">
            {description}
          </p>
        </div>

        <Icon className="h-4 w-4 text-zinc-400" />
      </div>

      <div className="mt-6 space-y-5">
        {items.map((item) => {
          const percentage =
            totalIncidents > 0
              ? Math.round((item.value / totalIncidents) * 100)
              : 0;

          const barClass =
            type === "severity"
              ? severityBarClass[item.label] ?? "bg-zinc-500"
              : "bg-zinc-700";

          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">
                  {item.label}
                </span>

                <span className="text-xs text-zinc-400">
                  {item.value} incidents · {percentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-3">
        <p className="text-xs text-zinc-400">
          Total incidents:{" "}
          <span className="font-medium text-zinc-600">
            {totalIncidents}
          </span>
        </p>
      </div>
    </div>
  );
};

