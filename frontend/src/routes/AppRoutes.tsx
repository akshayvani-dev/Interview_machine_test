import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login.tsx';
import { Register } from '../pages/Register.tsx';
import { PanelLayout } from '../components/PanelLayout.tsx';
import { Dashboard } from '../pages/Dashboard.tsx';
import { Users } from '../pages/Users.tsx';
import { Incidents } from '../pages/Incidents.tsx';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Internal Protected Panel Routes */}
      <Route element={<PanelLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/incidents" element={<Incidents />} />
      </Route>

      {/* Default Fallback / Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
