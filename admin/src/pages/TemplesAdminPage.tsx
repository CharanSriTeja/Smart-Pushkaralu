import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface Temple {
  id: string;
  name: { en: string; te?: string; hi?: string };
  lat: number;
  lng: number;
  district: string;
  state: string;
  coordinates_precision: 'access_verified' | 'approximate' | 'village_centre';
  source: 'osm' | 'official' | 'admin' | 'other';
  osm_id?: string;
  verified: boolean;
  active: boolean;
}

export const TemplesAdminPage: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTemple, setEditingTemple] = useState<Temple | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_te: '',
    name_hi: '',
    lat: '',
    lng: '',
    district: '',
    state: '',
    coordinates_precision: 'access_verified' as any,
    verified: false,
    active: true,
  });

  const loadTemples = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getAdminTemples();
      setTemples(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load temples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemples();
  }, []);

  const openEdit = (t: Temple) => {
    setEditingTemple(t);
    setFormData({
      name_en: t.name?.en || '',
      name_te: t.name?.te || '',
      name_hi: t.name?.hi || '',
      lat: String(t.lat),
      lng: String(t.lng),
      district: t.district || '',
      state: t.state || '',
      coordinates_precision: t.coordinates_precision || 'approximate',
      verified: t.verified,
      active: t.active,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemple) return;
    try {
      const payload = {
        name: {
          en: formData.name_en,
          te: formData.name_te || formData.name_en,
          hi: formData.name_hi || formData.name_en,
        },
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        district: formData.district,
        state: formData.state,
        coordinates_precision: formData.coordinates_precision,
        verified: formData.verified,
        active: formData.active,
      };

      await adminApi.updateAdminTemple(editingTemple.id, payload);
      setEditingTemple(null);
      loadTemples();
    } catch (err: any) {
      alert(err.message || 'Failed to update temple');
    }
  };

  const handleToggleVerified = async (t: Temple) => {
    try {
      await adminApi.updateAdminTemple(t.id, { verified: !t.verified });
      loadTemples();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pilgrimage Temples Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verified shrines and temples eligible to appear as stops along Pushkaralu routes.
          </p>
        </div>
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          © OpenStreetMap contributors for imported nodes
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Temples Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading temples...</div>
        ) : temples.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No temples registered yet. Run OSM import script.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Temple</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Precision</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {temples.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{t.name?.en}</div>
                      <div className="text-xs text-gray-500">{t.name?.te}</div>
                      <div className="text-xs text-gray-400">{t.district}, {t.state}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-600">
                      {t.lat?.toFixed(4)}, {t.lng?.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {t.coordinates_precision}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 uppercase">
                      {t.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleToggleVerified(t)}
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full cursor-pointer ${
                          t.verified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.verified ? '✓ Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTemple && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Temple Coordinates & Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name (English)</label>
                <input
                  type="text"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Name (Telugu)</label>
                  <input
                    type="text"
                    value={formData.name_te}
                    onChange={(e) => setFormData({ ...formData, name_te: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Name (Hindi)</label>
                  <input
                    type="text"
                    value={formData.name_hi}
                    onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Coordinates Precision</label>
                <select
                  value={formData.coordinates_precision}
                  onChange={(e) => setFormData({ ...formData, coordinates_precision: e.target.value as any })}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="access_verified">Access Verified (Gate / Entrance)</option>
                  <option value="approximate">Approximate (Geocoded / OSM node)</option>
                  <option value="village_centre">Village Centre</option>
                </select>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Mark as Verified</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Active for Routing</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTemple(null)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

