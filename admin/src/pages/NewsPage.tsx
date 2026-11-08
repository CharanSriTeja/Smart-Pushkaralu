import React, { useState, useEffect } from 'react';
import { TranslatableInput } from '../components/TranslatableInput';
import { LocalizedText } from '../types';
import { AdminApi } from '../services/adminApi';
import { useAuth } from '../context/AuthContext';

interface NewsItem {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  summary?: LocalizedText;
  category: 'general' | 'safety' | 'traffic' | 'water_level' | 'vip_movement' | 'lost_found';
  priority: 'normal' | 'high' | 'urgent';
  publish_status: 'draft' | 'published';
  pinned: boolean;
  notify_sent?: boolean;
  source_name?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  general: { label: 'General Announcement', icon: '📢', color: '#0F52BA', bg: '#EFF6FF' },
  safety: { label: 'Safety & River Caution', icon: '🚨', color: '#DC2626', bg: '#FEE2E2' },
  traffic: { label: 'Traffic & Parking Route', icon: '🚗', color: '#D97706', bg: '#FEF3C7' },
  water_level: { label: 'River Water Level & Current', icon: '🌊', color: '#0284C7', bg: '#E0F2FE' },
  vip_movement: { label: 'VIP / Dignitary Movement', icon: '🏛️', color: '#7C3AED', bg: '#EDE9FE' },
  lost_found: { label: 'Lost & Found Camp Notice', icon: '🔍', color: '#4B5563', bg: '#F3F4F6' },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'Normal', color: '#4B5563', bg: '#F3F4F6' },
  high: { label: 'High Priority', color: '#D97706', bg: '#FEF3C7' },
  urgent: { label: 'Urgent Alert', color: '#DC2626', bg: '#FEE2E2' },
};

