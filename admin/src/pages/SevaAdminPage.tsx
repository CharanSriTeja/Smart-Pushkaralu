import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { AdminSevaVideo, SevaCategory } from '../types';

export const SevaAdminPage: React.FC = () => {
  const [videos, setVideos] = useState<AdminSevaVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdminSevaVideo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formUrl, setFormUrl] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTitleTe, setFormTitleTe] = useState('');
  const [formTitleHi, setFormTitleHi] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescTe, setFormDescTe] = useState('');
  const [formDescHi, setFormDescHi] = useState('');
  const [formCategory, setFormCategory] = useState<SevaCategory>('aarthi');
  const [formGhatId, setFormGhatId] = useState('');
  const [formEventDate, setFormEventDate] = useState(new Date().toISOString().substring(0, 16));
  const [formIsLive, setFormIsLive] = useState(false);
  const [formPublished, setFormPublished] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formReason, setFormReason] = useState('');

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSevaVideos();
      setVideos(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load Seva videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const openAddModal = () => {
    setEditingVideo(null);
    setFormUrl('');
    setFormTitleEn('');
    setFormTitleTe('');
    setFormTitleHi('');
    setFormDescEn('');
    setFormDescTe('');
    setFormDescHi('');
    setFormCategory('aarthi');
    setFormGhatId('pushkar-ghat-01');
    setFormEventDate(new Date().toISOString().substring(0, 16));
    setFormIsLive(false);
    setFormPublished(true);
    setFormSortOrder(videos.length + 1);
    setFormReason('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (video: AdminSevaVideo) => {
    setEditingVideo(video);
    setFormUrl(video.youtube_url || `https://www.youtube.com/watch?v=${video.youtube_id}`);
    setFormTitleEn(video.title_en || video.title?.en || '');
    setFormTitleTe(video.title_te || video.title?.te || '');
    setFormTitleHi(video.title_hi || video.title?.hi || '');
    setFormDescEn(video.description_en || video.description?.en || '');
    setFormDescTe(video.description_te || video.description?.te || '');
    setFormDescHi(video.description_hi || video.description?.hi || '');
    setFormCategory(video.category);
    setFormGhatId(video.ghat_id || '');
    setFormEventDate(
      video.event_date ? new Date(video.event_date).toISOString().substring(0, 16) : new Date().toISOString().substring(0, 16)
    );
    setFormIsLive(Boolean(video.is_live));
    setFormPublished(Boolean(video.published));
    setFormSortOrder(video.sort_order || 1);
    setFormReason('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formUrl.trim()) {
      setErrorMessage('YouTube URL is required.');
      return;
    }
    if (!formTitleEn.trim() || !formTitleTe.trim()) {
      setErrorMessage('Both English and Telugu titles are required.');
      return;
    }

    try {
      const payload = {
        url: formUrl.trim(),
        title_en: formTitleEn.trim(),
        title_te: formTitleTe.trim(),
        title_hi: formTitleHi.trim() || undefined,
        description_en: formDescEn.trim() || undefined,
        description_te: formDescTe.trim() || undefined,
        description_hi: formDescHi.trim() || undefined,
        category: formCategory,
        ghat_id: formGhatId.trim() || null,
        event_date: new Date(formEventDate).toISOString(),
        is_live: formIsLive,
        published: formPublished,
        sort_order: Number(formSortOrder) || 1,
        reason: formReason.trim() || (editingVideo ? 'Admin updated video' : 'Admin created video'),
      };

      if (editingVideo) {
        await adminApi.updateSevaVideo(editingVideo.id, payload);
        setSuccessMessage('Video updated successfully.');
      } else {
        await adminApi.createSevaVideo(payload);
        setSuccessMessage('New Seva video added successfully.');
      }

      setIsModalOpen(false);
      await loadVideos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await adminApi.deleteSevaVideo(id, 'Admin deletion from web portal');
      setSuccessMessage('Video deleted successfully.');
      await loadVideos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete video');
    }
  };

  const handleTogglePublished = async (video: AdminSevaVideo) => {
    try {
      const newStatus = !video.published;
      await adminApi.updateSevaVideo(video.id, {
        published: newStatus,
        reason: `Toggled publication to ${newStatus ? 'Published' : 'Draft'}`,
      });
      await loadVideos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle publication');
    }
  };

  const handleToggleLive = async (video: AdminSevaVideo) => {
    try {
      const newLive = !video.is_live;
      await adminApi.updateSevaVideo(video.id, {
        is_live: newLive,
        reason: `Toggled live broadcast status to ${newLive ? 'LIVE' : 'RECORDED'}`,
      });
      await loadVideos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to toggle live broadcast');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const newVideos = [...videos];
    const temp = newVideos[index];
    newVideos[index] = newVideos[targetIndex];
    newVideos[targetIndex] = temp;

    const reorderPayload = newVideos.map((v, idx) => ({
      id: v.id,
      sort_order: idx + 1,
    }));

    try {
      setVideos(newVideos);
      await adminApi.reorderSevaVideos(reorderPayload);
      setSuccessMessage('Order updated successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reorder');
      await loadVideos();
    }
  };

  const filteredVideos = videos.filter((v) => {
    if (filterCategory !== 'all' && v.category !== filterCategory) return false;
    if (filterPublished === 'published' && !v.published) return false;
    if (filterPublished === 'draft' && v.published) return false;
    if (filterPublished === 'live' && !v.is_live) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📺</span> Virtual Seva & Event Experience (Module 10)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage official Godavari Pushkaralu live streaming links, ritual videos, Harathi broadcasts, and cultural events.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-md font-medium text-sm hover:bg-indigo-700 shadow-sm flex items-center gap-1"
        >
          <span>➕</span> Add YouTube Stream/Video
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded text-sm flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="mt-6 flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="all">All Categories</option>
            <option value="aarthi">Godavari Harathi (aarthi)</option>
            <option value="pooja">Pujas & Rituals (pooja)</option>
            <option value="cultural">Cultural & Bhajans (cultural)</option>
            <option value="snanam">Holy Dip & Snanam (snanam)</option>
            <option value="live_darshan">Live Darshan (live_darshan)</option>
            <option value="general">General Highlights (general)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Status:</span>
          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
            <option value="live">🔴 Live Now Only</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-gray-500 font-medium">
          Showing {filteredVideos.length} of {videos.length} videos
        </div>
      </div>

      {/* Video Table */}
      <div className="mt-6 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading videos...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No videos found matching current filters. Click "Add YouTube Stream/Video" to create one.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-16">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-32">Preview</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Video & Titles (EN / TE)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-28">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24">Live Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-24">Visibility</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredVideos.map((video, idx) => (
                <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                  {/* Order & Reorder Controls */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-xs font-semibold text-gray-600">#{video.sort_order}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="px-1 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === filteredVideos.length - 1}
                          className="px-1 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-30"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    <div className="relative w-28 h-16 rounded overflow-hidden bg-black shadow-sm group">
                      <img
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                        alt={video.title_en}
                        className="w-full h-full object-cover"
                      />
                      {video.is_live && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Info */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{video.title_en || video.title?.en}</div>
                    <div className="text-indigo-800 text-xs font-medium mt-0.5">{video.title_te || video.title?.te}</div>
                    {video.title_hi && <div className="text-gray-500 text-xs mt-0.5">{video.title_hi}</div>}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>🔗</span> {video.youtube_id}
                      </a>
                      {video.ghat_id && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                          📍 {video.ghat_id}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 capitalize">
                      {video.category}
                    </span>
                  </td>

                  {/* Live Status Toggle */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleLive(video)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        video.is_live
                          ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {video.is_live ? '🔴 LIVE' : 'Recorded'}
                    </button>
                  </td>

                  {/* Published Toggle */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublished(video)}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        video.published
                          ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                      }`}
                    >
                      {video.published ? 'Published' : 'Draft'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(video)}
                        className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(video.id, video.title_en)}
                        className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 font-medium"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingVideo ? 'Edit Seva Video / Stream' : 'Add Official YouTube Stream / Video'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* YouTube URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  YouTube URL * (youtu.be, youtube.com/watch, or youtube.com/live)
                </label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Server strictly validates and extracts the 11-character video ID and auto-generates official high-res thumbnails.
                </p>
              </div>

              {/* Bilingual Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Godavari Maha Harathi Live"
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Title (Telugu) *</label>
                  <input
                    type="text"
                    required
                    value={formTitleTe}
                    onChange={(e) => setFormTitleTe(e.target.value)}
                    placeholder="ఉదా: గోదావరి మహా హారతి ప్రత్యక్ష ప్రసారం"
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">Title (Hindi - Optional)</label>
                <input
                  type="text"
                  value={formTitleHi}
                  onChange={(e) => setFormTitleHi(e.target.value)}
                  placeholder="उदा: गोदावरी महा आरती सीधा प्रसारण"
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* Category & Ghat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SevaCategory)}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="aarthi">Godavari Harathi (aarthi)</option>
                    <option value="pooja">Pujas & Rituals (pooja)</option>
                    <option value="cultural">Cultural & Bhajans (cultural)</option>
                    <option value="snanam">Holy Dip & Snanam (snanam)</option>
                    <option value="live_darshan">Live Darshan (live_darshan)</option>
                    <option value="general">General Highlights (general)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Associated Ghat (Nullable)</label>
                  <select
                    value={formGhatId}
                    onChange={(e) => setFormGhatId(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="">None / Global Pushkaralu Event</option>
                    <option value="pushkar-ghat-01">Pushkar Ghat, Rajahmundry</option>
                    <option value="kotilingala-ghat-02">Kotilingala Ghat, Rajahmundry</option>
                    <option value="saraswathi-ghat-03">Saraswathi Ghat, Rajahmundry</option>
                    <option value="vip-ghat-04">VIP Ghat, Rajahmundry</option>
                    <option value="bhadrachalam-ghat-01">Bhadrachalam Main Ghat</option>
                  </select>
                </div>
              </div>

              {/* Event Date & Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Event Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    min="1"
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Description (English)</label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Brief description for pilgrims..."
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase">Description (Telugu)</label>
                  <textarea
                    rows={2}
                    value={formDescTe}
                    onChange={(e) => setFormDescTe(e.target.value)}
                    placeholder="భక్తుల కోసం తెలుగు వివరణ..."
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Flags: Live & Published */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsLive}
                    onChange={(e) => setFormIsLive(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    🔴 Is Live Stream Now (Prioritize on top)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    ✅ Published (Visible on mobile app)
                  </span>
                </label>
              </div>

              {/* Reason for Audit */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase">
                  Audit Reason (Logged immutably)
                </label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. Added evening harathi livestream link from district collectorate"
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm"
                >
                  {editingVideo ? 'Update Video' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

