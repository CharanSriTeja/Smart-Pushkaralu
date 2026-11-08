import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminApi } from '../services/adminApi';

interface DashboardStats {
  ghats: { total: number; normal: number; busy: number; surge: number };
  sos: { active: number; critical: number; highPriority: number };
  devices: { total: number; te: number; en: number; hi: number };
  quota: { used: number; total: number; percent: number };
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AdminApi.getDashboardStats()
      .then((data) => {
        if (mounted) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('Failed to load dashboard stats:', err);
          setError(err.message || 'Failed to load live statistics');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    {
      title: 'Monitored Ghats',
      count: loading ? '...' : (stats?.ghats.total ?? 0).toString(),
      icon: '🌊',
      color: '#0284C7',
      desc: loading
        ? 'Loading ghat statuses...'
        : `${stats?.ghats.normal ?? 0} Normal • ${stats?.ghats.busy ?? 0} Busy • ${stats?.ghats.surge ?? 0} High Surge`,
    },
    {
      title: 'Live Emergency Alerts',
      count: loading ? '...' : (stats?.sos.active ?? 0).toString(),
      icon: '🚨',
      color: '#DC2626',
      desc: loading
        ? 'Querying active alerts...'
        : `${stats?.sos.critical ?? 0} Critical • ${stats?.sos.highPriority ?? 0} High priority`,
    },
    {
      title: 'Registered Pilgrim Devices',
      count: loading ? '...' : (stats?.devices.total ?? 0).toLocaleString(),
      icon: '📱',
      color: '#16A34A',
      desc: loading
        ? 'Syncing device counts...'
        : `${stats?.devices.te ?? 0} Telugu • ${stats?.devices.en ?? 0} English • ${stats?.devices.hi ?? 0} Hindi`,
    },
    {
      title: 'API Quota Used',
      count: loading ? '...' : `${stats?.quota.percent ?? 0}%`,
      icon: '📈',
      color: '#D97706',
      desc: loading
        ? 'Calculating usage...'
        : `${(stats?.quota.used ?? 0).toLocaleString()} of ${(stats?.quota.total ?? 10000).toLocaleString()} monthly quota`,
    },
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

