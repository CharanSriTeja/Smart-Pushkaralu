import React, { useState, useEffect } from 'react';
import { AdminApi } from '../services/adminApi';
import { IssueReport, IssueUpdate, AuditLog, IssueStatus } from '../types';

interface IssueDetailPageProps {
  issueId: string;
  onBack: () => void;
}

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted (Initial)' },
  { value: 'under_review', label: 'Under Review (Field Squad Inspecting)' },
  { value: 'in_progress', label: 'In Progress (Active Remediation)' },
  { value: 'resolved', label: 'Resolved (Action Verified)' },
  { value: 'rejected', label: 'Closed / Rejected' },
];

export const IssueDetailPage: React.FC<IssueDetailPageProps> = ({ issueId, onBack }) => {
  const [issue, setIssue] = useState<IssueReport | null>(null);
  const [timeline, setTimeline] = useState<IssueUpdate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [targetStatus, setTargetStatus] = useState<IssueStatus>('in_progress');
  const [publicNote, setPublicNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadIssueDetail();
  }, [issueId]);

  const loadIssueDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminApi.getIssueById(issueId);
      setIssue(data.issue);
      setTimeline(data.timeline || []);
      setAuditLogs(data.auditLogs || []);
      if (data.issue) {
        setTargetStatus(data.issue.status);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditReason.trim()) {
      alert('A valid reason is strictly mandatory for administrative audit logging.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await AdminApi.updateIssueStatus(issueId, {
        status: targetStatus,
        reason: auditReason.trim(),
        public_note: publicNote.trim() || undefined,
        internal_note: internalNote.trim() || undefined,
        resolution_photo_url: resolutionPhotoUrl.trim() || undefined,
      });

      setSuccessMessage('Issue status updated and logged to audit trail successfully!');
      setAuditReason('');
      setPublicNote('');
      setInternalNote('');
      setResolutionPhotoUrl('');

      // Reload updated timeline
      await loadIssueDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to update issue status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="animate-spin text-3xl mb-2">⏳</div>
        Loading grievance report #{issueId}...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="text-3xl mb-2">❌</div>
        <p className="font-bold text-slate-800">Issue not found</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">
          ← Back to Issues
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
        >
          ← Back to Issue List
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">ID: {issue.id}</span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <span>✅ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Issue Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold text-blue-700">{issue.ticket_no}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                {issue.category}
              </span>
              {issue.duplicate_count > 0 && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                  +{issue.duplicate_count} duplicate reports merged
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Logged on {new Date(issue.created_at).toLocaleString()} • Location type: {issue.location_type}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Current Status:</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800">
              {issue.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Description & Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-400">Grievance Description</h3>
              <p className="text-sm text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                {issue.description}
              </p>
            </div>

            {issue.photo_url && (
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400">Pilgrim Attached Photo</h3>
                <div className="mt-1 rounded-lg overflow-hidden border border-slate-200 max-w-sm">
                  <img
                    src={issue.photo_url.startsWith('http') ? issue.photo_url : `http://localhost:4000${issue.photo_url}`}
                    alt="Pilgrim Grievance Evidence"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            <h3 className="font-bold uppercase text-slate-500 text-[11px]">Location & Reporter Meta</h3>
            <div>
              <span className="font-semibold">Coordinates:</span>
              <p className="font-mono text-slate-800">{Number(issue.lat).toFixed(6)}, {Number(issue.lng).toFixed(6)}</p>
            </div>
            {issue.qr_zone_id && (
              <div>
                <span className="font-semibold">QR / Zone ID:</span>
                <p className="font-mono text-slate-800">{issue.qr_zone_id}</p>
              </div>
            )}
            {issue.reporter_phone && (
              <div>
                <span className="font-semibold">Reporter Phone:</span>
                <p className="font-mono text-slate-800">{issue.reporter_phone}</p>
              </div>
            )}
            <div>
              <span className="font-semibold">Priority Level:</span>
              <p className="capitalize font-semibold text-slate-800">{issue.priority}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Update & Resolution Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span>✍️</span> Update Status & Dispatch Resolution Note
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Updating status sends an immediate push notification to the reporter's mobile device and creates a permanent entry in the system audit logs.
        </p>

        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Target Status *
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Resolution Proof Photo URL (Optional)
              </label>
              <input
                type="text"
                value={resolutionPhotoUrl}
                onChange={(e) => setResolutionPhotoUrl(e.target.value)}
                placeholder="https://... or /uploads/issues/resolved.jpg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Public Update Note (Visible to Pilgrim on Mobile)
              </label>
              <textarea
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                rows={3}
                placeholder="e.g. Sanitation squad dispatched to clear debris at Kotilingala Ghat."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Internal Administrative Note (Restricted to Control Room)
              </label>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                placeholder="e.g. Assigned to Sub-inspector Ramesh; verified via CCTV camera 4."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mandatory Audit Reason */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Audit Reason * <span className="text-red-500">(Required by audit policy)</span>
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder="State clear operational reason for status change (e.g. Task completed and verified by duty officer)"
              required
              className="w-full px-3 py-2 border border-amber-300 bg-amber-50/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow transition ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting & Dispatching FCM...' : 'Save & Broadcast Status Update →'}
            </button>
          </div>
        </form>
      </div>

      {/* Activity Timeline & Internal Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>📜</span> Historical Activity Timeline
        </h2>

        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No timeline entries yet.</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={item.id || idx} className="flex gap-4 border-l-2 border-blue-500 pl-4 py-1">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  {item.public_note && (
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-500">Public Note:</span> {item.public_note}
                    </p>
                  )}

                  {item.internal_note && (
                    <p className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200 mt-1">
                      <span className="font-bold">🔒 Internal Note:</span> {item.internal_note}
                    </p>
                  )}

                  {item.resolution_photo_url && (
                    <div className="mt-2">
                      <span className="text-[11px] font-bold text-emerald-700">Resolution Photo:</span>
                      <img
                        src={item.resolution_photo_url.startsWith('http') ? item.resolution_photo_url : `http://localhost:4000${item.resolution_photo_url}`}
                        alt="Resolution Proof"
                        className="w-32 h-24 object-cover rounded mt-1 border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Trail */}
      {auditLogs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span>🛡️</span> Administrative Audit Logs
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Timestamp</th>
                  <th className="p-2">Admin</th>
                  <th className="p-2">Action</th>
                  <th className="p-2">Audit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2 whitespace-nowrap text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-2 whitespace-nowrap font-mono">{log.admin_email}</td>
                    <td className="p-2 whitespace-nowrap font-semibold text-blue-700">{log.action}</td>
                    <td className="p-2">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

