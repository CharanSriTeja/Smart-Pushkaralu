import React, { useEffect, useState } from 'react';
import { fetchAdminSettings, updateAdminSetting } from '../services/api';
import { SettingRecord } from '../types';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [settings, setSettings] = useState<SettingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminSettings(token);
      setSettings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('settings.write')) {
      loadSettings();
    }
  }, [token]);

  const handleStartEdit = (setting: SettingRecord) => {
    setEditingKey(setting.key);
    setEditValue(typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value));
    setReason('');
    setStatusMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;

    if (!reason.trim()) {
      setStatusMessage({ type: 'error', text: 'An audit reason is required for any settings change.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    let parsedVal: any = editValue;
    try {
      parsedVal = JSON.parse(editValue);
    } catch {
      // keep as string or number
      if (!isNaN(Number(editValue))) parsedVal = Number(editValue);
    }

    try {
      await updateAdminSetting(editingKey, parsedVal, reason, token);
      setStatusMessage({ type: 'success', text: `Setting '${editingKey}' updated and audit logged successfully.` });
      setEditingKey(null);
      await loadSettings();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update setting' });
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('settings.write')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your current role lacks the <code>settings.write</code> permission required to configure settings.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Platform Settings Editor
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          Tune operational parameters across mobile apps and backend APIs. Every modification is audited.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '1rem',
            background: statusMessage.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            border: `1px solid ${statusMessage.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
            color: statusMessage.type === 'success' ? '#166534' : '#991B1B',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ color: '#64748B' }}>Loading settings...</div>
        ) : (
          settings.map((s) => {
            const isEditing = editingKey === s.key;

            return (
              <div
                key={s.key}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  border: isEditing ? '2px solid #0F52BA' : '1px solid #CBD5E1',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <code style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                    {s.key}
                  </code>
                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(s)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: '#0F52BA',
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSave} style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      New Value (JSON or string/number):
                    </label>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        marginBottom: '8px',
                        boxSizing: 'border-box',
                      }}
                    />

                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Audit Change Reason (Required):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Adjusted during weekend crowd surge"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                        marginBottom: '10px',
                        boxSizing: 'border-box',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#0F52BA',
                          color: '#FFFFFF',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {saving ? 'Saving...' : 'Save & Audit'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F52BA', margin: '8px 0' }}>
                      {typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                      Updated by {s.updated_by_name || 'System'} • {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : 'Initial seed'}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

