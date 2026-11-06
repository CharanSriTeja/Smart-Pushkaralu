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
import { NewsListPage } from './pages/NewsListPage';
import { NewsEditorPage } from './pages/NewsEditorPage';
import { FacilitiesEditorPage } from './pages/FacilitiesEditorPage';
import { IssuesListPage } from './pages/IssuesListPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { NearbyPlacesAdminPage } from './pages/NearbyPlacesAdminPage';
import { ConditionDisclaimer } from './components/ConditionDisclaimer';
import { Ghat, NewsPost } from './types';
import { io } from 'socket.io-client';

type ActiveView =
  | 'ghats'
  | 'create_ghat'
  | 'edit_ghat'
  | 'news'
  | 'create_news'
  | 'edit_news'
  | 'facilities'
  | 'issues'
  | 'issue_detail'
  | 'places'
  | 'audit_logs';

export const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{
        backgroundColor: '#0C2340',
        color: '#FFFFFF',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #0F52BA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '24px' }}>🌊</span>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px', margin: 0 }}>
              SMART PUSHKARALU 2027
            </h1>
            <span style={{ fontSize: '11px', color: '#93C5FD', letterSpacing: '0.3px' }}>
              OFFICIAL CONTROL ROOM &amp; GHAT ADMINISTRATION
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Live Socket Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: socketConnected ? '#064E3B' : '#7F1D1D',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: socketConnected ? '#34D399' : '#F87171',
            }} />
            {socketConnected ? 'LIVE FEED ACTIVE' : 'LOCAL DEV MODE'}
          </div>

          <div style={{ fontSize: '12px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤 Super Admin</span>
            <span style={{
              backgroundColor: '#DC2626',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '800',
            }}>
              SUPER_ADMIN
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <nav style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px',
        display: 'flex',
        gap: '4px',
      }}>
        {[
          { key: 'ghats', label: '🌊 Ghats Directory', view: 'ghats' },
          { key: 'places', label: '📍 Nearby Places & Cache (Mod 5)', view: 'places' },
          { key: 'news', label: '📢 Official Bulletins (Mod 9)', view: 'news' },
          { key: 'facilities', label: '🚻 Ghat Facilities (Mod 9)', view: 'facilities' },
          { key: 'issues', label: '🚨 Grievances & Issues (Mod 8)', view: 'issues' },
          { key: 'audit_logs', label: '📋 Audit Trail', view: 'audit_logs' },
        ].map((tab) => {
          const isActive =
            currentView === tab.view ||
            (tab.view === 'ghats' && (currentView === 'create_ghat' || currentView === 'edit_ghat')) ||
            (tab.view === 'news' && (currentView === 'create_news' || currentView === 'edit_news')) ||
            (tab.view === 'issues' && currentView === 'issue_detail');

          return (
            <button
              key={tab.key}
              onClick={() => setCurrentView(tab.view as ActiveView)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #0F52BA' : '3px solid transparent',
                color: isActive ? '#0F52BA' : '#475569',
                padding: '14px 18px',
                fontSize: '13px',
                fontWeight: isActive ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1300px', width: '100%', margin: '0 auto', padding: '24px' }}>
        <ConditionDisclaimer />

        {currentView === 'ghats' && (
          <GhatsListPage
            onEditGhat={handleEditGhat}
            onCreateGhat={handleCreateGhat}
            onViewAuditLogs={() => setCurrentView('audit_logs')}
          />
        )}

        {(currentView === 'create_ghat' || currentView === 'edit_ghat') && (
          <GhatFormPage
            ghat={editingGhat}
            onCancel={() => setCurrentView('ghats')}
            onSaved={() => setCurrentView('ghats')}
          />
        )}

        {currentView === 'news' && (
          <NewsListPage
            onCreateNews={handleCreateNews}
            onEditNews={handleEditNews}
          />
        )}

        {(currentView === 'create_news' || currentView === 'edit_news') && (
          <NewsEditorPage
            news={editingNews}
            onBack={() => setCurrentView('news')}
            onSaved={() => setCurrentView('news')}
          />
        )}

        {currentView === 'facilities' && (
          <FacilitiesEditorPage />
        )}

        {currentView === 'issues' && (
          <IssuesListPage
            onSelectIssue={(id) => {
              setSelectedIssueId(id);
              setCurrentView('issue_detail');
            }}
          />
        )}

        {currentView === 'issue_detail' && selectedIssueId && (
          <IssueDetailPage
            issueId={selectedIssueId}
            onBack={() => setCurrentView('issues')}
          />
        )}

        {currentView === 'places' && (
          <NearbyPlacesAdminPage />
        )}

        {currentView === 'audit_logs' && (
          <AuditLogsPage
            onBack={() => setCurrentView('ghats')}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748B',
      }}>
        Smart Pushkaralu 2027 • Godavari Holy Riverfront Administration • Official State Governments of AP &amp; Telangana
      </footer>
    </div>
  );
};
