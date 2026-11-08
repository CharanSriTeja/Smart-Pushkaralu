import { AuditLogRecord, SettingRecord, UsageStats } from '../types';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE = rawApiUrl.endsWith('/v1') ? rawApiUrl.slice(0, -3) : rawApiUrl.replace(/\/+$/, '');

function getHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('sp_admin_token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

export async function fetchAuditLogs(
  params: { page?: number; limit?: number; entity?: string; admin?: string; date?: string },
  token?: string | null
): Promise<{ items: AuditLogRecord[]; total: number; page: number; limit: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.entity) query.append('entity', params.entity);
  if (params.admin) query.append('admin', params.admin);
  if (params.date) query.append('date', params.date);

  const res = await fetch(`${API_BASE}/v1/admin/audit-logs?${query.toString()}`, {
    headers: getHeaders(token),
  });

  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const json = await res.json();
  return {
    items: json.items || json.data || [],
    total: json.total || 0,
    page: json.page || 1,
    limit: json.limit || 20,
    totalPages: json.totalPages || Math.ceil((json.total || 0) / (json.limit || 20)) || 1,
  };
}

export async function fetchAdminSettings(
  token?: string | null
): Promise<SettingRecord[]> {
  const res = await fetch(`${API_BASE}/v1/admin/settings`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  const data = await res.json();
  return data.settings || [];
}

export async function updateAdminSetting(
  key: string,
  value: any,
  reason: string,
  token?: string | null
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/v1/admin/settings`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ key, value, reason }),
  });
  if (!res.ok) throw new Error(`Failed to update setting: ${res.statusText}`);
  return true;
}

export async function fetchUsageStats(
  token?: string | null
): Promise<UsageStats> {
  const res = await fetch(`${API_BASE}/v1/admin/usage`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return await res.json();
}

