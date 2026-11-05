import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const cards = [
    { title: 'Monitored Ghats', count: '18', icon: '🌊', color: '#0284C7', desc: '12 Normal • 4 Busy • 2 High Surge' },
    { title: 'Live Emergency Alerts', count: '3', icon: '🚨', color: '#DC2626', desc: '1 Critical • 2 High priority' },
    { title: 'Registered Pilgrim Devices', count: '48,230', icon: '📱', color: '#16A34A', desc: '72% Telugu • 20% English • 8% Hindi' },
    { title: 'API Quota Used', count: '14.2%', icon: '📈', color: '#D97706', desc: '1,420 of 10,000 monthly free tier' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
          Godavari Pushkaralu Command Center
        </h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '0.875rem' }}>
          Welcome back, {user.name}. Overview of ghat operations, pilgrim safety, and platform health.
        </p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {cards.map((c) => (
          <div
            key={c.title}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              padding: '1.25rem',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>{c.title}</span>
              <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.color, marginBottom: '4px' }}>
              {c.count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E293B', marginBottom: '1rem' }}>
        Quick Management Shortcuts
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <Link
          to="/sos"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: '8px',
            padding: '1rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.95rem' }}>
              Real-time SOS Dashboard
            </div>
            <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>
              Live emergency telemetry, boat patrol alerts, and river incident dispatch.
            </div>
          </div>
        </Link>

        <Link
          to="/audit-logs"
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '2rem' }}>🔍</span>
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
              Inspect Audit Trail
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Review immutable records of admin actions, settings changes, and diffs.
            </div>
          </div>
        </Link>

        <Link
          to="/settings"
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '1rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '2rem' }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
              System Configuration
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Adjust offline cache days, crowd corridor perimeters, and rate limits.
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

