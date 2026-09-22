import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login.tsx';
import { Register } from '../pages/Register.tsx';
import { PanelLayout } from '../components/PanelLayout.tsx';
import { PageLoader } from '../components/PageLoader.tsx';
import { RequireAuth } from './RequireAuth.tsx';
import { RequireGuest } from './RequireGuest.tsx';
import { IncidentDetails } from '../components/IncidentDetails.tsx';

const Dashboard = lazy(() => import('../pages/Dashboard.tsx').then((module) => ({ default: module.Dashboard })));
const Users = lazy(() => import('../pages/Users.tsx').then((module) => ({ default: module.Users })));
const Incidents = lazy(() => import('../pages/Incidents.tsx').then((module) => ({ default: module.Incidents })));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader message="Loading workspace" />}>
      <Routes>
      {/* Public Authentication Routes */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Internal Protected Panel Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<PanelLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/:id" element={<IncidentDetails />} />
        </Route>
      </Route>

      {/* Default Fallback / Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};
