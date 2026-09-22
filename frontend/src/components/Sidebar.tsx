import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, AlertCircle, LogOut, X, Building2 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

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
    navigate('/login');
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
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-zinc-200 transition-transform duration-200 ease-in-out md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand / Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 text-white flex items-center justify-center font-semibold text-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm text-zinc-900 tracking-tight block">Acme Corp</span>
              <span className="text-[11px] text-zinc-400 block font-normal leading-none">Internal Operations</span>
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
          <div className="px-3 pb-2 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
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
                  `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User / Sign Out Footer */}
        <div className="p-3 border-t border-zinc-100">
          <div className="flex items-center justify-between p-2 rounded-md bg-zinc-50 border border-zinc-100 mb-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-medium shrink-0">
                JD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-800 truncate">John Doe</p>
                <p className="text-[11px] text-zinc-400 truncate">admin@acme.com</p>
              </div>
            </div>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            type="button"
            className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
