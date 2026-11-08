import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export const RoutingOperationsPage: React.FC = () => {
  const [operations, setOperations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOperations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getRoutingOperations();
      setOperations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routing Operations & Quota Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time status of routing providers, budget protection limits, and precomputed standard routes.
          </p>
        </div>
        <button
          onClick={loadOperations}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          🔄 Refresh Status
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading operations status...</div>
      ) : operations ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Active Engine</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1 uppercase">
                {operations.activeProvider}
              </div>
              <div className="text-xs text-gray-500 mt-1">OpenStreetMap Adapter</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Standard Routes</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {operations.standardRoutes?.reduce((acc: number, r: any) => acc + parseInt(r.count, 10), 0) || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Precomputed & Cached</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Corridor Temples</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {operations.activeTemples}
              </div>
              <div className="text-xs text-gray-500 mt-1">Active Pilgrimage Shrines</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase">Active Closures</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {operations.activeClosures}
              </div>
              <div className="text-xs text-gray-500 mt-1">Road Diversions Active</div>
            </div>
          </div>

          {/* Daily Usage Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Provider Usage (Last 24 Hours)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Provider</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Requests in 24h</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Safe Daily Limit</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Budget Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {operations.dailyUsage?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                        No external routing calls recorded in the last 24 hours.
                      </td>
                    </tr>
                  ) : (
                    operations.dailyUsage.map((u: any, idx: number) => {
                      const count = parseInt(u.count, 10);
                      const limit = 1800;
                      const pct = Math.round((count / limit) * 100);
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-semibold uppercase">{u.provider}</td>
                          <td className="px-4 py-3">{count}</td>
                          <td className="px-4 py-3">{limit}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attribution & Legal Notice */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-2">
            <h3 className="font-semibold text-gray-800">Mandatory OpenStreetMap & Provider Attribution</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              All routes and corridor calculations use OpenStreetMap data and OpenRouteService. Under ODbL terms,
              every user-facing view must display:
            </p>
            <div className="bg-white border rounded p-3 text-xs font-mono text-gray-800">
              {operations.attribution}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

