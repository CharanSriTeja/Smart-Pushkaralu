import React, { useState } from 'react';
import { AdminApi } from '../services/adminApi';

interface Props {
  ghatId: string;
  ghatName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NoticeModal: React.FC<Props> = ({
  ghatId,
  ghatName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [titleHi, setTitleHi] = useState('');

  const [messageEn, setMessageEn] = useState('');
  const [messageTe, setMessageTe] = useState('');
  const [messageHi, setMessageHi] = useState('');

  const [severity, setSeverity] = useState<'info' | 'warning' | 'emergency'>('warning');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !messageEn.trim()) {
      setError('English title and message are required.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A valid audit reason of at least 5 characters is strictly required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await AdminApi.createNotice({
        ghat_id: ghatId,
        title: {
          en: titleEn.trim(),
          te: titleTe.trim() || undefined,
          hi: titleHi.trim() || undefined,
        },
        message: {
          en: messageEn.trim(),
          te: messageTe.trim() || undefined,
          hi: messageHi.trim() || undefined,
        },
        severity,
        reason: reason.trim(),
      });

      alert('Safety advisory published and registered in audit log.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish notice.');
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
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
            Publish Safety Advisory
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
          Publishing notice for: <strong style={{ color: '#0F172A' }}>{ghatName}</strong>
        </p>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              Severity Level:
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '14px',
              }}
            >
              <option value="info">ℹ️ General Info / Guidance</option>
              <option value="warning">⚠️ Warning / High River Current</option>
              <option value="emergency">🚨 Emergency / Bathing Suspended</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              Title (English) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Life jackets mandatory beyond barricades"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Title (Telugu - తెలుగు)
              </label>
              <input
                type="text"
                placeholder="ఉదా. లైఫ్ జాకెట్లు తప్పనిసరి"
                value={titleTe}
                onChange={(e) => setTitleTe(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Title (Hindi - हिन्दी)
              </label>
              <input
                type="text"
                placeholder="उदा. लाइफ जैकेट अनिवार्य है"
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
              Message / Instructions (English) *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Detailed instructions for pilgrims..."
              value={messageEn}
              onChange={(e) => setMessageEn(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Message (Telugu - తెలుగు)
              </label>
              <textarea
                rows={2}
                placeholder="భక్తుల కోసం సూచనలు..."
                value={messageTe}
                onChange={(e) => setMessageTe(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Message (Hindi - हिन्दी)
              </label>
              <textarea
                rows={2}
                placeholder="श्रद्धालुओं के लिए निर्देश..."
                value={messageHi}
                onChange={(e) => setMessageHi(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#DC2626', marginBottom: '4px' }}>
              Mandatory Audit Reason *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Irrigation department issued high discharge bulletin from upstream..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
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
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: severity === 'emergency' ? '#DC2626' : '#0F52BA',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: '700',
              }}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Advisory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

