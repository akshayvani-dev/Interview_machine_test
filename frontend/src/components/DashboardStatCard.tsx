import React from "react";

interface DashboardStatCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
}

export const DashboardStatCard: React.FC<
  DashboardStatCardProps
> = ({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
}) => {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};