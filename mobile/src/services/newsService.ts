import { NewsPost, NewsFilters, RegisterDevicePayload } from '../types/news';
import { GhatFacility } from '../types/ghats';
import * as SecureStore from 'expo-secure-store';
import { API_V1_URL as API_BASE_URL } from './api';
const NEWS_CACHE_KEY = 'offline_cached_news_v1';
const FACILITIES_CACHE_PREFIX = 'offline_cached_facilities_';

export class NewsService {
  /**
   * Fetch news list with category/ghat filtering, localization, and offline cache fallback.
   */
  static async getNews(filters: NewsFilters = {}): Promise<{ news: NewsPost[]; isOffline: boolean }> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') {
      params.append('category', filters.category);
    }
    if (filters.ghat) {
      params.append('ghat', filters.ghat);
    }
    if (filters.language) {
      params.append('language', filters.language);
    }

    const url = `${API_BASE_URL}/news?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for low connectivity

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const news: NewsPost[] = json.data || [];

        // Save general news to cache for offline availability
        if ((!filters.category || filters.category === 'all') && !filters.ghat) {
          SecureStore.setItemAsync(NEWS_CACHE_KEY, JSON.stringify(news)).catch(() => {});
        }

        return { news, isOffline: false };
      }
    } catch (networkError) {
      console.warn('[NewsService] Network error fetching news, reading offline cache:', networkError);
    }

    // Offline Cache Fallback
    try {
      const cached = await SecureStore.getItemAsync(NEWS_CACHE_KEY);
      if (cached) {
        let news: NewsPost[] = JSON.parse(cached);

        if (filters.category && filters.category !== 'all') {
          news = news.filter((n) => n.category === filters.category);
        }
        if (filters.ghat) {
          news = news.filter((n) => !n.ghat_ids || n.ghat_ids.length === 0 || n.ghat_ids.includes(filters.ghat!));
        }

        return { news, isOffline: true };
      }
    } catch (cacheErr) {
      console.warn('[NewsService] Error reading offline cache:', cacheErr);
    }

    return { news: [], isOffline: true };
  }

  /**
   * Fetch single news item by ID
   */
  static async getNewsById(id: string, language?: string): Promise<{ news: NewsPost | null; isOffline: boolean }> {
    const url = `${API_BASE_URL}/news/${id}${language ? `?language=${language}` : ''}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return { news: json.data, isOffline: false };
      }
    } catch (err) {
      console.warn('[NewsService] Network error fetching news by ID, checking cache');
    }

    // Try finding in offline cache
    try {
      const cached = await SecureStore.getItemAsync(NEWS_CACHE_KEY);
      if (cached) {
        const list: NewsPost[] = JSON.parse(cached);
        const found = list.find((n) => n.id === id);
        if (found) {
          return { news: found, isOffline: true };
        }
      }
    } catch {}

    return { news: null, isOffline: true };
  }

  /**
   * Fetch urgent / high-priority news for home alert banner
   */
  static async getUrgentNews(language?: string): Promise<NewsPost | null> {
    const { news } = await this.getNews({ category: 'urgent', language: language as any });
    if (news && news.length > 0) {
      return news[0];
    }

    // Fallback: Check if any post is pinned or high priority
    const all = await this.getNews({ language: language as any });
    const urgentCandidate = all.news.find((n) => n.priority === 'urgent' || (n.is_pinned && n.category === 'advisory'));
    return urgentCandidate || null;
  }

  /**
   * Fetch facilities for a specific ghat with offline cache
   */
  static async getGhatFacilities(ghatId: string): Promise<{ facilities: GhatFacility[]; isOffline: boolean }> {
    const url = `${API_BASE_URL}/ghats/${ghatId}/facilities`;
    const cacheKey = `${FACILITIES_CACHE_PREFIX}${ghatId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const facilities: GhatFacility[] = json.data || [];
        SecureStore.setItemAsync(cacheKey, JSON.stringify(facilities)).catch(() => {});
        return { facilities, isOffline: false };
      }
    } catch (err) {
      console.warn('[NewsService] Network error fetching facilities, reading cache');
    }

    // Offline cache fallback
    try {
      const cached = await SecureStore.getItemAsync(cacheKey);
      if (cached) {
        return { facilities: JSON.parse(cached), isOffline: true };
      }
    } catch {}

    return { facilities: [], isOffline: true };
  }

  /**
   * Register device FCM token with preferred language & subscribed ghat topics
   */
  static async registerDevice(payload: RegisterDevicePayload): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn('[NewsService] Failed to sync device token with server:', err);
      return false;
    }
  }
}

