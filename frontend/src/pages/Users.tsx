import React from 'react';
import { Users as UsersIcon } from 'lucide-react';

export const Users: React.FC = () => {
  return (
    <div id="page-users" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Users</h2>
        <p className="text-xs text-zinc-500 mt-1">Manage team members, roles, and organization permissions</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 text-zinc-600 mb-4">
          <UsersIcon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-900">No users found</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
          Invite members to your organization workspace to assign responsibilities and manage incident routing.
        </p>
      </div>
    </div>
  );
};
