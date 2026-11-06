import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { AdminApi } from '../services/adminApi';

interface Props {
  onBack: () => void;
  entityIdFilter?: string;
}

export const AuditLogsPage: React.FC<Props> = ({ onBack, entityIdFilter }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await AdminApi.getAuditLogs({
          entityId: entityIdFilter,
          limit: 100,
        });
        setLogs(res.logs);
        setTotal(res.total);
      } catch (err: any) {
        alert('Failed to load audit logs: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entityIdFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#0F52BA',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '6px',
            }}
          >
            ← Back to Ghat Directory
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
            Administrative Audit Registry ({total} Records)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Immutable administrative action log showing administrator, timestamp, old value, new value, source URL, and mandated reason.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading audit logs...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 14px' }}>Timestamp</th>
                <th style={{ padding: '12px 14px' }}>Admin</th>
                <th style={{ padding: '12px 14px' }}>Action</th>
                <th style={{ padding: '12px 14px' }}>Entity</th>
                <th style={{ padding: '12px 14px' }}>Mandatory Reason</th>
                <th style={{ padding: '12px 14px' }}>Source URL</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateStr = new Date(log.created_at).toLocaleString();
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </td>

                    <td style={{ padding: '12px 14px', color: '#0F172A', fontWeight: '600' }}>
                      {log.admin_email || log.admin_id}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}>
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {log.entity_type} <span style={{ fontSize: '11px', color: '#94A3B8' }}>({log.entity_id.substring(0, 8)}...)</span>
                    </td>

                    <td style={{ padding: '12px 14px', color: '#334155', maxWidth: '260px' }}>
                      {log.reason}
                    </td>

                    <td style={{ padding: '12px 14px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.source_url ? (
                        <a href={log.source_url} target="_blank" rel="noreferrer" style={{ color: '#0F52BA' }}>
                          {log.source_url}
                        </a>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Diff Inspector Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
                Audit Change Diff: {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: '1.6' }}>
              <div><strong>Admin:</strong> {selectedLog.admin_email} ({selectedLog.admin_id})</div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}</div>
              <div><strong>Audit Reason:</strong> {selectedLog.reason}</div>
              {selectedLog.source_url && <div><strong>Source URL:</strong> {selectedLog.source_url}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#DC2626', marginBottom: '6px' }}>
                  Old Values (Previous State):
                </h5>
                <pre style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'None (New Record)'}
                </pre>
              </div>

              <div>
                <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', marginBottom: '6px' }}>
                  New Values (Updated State):
                </h5>
                <pre style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'None'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0F52BA',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

