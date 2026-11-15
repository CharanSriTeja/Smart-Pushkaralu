import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface RouteClosure {
  id: string;
  title: { en: string; te?: string; hi?: string };
  description?: { en: string; te?: string; hi?: string } | null;
  severity: 'info' | 'warning' | 'blocked';
  geometry?: any;
  starts_at: string;
  ends_at: string;
  active: boolean;
  source_name: string;
  source_url?: string | null;
  created_at: string;
}

export const RouteClosuresPage: React.FC = () => {
  const [closures, setClosures] = useState<RouteClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title_en: '',
    title_te: '',
    title_hi: '',
    desc_en: '',
    severity: 'warning' as 'info' | 'warning' | 'blocked',
    lat: '',
    lng: '',
    radius_m: 100,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    source_name: 'District Police Department',
    source_url: '',
  });

  const loadClosures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getRouteClosures();
      setClosures(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load closures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClosures();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);

      if (isNaN(lat) || isNaN(lng)) {
        alert('Valid latitude and longitude required.');
        return;
      }

      // GeoJSON Point representation
      const geometry = {
        type: 'Point',
        coordinates: [lng, lat],
      };

      const payload = {
        title: {
          en: formData.title_en,
          te: formData.title_te || formData.title_en,
          hi: formData.title_hi || formData.title_en,
        },
        description: formData.desc_en ? { en: formData.desc_en } : null,
        severity: formData.severity,
        geometry,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        source_name: formData.source_name,
        source_url: formData.source_url || null,
      };

      await adminApi.createRouteClosure(payload);
      setIsModalOpen(false);
      loadClosures();
    } catch (err: any) {
      alert(err.message || 'Error creating closure');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to lift/delete this closure?')) return;
    try {
      await adminApi.deleteRouteClosure(id);
      loadClosures();
    } catch (err: any) {
      alert(err.message || 'Failed to remove closure');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Road Closures & Police Diversions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage traffic cordons, bridge restrictions, and diversion advisories intersecting Pushkaralu routes.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          + Add Road Closure
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Closures Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading closures...</div>
        ) : closures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active closures or diversions reported.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Title & Notice</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Authority Source</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Active Window</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {closures.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          c.severity === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : c.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{c.title?.en}</div>
                      {c.description?.en && (
                        <div className="text-xs text-gray-500 mt-1">{c.description.en}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {c.source_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div>From: {new Date(c.starts_at).toLocaleDateString()}</div>
                      <div>To: {new Date(c.ends_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Add Road Closure / Diversion</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g. Godavari Bridge Heavy Vehicle Diversion"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Description / Detour Instructions</label>
                <textarea
                  rows={2}
                  value={formData.desc_en}
                  onChange={(e) => setFormData({ ...formData, desc_en: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="All buses diverted via Gammon Bridge."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="warning">Warning / Diversion</option>
                    <option value="blocked">Blocked / Closed</option>
                    <option value="info">Advisory / Slow Moving</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Authority Source</label>
                  <input
                    type="text"
                    required
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Location Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    placeholder="17.0005"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Location Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    placeholder="81.7800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Starts At</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Ends At</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Save Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

