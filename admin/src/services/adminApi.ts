import { Ghat, GhatNotice, CrowdStatus, AuditLog, PublishStatus, CrowdLevel } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/v1';

// Default mock admin token for control room development session
let activeToken = localStorage.getItem('pushkaralu_admin_token') || 'dev-admin-token';

export function setAdminToken(token: string) {
  activeToken = token;
  localStorage.setItem('pushkaralu_admin_token', token);
}

export function getAdminToken() {
  return activeToken;
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${activeToken}`,
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
};

