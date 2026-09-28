import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Sidebar } from "./Sidebar.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import { clearAuthToken } from "../api/fetchClient.ts";
import { getUnreadNotificationCount } from "../api/notificationApis.ts";

export const PanelLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { profile, isAuthenticated } = useAuth();

  const unreadNotificationsQuery = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const unreadCount = unreadNotificationsQuery.data ?? 0;
  const hasUnreadNotifications = unreadCount > 0;

  const getPageTitle = (pathname: string) => {
    if (pathname.includes("/users")) return "Users";
    if (pathname.includes("/incidents")) return "Incidents";
    if (pathname === "/me") return "My Profile";
    return "Dashboard";
  };


  return (
    <div
      id="panel-layout"
      className="flex h-screen overflow-hidden bg-zinc-50 font-sans"
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        profile={profile}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header
          id="panel-top-nav"
          className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-8"
        >
          <div className="flex items-center space-x-3">
            {/* Mobile menu toggle */}
            <button
              id="mobile-sidebar-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Current route title breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="hidden text-zinc-400 sm:inline">
                Internal
              </span>

              <span className="hidden text-zinc-300 sm:inline">/</span>

              <h1 className="text-sm font-semibold text-zinc-900 sm:text-base">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button
              onClick={() => navigate("/notifications")}
              id="top-notifications-btn"
              type="button"
              className="relative rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label={
                hasUnreadNotifications
                  ? `${unreadCount} unread notifications`
                  : "Notifications"
              }
            >
              <Bell className="h-4 w-4" />

              {hasUnreadNotifications && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                />
              )}
            </button>

            {/* User menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  id="user-menu-trigger"
                  type="button"
                  className="flex items-center space-x-2 rounded-md p-1.5 outline-none transition-colors hover:bg-zinc-100 focus:ring-2 focus:ring-zinc-900"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                    {profile?.name.slice(0, 1).toUpperCase() ?? "?"}
                  </div>

                  <span className="hidden text-xs font-medium text-zinc-700 sm:inline">
                    {profile?.name}
                  </span>

                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  id="user-dropdown-content"
                  className="z-50 min-w-[180px] rounded-md border border-zinc-200 bg-white p-1 shadow-xs animate-in fade-in-80"
                  sideOffset={6}
                  align="end"
                >
                  <div className="mb-1 border-b border-zinc-100 px-2 py-1.5 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-900">
                      {profile?.role}
                    </p>

                    <p className="truncate text-[11px]">
                      {profile?.email}
                    </p>
                  </div>

                  <DropdownMenu.Item
                    id="dropdown-profile-item"
                    onClick={() => navigate("/me")}
                    className="flex cursor-pointer items-center space-x-2 rounded px-2 py-1.5 text-xs text-zinc-700 outline-none hover:bg-zinc-100"
                  >
                    <User className="h-3.5 w-3.5 text-zinc-500" />
                    <span>My Profile</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-1 h-px bg-zinc-100" />

                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Content body */}
        <main
          id="panel-main-content"
          className="flex-1 overflow-y-auto p-2 sm:p-6"
        >
          <div className="mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

