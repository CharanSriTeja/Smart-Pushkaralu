import React, { useState, useEffect } from 'react';
import { GhatsListPage } from './pages/GhatsListPage';
import { GhatFormPage } from './pages/GhatFormPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ConditionDisclaimer } from './components/ConditionDisclaimer';
import { Ghat } from './types';
import { io } from 'socket.io-client';

type ActiveView = 'ghats' | 'create_ghat' | 'edit_ghat' | 'audit_logs';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ActiveView>('ghats');
  const [editingGhat, setEditingGhat] = useState<Ghat | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Connect to Socket.io for live control room updates
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
    });

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleEditGhat = (ghat: Ghat) => {
    setEditingGhat(ghat);
    setCurrentView('edit_ghat');
  };

  const handleCreateGhat = () => {
    setEditingGhat(null);
    setCurrentView('create_ghat');
  };

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
            <h1 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>
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

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px' }}>
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

