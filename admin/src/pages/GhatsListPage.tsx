import React, { useState, useEffect } from 'react';
import { Ghat } from '../types';
import { AdminApi } from '../services/adminApi';
import { TrustStatusBadge } from '../components/TrustStatusBadge';
import { CrowdOverrideModal } from '../components/CrowdOverrideModal';
import { NoticeModal } from '../components/NoticeModal';

interface Props {
  onEditGhat: (ghat: Ghat) => void;
  onCreateGhat: () => void;
  onViewAuditLogs: (ghatId?: string) => void;
}

export const GhatsListPage: React.FC<Props> = ({
  onEditGhat,
  onCreateGhat,
  onViewAuditLogs,
}) => {
  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  // Modal states
  const [crowdModalGhat, setCrowdModalGhat] = useState<Ghat | null>(null);
  const [noticeModalGhat, setNoticeModalGhat] = useState<Ghat | null>(null);

  const fetchGhats = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDistrict !== 'all') params.district = selectedDistrict;
      if (search.trim()) params.search = search.trim();

      const res = await AdminApi.getGhats(params);
      setGhats(res.data);
    } catch (err: any) {
      alert(`Error loading ghats: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGhats();
  }, [selectedDistrict]);

  const handleTogglePublish = async (ghat: Ghat) => {
    const nextStatus = ghat.publish_status === 'published' ? 'hidden' : 'published';
    const reason = window.prompt(
      `Mandatory Audit Reason: Why are you changing ${ghat.name.en} status to '${nextStatus}'?`
    );

    if (!reason || reason.trim().length < 5) {
      alert('Audit reason of at least 5 characters is strictly required.');
      return;
    }

    try {
      await AdminApi.setPublishStatus(ghat.id, nextStatus, reason.trim());
      await fetchGhats();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Top Controls Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>
            Godavari Pushkaralu Ghat Directory
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
            Manage official listings, verify government source URLs, toggle publication, and override crowd flows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onViewAuditLogs()}
            style={{
              padding: '10px 16px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            📜 Global Audit Logs
          </button>

          <button
            onClick={onCreateGhat}
            style={{
              padding: '10px 18px',
              backgroundColor: '#0F52BA',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>+</span> Add New Ghat
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '14px 18px',
        border: '1px solid #E2E8F0',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search ghat, town, district in English, Telugu, or Hindi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchGhats()}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="all">All Districts (AP & Telangana)</option>
            <option value="East Godavari">East Godavari (AP)</option>
            <option value="West Godavari">West Godavari (AP)</option>
            <option value="Dr. B.R. Ambedkar Konaseema">Konaseema (AP)</option>
            <option value="Bhadradri Kothagudem">Bhadradri Kothagudem (TS)</option>
            <option value="Jagtial">Jagtial (TS)</option>
            <option value="Nirmal">Nirmal (TS)</option>
            <option value="Jayashankar Bhupalpally">Jayashankar Bhupalpally (TS)</option>
          </select>
        </div>

        <button
          onClick={fetchGhats}
          style={{
            padding: '9px 16px',
            backgroundColor: '#0F52BA',
            color: '#FFFFFF',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Filter
        </button>
      </div>

      {/* Ghats Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading Ghats Directory...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '12px 16px' }}>Ghat Name (EN / TE)</th>
                <th style={{ padding: '12px 14px' }}>District & State</th>
                <th style={{ padding: '12px 14px' }}>Trust Status</th>
                <th style={{ padding: '12px 14px' }}>Bathing</th>
                <th style={{ padding: '12px 14px' }}>Crowd Level</th>
                <th style={{ padding: '12px 14px' }}>Publish</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ghats.map((g) => {
                const isPublished = g.publish_status === 'published';
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>
                        {g.name.en}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {g.name.te || '—'} {g.name.hi ? `• ${g.name.hi}` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '14px 14px', color: '#334155' }}>
                      <strong>{g.district}</strong>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{g.state}</div>
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <TrustStatusBadge
                        recordStatus={g.record_status}
                        officialSourceUrl={g.official_source_url}
                      />
                      {g.official_source_url && (
                        <div style={{ marginTop: '4px' }}>
                          <a
                            href={g.official_source_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '11px', color: '#0F52BA', textDecoration: 'underline' }}
                          >
                            Gov Portal ↗
                          </a>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: g.bathing_status === 'allowed' ? '#ECFDF5' : g.bathing_status === 'closed' ? '#FEF2F2' : '#FFFBEB',
                        color: g.bathing_status === 'allowed' ? '#065F46' : g.bathing_status === 'closed' ? '#991B1B' : '#B45309',
                      }}>
                        {g.bathing_status.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: g.crowd_level === 'low' ? '#F0FDF4' : g.crowd_level === 'very_high' ? '#FEF2F2' : '#FEFCE8',
                        color: g.crowd_level === 'low' ? '#15803D' : g.crowd_level === 'very_high' ? '#DC2626' : '#A16207',
                      }}>
                        {g.crowd_level.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '14px 14px' }}>
                      <button
                        onClick={() => handleTogglePublish(g)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: isPublished ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                          backgroundColor: isPublished ? '#DCFCE7' : '#F1F5F9',
                          color: isPublished ? '#166534' : '#64748B',
                          cursor: 'pointer',
                        }}
                      >
                        {isPublished ? '● Published' : '○ Hidden'}
                      </button>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setCrowdModalGhat(g)}
                          title="Override Crowd Level"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '6px',
                            color: '#1D4ED8',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          👥 Crowd
                        </button>

                        <button
                          onClick={() => setNoticeModalGhat(g)}
                          title="Publish Safety Notice"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#FFFBEB',
                            border: '1px solid #FDE68A',
                            borderRadius: '6px',
                            color: '#B45309',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          📢 Notice
                        </button>

                        <button
                          onClick={() => onEditGhat(g)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Edit
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

      {/* Modals */}
      {crowdModalGhat && (
        <CrowdOverrideModal
          ghatId={crowdModalGhat.id}
          ghatName={crowdModalGhat.name.en}
          currentLevel={crowdModalGhat.crowd_level}
          isOpen={true}
          onClose={() => setCrowdModalGhat(null)}
          onSuccess={fetchGhats}
        />
      )}

      {noticeModalGhat && (
        <NoticeModal
          ghatId={noticeModalGhat.id}
          ghatName={noticeModalGhat.name.en}
          isOpen={true}
          onClose={() => setNoticeModalGhat(null)}
          onSuccess={fetchGhats}
        />
      )}
    </div>
  );
};

