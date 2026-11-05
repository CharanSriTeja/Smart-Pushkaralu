import React, { useEffect, useState } from 'react';
import { fetchAuditLogs } from '../services/api';
import { AuditLogRecord } from '../types';
import { OldNewDiffViewer } from '../components/OldNewDiffViewer';
import { useAuth } from '../context/AuthContext';

export const AuditLogsPage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs({ page, limit: 15, entity: entityFilter || undefined }, token);
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('audit.read')) {
      loadLogs();
    }
  }, [page, entityFilter, token]);

  if (!hasPermission('audit.read')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your current role lacks the <code>audit.read</code> permission required to view audit logs.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Audit Log Trail
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            Immutable chronological record of administrator actions, settings modifications, and publishes. Total records: {total}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">All Entity Types</option>
            <option value="settings">Settings</option>
            <option value="ghat">Ghats</option>
            <option value="news">News</option>
            <option value="seva">Seva</option>
            <option value="user">Users</option>
          </select>
          <button
            onClick={loadLogs}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No audit records match the selected filter.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Admin</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
                <th style={{ padding: '10px 14px' }}>Entity</th>
                <th style={{ padding: '10px 14px' }}>Target ID</th>
                <th style={{ padding: '10px 14px' }}>Diff / Changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const hasDiff = log.old_value !== null || log.new_value !== null;

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      style={{
                        borderBottom: '1px solid #E2E8F0',
                        background: isExpanded ? '#F8FAFC' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#64748B', fontSize: '0.8125rem' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>
                        {log.admin_name || log.admin_phone || log.admin_id || 'System'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#334155' }}>
                        {log.entity_type}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748B', fontSize: '0.8125rem' }}>
                        {log.entity_id || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {hasDiff ? (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              background: isExpanded ? '#0F52BA' : '#FFFFFF',
                              color: isExpanded ? '#FFFFFF' : '#334155',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {isExpanded ? 'Hide Diff ▲' : 'View Diff ▼'}
                          </button>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>No diff payload</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td colSpan={6} style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.8125rem', marginBottom: '6px', color: '#475569' }}>
                            <strong>Reason:</strong> {log.reason || 'None provided'} &nbsp;•&nbsp;
                            <strong>Source URL:</strong> <code>{log.source_url || 'N/A'}</code>
                          </div>
                          <OldNewDiffViewer oldValue={log.old_value} newValue={log.new_value} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Page {page} of {totalPages} ({total} entries)
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{ padding: '4px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.5 }}
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{ padding: '4px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: page < totalPages ? 'pointer' : 'default', opacity: page < totalPages ? 1 : 0.5 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

