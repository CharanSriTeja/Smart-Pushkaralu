import React, { useState } from 'react';
import { AdminApi } from '../services/adminApi';
import { NewsPost, NewsCategory, NewsPriority, NewsPublishStatus, LocalizedString } from '../types';

interface Props {
  news?: NewsPost | null;
  onBack: () => void;
  onSaved: () => void;
}

export const NewsEditorPage: React.FC<Props> = ({ news, onBack, onSaved }) => {
  const isEditing = Boolean(news);

  // Multilingual fields
  const [title, setTitle] = useState<LocalizedString>({
    en: news?.title?.en || '',
    te: news?.title?.te || '',
    hi: news?.title?.hi || '',
  });

  const [content, setContent] = useState<LocalizedString>({
    en: news?.content?.en || '',
    te: news?.content?.te || '',
    hi: news?.content?.hi || '',
  });

  const [summary, setSummary] = useState<LocalizedString>({
    en: news?.summary?.en || '',
    te: news?.summary?.te || '',
    hi: news?.summary?.hi || '',
  });

  // Metadata
  const [category, setCategory] = useState<NewsCategory>(news?.category || 'general');
  const [priority, setPriority] = useState<NewsPriority>(news?.priority || 'normal');
  const [ghatIds, setGhatIds] = useState<string>((news?.ghat_ids || []).join(', '));
  const [sourceUrl, setSourceUrl] = useState<string>(news?.source_url || '');
  const [isOfficial, setIsOfficial] = useState<boolean>(news?.is_official || false);
  const [isPinned, setIsPinned] = useState<boolean>(news?.is_pinned || false);
  const [publishStatus, setPublishStatus] = useState<NewsPublishStatus>(news?.publish_status || 'draft');
  const [expiresAt, setExpiresAt] = useState<string>(
    news?.expires_at ? news.expires_at.slice(0, 16) : ''
  );
  const [notify, setNotify] = useState<boolean>(false);
  const [auditReason, setAuditReason] = useState<string>('');

  // States
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Missing language warning logic
  const isMissingTelugu = !title.te?.trim() || !content.te?.trim();
  const isMissingHindi = !title.hi?.trim() || !content.hi?.trim();
  const hasMissingLanguages = isMissingTelugu || isMissingHindi;

  // Draft Translation Handler
  const handleDraftTranslate = async () => {
    if (!title.en.trim() && !content.en.trim()) {
      alert('Please enter English title or content first to generate draft translations.');
      return;
    }

    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const draft = await AdminApi.draftTranslate({
        title: title.en,
        content: content.en,
        summary: summary.en,
        sourceLang: 'en',
      });

      if (draft.title) {
        setTitle((prev) => ({
          ...prev,
          te: prev.te?.trim() ? prev.te : draft.title.te,
          hi: prev.hi?.trim() ? prev.hi : draft.title.hi,
        }));
      }

      if (draft.content) {
        setContent((prev) => ({
          ...prev,
          te: prev.te?.trim() ? prev.te : draft.content.te,
          hi: prev.hi?.trim() ? prev.hi : draft.content.hi,
        }));
      }

      if (draft.summary) {
        setSummary((prev) => ({
          ...prev,
          te: prev.te?.trim() ? prev.te : draft.summary.te,
          hi: prev.hi?.trim() ? prev.hi : draft.summary.hi,
        }));
      }

      setSuccessMessage('Draft translations populated! Please review and confirm before publishing.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Draft translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.en.trim()) {
      setErrorMessage('English Title is required.');
      return;
    }
    if (!content.en.trim()) {
      setErrorMessage('English Content is required.');
      return;
    }
    if (!auditReason.trim()) {
      setErrorMessage('An Administrative Audit Reason is strictly required.');
      return;
    }

    if (isOfficial) {
      const lowerUrl = (sourceUrl || '').toLowerCase();
      const isGov = lowerUrl.includes('.gov.in') || lowerUrl.includes('.nic.in');
      if (!isGov) {
        setErrorMessage(
          'Official label can only be granted when source URL is a verified official government or district portal (*.gov.in / *.nic.in).'
        );
        return;
      }
    }

    const ghat_ids = ghatIds
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: any = {
      title,
      content,
      summary: summary.en.trim() ? summary : null,
      category,
      priority,
      ghat_ids,
      source_url: sourceUrl.trim() || null,
      is_official: isOfficial,
      is_pinned: isPinned,
      publish_status: publishStatus,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      notify,
      audit_reason: auditReason.trim(),
    };

    setIsSaving(true);
    try {
      if (isEditing && news) {
        await AdminApi.updateNews(news.id, payload);
      } else {
        await AdminApi.createNews(payload);
      }
      onSaved();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save bulletin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#0F52BA',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              padding: 0,
              marginBottom: '6px',
            }}
          >
            ← Back to Bulletins List
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            {isEditing ? 'Edit Official Bulletin' : 'Draft New Bulletin'}
          </h2>
        </div>

        {/* Translation Assistant Button */}
        <button
          type="button"
          onClick={handleDraftTranslate}
          disabled={isTranslating}
          style={{
            backgroundColor: '#0F52BA',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(15,82,186,0.2)',
          }}
        >
          <span>{isTranslating ? '⏳' : '✨'}</span>
          {isTranslating ? 'Generating Drafts...' : 'Draft Translations (EN → TE, HI)'}
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div style={{
          backgroundColor: '#DEF7EC',
          color: '#03543F',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: '600',
        }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: '600',
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Missing Language Warning Banner */}
      {hasMissingLanguages && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1.5px solid #FDE68A',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: '800', color: '#92400E', fontSize: '14px' }}>
              Missing Language Warning
            </div>
            <div style={{ color: '#78350F', fontSize: '13px', marginTop: '2px' }}>
              Rules require all user-facing advisories to support Telugu, English, and Hindi.
              {isMissingTelugu && ' [Telugu content is empty]'}
              {isMissingHindi && ' [Hindi content is empty]'}
              {' — Click the "Draft Translations" button above for assistance.'}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Multilingual Text Editor Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 16px 0' }}>
            1. Multilingual Content (Telugu, English, Hindi)
          </h3>

          {/* Titles Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Title (English) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                value={title.en}
                onChange={(e) => setTitle({ ...title, en: e.target.value })}
                placeholder="e.g. VIP Ghat Traffic Diversion in Rajahmundry"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Title (తెలుగు - Telugu) {!title.te?.trim() && <span style={{ color: '#D97706' }}>[Pending]</span>}
              </label>
              <input
                type="text"
                value={title.te || ''}
                onChange={(e) => setTitle({ ...title, te: e.target.value })}
                placeholder="ఉదా: రాజమండ్రి విఐపి ఘాట్ వద్ద ట్రాఫిక్ మళ్లింపు"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Title (हिन्दी - Hindi) {!title.hi?.trim() && <span style={{ color: '#D97706' }}>[Pending]</span>}
              </label>
              <input
                type="text"
                value={title.hi || ''}
                onChange={(e) => setTitle({ ...title, hi: e.target.value })}
                placeholder="उदा: राजमुंदरी वीआईपी घाट पर यातायात डायवर्जन"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Summaries Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Short Summary (English)
              </label>
              <input
                type="text"
                value={summary.en}
                onChange={(e) => setSummary({ ...summary, en: e.target.value })}
                placeholder="One-line summary for push notifications"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Short Summary (తెలుగు)
              </label>
              <input
                type="text"
                value={summary.te || ''}
                onChange={(e) => setSummary({ ...summary, te: e.target.value })}
                placeholder="నోటిఫికేషన్ కోసం సంక్షిప్త వివరణ"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Short Summary (हिन्दी)
              </label>
              <input
                type="text"
                value={summary.hi || ''}
                onChange={(e) => setSummary({ ...summary, hi: e.target.value })}
                placeholder="अधिसूचना के लिए संक्षिप्त विवरण"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Detailed Content Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Full Advisory Body (English) <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                rows={5}
                value={content.en}
                onChange={(e) => setContent({ ...content, en: e.target.value })}
                placeholder="Enter complete bulletin details..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Full Advisory Body (తెలుగు)
              </label>
              <textarea
                rows={5}
                value={content.te || ''}
                onChange={(e) => setContent({ ...content, te: e.target.value })}
                placeholder="పూర్తి ప్రకటన వివరాలు..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Full Advisory Body (हिन्दी)
              </label>
              <textarea
                rows={5}
                value={content.hi || ''}
                onChange={(e) => setContent({ ...content, hi: e.target.value })}
                placeholder="पूरी सूचना का विवरण..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>
        </div>

        {/* Classification & Metadata Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 16px 0' }}>
            2. Classification, Status & Trust Settings
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              >
                <option value="urgent">🚨 Urgent Emergency</option>
                <option value="advisory">📢 Safety Advisory</option>
                <option value="facility">🚻 Facilities Update</option>
                <option value="traffic">🚗 Traffic &amp; Route</option>
                <option value="weather">🌧️ Weather &amp; River Level</option>
                <option value="general">ℹ️ General News</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NewsPriority)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              >
                <option value="low">Low (Background info)</option>
                <option value="normal">Normal (Standard broadcast)</option>
                <option value="high">High (Featured advisory)</option>
                <option value="urgent">Urgent (Immediate alert)</option>
              </select>
            </div>

            {/* Publish Status */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Publish Status
              </label>
              <select
                value={publishStatus}
                onChange={(e) => setPublishStatus(e.target.value as NewsPublishStatus)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live to pilgrims)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Expiry Date */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Expiry Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Ghat Tags & Source URL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Ghat ID Tags (Optional comma-separated UUIDs)
              </label>
              <input
                type="text"
                value={ghatIds}
                onChange={(e) => setGhatIds(e.target.value)}
                placeholder="Leave blank for all ghats, or paste ghat UUIDs"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1E293B', marginBottom: '6px' }}>
                Source URL (Strictly required for Official Flag)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://eastgodavari.ap.gov.in/..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Flags Toggles */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '12px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
              <input
                type="checkbox"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              🏛️ Mark as Verified Official Government Notice
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              📌 Pin Bulletin to Top of Public Feed
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#047857' }}>
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              🔔 Send FCM Push Notification to topic subscribers on publish
            </label>
          </div>
        </div>

        {/* Mandatory Audit Reason Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#991B1B', margin: '0 0 8px 0' }}>
            3. Mandatory Administrative Audit Reason <span style={{ color: '#DC2626' }}>*</span>
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 12px 0' }}>
            In accordance with Pushkaralu governance compliance, every bulletin creation, update, or retraction is recorded in the permanent audit logs.
          </p>
          <textarea
            rows={3}
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            placeholder="e.g. Published official order issued by Collector & District Magistrate for morning VIP movement."
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
            required
          />
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#F1F5F9',
              color: '#334155',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0F52BA',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(15,82,186,0.25)',
            }}
          >
            {isSaving ? 'Saving Bulletin...' : isEditing ? 'Save Changes & Record Audit' : 'Publish Bulletin & Record Audit'}
          </button>
        </div>
      </form>
    </div>
  );
};

