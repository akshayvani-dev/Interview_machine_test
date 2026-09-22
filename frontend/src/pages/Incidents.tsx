import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Incidents: React.FC = () => {
  return (
    <div id="page-incidents" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Incidents</h2>
        <p className="text-xs text-zinc-500 mt-1">Track active operational events and system escalations</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 text-zinc-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">No active incidents</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
          All systems and services are operating normally. Real-time incident alerts will populate here when triggered.
        </p>
      </div>
    </div>
  );
};
