import React from 'react';
import { useAuth } from '../context/AuthContext';

export const IssuesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  if (!hasPermission('issues.update')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>issues.update</code> permission.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
        Pilgrim Grievances & Issues (Module 7)
      </h1>
      <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Review reported sanitation issues, lost items, and infrastructure repairs submitted by pilgrims.
      </p>

      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>📋</span>
        <h3 style={{ margin: '0 0 8px 0', color: '#0F172A' }}>Module 7 Grievance Portal Foundation Ready</h3>
        <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto', fontSize: '0.875rem' }}>
          This administrative view is gated by RBAC permission <code>issues.update</code>. Grievance tickets synced with the ICCC webhook schema will be triaged here.
        </p>
      </div>
    </div>
  );
};

