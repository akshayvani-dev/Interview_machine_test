import React from "react";

import { useAuth } from "../auth/AuthContext.tsx";

const ProfilePage: React.FC = () => {
  const { profile, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Not authenticated
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Please log in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  const organization =
    typeof profile.orgId === "object" ? profile.orgId : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
              {profile.name?.charAt(0).toUpperCase() || "?"}
            </div>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {profile.name}
              </h1>

              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="px-6 py-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Profile Information
          </h2>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            <ProfileRow label="Name" value={profile.name} />
            <ProfileRow label="Email" value={profile.email} />

            <ProfileRow
              label="Account Type"
              value={profile.type === "org" ? "Organization" : "User"}
            />

            {profile.role && (
              <ProfileRow label="Role" value={profile.role} />
            )}
          </div>
        </div>

        {/* Organization */}
        {organization && (
          <div className="border-t border-gray-200 px-6 py-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Organization
            </h2>

            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              <ProfileRow label="Name" value={organization.name} />
              <ProfileRow label="Email" value={organization.email} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProfileRowProps {
  label: string;
  value: string;
}

const ProfileRow: React.FC<ProfileRowProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-gray-500">{label}</span>

      <span className="break-all text-sm text-gray-900 sm:text-right">
        {value}
      </span>
    </div>
  );
};

export default ProfilePage;
