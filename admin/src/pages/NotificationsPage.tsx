import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusChip } from '../components/StatusChip';
import { tokens } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';

export interface NotificationRecord {
  topic: string;
  language?: string;
  title: string;
  body: string;
  data: Record<string, string>;
  sentAt: string;
}

export const NotificationsPage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'urgent' | 'district'>('all');
  const [district, setDistrict] = useState('East Godavari');
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>('en');
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const canPublish = hasPermission('news.publish') || hasPermission('*');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/v1/admin/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data || []);
      }
    } catch {
      // offline / mock mode
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Please provide both notification title and body.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError('An audit reason of at least 5 characters is mandatory.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/v1/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          language,
          target,
          district: target === 'district' ? district : undefined,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to dispatch notification');
      }

      setSuccessMsg(`Push notification dispatched successfully to ${target === 'district' ? district : target} target.`);
      setTitle('');
      setBody('');
      setReason('');
      setShowConfirm(false);
      fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Dispatch failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title="Push Notifications Dispatcher"
        description="Broadcast festival advisories, crowd warnings, and ghat emergency alerts to pilgrim mobile devices"
      />

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            border: `1px solid ${tokens.colors.danger}`,
            borderRadius: `${tokens.radii.sm}px`,
            color: tokens.colors.danger,
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#DCFCE7',
            border: `1px solid ${tokens.colors.success}`,
            borderRadius: `${tokens.radii.sm}px`,
            color: tokens.colors.success,
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Main Two Column Layout: Compose Form & Mobile Preview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Compose Form */}
        <div
          style={{
            backgroundColor: tokens.colors.bg,
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: `${tokens.radii.md}px`,
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.25rem', color: tokens.colors.textPrimary }}>
            📢 Compose Notification
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Target & Language Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Audience Target *
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: `${tokens.radii.sm}px`,
                    border: `1px solid ${tokens.colors.border}`,
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="all">All Pushkaralu Pilgrims (Global)</option>
                  <option value="urgent">Urgent Festival Broadcast (High Priority)</option>
                  <option value="district">Targeted by District</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  Language *
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: `${tokens.radii.sm}px`,
                    border: `1px solid ${tokens.colors.border}`,
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="en">English (en)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            {target === 'district' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                  District Region
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: `${tokens.radii.sm}px`,
                    border: `1px solid ${tokens.colors.border}`,
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="East Godavari">East Godavari (Rajahmundry)</option>
                  <option value="West Godavari">West Godavari (Narasapuram / Kovvur)</option>
                  <option value="Konaseema">Dr. B.R. Ambedkar Konaseema</option>
                  <option value="Eluru">Eluru</option>
                </select>
              </div>
            )}

            {/* Notification Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Notification Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. VIP Procession & Ghat Queue Alert"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Notification Body */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Notification Message Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="e.g. Kotilingala Ghat is currently experiencing heavy pilgrim rush. Shuttles are being diverted to Pushkar Ghat."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Audit Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>
                Mandatory Audit Reason (min 5 characters) *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Official reason for sending this push broadcast"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: `${tokens.radii.sm}px`,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={!canPublish || submitting || !title.trim() || !body.trim() || reason.trim().length < 5}
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: tokens.colors.primary700,
                  color: tokens.colors.textInverse,
                  border: 'none',
                  borderRadius: `${tokens.radii.sm}px`,
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: !canPublish || submitting || !title.trim() || !body.trim() || reason.trim().length < 5 ? 0.6 : 1,
                }}
              >
                🚀 Dispatch Push Notification
              </button>
            </div>
          </div>
        </div>

        {/* Live Mobile Device Preview */}
        <div
          style={{
            backgroundColor: tokens.colors.bg,
            border: `1px solid ${tokens.colors.border}`,
            borderRadius: `${tokens.radii.md}px`,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: tokens.colors.textMuted, marginBottom: '1rem' }}>
            📱 Mobile Lock Screen Preview
          </span>

          <div
            style={{
              width: '280px',
              backgroundColor: '#1E293B',
              borderRadius: '24px',
              padding: '14px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '4px solid #0F172A',
            }}
          >
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', marginBottom: '12px' }}>
              10:27 • Wednesday
            </div>

            {/* Notification Card */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '1rem' }}>🕉️</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: tokens.colors.primary700 }}>
                  Smart Pushkaralu
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748B', marginLeft: 'auto' }}>now</span>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
                {title.trim() || 'Notification Title Here'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.3 }}>
                {body.trim() || 'Notification body text will appear right here as received on citizen handsets.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched History Table */}
      <div
        style={{
          backgroundColor: tokens.colors.bg,
          border: `1px solid ${tokens.colors.border}`,
          borderRadius: `${tokens.radii.md}px`,
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: tokens.colors.textPrimary }}>
            📜 Dispatched Push Notifications Log
          </h2>
          <button
            onClick={fetchHistory}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: `${tokens.radii.sm}px`,
              border: `1px solid ${tokens.colors.border}`,
              backgroundColor: tokens.colors.bg,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Log
          </button>
        </div>

        {loading ? (
          <p style={{ color: tokens.colors.textMuted, fontSize: '0.875rem' }}>Loading log records...</p>
        ) : history.length === 0 ? (
          <p style={{ color: tokens.colors.textMuted, fontSize: '0.875rem' }}>
            No push notifications dispatched yet in this session.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${tokens.colors.border}`, textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Topic / Target</th>
                  <th style={{ padding: '8px' }}>Language</th>
                  <th style={{ padding: '8px' }}>Notification Title</th>
                  <th style={{ padding: '8px' }}>Message Preview</th>
                  <th style={{ padding: '8px' }}>Dispatched At</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${tokens.colors.border}` }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>{item.topic}</td>
                    <td style={{ padding: '8px', textTransform: 'uppercase' }}>{item.language || 'en'}</td>
                    <td style={{ padding: '8px', fontWeight: '700' }}>{item.title}</td>
                    <td style={{ padding: '8px', color: tokens.colors.textMuted, maxWidth: '280px' }}>
                      {item.body}
                    </td>
                    <td style={{ padding: '8px', color: tokens.colors.textMuted }}>
                      {new Date(item.sentAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <StatusChip variant="success" label="Delivered" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirm Push Notification Broadcast"
        message={`You are about to broadcast this notification to ${target === 'district' ? `pilgrims in ${district}` : target === 'urgent' ? 'all users as an URGENT banner' : 'all festival attendees'}.`}
        confirmLabel="Confirm & Send"
        onConfirm={handleBroadcast}
        onCancel={() => setShowConfirm(false)}
        loading={submitting}
      />
    </div>
  );
};
