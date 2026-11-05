import React, { useEffect, useState } from 'react';
import { fetchUsageStats } from '../services/api';
import { UsageStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const UsagePage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats(token).then((res) => {
      setStats(res);
      setLoading(false);
    });
  }, [token]);

  if (!hasPermission('settings.write') && !hasPermission('*')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Only administrators with system management permissions can inspect API usage quotas.</p>
      </div>
    );
  }

  if (loading || !stats) {
    return <div style={{ color: '#64748B' }}>Loading API usage telemetry...</div>;
  }

  const quotaPercent = Math.min(100, stats.quotaPercentUsed);
  const isNearLimit = quotaPercent > 80;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          API Quota & Cost Tracking
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Monthly tracking of third-party API providers (Firebase Auth, FCM Notifications, SMS Gateways).
        </p>
      </div>

      {/* Quota Progress Bar Card */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Current Month Free Quota</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>
              {stats.currentMonthUsage.toLocaleString()} / {stats.monthlyQuota.toLocaleString()} calls
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: isNearLimit ? '#DC2626' : '#16A34A',
                background: isNearLimit ? '#FEE2E2' : '#DCFCE7',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              {quotaPercent}% Used
            </span>
          </div>
        </div>

        {/* Progress track */}
        <div style={{ height: '12px', background: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${quotaPercent}%`,
              backgroundColor: isNearLimit ? '#DC2626' : '#0F52BA',
              borderRadius: '6px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
          <span>Remaining before threshold: {stats.quotaRemaining.toLocaleString()} calls</span>
          <span>Estimated Provider Bill: ₹{(stats.currentMonthCost * 83).toFixed(2)} ($0.00 in free tier)</span>
        </div>
      </div>

      {/* Provider Breakdown Cards */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.75rem' }}>
        Usage by Provider
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.providers.map((p) => (
          <div key={p.provider} style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{p.provider}</span>
              <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                Provider
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F52BA', margin: '8px 0 4px 0' }}>
              {p.totalCalls.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total calls logged</div>
          </div>
        ))}
      </div>

      {/* Daily Usage History */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.75rem' }}>
        Daily Breakdown (Last 30 Days)
      </h2>
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>Date</th>
              <th style={{ padding: '10px 14px' }}>Service Provider</th>
              <th style={{ padding: '10px 14px' }}>Total Calls</th>
            </tr>
          </thead>
          <tbody>
            {stats.dailyUsage.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 14px', color: '#64748B' }}>{d.date}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>{d.provider}</td>
                <td style={{ padding: '10px 14px', color: '#0F52BA', fontWeight: 700 }}>{d.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

