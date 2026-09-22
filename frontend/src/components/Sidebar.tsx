import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  LogOut,
  X,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { clearAuthToken } from '../api/fetchClient.ts';
import type { CurrentProfile } from '../api/authApis.ts';

interface SidebarProps {
  isOpen: boolean;
  profile?: CurrentProfile;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  profile,
  isCollapsed,
  onToggleCollapse,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = React.useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      id: 'nav-dashboard',
    },
    {
      label: 'Users',
      path: '/users',
      icon: Users,
      id: 'nav-users',
    },
    {
      label: 'Incidents',
      path: '/incidents',
      icon: AlertCircle,
      id: 'nav-incidents',
    },
  ];

  const handleSignOut = () => {
    clearAuthToken();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-zinc-900/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col ${isCollapsed ? 'md:w-20' : 'md:w-56'} w-56 bg-white border-r border-zinc-200 transition-[width,transform] duration-200 ease-in-out md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand / Header */}
        <div className={`flex items-center h-16 border-b border-zinc-100 ${isCollapsed ? 'md:justify-center md:px-3' : 'justify-between px-6'}`}>
          <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-2.5'}`}>
            <div className="w-8 h-8 rounded-md bg-zinc-900 text-white flex items-center justify-center font-semibold text-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div className={isCollapsed ? 'md:hidden' : ''}>
              <span className="font-semibold text-sm text-zinc-900 tracking-tight block">
                {profile?.type === 'org'
                  ? profile.name
                  : typeof profile?.orgId === 'object'
                    ? profile.orgId.name
                    : 'Workspace'}
              </span>
              <span className="text-[11px] text-zinc-400 block font-normal leading-none truncate max-w-[150px]">
                {profile?.type === 'org'
                  ? profile.email
                  : typeof profile?.orgId === 'object'
                    ? profile.orgId.email
                    : 'Internal Operations'}
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            id="sidebar-close-btn"
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 px-3 py-6 space-y-1">
          <div className={`px-3 pb-2 text-[11px] font-medium text-zinc-400 uppercase tracking-wider ${isCollapsed ? 'md:hidden' : ''}`}>
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                id={item.id}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3'} px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={isCollapsed ? 'md:hidden' : ''}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User / Sign Out Footer */}
        <div className="p-3 border-t border-zinc-100">
          <button
            id="sidebar-collapse-toggle"
            type="button"
            onClick={onToggleCollapse}
            className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3'} px-3 py-2 mb-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            <span className={isCollapsed ? 'md:hidden' : ''}>
              {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </button>

          <AlertDialog.Root open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <AlertDialog.Trigger asChild>
              <button
                id="sidebar-signout-btn"
                type="button"
                className={`w-full flex items-center ${isCollapsed ? 'md:justify-center' : 'space-x-3'} px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer`}
                title={isCollapsed ? 'Sign out' : undefined}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className={isCollapsed ? 'md:hidden' : ''}>Sign out</span>
              </button>
            </AlertDialog.Trigger>

            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-zinc-950/35 backdrop-blur-[2px]" />
              <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl focus:outline-none">
                <AlertDialog.Title className="text-base font-semibold text-zinc-900">
                  Sign out?
                </AlertDialog.Title>
                <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Are you sure you want to sign out?
                </AlertDialog.Description>
                <div className="mt-6 flex justify-end gap-2">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    >
                      Sign out
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </aside>
    </>
  );
};
