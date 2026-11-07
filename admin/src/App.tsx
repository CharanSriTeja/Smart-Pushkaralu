import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { SOSDashboardPage } from './pages/SOSDashboardPage';
import { GhatsPage } from './pages/GhatsPage';
import { NewsPage } from './pages/NewsPage';
import { SevaPage } from './pages/SevaPage';
import { IssuesPage } from './pages/IssuesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsagePage } from './pages/UsagePage';
import { NearbyPlacesAdminPage } from './pages/NearbyPlacesAdminPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="sos" element={<SOSDashboardPage />} />
            <Route path="ghats" element={<GhatsPage />} />
            <Route path="places" element={<NearbyPlacesAdminPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="seva" element={<SevaPage />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="usage" element={<UsagePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