export const NewsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  // News List State
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listFilter, setListFilter] = useState<'all' | 'published' | 'draft' | 'urgent'>('all');

  // Form State
  const [title, setTitle] = useState<LocalizedText>({
    en: '',
    te: '',
    hi: '',
  });
  const [content, setContent] = useState<LocalizedText>({
    en: '',
    te: '',
    hi: '',
  });
  const [category, setCategory] = useState<NewsItem['category']>('general');
  const [priority, setPriority] = useState<NewsItem['priority']>('normal');
  const [publishStatus, setPublishStatus] = useState<NewsItem['publish_status']>('published');
  const [pinned, setPinned] = useState(false);
  const [notify, setNotify] = useState(false);
  const [sourceName, setSourceName] = useState('Pushkaralu Command Center');
  const [sourceUrl, setSourceUrl] = useState('');
  const [auditReason, setAuditReason] = useState('');

  // UI State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNewsList = async () => {
    setLoadingList(true);
    try {
      const res = await AdminApi.getNews({ limit: '50' });
      setNewsList(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchNewsList();
  }, []);

  const handleAutoTranslate = async () => {
    if (!title.en && !content.en) {
      setFeedbackMsg({
        type: 'error',
        text: 'Please write the English title or body first before auto-translating.',
      });
      return;
    }

    setIsTranslating(true);
    setFeedbackMsg(null);
    try {
      const draft = await AdminApi.draftTranslate({
        title: title.en,
        content: content.en,
        sourceLang: 'en',
      });

      if (draft?.title) {
        setTitle((prev) => ({
          ...prev,
          te: draft.title.te || prev.te,
          hi: draft.title.hi || prev.hi,
        }));
      }

      if (draft?.content) {
        setContent((prev) => ({
          ...prev,
          te: draft.content.te || prev.te,
          hi: draft.content.hi || prev.hi,
        }));
      }

      setFeedbackMsg({
        type: 'success',
        text: 'Translations drafted successfully! Review Telugu and Hindi fields below.',
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Translation assistance error: ${err.message || 'Check network'}`,
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.en?.trim()) {
      alert('Headline in English is required.');
      return;
    }
    if (!content.en?.trim()) {
      alert('Content Body in English is required.');
      return;
    }
    if (!auditReason.trim()) {
      alert('Administrative audit reason is required for compliance logging.');
      return;
    }

    setIsPublishing(true);
    setFeedbackMsg(null);
    try {
      const payload = {
        title: {
          en: title.en.trim(),
          te: title.te?.trim() || undefined,
          hi: title.hi?.trim() || undefined,
        },
        content: {
          en: content.en.trim(),
          te: content.te?.trim() || undefined,
          hi: content.hi?.trim() || undefined,
        },
        category,
        priority,
        publish_status: publishStatus,
        pinned,
        notify,
        source_name: sourceName.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        audit_reason: auditReason.trim(),
      };

      const result = await AdminApi.createNews(payload);

      setFeedbackMsg({
        type: 'success',
        text: `News advisory "${payload.title.en}" published successfully! ${
          result.notificationSent ? '🔔 Push notification broadcasted to pilgrim devices.' : ''
        }`,
      });

      // Reset form
      setTitle({ en: '', te: '', hi: '' });
      setContent({ en: '', te: '', hi: '' });
      setCategory('general');
      setPriority('normal');
      setPublishStatus('published');
      setPinned(false);
      setNotify(false);
      setAuditReason('');

      await fetchNewsList();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to create news advisory.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteNews = async (id: string, itemTitle: string) => {
    const reason = window.prompt(`Provide audit reason for deleting "${itemTitle}":`);
    if (!reason || !reason.trim()) return;

    try {
      await AdminApi.deleteNews(id, reason.trim());
      setFeedbackMsg({
        type: 'success',
        text: `News item "${itemTitle}" deleted successfully.`,
      });
      await fetchNewsList();
    } catch (err: any) {
      alert(`Delete failed: ${err.message || 'Unknown error'}`);
    }
  };

  if (!hasPermission('news.publish') && !hasPermission('*')) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px' }}>
        <h3 style={{ color: '#DC2626' }}>Access Forbidden</h3>
        <p style={{ color: '#64748B' }}>Your role lacks <code>news.publish</code> permission required to publish advisories.</p>
      </div>
    );
  }

  const filteredList = newsList.filter((item) => {
    if (listFilter === 'published') return item.publish_status === 'published';
    if (listFilter === 'draft') return item.publish_status === 'draft';
    if (listFilter === 'urgent') return item.priority === 'urgent' || item.priority === 'high';
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
            Official News & Advisory Dispatch (Module 9)
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
            Broadcast real-time bulletins, crowd flow alerts, safety advisories, and push notifications to pilgrims.
          </p>
        </div>
        <button
          onClick={fetchNewsList}
          style={{
            padding: '8px 16px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            color: '#1E293B',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔄 Refresh Feed
        </button>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            background: feedbackMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            border: feedbackMsg.type === 'success' ? '1px solid #86EFAC' : '1px solid #FCA5A5',
            color: feedbackMsg.type === 'success' ? '#166534' : '#991B1B',
          }}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Grid: Form on left, Feed on right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1.2fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Compose Form */}
        <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Compose Official Bulletin
            </h2>
            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={isTranslating}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#F0FDF4',
                border: '1px solid #86EFAC',
                color: '#15803D',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: isTranslating ? 'not-allowed' : 'pointer',
              }}
            >
              {isTranslating ? 'Translating...' : '✨ Auto-Draft TE & HI'}
            </button>
          </div>

          <form onSubmit={handleCreateNews}>
            <TranslatableInput
              label="Advisory Headline *"
              value={title}
              onChange={setTitle}
              requiredLanguages={['en']}
            />

            <TranslatableInput
              label="Advisory Content Body *"
              value={content}
              onChange={setContent}
              multiline
              requiredLanguages={['en']}
            />

            {/* Categorization & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="general">📢 General Bulletin</option>
                  <option value="safety">🚨 Safety & Caution</option>
                  <option value="traffic">🚗 Traffic & Route</option>
                  <option value="water_level">🌊 River Water Level</option>
                  <option value="vip_movement">🏛️ VIP / Protocols</option>
                  <option value="lost_found">🔍 Lost & Found Camp</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Alert (Banner)</option>
                </select>
              </div>
            </div>

            {/* Publication & Notification Toggles */}
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>Publish Status</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={publishStatus === 'published'}
                      onChange={() => setPublishStatus('published')}
                    />
                    Published
                  </label>
                  <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="status"
                      checked={publishStatus === 'draft'}
                      onChange={() => setPublishStatus('draft')}
                    />
                    Save as Draft
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#1E293B', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                  />
                  📌 Pin to Top Banner
                </label>

                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#1E293B', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                  />
                  🔔 Broadcast FCM Push Notification
                </label>
              </div>
            </div>

            {/* Source Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Official Source Agency
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Police Dept / Collectorate"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Source Reference URL (Optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Audit Reason */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Administrative Audit Reason * (Required for audit compliance)
              </label>
              <input
                type="text"
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="e.g. Approved by Joint Collector for heavy crowd diversion."
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isPublishing}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0F52BA',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isPublishing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(15, 82, 186, 0.25)',
                }}
              >
                {isPublishing ? 'Publishing...' : 'Publish Official Advisory'}
              </button>
            </div>
          </form>
        </div>

        {/* Existing News Stream */}
        <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Live Advisories ({filteredList.length})
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'published', 'draft', 'urgent'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setListFilter(filterKey)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: listFilter === filterKey ? '1px solid #0F52BA' : '1px solid #E2E8F0',
                    background: listFilter === filterKey ? '#0F52BA' : '#F8FAFC',
                    color: listFilter === filterKey ? '#FFFFFF' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {loadingList ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              ⏳ Loading advisories...
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              No advisories found for the selected filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '720px', overflowY: 'auto' }}>
              {filteredList.map((item) => {
                const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
                const prio = PRIORITY_MAP[item.priority] || PRIORITY_MAP.normal;
                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      background: item.pinned ? '#FFFBEB' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: cat.bg,
                              color: cat.color,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {cat.icon} {cat.label}
                          </span>

                          {item.priority !== 'normal' && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: prio.bg,
                                color: prio.color,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              {prio.label}
                            </span>
                          )}

                          {item.pinned && (
                            <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              📌 Pinned
                            </span>
                          )}

                          {item.publish_status === 'draft' && (
                            <span style={{ fontSize: '0.72rem', background: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Draft
                            </span>
                          )}
                        </div>

                        <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                          {item.title.en}
                        </h3>

                        {item.title.te && (
                          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                            {item.title.te}
                          </div>
                        )}

                        <p style={{ margin: '4px 0 6px 0', fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                          {item.content.en}
                        </p>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94A3B8' }}>
                          <span>
                            🕒 {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {item.source_name && <span>🏛️ {item.source_name}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteNews(item.id, item.title.en)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '4px',
                        }}
                        title="Delete Advisory"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
