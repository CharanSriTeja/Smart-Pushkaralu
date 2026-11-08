import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface RouteOrigin {
  id: string;
  name: { en: string; te?: string; hi?: string };
  kind: 'city' | 'railway_station' | 'bus_stand' | 'other';
  lat: number;
  lng: number;
  district: string;
  state: string;
  sort_order: number;
  active: boolean;
}

export const RouteOriginsPage: React.FC = () => {
  const [origins, setOrigins] = useState<RouteOrigin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState<RouteOrigin | null>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_te: '',
    name_hi: '',
    kind: 'railway_station',
    lat: '',
    lng: '',
    district: 'East Godavari',
    state: 'Andhra Pradesh',
    sort_order: 0,
    active: true,
  });

  const loadOrigins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getRouteOrigins();
      setOrigins(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load route origins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrigins();
  }, []);

  const openCreateModal = () => {
    setEditingOrigin(null);
    setFormData({
      name_en: '',
      name_te: '',
      name_hi: '',
      kind: 'railway_station',
      lat: '',
      lng: '',
      district: 'East Godavari',
      state: 'Andhra Pradesh',
      sort_order: origins.length + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (orig: RouteOrigin) => {
    setEditingOrigin(orig);
    setFormData({
      name_en: orig.name?.en || '',
      name_te: orig.name?.te || '',
      name_hi: orig.name?.hi || '',
      kind: orig.kind,
      lat: String(orig.lat),
      lng: String(orig.lng),
      district: orig.district || 'East Godavari',
      state: orig.state || 'Andhra Pradesh',
      sort_order: orig.sort_order || 0,
      active: orig.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: {
          en: formData.name_en,
          te: formData.name_te || formData.name_en,
          hi: formData.name_hi || formData.name_en,
        },
        kind: formData.kind,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        district: formData.district,
        state: formData.state,
        sort_order: Number(formData.sort_order),
        active: formData.active,
      };

      if (editingOrigin) {
        await adminApi.updateRouteOrigin(editingOrigin.id, payload);
      } else {
        await adminApi.createRouteOrigin(payload);
      }

      setIsModalOpen(false);
      loadOrigins();
    } catch (err: any) {
      alert(err.message || 'Error saving origin');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route origin?')) return;
    try {
      await adminApi.deleteRouteOrigin(id);
      loadOrigins();
    } catch (err: any) {
      alert(err.message || 'Failed to delete origin');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Starting Origins</h1>
          <p className="text-sm text-gray-500 mt-1">
            Curated transit stations, railway junctions, and arrival cities for standard route calculations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          + Add Route Origin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading origins...</div>
        ) : origins.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No route origins found. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Origin Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">District / State</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {origins.map((orig) => (
                  <tr key={orig.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{orig.sort_order}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{orig.name?.en}</div>
                      <div className="text-xs text-gray-500">{orig.name?.te} | {orig.name?.hi}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {orig.kind.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {orig.lat?.toFixed(4)}, {orig.lng?.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {orig.district}, {orig.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          orig.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {orig.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openEditModal(orig)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(orig.id)}
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
            <h2 className="text-xl font-bold text-gray-900">
              {editingOrigin ? 'Edit Route Origin' : 'Add Route Origin'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name (English)</label>
                <input
                  type="text"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g. Rajahmundry Railway Station (RJY)"
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
                    placeholder="రాజమండ్రి రైల్వే స్టేషన్"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Name (Hindi)</label>
                  <input
                    type="text"
                    value={formData.name_hi}
                    onChange={(e) => setFormData({ ...formData, name_hi: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    placeholder="राजमहेंद्री रेलवे स्टेशन"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Category</label>
                  <select
                    value={formData.kind}
                    onChange={(e) => setFormData({ ...formData, kind: e.target.value as any })}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="railway_station">Railway Station</option>
                    <option value="bus_stand">Bus Stand</option>
                    <option value="city">Major City</option>
                    <option value="other">Other Transit Point</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
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
                    placeholder="17.0005"
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
                    placeholder="81.7800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="activeToggle" className="text-gray-700">Active and available for routing</label>
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Origin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

