import React, { useState, useEffect, useMemo } from 'react';
import { AdminApi } from '../services/adminApi';
import { useAuth } from '../context/AuthContext';

export interface IssueItem {
  id: string;
  ticket_no: string;
  category: 'sanitation' | 'road' | 'water' | 'lighting' | 'crowd' | 'other';
  description: string;
  photo_url?: string | null;
  location_type: string;
  lat: number;
  lng: number;
  ghat_id?: string | null;
  ghat_name?: string | null;
  status: 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'rejected';
  priority: string;
  reporter_phone?: string | null;
  device_fingerprint?: string | null;
  is_duplicate: boolean;
  duplicate_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  sanitation: { label: 'Sanitation', icon: '🧹', color: '#D97706', bg: '#FEF3C7' },
  water: { label: 'Drinking Water', icon: '🚰', color: '#0284C7', bg: '#E0F2FE' },
  road: { label: 'Road & Path', icon: '🛣️', color: '#4B5563', bg: '#F3F4F6' },
  lighting: { label: 'Lighting', icon: '💡', color: '#CA8A04', bg: '#FEF9C3' },
  crowd: { label: 'Crowd Hazard', icon: '👥', color: '#DC2626', bg: '#FEE2E2' },
  other: { label: 'Other', icon: '⚠️', color: '#7C3AED', bg: '#EDE9FE' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#D97706', bg: '#FEF3C7' },
  under_review: { label: 'Under Review', color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', color: '#7C3AED', bg: '#EDE9FE' },
  resolved: { label: 'Resolved', color: '#16A34A', bg: '#DCFCE7' },
  rejected: { label: 'Rejected', color: '#6B7280', bg: '#F3F4F6' },
};

export const IssuesPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Modal State
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('resolved');
  const [auditReason, setAuditReason] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await AdminApi.getIssues(params);
      setIssues(res.issues || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch issues from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter]);

  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;
    const q = searchQuery.toLowerCase();
    return issues.filter(
      (i) =>
        i.ticket_no.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.reporter_phone && i.reporter_phone.toLowerCase().includes(q))
    );
  }, [issues, searchQuery]);

  // Statistics
  const counts = useMemo(() => {
    const total = issues.length;
    const submitted = issues.filter((i) => i.status === 'submitted').length;
    const underReview = issues.filter((i) => i.status === 'under_review').length;
    const inProgress = issues.filter((i) => i.status === 'in_progress').length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;
    return { total, submitted, underReview, inProgress, resolved };
  }, [issues]);

  const handleOpenResolveModal = (issue: IssueItem) => {
    setSelectedIssue(issue);
    setActionStatus(issue.status === 'submitted' ? 'under_review' : 'resolved');
    setAuditReason('');
    setPublicNote(
      issue.status === 'submitted'
        ? 'Assigned to field sanitation & engineering squad for triage.'
        : 'The reported grievance has been inspected and rectified by ground staff.'
    );
    setInternalNote('');
  };

  const handleCloseModal = () => {
    setSelectedIssue(null);
    setAuditReason('');
    setPublicNote('');
    setInternalNote('');
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    if (!auditReason.trim()) {
      alert('An administrative audit reason is required.');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      await AdminApi.updateIssueStatus(selectedIssue.id, {
        status: actionStatus,
        reason: auditReason.trim(),
        public_note: publicNote.trim() || undefined,
        internal_note: internalNote.trim() || undefined,
      });

      setSuccessMsg(`Issue #${selectedIssue.ticket_no} updated to status "${actionStatus}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
      handleCloseModal();
      await fetchIssues();
    } catch (err: any) {
      alert(`Update failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!hasPermission('issues.update') && !hasPermission('*')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>issues.update</code> permission required to triage grievances.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
            Pilgrim Grievances & Issues Triage (Module 8)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
            Inspect, assign, and resolve sanitation, road, water, and infrastructure issues reported from the mobile app.
          </p>
        </div>
        <button
          onClick={fetchIssues}
          style={{
            padding: '8px 16px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            color: '#1E293B',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', padding: '10px 16px', borderRadius: '6px', marginBottom: '1rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 16px', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{ background: '#FFFFFF', padding: '14px 18px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Issues</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{counts.total}</div>
        </div>
        <div style={{ background: '#FFFBEB', padding: '14px 18px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 700, textTransform: 'uppercase' }}>Pending / Submitted</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{counts.submitted}</div>
        </div>
        <div style={{ background: '#EFF6FF', padding: '14px 18px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
          <div style={{ fontSize: '0.75rem', color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase' }}>Under Review</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>{counts.underReview}</div>
        </div>
        <div style={{ background: '#FAF5FF', padding: '14px 18px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B21A8', fontWeight: 700, textTransform: 'uppercase' }}>In Progress</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7C3AED', marginTop: '4px' }}>{counts.inProgress}</div>
        </div>
        <div style={{ background: '#F0FDF4', padding: '14px 18px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700, textTransform: 'uppercase' }}>Resolved</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16A34A', marginTop: '4px' }}>{counts.resolved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Status:</span>
          {['all', 'submitted', 'under_review', 'in_progress', 'resolved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: statusFilter === s ? '1px solid #0F52BA' : '1px solid #E2E8F0',
                background: statusFilter === s ? '#0F52BA' : '#F8FAFC',
                color: statusFilter === s ? '#FFFFFF' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: '0.85rem',
              color: '#1E293B',
              fontWeight: 600,
            }}
          >
            <option value="all">All Categories</option>
            <option value="sanitation">🧹 Sanitation</option>
            <option value="water">🚰 Drinking Water</option>
            <option value="road">🛣️ Road & Path</option>
            <option value="lighting">💡 Lighting</option>
            <option value="crowd">👥 Crowd Hazard</option>
            <option value="other">⚠️ Other</option>
          </select>

          <input
            type="text"
            placeholder="Search ticket, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              minWidth: '220px',
            }}
          />
        </div>
      </div>

      {/* Issues Table / List */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
            Loading reported grievances...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            No grievances match the selected filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Ticket & Category</th>
                  <th style={{ padding: '12px 16px' }}>Description</th>
                  <th style={{ padding: '12px 16px' }}>Location</th>
                  <th style={{ padding: '12px 16px' }}>Photo</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Reported At</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => {
                  const cat = CATEGORY_META[issue.category] || CATEGORY_META.other;
                  const stat = STATUS_META[issue.status] || STATUS_META.submitted;
                  return (
                    <tr key={issue.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {issue.ticket_no}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '4px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: cat.bg,
                            color: cat.color,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <span>{cat.icon}</span> {cat.label}
                        </div>
                        {issue.duplicate_count > 0 && (
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>
                            +{issue.duplicate_count} merged duplicates
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: '320px' }}>
                        <div style={{ color: '#1E293B', fontWeight: 500, lineHeight: 1.4 }}>
                          {issue.description}
                        </div>
                        {issue.reporter_phone && (
                          <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px' }}>
                            Reporter: 📞 {issue.reporter_phone}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ color: '#0F172A', fontWeight: 600 }}>
                          {issue.ghat_name || 'Near Ghat Zone'}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '2px' }}>
                          GPS: {issue.lat != null ? Number(issue.lat).toFixed(4) : '—'}, {issue.lng != null ? Number(issue.lng).toFixed(4) : '—'}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        {issue.photo_url ? (
                          <a href={issue.photo_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={issue.photo_url}
                              alt="Issue evidence"
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                            />
                          </a>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>No photo</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: stat.bg,
                            color: stat.color,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'inline-block',
                          }}
                        >
                          {stat.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'top', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {new Date(issue.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => handleOpenResolveModal(issue)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #0F52BA',
                            background: '#0F52BA',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Resolve / Triage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Triage / Resolve Modal */}
      {selectedIssue && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  Triage Grievance #{selectedIssue.ticket_no}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Category: {CATEGORY_META[selectedIssue.category]?.label || selectedIssue.category} • Location: {selectedIssue.lat != null ? Number(selectedIssue.lat).toFixed(4) : '—'}, {selectedIssue.lng != null ? Number(selectedIssue.lng).toFixed(4) : '—'}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', marginBottom: '4px' }}>PILGRIM'S REPORT:</div>
              <div style={{ color: '#0F172A', fontSize: '0.9rem', lineHeight: 1.5 }}>{selectedIssue.description}</div>
              {selectedIssue.photo_url && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={selectedIssue.photo_url}
                    alt="Report Evidence"
                    style={{ maxHeight: '180px', borderRadius: '6px', border: '1px solid #CBD5E1', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateStatusSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Target Resolution Status *
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="under_review">Under Review (Assigned to response squad)</option>
                  <option value="in_progress">In Progress (Work underway on ghat)</option>
                  <option value="resolved">Resolved (Grievance fixed & inspected)</option>
                  <option value="rejected">Rejected (Duplicate or invalid report)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Administrative Audit Reason * (Required for audit log compliance)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sanitation supervisor verified clean up at Kotilingala ghat."
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Public Status Note (Visible to the pilgrim on their mobile timeline)
                </label>
                <textarea
                  rows={2}
                  value={publicNote}
                  onChange={(e) => setPublicNote(e.target.value)}
                  placeholder="e.g. Water tankers have refilled the station. All taps functional."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Internal Notes (Control Room & Squad visible only)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handled by Team Bravo officer Kumar."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: actionStatus === 'resolved' ? '#16A34A' : '#0F52BA',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: isUpdating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isUpdating ? 'Saving...' : 'Apply Status & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
