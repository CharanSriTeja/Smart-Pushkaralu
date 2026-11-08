import React, { useState, useEffect } from 'react';
import { AdminApi } from '../services/adminApi';
import {
  AdminTransportHub,
  AdminBusRoute,
  AdminBusSpecialService,
  AdminRailStation,
  AdminShuttleRoute,
  AdminExternalLink,
} from '../types';

export const TransportAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hubs' | 'routes' | 'specials' | 'rail' | 'shuttles' | 'links'>('hubs');

  // Data states
  const [hubs, setHubs] = useState<AdminTransportHub[]>([]);
  const [routes, setRoutes] = useState<AdminBusRoute[]>([]);
  const [specials, setSpecials] = useState<AdminBusSpecialService[]>([]);
  const [stations, setStations] = useState<AdminRailStation[]>([]);
  const [shuttles, setShuttles] = useState<AdminShuttleRoute[]>([]);
  const [links, setLinks] = useState<AdminExternalLink[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'hub' | 'route' | 'special' | 'rail' | 'shuttle'>('hub');
  const [formData, setFormData] = useState<any>({});

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hubsRes, routesRes, specialsRes, stationsRes, shuttlesRes, linksRes] = await Promise.all([
        AdminApi.getTransportHubs(),
        AdminApi.getBusRoutes(),
        AdminApi.getSpecialServices(),
        AdminApi.getRailStations(),
        AdminApi.getShuttleRoutes(),
        AdminApi.getExternalLinks(),
      ]);
      setHubs(hubsRes);
      setRoutes(routesRes);
      setSpecials(specialsRes);
      setStations(stationsRes);
      setShuttles(shuttlesRes);
      setLinks(linksRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load transport data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAddModal = (type: 'hub' | 'route' | 'special' | 'rail' | 'shuttle') => {
    setModalType(type);
    if (type === 'hub') {
      setFormData({
        name_en: '',
        name_te: '',
        name_hi: '',
        hub_type: 'bus_stand',
        operator: 'APSRTC',
        code: '',
        phone: '',
        lat: '17.0095',
        lng: '81.7892',
        reason: 'Added new transit hub for Pushkaralu 2027',
      });
    } else if (type === 'route') {
      setFormData({
        route_number: '',
        operator: 'APSRTC',
        origin_en: '',
        origin_te: '',
        destination_en: '',
        destination_te: '',
        frequency_minutes: 10,
        bus_type: 'ordinary',
        reason: 'Added regular bus route',
      });
    } else if (type === 'special') {
      setFormData({
        service_code: `PUSH-SPL-${Date.now().toString().slice(-4)}`,
        service_title_en: '',
        service_title_te: '',
        operator: 'APSRTC',
        origin_city_en: 'Hyderabad (MGBS)',
        destination_town_en: 'Rajahmundry',
        start_date: '2027-07-14',
        end_date: '2027-07-25',
        booking_url: 'https://www.apsrtconline.in',
        reason: 'Published Pushkaralu special express bus fleet',
      });
    } else if (type === 'rail') {
      setFormData({
        station_code: '',
        station_name_en: '',
        station_name_te: '',
        division: 'Vijayawada (BZA)',
        zone: 'SCR',
        total_platforms: 2,
        helpdesk_phone: '139',
        lat: '17.0000',
        lng: '81.7700',
        reason: 'Added railway station info with Pushkaralu halts',
      });
    } else if (type === 'shuttle') {
      setFormData({
        route_code: `SHTL-${Date.now().toString().slice(-3)}`,
        route_name_en: '',
        route_name_te: '',
        origin_name_en: 'Satellite Parking',
        destination_name_en: 'Pushkar Ghat Gate',
        frequency_minutes: 8,
        color_code: '#2E7D32',
        accessible_for_elderly_disabled: true,
        reason: 'Configured free green corridor shuttle route',
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (modalType === 'hub') {
        await AdminApi.createTransportHub({
          name: { en: formData.name_en, te: formData.name_te || formData.name_en, hi: formData.name_hi || formData.name_en },
          hub_type: formData.hub_type,
          operator: formData.operator,
          code: formData.code,
          phone: formData.phone,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          reason: formData.reason,
        });
      } else if (modalType === 'route') {
        await AdminApi.createBusRoute({
          route_number: formData.route_number,
          operator: formData.operator,
          origin: { en: formData.origin_en, te: formData.origin_te || formData.origin_en },
          destination: { en: formData.destination_en, te: formData.destination_te || formData.destination_en },
          frequency_minutes: parseInt(formData.frequency_minutes, 10),
          bus_type: formData.bus_type,
          reason: formData.reason,
        });
      } else if (modalType === 'special') {
        await AdminApi.createSpecialService({
          service_code: formData.service_code,
          service_title: { en: formData.service_title_en, te: formData.service_title_te || formData.service_title_en },
          operator: formData.operator,
          origin_city: { en: formData.origin_city_en },
          destination_town: { en: formData.destination_town_en },
          operating_dates: { start_date: formData.start_date, end_date: formData.end_date },
          booking_url: formData.booking_url,
          reason: formData.reason,
        });
      } else if (modalType === 'rail') {
        await AdminApi.createRailStation({
          station_code: formData.station_code.toUpperCase(),
          station_name: { en: formData.station_name_en, te: formData.station_name_te || formData.station_name_en },
          division: formData.division,
          zone: formData.zone,
          total_platforms: parseInt(formData.total_platforms, 10),
          helpdesk_phone: formData.helpdesk_phone,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          reason: formData.reason,
        });
      } else if (modalType === 'shuttle') {
        await AdminApi.createShuttleRoute({
          route_code: formData.route_code,
          route_name: { en: formData.route_name_en, te: formData.route_name_te || formData.route_name_en },
          origin_name: { en: formData.origin_name_en },
          destination_name: { en: formData.destination_name_en },
          frequency_minutes: parseInt(formData.frequency_minutes, 10),
          color_code: formData.color_code,
          accessible_for_elderly_disabled: Boolean(formData.accessible_for_elderly_disabled),
          reason: formData.reason,
        });
      }

      setIsModalOpen(false);
      setSuccessMsg('Record saved and audit log created successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error creating record');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleHubActive = async (hub: AdminTransportHub) => {
    const reason = prompt(`Enter reason for ${hub.is_active ? 'deactivating' : 'activating'} hub "${hub.name.en}":`, 'Operational schedule update');
    if (reason === null) return;
    try {
      await AdminApi.updateTransportHub(hub.id, { is_active: !hub.is_active, reason });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
            🚌 Transport &amp; Shuttles Command Portal
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            APSRTC, TGSRTC bus routes, Pushkaralu special fleets, South Central Railway halts, and free pilgrim green corridor shuttles.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => openAddModal(
              activeTab === 'hubs' ? 'hub' : activeTab === 'routes' ? 'route' : activeTab === 'specials' ? 'special' : activeTab === 'rail' ? 'rail' : 'shuttle'
            )}
            style={{
              backgroundColor: '#0F52BA',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>➕</span> Add {activeTab === 'hubs' ? 'Hub' : activeTab === 'routes' ? 'Bus Route' : activeTab === 'specials' ? 'Special Bus' : activeTab === 'rail' ? 'Station' : activeTab === 'shuttles' ? 'Shuttle' : 'Item'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: '20px', gap: '8px' }}>
        {[
          { key: 'hubs', label: '🚌 Transit Hubs', count: hubs.length },
          { key: 'routes', label: '🚏 Bus Routes', count: routes.length },
          { key: 'specials', label: '🌟 Pushkaralu Specials', count: specials.length },
          { key: 'rail', label: '🚆 Rail Stations', count: stations.length },
          { key: 'shuttles', label: '🚐 Free Shuttles', count: shuttles.length },
          { key: 'links', label: '🔗 Official Portals', count: links.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 16px',
              fontWeight: activeTab === tab.key ? '700' : '500',
              color: activeTab === tab.key ? '#0F52BA' : '#64748B',
              borderBottom: activeTab === tab.key ? '3px solid #0F52BA' : '3px solid transparent',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '11px', background: activeTab === tab.key ? '#DBEAFE' : '#F1F5F9', color: activeTab === tab.key ? '#1E40AF' : '#475569', padding: '2px 6px', borderRadius: '10px' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading transit data...</div>
      ) : (
        <>
          {/* TAB 1: HUBS */}
          {activeTab === 'hubs' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {hubs.map((h) => (
                <div key={h.id} style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: h.hub_type === 'bus_stand' ? '#DBEAFE' : '#FEF3C7', color: h.hub_type === 'bus_stand' ? '#1E40AF' : '#92400E' }}>
                        {h.hub_type.replace('_', ' ')}
                      </span>
                      <h3 style={{ margin: '6px 0 2px 0', fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                        {h.name.en}
                      </h3>
                      {h.name.te && <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{h.name.te}</p>}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: h.is_active ? '#15803D' : '#94A3B8' }}>
                      {h.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569', margin: '8px 0' }}>
                    <div><strong>Operator:</strong> {h.operator || 'State Transport'}</div>
                    {h.code && <div><strong>Code:</strong> {h.code}</div>}
                    {h.phone && <div><strong>Phone:</strong> {h.phone}</div>}
                    <div><strong>Coordinates:</strong> {h.lat}, {h.lng}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => handleToggleHubActive(h)}
                      style={{ fontSize: '12px', padding: '4px 10px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#F8FAFC', cursor: 'pointer' }}
                    >
                      {h.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: BUS ROUTES */}
          {activeTab === 'routes' && (
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Route Number</th>
                    <th style={{ padding: '12px 16px' }}>Operator</th>
                    <th style={{ padding: '12px 16px' }}>Origin → Destination</th>
                    <th style={{ padding: '12px 16px' }}>Frequency</th>
                    <th style={{ padding: '12px 16px' }}>Bus Type</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>{r.route_number}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          {r.operator}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div><strong>{r.origin.en}</strong> → <strong>{r.destination.en}</strong></div>
                        {r.origin.te && <div style={{ fontSize: '11px', color: '#64748B' }}>{r.origin.te} → {r.destination.te}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>Every {r.frequency_minutes || 15} mins</td>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{r.bus_type}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: r.is_active ? '#15803D' : '#94A3B8', fontWeight: '600' }}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PUSHKARALU SPECIALS */}
          {activeTab === 'specials' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {specials.map((s) => (
                <div key={s.id} style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', borderTop: '4px solid #F59E0B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                      {s.service_code}
                    </span>
                    <span style={{ fontSize: '11px', background: '#E0F2FE', color: '#0369A1', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      {s.operator}
                    </span>
                  </div>

                  <h3 style={{ margin: '8px 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                    {s.service_title.en}
                  </h3>
                  {s.service_title.te && <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748B' }}>{s.service_title.te}</p>}

                  <div style={{ fontSize: '12px', color: '#475569', margin: '8px 0', background: '#F8FAFC', padding: '8px', borderRadius: '4px' }}>
                    <div><strong>From:</strong> {s.origin_city.en}</div>
                    <div><strong>To:</strong> {s.destination_town.en}</div>
                    <div><strong>Pushkaralu Dates:</strong> {s.operating_dates.start_date} to {s.operating_dates.end_date}</div>
                    {s.emergency_helpline && <div><strong>Helpline:</strong> {s.emergency_helpline}</div>}
                  </div>

                  {s.booking_url && (
                    <a
                      href={s.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#0F52BA', textDecoration: 'none', fontWeight: '600', display: 'inline-block', marginTop: '6px' }}
                    >
                      🔗 Official Booking Portal &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: RAIL STATIONS */}
          {activeTab === 'rail' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {stations.map((stn) => (
                <div key={stn.id} style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', borderTop: '4px solid #0F52BA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F52BA' }}>
                      {stn.station_code}
                    </span>
                    <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                      {stn.zone} / {stn.division}
                    </span>
                  </div>

                  <h3 style={{ margin: '8px 0 2px 0', fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                    {stn.station_name.en}
                  </h3>
                  {stn.station_name.te && <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748B' }}>{stn.station_name.te}</p>}

                  <div style={{ fontSize: '12px', color: '#475569', margin: '8px 0' }}>
                    <div><strong>Platforms:</strong> {stn.total_platforms}</div>
                    <div><strong>Special Pushkaralu Halts:</strong> {stn.has_pushkaralu_special_trains ? '✅ Configured' : 'No'}</div>
                    <div><strong>Railway Enquiry / Helpdesk:</strong> {stn.helpdesk_phone || '139'}</div>
                    <div><strong>Coordinates:</strong> {stn.lat}, {stn.lng}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: SHUTTLES */}
          {activeTab === 'shuttles' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {shuttles.map((sh) => (
                <div key={sh.id} style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', borderLeft: `6px solid ${sh.color_code || '#2E7D32'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: sh.color_code || '#2E7D32' }}>
                      {sh.route_code}
                    </span>
                    <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      {sh.fare === 0 ? 'FREE SHUTTLE' : `₹${sh.fare}`}
                    </span>
                  </div>

                  <h3 style={{ margin: '8px 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                    {sh.route_name.en}
                  </h3>
                  {sh.route_name.te && <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748B' }}>{sh.route_name.te}</p>}

                  <div style={{ fontSize: '12px', color: '#475569', margin: '8px 0' }}>
                    <div><strong>From:</strong> {sh.origin_name.en}</div>
                    <div><strong>To:</strong> {sh.destination_name.en}</div>
                    <div><strong>Frequency:</strong> Every {sh.frequency_minutes} mins</div>
                    <div><strong>Accessibility:</strong> {sh.accessible_for_elderly_disabled ? '♿ Elderly & Disabled Friendly' : 'Standard'}</div>
                  </div>

                  {sh.stops && sh.stops.length > 0 && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                      <strong style={{ fontSize: '11px', color: '#334155' }}>Stops ({sh.stops.length}):</strong>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        {sh.stops.map((st, idx) => (
                          <div key={idx}>• {st.stop_name.en}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: OFFICIAL EXTERNAL LINKS */}
          {activeTab === 'links' && (
            <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '13px', color: '#475569' }}>
                🛡️ <strong>Verified Portals Only</strong>: Unofficial scrapers and unauthorized proxy APIs are disabled.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Link Title</th>
                    <th style={{ padding: '12px 16px' }}>Authority</th>
                    <th style={{ padding: '12px 16px' }}>Target URL</th>
                    <th style={{ padding: '12px 16px' }}>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', color: '#0F52BA' }}>
                        {l.category}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        <div>{l.title.en}</div>
                        {l.title.te && <div style={{ fontSize: '11px', color: '#64748B' }}>{l.title.te}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{l.official_authority}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0F52BA', textDecoration: 'none', wordBreak: 'break-all' }}>
                          {l.url}
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: '#15803D', fontWeight: '700' }}>✅ Official</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', width: '540px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>
              Add New {modalType === 'hub' ? 'Transport Hub' : modalType === 'route' ? 'Bus Route' : modalType === 'special' ? 'Pushkaralu Special Bus' : modalType === 'rail' ? 'Railway Station' : 'Shuttle Route'}
            </h2>

            <form onSubmit={handleFormSubmit}>
              {modalType === 'hub' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Name (Telugu)</label>
                    <input
                      type="text"
                      value={formData.name_te}
                      onChange={(e) => setFormData({ ...formData, name_te: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Hub Type</label>
                      <select
                        value={formData.hub_type}
                        onChange={(e) => setFormData({ ...formData, hub_type: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      >
                        <option value="bus_stand">Bus Stand</option>
                        <option value="railway_station">Railway Station</option>
                        <option value="parking">Satellite Parking</option>
                        <option value="auto_stand">Auto Stand</option>
                        <option value="boat_point">Boat Point</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Operator</label>
                      <input
                        type="text"
                        value={formData.operator}
                        onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Latitude *</label>
                      <input
                        type="text"
                        required
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Longitude *</label>
                      <input
                        type="text"
                        required
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'route' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Route Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Route 101"
                      value={formData.route_number}
                      onChange={(e) => setFormData({ ...formData, route_number: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Origin (English) *</label>
                      <input
                        type="text"
                        required
                        value={formData.origin_en}
                        onChange={(e) => setFormData({ ...formData, origin_en: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Destination (English) *</label>
                      <input
                        type="text"
                        required
                        value={formData.destination_en}
                        onChange={(e) => setFormData({ ...formData, destination_en: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Operator</label>
                      <select
                        value={formData.operator}
                        onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      >
                        <option value="APSRTC">APSRTC</option>
                        <option value="TGSRTC">TGSRTC</option>
                        <option value="SPECIAL_RTC">Special RTC Fleet</option>
                        <option value="CITY_BUS">City Bus</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Frequency (Minutes)</label>
                      <input
                        type="number"
                        value={formData.frequency_minutes}
                        onChange={(e) => setFormData({ ...formData, frequency_minutes: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'rail' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Station Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. RJY"
                        value={formData.station_code}
                        onChange={(e) => setFormData({ ...formData, station_code: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Station Name (English) *</label>
                      <input
                        type="text"
                        required
                        value={formData.station_name_en}
                        onChange={(e) => setFormData({ ...formData, station_name_en: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'shuttle' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Route Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SHTL-GREEN-01"
                      value={formData.route_code}
                      onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Shuttle Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={formData.route_name_en}
                      onChange={(e) => setFormData({ ...formData, route_name_en: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                    />
                  </div>
                </>
              )}

              {/* Audit Reason Field (Required by System Rules) */}
              <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '10px', borderRadius: '4px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Audit Reason (Mandatory) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Official reason for modifying transport registry"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', backgroundColor: '#0F52BA', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Saving...' : 'Save & Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

