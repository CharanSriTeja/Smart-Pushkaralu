import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './AppShell';
import { useAuth } from '../context/AuthContext';

export { NAV_ITEMS } from './Sidebar';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user.role === 'guest') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <AppShell />;
};

export default Layout;
