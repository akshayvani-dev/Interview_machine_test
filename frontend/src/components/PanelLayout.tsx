import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut, Shield } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Sidebar } from './Sidebar.tsx';

export const PanelLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/users')) return 'Users';
    if (pathname.includes('/incidents')) return 'Incidents';
    return 'Dashboard';
  };

  const handleSignOut = () => {
    navigate('/login');
  };

  return (
    <div id="panel-layout" className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header
          id="panel-top-nav"
          className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between shrink-0"
        >
          <div className="flex items-center space-x-3">
            {/* Mobile menu toggle */}
            <button
              id="mobile-sidebar-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current route title breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-zinc-400 hidden sm:inline">Internal</span>
              <span className="text-zinc-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-zinc-900 text-sm sm:text-base">
                {getPageTitle(location.pathname)}
              </h1>
            </div>
          </div>

          {/* Right actions with Radix DropdownMenu */}
          <div className="flex items-center space-x-3">
            <button
              id="top-notifications-btn"
              type="button"
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  id="user-menu-trigger"
                  type="button"
                  className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-zinc-100 transition-colors outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">
                    JD
                  </div>
                  <span className="text-xs font-medium text-zinc-700 hidden sm:inline">John Doe</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  id="user-dropdown-content"
                  className="z-50 min-w-[180px] bg-white rounded-md p-1 shadow-xs border border-zinc-200 animate-in fade-in-80"
                  sideOffset={6}
                  align="end"
                >
                  <div className="px-2 py-1.5 text-xs text-zinc-500 border-b border-zinc-100 mb-1">
                    <p className="font-medium text-zinc-900">Signed in as</p>
                    <p className="text-[11px] truncate">admin@acme.com</p>
                  </div>

                  <DropdownMenu.Item
                    id="dropdown-profile-item"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2 px-2 py-1.5 text-xs text-zinc-700 rounded hover:bg-zinc-100 outline-none cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>My Profile</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    id="dropdown-security-item"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2 px-2 py-1.5 text-xs text-zinc-700 rounded hover:bg-zinc-100 outline-none cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Security Settings</span>
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-zinc-100 my-1" />

                  <DropdownMenu.Item
                    id="dropdown-signout-item"
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-2 py-1.5 text-xs text-rose-600 rounded hover:bg-rose-50 outline-none cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign out</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Content body with responsive padding */}
        <main
          id="panel-main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-8"
        >
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
