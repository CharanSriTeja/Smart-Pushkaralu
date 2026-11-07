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
  try {
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
    return await res.json();
  } catch (err) {
    console.warn('[Admin API] Falling back to mock audit logs:', err);
    return {
      items: [
        {
          id: 'mock-audit-1',
          admin_id: 'admin-super-01',
          admin_name: 'District Collector',
          admin_phone: '+91 99999 99999',
          action: 'settings.update',
          entity_type: 'settings',
          entity_id: 'corridor_km',
          old_value: 3,
          new_value: 5,
          source_url: '/v1/admin/settings',
          reason: 'Expanded crowd buffer for Pushkar Ghat',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'mock-audit-2',
          admin_id: 'admin-editor-02',
          admin_name: 'Media Officer',
          admin_phone: '+91 88888 88888',
          action: 'news.publish',
          entity_type: 'news',
          entity_id: 'news-101',
          old_value: null,
          new_value: { title: 'Godavari Water Discharge Steady' },
          source_url: '/v1/admin/news',
          reason: 'Official morning advisory',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  }
}

export async function fetchAdminSettings(
  token?: string | null
): Promise<SettingRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/admin/settings`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.settings || [];
  } catch (err) {
    console.warn('[Admin API] Falling back to mock settings:', err);
    return [
      { key: 'places_cache_days', value: 7, updated_by_name: 'Super Administrator', updated_at: new Date().toISOString() },
      { key: 'route_cache_days', value: 1, updated_by_name: 'Super Administrator', updated_at: new Date().toISOString() },
      { key: 'corridor_km', value: 3, updated_by_name: 'Super Administrator', updated_at: new Date().toISOString() },
      { key: 'sos_rate_limit_per_hour', value: 5, updated_by_name: 'Super Administrator', updated_at: new Date().toISOString() },
      { key: 'default_language', value: 'en', updated_by_name: 'Super Administrator', updated_at: new Date().toISOString() },
    ];
  }
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
  try {
    const res = await fetch(`${API_BASE}/v1/admin/usage`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Admin API] Falling back to mock usage:', err);
    return {
      monthlyQuota: 10000,
      currentMonthUsage: 1420,
      currentMonthCost: 0.0,
      quotaRemaining: 8580,
      quotaPercentUsed: 14.2,
      providers: [
        { provider: 'firebase_auth', totalCalls: 890, totalCost: 0 },
        { provider: 'firebase_messaging', totalCalls: 530, totalCost: 0 },
      ],
      dailyUsage: [
        { date: '2026-11-05', provider: 'firebase_auth', count: 120 },
        { date: '2026-11-05', provider: 'firebase_messaging', count: 85 },
        { date: '2026-11-04', provider: 'firebase_auth', count: 145 },
        { date: '2026-11-04', provider: 'firebase_messaging', count: 90 },
      ],
    };
  }
}

