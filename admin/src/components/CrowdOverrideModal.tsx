import React, { useState } from 'react';
import { CrowdLevel } from '../types';
import { AdminApi } from '../services/adminApi';

interface Props {
  ghatId: string;
  ghatName: string;
  currentLevel: CrowdLevel;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CrowdOverrideModal: React.FC<Props> = ({
  ghatId,
  ghatName,
  currentLevel,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [level, setLevel] = useState<CrowdLevel>(currentLevel || 'medium');
  const [reason, setReason] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A descriptive audit reason of at least 5 characters is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await AdminApi.overrideCrowd(ghatId, level, reason.trim(), sourceUrl.trim() || undefined);
      alert('Crowd status override successfully applied and logged.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply crowd override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
            Override Crowd Level
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
          Ghat: <strong style={{ color: '#0F172A' }}>{ghatName}</strong>
        </p>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Select Forced Crowd Density:
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CrowdLevel)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="low">🟢 Low Crowd (&lt;30%)</option>
              <option value="medium">🟡 Moderate Crowd (30-60%)</option>
              <option value="high">🟠 High Rush (60-85%)</option>
              <option value="very_high">🔴 Peak Density / Barricades Full (&gt;85%)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Official Source / Camera Feed URL (Optional):
            </label>
            <input
              type="url"
              placeholder="https://eastgodavari.ap.gov.in/control-room/feed"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#DC2626', marginBottom: '6px' }}>
              Mandatory Audit Reason (Required for Audit Logging):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Police Control Room CCTV confirmed heavy influx from rail bridge..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0F52BA',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: '700',
              }}
            >
              {isSubmitting ? 'Logging...' : 'Apply & Audit Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

