import React, { useState, useEffect } from 'react';
import { AdminApi } from '../services/adminApi';
import { Ghat, GhatFacility } from '../types';

export const FacilitiesEditorPage: React.FC = () => {
  const [ghats, setGhats] = useState<Ghat[]>([]);
  const [selectedGhatId, setSelectedGhatId] = useState<string>('');
  const [facilities, setFacilities] = useState<GhatFacility[]>([]);
  const [loadingGhats, setLoadingGhats] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  // New Facility Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState('drinking_water');
  const [newCount, setNewCount] = useState(1);
  const [newOperational, setNewOperational] = useState(true);
  const [newDetailEn, setNewDetailEn] = useState('');
  const [newDetailTe, setNewDetailTe] = useState('');
  const [newDetailHi, setNewDetailHi] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Status Toggle state
  const [actionTarget, setActionTarget] = useState<GhatFacility | null>(null);
  const [toggleReason, setToggleReason] = useState('');
  const [isToggling, setIsToggling] = useState(false);

  // Load Ghats on mount
  useEffect(() => {
    AdminApi.getGhats({ limit: '100' })
      .then((res) => {
        setGhats(res.data);
        if (res.data.length > 0) {
          setSelectedGhatId(res.data[0].id);
        }
      })
      .finally(() => setLoadingGhats(false));
  }, []);

  // Load Facilities when selected ghat changes
  useEffect(() => {
    if (!selectedGhatId) return;
    setLoadingFacilities(true);
    AdminApi.getFacilities(selectedGhatId)
      .then((data) => setFacilities(data))
      .finally(() => setLoadingFacilities(false));
  }, [selectedGhatId]);

  const refreshFacilities = () => {
    if (!selectedGhatId) return;
    setLoadingFacilities(true);
    AdminApi.getFacilities(selectedGhatId)
      .then((data) => setFacilities(data))
      .finally(() => setLoadingFacilities(false));
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) {
      alert('An audit reason is strictly required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await AdminApi.addFacility(selectedGhatId, {
        facility_type: newType,
        count: Number(newCount),
        is_operational: newOperational,
        details: {
          en: newDetailEn,
          te: newDetailTe || newDetailEn,
          hi: newDetailHi || newDetailEn,
        },
        source_url: newSourceUrl.trim() || null,
        audit_reason: newReason.trim(),
      });

      setShowAddModal(false);
      setNewDetailEn('');
      setNewDetailTe('');
      setNewDetailHi('');
      setNewReason('');
      refreshFacilities();
    } catch (err: any) {
      alert(err.message || 'Failed to add facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOperational = async () => {
    if (!actionTarget || !toggleReason.trim()) {
      alert('An audit reason is strictly required.');
      return;
    }

    setIsToggling(true);
    try {
      const nextOperational = !actionTarget.is_operational;
      await AdminApi.updateFacility(selectedGhatId, actionTarget.id!, {
        is_operational: nextOperational,
        audit_reason: toggleReason.trim(),
      });

      setActionTarget(null);
      setToggleReason('');
      refreshFacilities();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteFacility = async (fac: GhatFacility) => {
    const reason = prompt('Please enter the mandatory audit reason for deleting this facility:');
    if (!reason || !reason.trim()) return;

    try {
      await AdminApi.deleteFacility(selectedGhatId, fac.id!, reason.trim());
      refreshFacilities();
    } catch (err: any) {
      alert(err.message || 'Failed to delete facility');
    }
  };

  const currentGhat = ghats.find((g) => g.id === selectedGhatId);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
            Ghat Facilities Management
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Monitor and manage on-site infrastructure: drinking water, medical tents, sanitation, and safety posts across Godavari ghats.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={!selectedGhatId}
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
          }}
        >
          <span>➕</span> Add Facility to Ghat
        </button>
      </div>

      {/* Ghat Selector Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <label style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>
          Select Ghat:
        </label>
        {loadingGhats ? (
          <span style={{ fontSize: '13px', color: '#64748B' }}>Loading ghat directory...</span>
        ) : (
          <select
            value={selectedGhatId}
            onChange={(e) => setSelectedGhatId(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: '#F8FAFC',
              minWidth: '280px',
            }}
          >
            {ghats.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name?.en} ({g.district}, {g.state})
              </option>
            ))}
          </select>
        )}

        {currentGhat && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <span style={{
              backgroundColor: '#DEF7EC',
              color: '#03543F',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              District: {currentGhat.district}
            </span>
            <span style={{
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
            }}>
              River: {currentGhat.river}
            </span>
          </div>
        )}
      </div>

      {/* Facilities Grid */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loadingFacilities ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Loading facilities for selected ghat...
          </div>
        ) : facilities.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            No facilities registered for this ghat yet. Click &quot;Add Facility to Ghat&quot; above to add one.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Facility Type</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Operational Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Units / Count</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Details (EN / TE)</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Source / Verified</th>
                <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((fac) => (
                <tr key={fac.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', textTransform: 'capitalize' }}>
                    {fac.facility_type.replace('_', ' ')}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      backgroundColor: fac.is_operational ? '#DEF7EC' : '#FDE8E8',
                      color: fac.is_operational ? '#03543F' : '#9B1C1C',
                    }}>
                      <span>{fac.is_operational ? '●' : '✕'}</span>
                      {fac.is_operational ? 'OPERATIONAL' : 'MAINTENANCE'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1E293B' }}>
                    {fac.count || 1}
                  </td>

                  <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                    <div style={{ color: '#0F172A', fontWeight: '600' }}>{fac.details?.en}</div>
                    {fac.details?.te && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {fac.details.te}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#64748B' }}>
                    {fac.source_url ? (
                      <a href={fac.source_url} target="_blank" rel="noreferrer" style={{ color: '#0F52BA' }}>
                        Official Source ↗
                      </a>
                    ) : (
                      'Municipal field verified'
                    )}
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setActionTarget(fac);
                          setToggleReason('');
                        }}
                        style={{
                          backgroundColor: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          color: fac.is_operational ? '#B91C1C' : '#047857',
                        }}
                      >
                        {fac.is_operational ? 'Set Maintenance' : 'Set Operational'}
                      </button>

                      <button
                        onClick={() => handleDeleteFacility(fac)}
                        style={{
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          color: '#DC2626',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Facility Modal */}
      {showAddModal && (
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
            maxWidth: '550px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0F172A' }}>
              Add Facility to Ghat
            </h3>

            <form onSubmit={handleCreateFacility}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Facility Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                >
                  <option value="drinking_water">🚰 Purified Drinking Water (RO)</option>
                  <option value="medical_camp">🏥 Medical Camp &amp; Ambulance</option>
                  <option value="changing_room">🚪 Changing Rooms</option>
                  <option value="toilet">🚻 Sanitation &amp; Toilets</option>
                  <option value="police_post">👮 Police Helpdesk / Post</option>
                  <option value="parking">🅿️ Parking Area</option>
                  <option value="cloak_room">🧳 Cloak Room</option>
                  <option value="prasad_counter">🥣 Free Prasadam Counter</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    Units / Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCount}
                    onChange={(e) => setNewCount(Number(e.target.value))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    Initial Status
                  </label>
                  <select
                    value={newOperational ? 'true' : 'false'}
                    onChange={(e) => setNewOperational(e.target.value === 'true')}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="true">🟢 Fully Operational</option>
                    <option value="false">🔴 Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Description (English) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4 RO water dispensers near north steps"
                  value={newDetailEn}
                  onChange={(e) => setNewDetailEn(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Description (తెలుగు - Telugu)
                </label>
                <input
                  type="text"
                  placeholder="ఉదా: ఉత్తర మెట్ల వద్ద 4 ఆర్వో నీటి కేంద్రాలు"
                  value={newDetailTe}
                  onChange={(e) => setNewDetailTe(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Description (हिन्दी - Hindi)
                </label>
                <input
                  type="text"
                  placeholder="उदा: उत्तरी सीढ़ियों के पास 4 आरओ जल केंद्र"
                  value={newDetailHi}
                  onChange={(e) => setNewDetailHi(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                  Source / Verification URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://eastgodavari.ap.gov.in/facilities"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#991B1B', marginBottom: '4px' }}>
                  Mandatory Audit Reason <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Municipal commissioner commissioned new medical post for Pushkaralu readiness."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#0F52BA', color: '#FFFFFF', fontWeight: '700', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Saving...' : 'Add Facility & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Operational Status Modal */}
      {actionTarget && (
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
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0F172A' }}>
              Change Facility Operational Status
            </h3>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              Switching <strong>{actionTarget.facility_type.replace('_', ' ')}</strong> to{' '}
              <strong>{actionTarget.is_operational ? 'UNDER MAINTENANCE' : 'OPERATIONAL'}</strong>.
              Enter mandatory audit reason:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Pipeline maintenance underway by district municipal engineers."
              value={toggleReason}
              onChange={(e) => setToggleReason(e.target.value)}
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
                onClick={() => setActionTarget(null)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#F1F5F9', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleToggleOperational}
                disabled={isToggling || !toggleReason.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0F52BA',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {isToggling ? 'Updating...' : 'Confirm Audit & Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

