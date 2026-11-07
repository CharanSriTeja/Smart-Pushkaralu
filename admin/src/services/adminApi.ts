import { Ghat, GhatNotice, CrowdStatus, AuditLog, PublishStatus, CrowdLevel } from '../types';

const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
const API_BASE_URL = rawApiUrl.endsWith('/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/v1`;

// Default mock admin token for control room development session
let activeToken = localStorage.getItem('pushkaralu_admin_token') || 'dev-admin-token';

export function setAdminToken(token: string) {
  activeToken = token;
  localStorage.setItem('pushkaralu_admin_token', token);
}

export function getAdminToken() {
  return (
    localStorage.getItem('sp_admin_token') ||
    localStorage.getItem('pushkaralu_admin_token') ||
    activeToken ||
    'dev-admin-token'
  );
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAdminToken()}`,
});

export const AdminApi = {
  async getGhats(params: Record<string, string> = {}): Promise<{ data: Ghat[]; total: number }> {
    const q = new URLSearchParams({ includeHidden: 'true', ...params });
    const res = await fetch(`${API_BASE_URL}/ghats?${q.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch ghats: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data || [], total: json.pagination?.total || 0 };
  },

  async getGhatById(id: string): Promise<Ghat> {
    const res = await fetch(`${API_BASE_URL}/ghats/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch ghat: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async createGhat(data: any): Promise<Ghat> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create ghat');
    return json.data;
  },

  async updateGhat(id: string, updates: any): Promise<Ghat> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update ghat');
    return json.data;
  },

  async setPublishStatus(id: string, publish_status: PublishStatus, reason: string): Promise<Ghat> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${id}/publish-status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ publish_status, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to change publish status');
    return json.data;
  },

  async deleteGhat(id: string, reason: string = 'Ghat removed by administrator'): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete ghat');
    return true;
  },

  async bulkImportGhats(ghats: any[], reason: string = 'Bulk import from CSV'): Promise<{ count: number; errors: any[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/bulk`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ghats, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to bulk import ghats');
    return { count: json.count || 0, errors: json.errors || [] };
  },

  async overrideCrowd(
    id: string,
    crowd_level: CrowdLevel,
    reason: string,
    source_url?: string
  ): Promise<CrowdStatus> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${id}/crowd-override`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ crowd_level, reason, source_url }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to override crowd status');
    return json.data;
  },

  async createNotice(data: {
    ghat_id: string;
    title: { en: string; te?: string; hi?: string };
    message: { en: string; te?: string; hi?: string };
    severity: string;
    reason: string;
  }): Promise<GhatNotice> {
    const res = await fetch(`${API_BASE_URL}/admin/notices`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create notice');
    return json.data;
  },

  async getAuditLogs(params: {
    entityType?: string;
    entityId?: string;
    limit?: number;
  } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const q = new URLSearchParams();
    if (params.entityType) q.append('entityType', params.entityType);
    if (params.entityId) q.append('entityId', params.entityId);
    if (params.limit) q.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/admin/audit-logs?${q.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
    const json = await res.json();
    return { logs: json.data || [], total: json.total || 0 };
  },

  // ----------------------------------------------------
  // Module 9: Official News & Announcements
  // ----------------------------------------------------
  async getNews(params: Record<string, string> = {}): Promise<{ data: any[]; total: number }> {
    const q = new URLSearchParams({ includeExpired: 'true', ...params });
    const res = await fetch(`${API_BASE_URL}/news?${q.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch news: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data || [], total: json.meta?.total || 0 };
  },

  async getNewsById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/news/${id}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch news item: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async createNews(payload: any): Promise<{ data: any; notificationSent: boolean }> {
    const res = await fetch(`${API_BASE_URL}/admin/news`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create news announcement');
    return { data: json.data, notificationSent: json.meta?.notificationSent || false };
  },

  async updateNews(id: string, payload: any): Promise<{ data: any; notificationSent: boolean }> {
    const res = await fetch(`${API_BASE_URL}/admin/news/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update news announcement');
    return { data: json.data, notificationSent: json.meta?.notificationSent || false };
  },

  async deleteNews(id: string, audit_reason: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/news/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ audit_reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete news announcement');
  },

  async draftTranslate(data: {
    title?: string;
    content?: string;
    summary?: string;
    sourceLang?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/news/draft-translate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to draft translation');
    return json.data;
  },

  // ----------------------------------------------------
  // Module 9: Ghat Facilities Management
  // ----------------------------------------------------
  async getFacilities(ghatId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/ghats/${ghatId}/facilities`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch facilities: ${res.statusText}`);
    const json = await res.json();
    return json.data || [];
  },

  async addFacility(ghatId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${ghatId}/facilities`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to add facility');
    return json.data;
  },

  async updateFacility(ghatId: string, facilityId: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${ghatId}/facilities/${facilityId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update facility');
    return json.data;
  },

  async deleteFacility(ghatId: string, facilityId: string, audit_reason: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/ghats/${ghatId}/facilities/${facilityId}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ audit_reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete facility');
  },

  // ----------------------------------------------------
  // Module 8: Grievances & Issue Management
  // ----------------------------------------------------
  async getIssues(params: Record<string, string> = {}): Promise<{ issues: any[]; total: number; page: number; limit: number }> {
    const q = new URLSearchParams(params);
    const res = await fetch(`${API_BASE_URL}/admin/issues?${q.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch issues: ${res.statusText}`);
    return await res.json();
  },

  async getIssueById(id: string): Promise<{ issue: any; timeline: any[]; auditLogs: any[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/issues/${id}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch issue details');
    return json;
  },

  async updateIssueStatus(id: string, payload: {
    status: string;
    reason: string;
    public_note?: string;
    internal_note?: string;
    resolution_photo_url?: string;
  }): Promise<{ issue: any; update: any }> {
    const res = await fetch(`${API_BASE_URL}/admin/issues/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update issue status');
    return json;
  },

  async addIssueUpdate(id: string, payload: {
    reason: string;
    status?: string;
    public_note?: string;
    internal_note?: string;
    resolution_photo_url?: string;
  }): Promise<{ issue: any; update: any }> {
    const res = await fetch(`${API_BASE_URL}/admin/issues/${id}/updates`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to add timeline update');
    return json;
  },

  // ----------------------------------------------------
  // Module 5: Nearby Places, Curated Records & Cache
  // ----------------------------------------------------
  async getCuratedPlaces(): Promise<{ hotels: any[]; temples: any[]; transport_hubs: any[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/places/curated`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch curated places');
    const json = await res.json();
    return json.data;
  },

  async createHotel(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/hotels`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create hotel');
    return json.data;
  },

  async updateHotel(id: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/hotels/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update hotel');
    return json.data;
  },

  async deleteHotel(id: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/hotels/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete hotel');
    return json;
  },

  async createTemple(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/temples`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create temple');
    return json.data;
  },

  async updateTemple(id: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/temples/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update temple');
    return json.data;
  },

  async deleteTemple(id: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/temples/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete temple');
    return json;
  },

  async createTransportHub(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/transport-hubs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create transport hub');
    return json.data;
  },

  async updateTransportHub(id: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/transport-hubs/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update transport hub');
    return json.data;
  },

  async deleteTransportHub(id: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/transport-hubs/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete transport hub');
    return json;
  },

  async getOverrides(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/admin/places/overrides`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch overrides');
    const json = await res.json();
    return json.data;
  },

  async upsertOverride(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/overrides`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to save override');
    return json.data;
  },

  async deleteOverride(id: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/overrides/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to delete override');
    return json;
  },

  async getCacheStatus(): Promise<{ cache_entries: any[]; usage_stats: any }> {
    const res = await fetch(`${API_BASE_URL}/admin/places/cache-status`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch cache status');
    const json = await res.json();
    return json.data;
  },

  async prewarmCache(reason: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/prewarm`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to pre-warm cache');
    return json.data;
  },

  async invalidateCache(payload: { ghat_id?: string; type?: string; radius_m?: number; reason?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/places/cache/invalidate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to invalidate cache');
    return json;
  },

  // Module 7 Emergency SOS Endpoints
  async getSosAlerts(params: { status?: string; type?: string; ghatId?: string; page?: number; limit?: number } = {}): Promise<{ data: any[]; total: number }> {
    const q = new URLSearchParams();
    if (params.status) q.append('status', params.status);
    if (params.type) q.append('type', params.type);
    if (params.ghatId) q.append('ghatId', params.ghatId);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/admin/sos?${q.toString()}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch SOS alerts: ${res.statusText}`);
    const json = await res.json();
    return { data: json.data || [], total: json.total || 0 };
  },

  async getSosAlertById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch SOS alert: ${res.statusText}`);
    const json = await res.json();
    return json.data;
  },

  async updateSosStatus(id: string, status: string, note: string, isPublic: boolean = true): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, note, isPublic }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update alert status');
    return json.data;
  },

  async assignSosResponder(id: string, assignedToName: string, assignedToPhone?: string, note?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/${id}/assign`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ assignedToName, assignedToPhone, note }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to assign responder');
    return json.data;
  },

  async addSosNote(id: string, note: string, isPublic: boolean = false): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/${id}/notes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ note, isPublic }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to add note');
    return json.data;
  },

  async mergeSosAlerts(sourceAlertId: string, targetAlertId: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/merge`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ sourceAlertId, targetAlertId, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to merge alerts');
    return json;
  },

  async getQrZones(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/zones`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch QR zones');
    const json = await res.json();
    return json.data || [];
  },

  async createQrZone(data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/zones`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create QR zone');
    return json.data;
  },

  async updateQrZone(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/zones/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update QR zone');
    return json.data;
  },

  async getEmergencyContacts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/contacts`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch emergency contacts');
    const json = await res.json();
    return json.data || [];
  },

  async createEmergencyContact(data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/contacts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create emergency contact');
    return json.data;
  },

  async updateEmergencyContact(id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/contacts/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to update emergency contact');
    return json.data;
  },

  async deleteEmergencyContact(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/sos/contacts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to deactivate contact');
    return json;
  },
};



