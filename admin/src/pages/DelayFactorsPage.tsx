import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface DelayFactor {
  id: string;
  ghat_id?: string | null;
  ghat_name?: { en: string } | null;
  factor: number;
  label: { en: string; te?: string; hi?: string };
  starts_at: string;
  ends_at: string;
  active: boolean;
  created_at: string;
}

export const DelayFactorsPage: React.FC = () => {
  const [factors, setFactors] = useState<DelayFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    factor: '1.4',
    label_en: 'Pushkaram Snanam Peak Crowd Delay',
    label_te: 'పుష్కర స్నానాల రద్దీ ఆలస్యం',
    label_hi: 'पुष्करालु स्नान भीड़ विलंब',
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
  });

  const loadFactors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDelayFactors();
      setFactors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load delay multipliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const multiplier = parseFloat(formData.factor);
      if (isNaN(multiplier) || multiplier < 1.0) {
        alert('Multiplier must be at least 1.0');
        return;
      }

      const payload = {
        ghat_id: null, // Global default multiplier
        factor: multiplier,
        label: {
          en: formData.label_en,
          te: formData.label_te || formData.label_en,
          hi: formData.label_hi || formData.label_en,
        },
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
      };

      await adminApi.createDelayFactor(payload);
      setIsModalOpen(false);
      loadFactors();
    } catch (err: any) {
      alert(err.message || 'Failed to create delay multiplier');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this multiplier?')) return;
    try {
      await adminApi.deleteDelayFactor(id);
      loadFactors();
    } catch (err: any) {
      alert(err.message || 'Failed to remove multiplier');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traffic & Crowd Delay Multipliers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure realistic travel time multipliers during peak festival snanam dates without claiming live traffic.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
        >
          + Add Delay Multiplier
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Multipliers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading multipliers...</div>
        ) : factors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active delay multipliers. Standard driving speed will apply (1.0x).</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Multiplier</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Reason / Label</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Effective Dates</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {factors.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800">
                        {f.factor.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{f.label?.en}</div>
                      <div className="text-xs text-gray-500">{f.label?.te}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {f.ghat_name ? `Ghat: ${f.ghat_name.en}` : '🌐 All Pushkaralu Routes (Global)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div>From: {new Date(f.starts_at).toLocaleDateString()}</div>
                      <div>To: {new Date(f.ends_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(f.id)}
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
            <h2 className="text-xl font-bold text-gray-900">Add Crowd Delay Multiplier</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Time Multiplier Factor (e.g. 1.4 = +40% travel time)</label>
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="5.0"
                  required
                  value={formData.factor}
                  onChange={(e) => setFormData({ ...formData, factor: e.target.value })}
                  className="w-full border rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Label (English)</label>
                <input
                  type="text"
                  required
                  value={formData.label_en}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Label (Telugu)</label>
                  <input
                    type="text"
                    value={formData.label_te}
                    onChange={(e) => setFormData({ ...formData, label_te: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Label (Hindi)</label>
                  <input
                    type="text"
                    value={formData.label_hi}
                    onChange={(e) => setFormData({ ...formData, label_hi: e.target.value })}
                    className="w-full border rounded-lg p-2"
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
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Save Multiplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

