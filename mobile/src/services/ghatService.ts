import { Ghat, GhatFilters, CrowdStatus, GhatNotice } from '../types/ghats';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/v1';
const GHATS_CACHE_KEY = 'offline_cached_ghats_v1';
const GHAT_DETAIL_CACHE_PREFIX = 'offline_cached_ghat_detail_';

export class GhatService {
  /**
   * Fetch list of ghats with filtering, distance calculations, and offline fallback.
   */
  static async getGhats(filters: GhatFilters = {}): Promise<{ ghats: Ghat[]; isOffline: boolean }> {
    const params = new URLSearchParams();
    if (filters.state) params.append('state', filters.state);
    if (filters.district) params.append('district', filters.district);
    if (filters.river) params.append('river', filters.river);
    if (filters.bathingStatus) params.append('bathingStatus', filters.bathingStatus);
    if (filters.crowdLevel) params.append('crowdLevel', filters.crowdLevel);
    if (filters.facilities) params.append('facilities', filters.facilities);
    if (filters.near) params.append('near', filters.near);
    if (filters.search) params.append('search', filters.search);

    const url = `${API_BASE_URL}/ghats?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s network timeout for weak connectivity

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const ghats: Ghat[] = json.data || [];

        // Cache the full list for offline usage
        if (!filters.search && !filters.near && (!filters.district || filters.district === 'all')) {
          SecureStore.setItemAsync(GHATS_CACHE_KEY, JSON.stringify(ghats)).catch(() => {});
        }

        return { ghats, isOffline: false };
      }
    } catch (networkError) {
      console.warn('[GhatService] Network error fetching ghats, falling back to offline cache:', networkError);
    }

    // Attempt to load from offline cache
    try {
      const cached = await SecureStore.getItemAsync(GHATS_CACHE_KEY);
      if (cached) {
        let ghats: Ghat[] = JSON.parse(cached);

        // Apply in-memory client filtering on cached data if filters are provided
        if (filters.district && filters.district !== 'all') {
          ghats = ghats.filter((g) => g.district.toLowerCase() === filters.district!.toLowerCase());
        }
        if (filters.bathingStatus) {
          ghats = ghats.filter((g) => g.bathing_status === filters.bathingStatus);
        }
        if (filters.crowdLevel) {
          ghats = ghats.filter((g) => g.crowd_level === filters.crowdLevel);
        }

        return { ghats, isOffline: true };
      }
    } catch (cacheError) {
      console.warn('[GhatService] Failed to read offline cache:', cacheError);
    }

    return { ghats: [], isOffline: true };
  }

  /**
   * Fetch full details for a single ghat with offline fallback
   */
  static async getGhatById(id: string): Promise<{ ghat: Ghat | null; isOffline: boolean }> {
    const url = `${API_BASE_URL}/ghats/${id}`;
    const cacheKey = `${GHAT_DETAIL_CACHE_PREFIX}${id}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const ghat: Ghat = json.data;

        // Save to cache
        SecureStore.setItemAsync(cacheKey, JSON.stringify(ghat)).catch(() => {});
        return { ghat, isOffline: false };
      }
    } catch (err) {
      console.warn('[GhatService] Network failed for ghat detail, using cache:', err);
    }

    // Try reading cached detail
    try {
      const cached = await SecureStore.getItemAsync(cacheKey);
      if (cached) {
        return { ghat: JSON.parse(cached), isOffline: true };
      }
    } catch {}

    return { ghat: null, isOffline: true };
  }

  /**
   * Fetch active notices for a ghat
   */
  static async getGhatNotices(id: string): Promise<GhatNotice[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/ghats/${id}/notices`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.warn('[GhatService] Failed to fetch notices:', err);
    }
    return [];
  }

  /**
   * Fetch live crowd status for a ghat
   */
  static async getGhatCrowdStatus(id: string): Promise<CrowdStatus | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/ghats/${id}/crowd`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.warn('[GhatService] Failed to fetch crowd status:', err);
    }
    return null;
  }

  /**
   * Submit an on-site crowd level report
   */
  static async submitCrowdReport(data: {
    ghat_id: string;
    reported_crowd_level: string;
    lat: number;
    lng: number;
    device_fingerprint: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/crowd-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok) {
        return { success: true, data: json.data };
      } else {
        return { success: false, error: json.error?.message || 'Report submission failed' };
      }
    } catch (err: any) {
      return { success: false, error: 'Network error. Please check connection and try again.' };
    }
  }
}

