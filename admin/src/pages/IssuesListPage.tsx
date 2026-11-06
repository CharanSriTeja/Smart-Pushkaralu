import React, { useState, useEffect } from 'react';
import { AdminApi } from '../services/adminApi';
import { IssueReport, IssueStatus } from '../types';

interface IssuesListPageProps {
  onSelectIssue: (issueId: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  sanitation: '🧹 Sanitation',
  water: '🚰 Water',
  road: '🛣️ Road',
  lighting: '💡 Lighting',
  crowd: '👥 Crowd',
  other: '⚠️ Other',
};

const STATUS_BADGES: Record<IssueStatus, { label: string; bg: string; text: string }> = {
  submitted: { label: 'Submitted', bg: '#FEF3C7', text: '#B45309' },
  under_review: { label: 'Under Review', bg: '#FFEDD5', text: '#C2410C' },
  in_progress: { label: 'In Progress', bg: '#E0F2FE', text: '#0369A1' },
  resolved: { label: 'Resolved', bg: '#DCFCE7', text: '#15803D' },
  rejected: { label: 'Closed / Rejected', bg: '#F1F5F9', text: '#475569' },
};

export const IssuesListPage: React.FC<IssuesListPageProps> = ({ onSelectIssue }) => {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  useEffect(() => {
    loadIssues();
  }, [statusFilter, categoryFilter]);

  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: '100' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await AdminApi.getIssues(params);
      setIssues(res.issues || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIssues();
  };

  // Stats calculation
  const totalCount = issues.length;
  const submittedCount = issues.filter((i) => i.status === 'submitted').length;
  const reviewCount = issues.filter((i) => i.status === 'under_review').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>🚨</span> Grievances & Issue Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor, assign, and resolve pilgrim grievance reports submitted from ghats and zones during Godavari Pushkaralu.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Table List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              viewMode === 'map' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Ground Map
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Total Reports</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase">Submitted</div>
          <div className="text-2xl font-extrabold text-amber-800 mt-1">{submittedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-200 bg-orange-50/40 shadow-sm">
          <div className="text-xs font-medium text-orange-700 uppercase">Under Review</div>
          <div className="text-2xl font-extrabold text-orange-800 mt-1">{reviewCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-sky-200 bg-sky-50/40 shadow-sm">
          <div className="text-xs font-medium text-sky-700 uppercase">In Progress</div>
          <div className="text-2xl font-extrabold text-sky-800 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase">Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Ticket # (e.g. SP-2027) or keywords..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Closed / Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="sanitation">🧹 Sanitation</option>
            <option value="water">🚰 Water</option>
            <option value="road">🛣️ Road</option>
            <option value="lighting">💡 Lighting</option>
            <option value="crowd">👥 Crowd</option>
            <option value="other">⚠️ Other</option>
          </select>

          <button
            onClick={loadIssues}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
            title="Refresh list"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Main Content: Table or Map */}
      {viewMode === 'map' ? (
        <IssuesMapView issues={issues} onSelectIssue={onSelectIssue} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              Loading issues...
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <div className="text-4xl mb-2">📋</div>
              <p className="font-semibold text-slate-700">No issues found matching the criteria</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Ticket #</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Description</th>
                    <th className="p-3.5">Location / Zone</th>
                    <th className="p-3.5">Reported</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {issues.map((issue) => {
                    const badge = STATUS_BADGES[issue.status] || STATUS_BADGES.submitted;
                    return (
                      <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {issue.ticket_no}
                          {issue.duplicate_count > 0 && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              +{issue.duplicate_count} dup
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-medium">
                            {CATEGORY_ICONS[issue.category] || issue.category}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate" title={issue.description}>
                          {issue.description}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-xs text-slate-500">
                          {issue.qr_zone_id ? (
                            <span className="font-semibold text-slate-700">Zone: {issue.qr_zone_id}</span>
                          ) : (
                            <span>{Number(issue.lat).toFixed(4)}, {Number(issue.lng).toFixed(4)}</span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-xs text-slate-400">
                          {new Date(issue.created_at).toLocaleDateString()} {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right">
                          <button
                            onClick={() => onSelectIssue(issue.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition border border-blue-200"
                          >
                            Review & Update →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Interactive Ground Map component plotting issues by coordinates
 */
const IssuesMapView: React.FC<{ issues: IssueReport[]; onSelectIssue: (id: string) => void }> = ({
  issues,
  onSelectIssue,
}) => {
  const [selectedPin, setSelectedPin] = useState<IssueReport | null>(null);

  // Center around Godavari Rajahmundry ghats
  const centerLat = 16.989065;
  const centerLng = 81.775412;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="mb-3 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm">📍 Spatial Grievance Distribution</h3>
        <span className="text-xs text-slate-500">Displaying {issues.length} geolocated incidents</span>
      </div>

      <div className="relative w-full h-96 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* River Water Simulation Background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-0 bottom-0 left-1/3 w-28 bg-blue-950/60 border-l border-r border-blue-500/30 transform -skew-x-12 flex items-center justify-center">
          <span className="text-blue-400/40 text-xs font-mono uppercase tracking-widest transform -rotate-90">
            Godavari River Channel
          </span>
        </div>

        {/* Issue Pins plotted on canvas */}
        {issues.map((issue) => {
          // Normalize lat/lng to percentage coordinates on 96h canvas
          const xOffset = Math.min(Math.max(50 + (Number(issue.lng) - centerLng) * 3500, 5), 95);
          const yOffset = Math.min(Math.max(50 - (Number(issue.lat) - centerLat) * 3500, 5), 95);

          const isSelected = selectedPin?.id === issue.id;
          const pinColor =
            issue.status === 'resolved'
              ? 'bg-emerald-500'
              : issue.status === 'in_progress'
              ? 'bg-sky-500'
              : issue.status === 'under_review'
              ? 'bg-orange-500'
              : 'bg-amber-500';

          return (
            <button
              key={issue.id}
              onClick={() => setSelectedPin(issue)}
              style={{ left: `${xOffset}%`, top: `${yOffset}%` }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shadow-lg border-2 ${pinColor} ${
                isSelected ? 'ring-4 ring-white z-20 scale-125' : 'hover:scale-110 z-10'
              } transition`}
              title={`${issue.ticket_no} - ${issue.category}`}
            >
              {issue.category === 'sanitation'
                ? '🧹'
                : issue.category === 'water'
                ? '🚰'
                : issue.category === 'lighting'
                ? '💡'
                : issue.category === 'road'
                ? '🛣️'
                : '⚠️'}
            </button>
          );
        })}

        {/* Selected Pin Details Overlay Card */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900/95 backdrop-blur border border-slate-700 p-4 rounded-xl text-white shadow-2xl z-30">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs font-bold text-blue-400">{selectedPin.ticket_no}</span>
              <button onClick={() => setSelectedPin(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
            <p className="text-xs font-medium text-slate-200 line-clamp-2 mb-2">
              {selectedPin.description}
            </p>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 capitalize">{selectedPin.status.replace('_', ' ')}</span>
              <button
                onClick={() => onSelectIssue(selectedPin.id)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
              >
                Inspect Issue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
