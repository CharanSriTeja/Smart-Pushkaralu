import React, { useState, useEffect } from 'react';
import { AdminApi } from '../services/adminApi';

interface LocalizedText {
  en: string;
  te?: string;
  hi?: string;
}

export const NearbyPlacesAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'curated' | 'overrides' | 'cache'>('curated');
  const [curatedFilter, setCuratedFilter] = useState<'all' | 'hotel' | 'temple' | 'transport_hub'>('all');
  
  // Data state
  const [curatedData, setCuratedData] = useState<{ hotels: any[]; temples: any[]; transport_hubs: any[] }>({
    hotels: [],
    temples: [],
    transport_hubs: [],
  });
  const [overrides, setOverrides] = useState<any[]>([]);
  const [cacheStatus, setCacheStatus] = useState<{ cache_entries: any[]; usage_stats: any }>({
    cache_entries: [],
    usage_stats: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Add / Edit Curated Place
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<'hotel' | 'temple' | 'transport_hub'>('temple');
  const [formData, setFormData] = useState<any>({
    name_en: '',
    name_te: '',
    name_hi: '',
    address_en: '',
    phone: '',
    lat: '16.9922',
    lng: '81.7656',
    price_range: 'mid_range',
    deity_en: '',
    darshan_en: '',
    hub_type: 'bus_stand',
    reason: '',
  });

  // Modal for Override
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideData, setOverrideData] = useState({
    place_id: '',
    name_override_en: '',
    phone_override: '',
    custom_notes_en: '',
    is_hidden: false,
    reason: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [curated, ovs, cache] = await Promise.all([
        AdminApi.getCuratedPlaces(),
        AdminApi.getOverrides(),
        AdminApi.getCacheStatus(),
      ]);
      setCuratedData(curated);
      setOverrides(ovs);
      setCacheStatus(cache);
    } catch (err: any) {
      setError(err.message || 'Failed to load places data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCuratedPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || formData.reason.trim().length < 3) {
      alert('Audit reason is required for administrative modifications');
      return;
    }

    setActionLoading(true);
    try {
      const name: LocalizedText = {
        en: formData.name_en,
        te: formData.name_te || undefined,
        hi: formData.name_hi || undefined,
      };
      const address = formData.address_en ? { en: formData.address_en } : undefined;

      if (modalCategory === 'hotel') {
        await AdminApi.createHotel({
          name,
          address,
          phone: formData.phone || undefined,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          price_range: formData.price_range,
          reason: formData.reason,
        });
      } else if (modalCategory === 'temple') {
        await AdminApi.createTemple({
          name,
          address,
          phone: formData.phone || undefined,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          deity: formData.deity_en ? { en: formData.deity_en } : undefined,
          darshan_timings: formData.darshan_en ? { en: formData.darshan_en } : undefined,
          reason: formData.reason,
        });
      } else {
        await AdminApi.createPlaceTransportHub({
          name,
          address,
          phone: formData.phone || undefined,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          hub_type: formData.hub_type,
          reason: formData.reason,
        });
      }

      setSuccessMsg('Place created and audit logged successfully');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create place');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleHide = async (type: 'hotel' | 'temple' | 'transport_hub', place: any) => {
    const reason = prompt(`Enter audit reason to ${place.is_hidden ? 'unhide' : 'hide'} this record:`);
    if (!reason || reason.trim().length < 3) return;

    try {
      if (type === 'hotel') {
        await AdminApi.updateHotel(place.id, { is_hidden: !place.is_hidden, reason });
      } else if (type === 'temple') {
        await AdminApi.updateTemple(place.id, { is_hidden: !place.is_hidden, reason });
      } else {
        await AdminApi.updatePlaceTransportHub(place.id, { is_hidden: !place.is_hidden, reason });
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleDeleteCurated = async (type: 'hotel' | 'temple' | 'transport_hub', id: string) => {
    const reason = prompt('Enter mandatory audit reason for deleting this record:');
    if (!reason || reason.trim().length < 3) return;

    try {
      if (type === 'hotel') await AdminApi.deleteHotel(id, reason);
      else if (type === 'temple') await AdminApi.deleteTemple(id, reason);
      else await AdminApi.deletePlaceTransportHub(id, reason);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideData.reason || overrideData.reason.trim().length < 3) {
      alert('Audit reason is required');
      return;
    }

    setActionLoading(true);
    try {
      await AdminApi.upsertOverride({
        place_id: overrideData.place_id,
        name_override: overrideData.name_override_en ? { en: overrideData.name_override_en } : undefined,
        phone_override: overrideData.phone_override || undefined,
        custom_notes: overrideData.custom_notes_en ? { en: overrideData.custom_notes_en } : undefined,
        is_hidden: overrideData.is_hidden,
        reason: overrideData.reason,
      });

      setSuccessMsg('Override saved and audit logged successfully');
      setIsOverrideModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save override');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrewarmCache = async () => {
    const reason = prompt('Enter audit reason for manual cache pre-warm pass:', 'Scheduled festival readiness pre-warm');
    if (!reason || reason.trim().length < 3) return;

    setActionLoading(true);
    try {
      const res = await AdminApi.prewarmCache(reason);
      alert(`Pre-warm completed: ${res.data?.warmedEntries} sectors refreshed, ${res.data?.skippedFresh} skipped fresh.`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Pre-warm failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvalidateCache = async () => {
    const confirmClear = confirm('Are you sure you want to flush all cached spatial places across all ghats?');
    if (!confirmClear) return;

    const reason = prompt('Enter mandatory audit reason for cache invalidation:', 'Manual purge for fresh spatial data');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await AdminApi.invalidateCache({ reason });
      alert(res.message || 'Cache invalidated successfully');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Invalidation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const allCuratedList = [
    ...curatedData.hotels.map((h) => ({ ...h, categoryType: 'hotel' })),
    ...curatedData.temples.map((t) => ({ ...t, categoryType: 'temple' })),
    ...curatedData.transport_hubs.map((th) => ({ ...th, categoryType: 'transport_hub' })),
  ];

  const filteredCurated = allCuratedList.filter((item) => {
    if (curatedFilter === 'all') return true;
    return item.categoryType === curatedFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📍</span> Nearby Hotels, Temples & Spatial Cache (Module 5)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage official Godavari Pushkaralu places, third-party directory overrides, and the spatial cache engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Add Curated Place
          </button>
          <button
            onClick={() => setIsOverrideModalOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 shadow-sm flex items-center gap-1.5"
          >
            <span>✏️</span> Add Directory Override
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-green-600 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button
          onClick={() => setActiveTab('curated')}
          className={`py-3 px-1 font-medium text-sm border-b-2 flex items-center gap-2 ${
            activeTab === 'curated'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>🏛️</span> Curated Places ({allCuratedList.length})
        </button>

        <button
          onClick={() => setActiveTab('overrides')}
          className={`py-3 px-1 font-medium text-sm border-b-2 flex items-center gap-2 ${
            activeTab === 'overrides'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>🛡️</span> Directory Overrides ({overrides.length})
        </button>

        <button
          onClick={() => setActiveTab('cache')}
          className={`py-3 px-1 font-medium text-sm border-b-2 flex items-center gap-2 ${
            activeTab === 'cache'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>⚡</span> Spatial Cache & API Budget Guard ({cacheStatus.cache_entries?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl p-12 text-center text-gray-500 shadow-sm">
          <div className="text-3xl mb-3">🔄</div>
          <div className="text-sm font-semibold">Loading places data and cache metrics...</div>
        </div>
      ) : (
        <>
      {/* ================= TAB 1: CURATED PLACES ================= */}
      {activeTab === 'curated' && (
        <div className="space-y-4">
          {/* Subfilter */}
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
            <span className="text-xs font-semibold text-gray-500 uppercase px-2">Filter Type:</span>
            {(['all', 'temple', 'hotel', 'transport_hub'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setCuratedFilter(t)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize ${
                  curatedFilter === t
                    ? 'bg-white shadow text-blue-700 font-bold border'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'transport_hub' ? 'Transport Hubs' : `${t}s`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Name & Address</th>
                    <th className="py-3 px-4">Coordinates</th>
                    <th className="py-3 px-4">Category Specifics</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCurated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No curated places found under this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCurated.map((place) => {
                      const name = place.name?.en || 'Untitled';
                      const addr = place.address?.en || 'No address specified';
                      return (
                        <tr key={place.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold capitalize">
                            {place.categoryType === 'hotel' && '🏨 Hotel'}
                            {place.categoryType === 'temple' && '🛕 Temple'}
                            {place.categoryType === 'transport_hub' && '🚌 Transport'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">{addr}</div>
                            {place.phone && <div className="text-xs text-blue-600">📞 {place.phone}</div>}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {Number(place.lat).toFixed(4)}, {Number(place.lng).toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {place.categoryType === 'temple' && (
                              <div>
                                {place.deity?.en && <div><strong>Deity:</strong> {place.deity.en}</div>}
                                {place.darshan_timings?.en && <div><strong>Timings:</strong> {place.darshan_timings.en}</div>}
                              </div>
                            )}
                            {place.categoryType === 'hotel' && (
                              <div>
                                <div><strong>Tier:</strong> {place.price_range || 'mid_range'}</div>
                                {place.rating && <div>⭐ {place.rating}</div>}
                              </div>
                            )}
                            {place.categoryType === 'transport_hub' && (
                              <div>
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono text-xs">
                                  {place.hub_type}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {place.is_hidden ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                🚫 Hidden
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                                🟢 Published
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleHide(place.categoryType, place)}
                              className="text-xs text-amber-600 hover:underline font-semibold"
                            >
                              {place.is_hidden ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              onClick={() => handleDeleteCurated(place.categoryType, place.id)}
                              className="text-xs text-red-600 hover:underline font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DIRECTORY OVERRIDES ================= */}
      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-900">
            <strong>Directory Overrides Note:</strong> Overrides allow admins to sanitize third-party Google Places
            results, add verified pushkaralu instructions (e.g. senior citizen entrance, road block warnings), or hide
            inappropriate listings without modifying upstream APIs.
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Place ID</th>
                    <th className="py-3 px-4">Name Override</th>
                    <th className="py-3 px-4">Phone Override</th>
                    <th className="py-3 px-4">Custom Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overrides.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No active place overrides.
                      </td>
                    </tr>
                  ) : (
                    overrides.map((ov) => (
                      <tr key={ov.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-900">{ov.place_id}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {ov.name_override?.en || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {ov.phone_override || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-700 max-w-xs truncate">
                          {ov.custom_notes?.en || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          {ov.is_hidden ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                              🚫 Hidden
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                              ✏️ Active Override
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              const r = prompt('Enter audit reason to delete override:');
                              if (r) {
                                await AdminApi.deleteOverride(ov.id, r);
                                fetchData();
                              }
                            }}
                            className="text-xs text-red-600 hover:underline font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SPATIAL CACHE & API BUDGET GUARD ================= */}
      {activeTab === 'cache' && (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Google Places Calls Today</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {cacheStatus.usage_stats?.call_count ?? 0}{' '}
                <span className="text-sm text-gray-400 font-normal">/ {cacheStatus.usage_stats?.daily_limit ?? 500}</span>
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">
                {cacheStatus.usage_stats?.remaining ?? 500} calls remaining today
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Budget Guard Protection</div>
              <div className="text-xl font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                <span>🛡️</span> ACTIVE
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Trips automatically at 500 daily calls
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Cached Spatial Sectors</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {cacheStatus.cache_entries?.length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Configurable 7-day TTL with stale-while-revalidate
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase">Stale Sectors</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {cacheStatus.cache_entries?.filter((c) => c.is_stale).length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Auto-refreshed in background on pilgrim request
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-xl border">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Spatial Cache Maintenance</h3>
              <p className="text-xs text-gray-500">
                Pre-warm caches for all published ghats or purge invalid sectors.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrewarmCache}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                🔥 Pre-warm All Published Ghats
              </button>
              <button
                onClick={handleInvalidateCache}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 shadow-sm disabled:opacity-50"
              >
                🗑️ Flush Cache
              </button>
            </div>
          </div>

          {/* Cached Sectors Table */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Ghat</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Radius</th>
                    <th className="py-3 px-4">Items Count</th>
                    <th className="py-3 px-4">Fetched At</th>
                    <th className="py-3 px-4">Expires At</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cacheStatus.cache_entries?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No cached sectors. Tap 'Pre-warm All Published Ghats' above to populate.
                      </td>
                    </tr>
                  ) : (
                    cacheStatus.cache_entries?.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {entry.ghat_name?.en || entry.ghat_id}
                        </td>
                        <td className="py-3 px-4 capitalize font-semibold">{entry.type}</td>
                        <td className="py-3 px-4 font-mono text-xs">{entry.radius_m / 1000} km</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{entry.item_count} places</td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-500">
                          {new Date(entry.fetched_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-gray-500">
                          {new Date(entry.expires_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {entry.is_stale ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                              ⚠️ Stale (Refreshing)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold">
                              🟢 Fresh
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* ================= MODAL: ADD CURATED PLACE ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Curated Pushkaralu Place</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCuratedPlace} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Place Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['temple', 'hotel', 'transport_hub'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setModalCategory(cat)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold capitalize ${
                        modalCategory === cat
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {cat === 'transport_hub' ? 'Transport' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Name (English) *</label>
                <input
                  type="text"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Sri Kotilingeshwara Swamy Temple"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (Telugu)</label>
                  <input
                    type="text"
                    value={formData.name_te}
                    onChange={(e) => setFormData({ ...formData, name_te: e.target.value })}
                    placeholder="కోటిలింగేశ్వర స్వామి ఆలయం"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name (Hindi)</label>
                  <input
                    type="text"
                    value={formData.name_hi}
                    onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                    placeholder="कोटिलिंगेश्वर स्वामी मंदिर"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 883 244 8888"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address (EN)</label>
                  <input
                    type="text"
                    value={formData.address_en}
                    onChange={(e) => setFormData({ ...formData, address_en: e.target.value })}
                    placeholder="Near Ghat Embankment Road"
                    className="w-full border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              {/* Conditional Category fields */}
              {modalCategory === 'temple' && (
                <div className="grid grid-cols-2 gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Deity</label>
                    <input
                      type="text"
                      value={formData.deity_en}
                      onChange={(e) => setFormData({ ...formData, deity_en: e.target.value })}
                      placeholder="Lord Shiva"
                      className="w-full border rounded p-1.5 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Darshan Timings</label>
                    <input
                      type="text"
                      value={formData.darshan_en}
                      onChange={(e) => setFormData({ ...formData, darshan_en: e.target.value })}
                      placeholder="05:00 AM - 09:00 PM"
                      className="w-full border rounded p-1.5 text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {modalCategory === 'hotel' && (
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price Range</label>
                  <select
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    className="w-full border rounded p-2 text-xs bg-white"
                  >
                    <option value="dharamshala">Pilgrim Choultry / Dharamshala</option>
                    <option value="budget">Budget Friendly</option>
                    <option value="mid_range">Mid-Range Comfort</option>
                    <option value="luxury">Luxury / Resort</option>
                    <option value="free">Free / Community Rest Hall</option>
                  </select>
                </div>
              )}

              {modalCategory === 'transport_hub' && (
                <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hub Type</label>
                  <select
                    value={formData.hub_type}
                    onChange={(e) => setFormData({ ...formData, hub_type: e.target.value })}
                    className="w-full border rounded p-2 text-xs bg-white"
                  >
                    <option value="railway_station">Railway Station</option>
                    <option value="bus_stand">APSRTC / TSRTC Bus Station</option>
                    <option value="auto_stand">Prepaid Auto / Electric Buggy Stand</option>
                    <option value="boat_point">Godavari Ferry & Boat Jetty</option>
                    <option value="parking">Designated Pushkaralu Parking Zone</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Verified official listing for Pushkaralu pilgrims"
                  className="w-full border border-red-200 rounded-lg p-2.5 bg-red-50/30 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD OVERRIDE ================= */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Place Directory Override</h2>
              <button onClick={() => setIsOverrideModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOverride} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Place ID (Google or Internal ID) *</label>
                <input
                  type="text"
                  required
                  value={overrideData.place_id}
                  onChange={(e) => setOverrideData({ ...overrideData, place_id: e.target.value })}
                  placeholder="e.g. ChIJ... or google_place_mock..."
                  className="w-full border rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Corrected / Official Name (EN)</label>
                <input
                  type="text"
                  value={overrideData.name_override_en}
                  onChange={(e) => setOverrideData({ ...overrideData, name_override_en: e.target.value })}
                  placeholder="Official Name Override"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Verified Phone</label>
                <input
                  type="text"
                  value={overrideData.phone_override}
                  onChange={(e) => setOverrideData({ ...overrideData, phone_override: e.target.value })}
                  placeholder="+91..."
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custom Pushkaralu Advisory Notes</label>
                <textarea
                  rows={2}
                  value={overrideData.custom_notes_en}
                  onChange={(e) => setOverrideData({ ...overrideData, custom_notes_en: e.target.value })}
                  placeholder="e.g. Restricted sector parking during peak bathing days."
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hideCheckbox"
                  checked={overrideData.is_hidden}
                  onChange={(e) => setOverrideData({ ...overrideData, is_hidden: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="hideCheckbox" className="font-semibold text-red-700 text-xs">
                  Completely Hide This Place from Pilgrims
                </label>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-xs">Mandatory Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  placeholder="e.g. Police cordoned off this location"
                  className="w-full border border-red-200 rounded-lg p-2 text-xs bg-red-50/30"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
