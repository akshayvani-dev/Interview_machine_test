import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div id="page-dashboard" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Dashboard</h2>
        <p className="text-xs text-zinc-500 mt-1">Overview of organization metrics and operational performance</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 text-zinc-600 mb-4">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">No dashboard widgets configured</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Operational statistics and live system telemetry will appear here once connected to your services.
        </p>
      </div>
    </div>
  );
};
