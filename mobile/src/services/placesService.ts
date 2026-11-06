import * as SecureStore from 'expo-secure-store';
import { NearbyPlace, NearbyPlacesResponse, QueryPlaceType } from '../types/places';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/v1';
const PLACES_CACHE_PREFIX = 'offline_cached_nearby_places_';

export class PlacesService {
  /**
   * Fetches nearby places for a ghat by type and radius (1, 3, 5, 10 km).
   * Supports offline cache fallback for weak network environments during Pushkaralu.
   */
  static async getNearbyPlaces(
    ghatId: string,
    type: QueryPlaceType = 'all',
    radiusKm: number = 3
  ): Promise<{ data: NearbyPlacesResponse; isOffline: boolean }> {
    const cacheKey = `${PLACES_CACHE_PREFIX}${ghatId}_${type}_${radiusKm}`;
    const url = `${API_BASE_URL}/ghats/${ghatId}/nearby?type=${type}&radius=${radiusKm}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for low connectivity

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const responseData: NearbyPlacesResponse = json.data;

        // Save to offline storage
        SecureStore.setItemAsync(cacheKey, JSON.stringify(responseData)).catch(() => {});

        return { data: responseData, isOffline: false };
      }
    } catch (networkError) {
      console.warn('[PlacesService] Network error fetching nearby places, falling back to cache:', networkError);
    }

    // Attempt offline fallback
    try {
      const cached = await SecureStore.getItemAsync(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as NearbyPlacesResponse;
        return { data, isOffline: true };
      }
    } catch (cacheErr) {
      console.warn('[PlacesService] Failed reading offline cache:', cacheErr);
    }

    // Default empty fallback
    return {
      data: {
        ghat_id: ghatId,
        ghat_name: { en: 'Ghat' },
        center: { lat: 0, lng: 0 },
        radius_m: radiusKm * 1000,
        radius_km: radiusKm,
        type,
        places: [],
        total: 0,
        is_cached: false,
        is_stale: false,
        cached_at: null,
        expires_at: null,
        disclaimer: 'Notice: Pushkaralu traffic regulations may affect timings and accessibility.',
      },
      isOffline: true,
    };
  }
}
