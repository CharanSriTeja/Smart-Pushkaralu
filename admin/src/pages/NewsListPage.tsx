import React, { useState, useEffect } from 'react';
import { AdminApi } from '../services/adminApi';
import { NewsPost } from '../types';

interface Props {
  onCreateNews: () => void;
  onEditNews: (news: NewsPost) => void;
}

export const NewsListPage: React.FC<Props> = ({ onCreateNews, onEditNews }) => {
  const [newsList, setNewsList] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminApi.getNews();
      setNewsList(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDeleteSubmit = async () => {
    if (!deletingId || !deleteReason.trim()) {
      alert('An audit reason is strictly required for deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await AdminApi.deleteNews(deletingId, deleteReason.trim());
      setDeletingId(null);
      setDeleteReason('');
      fetchNews();
    } catch (err: any) {
      alert(err.message || 'Failed to delete news item');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNews = newsList.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const enTitle = (item.title?.en || '').toLowerCase();
      const teTitle = (item.title?.te || '').toLowerCase();
      const hiTitle = (item.title?.hi || '').toLowerCase();
      return enTitle.includes(q) || teTitle.includes(q) || hiTitle.includes(q);
    }
    return true;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Title Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            Official Bulletins & Advisories
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Broadcast real-time push advisories, emergency alerts, and traffic updates across Godavari Pushkaralu.
          </p>
        </div>

        <button
          onClick={onCreateNews}
          style={{
            backgroundColor: '#0F52BA',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(15,82,186,0.2)',
          }}
        >
          <span>➕</span> Create New Bulletin
        </button>
      </div>

      {/* Filters Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        marginBottom: '20px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search bulletins by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              flex: 1,
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="all">All Categories</option>
            <option value="urgent">🚨 Urgent</option>
            <option value="advisory">📢 Advisory</option>
            <option value="facility">🚻 Facilities</option>
            <option value="traffic">🚗 Traffic</option>
            <option value="weather">🌧️ Weather</option>
            <option value="general">ℹ️ General</option>
          </select>
        </div>

        <button
          onClick={fetchNews}
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#334155',
          }}
        >
          🔄 Refresh Feed
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* News Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading bulletins...
          </div>
        ) : filteredNews.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            No bulletins found matching your criteria.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status / Flags</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Title (EN / TE / HI)</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Priority</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Official Source</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Published / Expiry</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.map((item) => {
                const isExpired = item.expires_at ? new Date(item.expires_at) <= new Date() : false;

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: item.is_pinned ? '#F0F9FF' : '#FFFFFF',
                    }}
                  >
                    {/* Status & Flags */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor:
                            item.publish_status === 'published' ? '#DEF7EC' :
                            item.publish_status === 'draft' ? '#FEF3C7' : '#F1F5F9',
                          color:
                            item.publish_status === 'published' ? '#03543F' :
                            item.publish_status === 'draft' ? '#92400E' : '#475569',
                        }}>
                          {item.publish_status.toUpperCase()}
                        </span>

                        {item.is_pinned && (
                          <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '700' }}>
                            📌 Pinned
                          </span>
                        )}

                        {item.notify_sent && (
                          <span style={{ fontSize: '11px', color: '#047857' }}>
                            🔔 Push Sent
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title */}
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '2px' }}>
                        {item.title?.en}
                      </div>
                      {item.title?.te && (
                        <div style={{ fontSize: '12px', color: '#475569' }}>{item.title.te}</div>
                      )}
                      {item.title?.hi && (
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{item.title.hi}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor:
                          item.category === 'urgent' ? '#FEE2E2' :
                          item.category === 'advisory' ? '#FEF3C7' :
                          item.category === 'traffic' ? '#F3E8FF' :
                          item.category === 'weather' ? '#E0E7FF' : '#F1F5F9',
                        color:
                          item.category === 'urgent' ? '#991B1B' :
                          item.category === 'advisory' ? '#92400E' :
                          item.category === 'traffic' ? '#6B21A8' :
                          item.category === 'weather' ? '#3730A3' : '#334155',
                      }}>
                        {item.category.toUpperCase()}
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '11px',
                        color:
                          item.priority === 'urgent' ? '#DC2626' :
                          item.priority === 'high' ? '#D97706' : '#475569',
                      }}>
                        {item.priority.toUpperCase()}
                      </span>
                    </td>

                    {/* Official Source */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.is_official ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803D' }}>
                          <span>🏛️</span>
                          <span style={{ fontWeight: '700', fontSize: '11px' }}>Official Portal</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '11px' }}>Standard</span>
                      )}
                    </td>

                    {/* Published / Expiry */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Unpublished'}
                      </div>
                      {item.expires_at && (
                        <div style={{
                          fontSize: '11px',
                          color: isExpired ? '#DC2626' : '#64748B',
                          fontWeight: isExpired ? '700' : 'normal',
                        }}>
                          {isExpired ? '⚠️ Expired: ' : 'Expires: '}
                          {new Date(item.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onEditNews(item)}
                          style={{
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#0F52BA',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(item.id);
                            setDeleteReason('');
                          }}
                          style={{
                            backgroundColor: '#FEF2F2',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: '#DC2626',
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#991B1B' }}>
              Confirm Bulletin Deletion
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              Every administrative deletion is recorded in the permanent audit logs. Please enter the reason for deleting this bulletin:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Obsolete road repair notice superseded by police advisory."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F1F5F9',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isDeleting || !deleteReason.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Audit & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
