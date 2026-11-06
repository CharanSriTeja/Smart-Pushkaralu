import { env } from '../../config/env.js';
import {
  NearbyPlace,
  NearbyPlacesResponse,
  PlaceCategory,
  QueryPlaceType,
  PlaceOverride,
} from '../../types/places.js';
import { PlacesRepository } from './places.repository.js';
import { PlacesApiService } from '../../services/places-api.service.js';
import { calculateHaversineDistanceMeters } from '../../services/distance.service.js';

export class PlacesService {
  public static readonly PUSHKARALU_DISCLAIMER =
    'Notice: During Godavari Pushkaralu, temple queues, road diversions, ghat security cordons, and parking regulations may affect real-time accessibility and timings. Conditions can change suddenly.';

  /**
   * Fetches nearby places for a ghat with cache check, stale-while-revalidate, and merging.
   */
  public static async getNearbyPlaces(
    ghatId: string,
    queryType: QueryPlaceType = 'all',
    radiusKm: number = 3
  ): Promise<NearbyPlacesResponse> {
    // 1. Validate Radius
    const allowedRadii = [1, 3, 5, 10];
    const safeRadiusKm = allowedRadii.includes(Number(radiusKm)) ? Number(radiusKm) : 3;
    const radiusMeters = safeRadiusKm * 1000;

    // 2. Validate Ghat
    const ghat = await PlacesRepository.getGhat(ghatId);
    if (!ghat) {
      const err = new Error('Ghat not found') as any;
      err.statusCode = 404;
      err.code = 'GHAT_NOT_FOUND';
      throw err;
    }

    const typeKey = queryType || 'all';

    // 3. Check Cache
    const cached = await PlacesRepository.getCacheRecord(ghatId, typeKey, radiusMeters);

    if (cached) {
      const now = new Date();
      const expiresAt = new Date(cached.expires_at);
      const isStale = now.getTime() > expiresAt.getTime();

      if (isStale) {
        // Stale-While-Revalidate: Return stale data immediately, refresh asynchronously in background
        console.log(
          `[PlacesService] Stale cache hit for ghat ${ghatId} (${typeKey}, ${safeRadiusKm}km). Serving stale data and queuing background refresh.`
        );
        this.refreshCacheInBackground(ghatId, ghat.lat, ghat.lng, typeKey, safeRadiusKm, radiusMeters).catch(
          (err) => console.error('[PlacesService] Background cache refresh failed:', err)
        );

        return {
          ghat_id: ghat.id,
          ghat_name: ghat.name,
          center: { lat: ghat.lat, lng: ghat.lng },
          radius_m: radiusMeters,
          radius_km: safeRadiusKm,
          type: typeKey,
          places: cached.results,
          total: cached.results.length,
          is_cached: true,
          is_stale: true,
          cached_at: new Date(cached.fetched_at).toISOString(),
          expires_at: expiresAt.toISOString(),
          disclaimer: this.PUSHKARALU_DISCLAIMER,
        };
      }

      // Fresh cache hit
      return {
        ghat_id: ghat.id,
        ghat_name: ghat.name,
        center: { lat: ghat.lat, lng: ghat.lng },
        radius_m: radiusMeters,
        radius_km: safeRadiusKm,
        type: typeKey,
        places: cached.results,
        total: cached.results.length,
        is_cached: true,
        is_stale: false,
        cached_at: new Date(cached.fetched_at).toISOString(),
        expires_at: expiresAt.toISOString(),
        disclaimer: this.PUSHKARALU_DISCLAIMER,
      };
    }

    // 4. Cache Miss: Fetch fresh, merge, and populate cache
    console.log(
      `[PlacesService] Cache miss for ghat ${ghatId} (${typeKey}, ${safeRadiusKm}km). Fetching fresh places.`
    );
    const { places, budgetGuardActive } = await this.computeNearbyPlaces(
      ghat.lat,
      ghat.lng,
      typeKey,
      radiusMeters
    );

    const expiryDays = env.PLACES_CACHE_EXPIRY_DAYS || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const cachedAt = new Date();

    // Persist to cache
    await PlacesRepository.saveCacheRecord(ghatId, typeKey, radiusMeters, places, expiresAt);

    return {
      ghat_id: ghat.id,
      ghat_name: ghat.name,
      center: { lat: ghat.lat, lng: ghat.lng },
      radius_m: radiusMeters,
      radius_km: safeRadiusKm,
      type: typeKey,
      places,
      total: places.length,
      is_cached: false,
      is_stale: false,
      cached_at: cachedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      budget_guard_active: budgetGuardActive,
      disclaimer: this.PUSHKARALU_DISCLAIMER,
    };
  }

  /**
   * Background cache refresh for stale records.
   */
  public static async refreshCacheInBackground(
    ghatId: string,
    ghatLat: number,
    ghatLng: number,
    queryType: QueryPlaceType,
    safeRadiusKm: number,
    radiusMeters: number
  ): Promise<void> {
    const { places } = await this.computeNearbyPlaces(ghatLat, ghatLng, queryType, radiusMeters);
    const expiryDays = env.PLACES_CACHE_EXPIRY_DAYS || 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    await PlacesRepository.saveCacheRecord(ghatId, queryType, radiusMeters, places, expiresAt);
    console.log(
      `[PlacesService] Background refresh completed for ghat ${ghatId} (${queryType}, ${safeRadiusKm}km). Saved ${places.length} places.`
    );
  }

  /**
   * Computes, merges, overrides, and sorts places for a coordinate and radius.
   */
  public static async computeNearbyPlaces(
    ghatLat: number,
    ghatLng: number,
    queryType: QueryPlaceType,
    radiusMeters: number
  ): Promise<{ places: NearbyPlace[]; budgetGuardActive: boolean }> {
    const categories: PlaceCategory[] =
      queryType === 'all'
        ? ['hotel', 'temple', 'transport_hub']
        : [queryType as PlaceCategory];

    // 1. Fetch curated places from database
    const curatedPromises: Promise<NearbyPlace[]>[] = [];
    if (categories.includes('hotel')) {
      curatedPromises.push(PlacesRepository.getCuratedHotels(ghatLat, ghatLng, radiusMeters));
    }
    if (categories.includes('temple')) {
      curatedPromises.push(PlacesRepository.getCuratedTemples(ghatLat, ghatLng, radiusMeters));
    }
    if (categories.includes('transport_hub')) {
      curatedPromises.push(PlacesRepository.getCuratedTransportHubs(ghatLat, ghatLng, radiusMeters));
    }

    const curatedLists = await Promise.all(curatedPromises);
    const curatedPlaces = curatedLists.flat();

    // 2. Fetch third-party places from Places API with budget guard & field masks
    const thirdPartyPromises = categories.map((cat) =>
      PlacesApiService.searchNearby(ghatLat, ghatLng, cat, radiusMeters)
    );
    const thirdPartyResults = await Promise.all(thirdPartyPromises);

    const thirdPartyPlaces: NearbyPlace[] = [];
    let budgetGuardActive = false;

    for (const res of thirdPartyResults) {
      if (res.budgetGuardActive) {
        budgetGuardActive = true;
      }
      thirdPartyPlaces.push(...res.places);
    }

    // 3. Load Overrides Map
    const overridesMap = await PlacesRepository.getOverridesMap();

    // 4. Deduplicate Third-Party against Curated (curated takes precedence if within 60 meters)
    const filteredThirdParty: NearbyPlace[] = [];
    for (const tp of thirdPartyPlaces) {
      const isDuplicateOfCurated = curatedPlaces.some((cp) => {
        const dist = calculateHaversineDistanceMeters(tp.lat, tp.lng, cp.lat, cp.lng);
        return dist <= 60;
      });

      if (!isDuplicateOfCurated) {
        filteredThirdParty.push(tp);
      }
    }

    // 5. Combine and Apply Overrides
    const combinedPlaces = [...curatedPlaces, ...filteredThirdParty];
    const finalPlaces: NearbyPlace[] = [];

    for (const place of combinedPlaces) {
      const override = overridesMap.get(place.id);

      // If hidden by override or if curated record is hidden, skip it
      if (override?.is_hidden || place.is_hidden) {
        continue;
      }

      // Apply overrides if available
      if (override) {
        if (override.name_override && Object.keys(override.name_override).length > 0) {
          place.name = {
            en: override.name_override.en || place.name.en,
            te: override.name_override.te || place.name.te,
            hi: override.name_override.hi || place.name.hi,
          };
        }
        if (override.phone_override) {
          place.phone = override.phone_override;
        }
        if (override.address_override && Object.keys(override.address_override).length > 0) {
          place.address = {
            en: override.address_override.en || place.address?.en || '',
            te: override.address_override.te || place.address?.te,
            hi: override.address_override.hi || place.address?.hi,
          };
        }
        if (override.custom_notes && Object.keys(override.custom_notes).length > 0) {
          place.custom_notes = override.custom_notes;
        }
      }

      finalPlaces.push(place);
    }

    // 6. Sort all by distance ascending
    finalPlaces.sort((a, b) => a.distance_m - b.distance_m);

    return {
      places: finalPlaces,
      budgetGuardActive,
    };
  }

  /**
   * Pre-warms cache for all published ghats.
   * Can be run on a schedule or triggered by admin.
   */
  public static async prewarmPublishedGhats(): Promise<{
    ghatsCount: number;
    warmedEntries: number;
    skippedFresh: number;
  }> {
    const publishedGhats = await PlacesRepository.getAllPublishedGhats();
    console.log(`[PlacesService] Starting cache pre-warming for ${publishedGhats.length} published ghats...`);

    let warmedEntries = 0;
    let skippedFresh = 0;

    const commonTypes: QueryPlaceType[] = ['all', 'hotel', 'temple', 'transport_hub'];
    const commonRadiiKm = [3, 5];

    for (const ghat of publishedGhats) {
      for (const type of commonTypes) {
        for (const radiusKm of commonRadiiKm) {
          const radiusMeters = radiusKm * 1000;
          const cached = await PlacesRepository.getCacheRecord(ghat.id, type, radiusMeters);

          const now = new Date();
          const isExpiredOrMissing = !cached || now.getTime() > new Date(cached.expires_at).getTime();

          if (isExpiredOrMissing) {
            try {
              const { places } = await this.computeNearbyPlaces(
                ghat.lat,
                ghat.lng,
                type,
                radiusMeters
              );
              const expiryDays = env.PLACES_CACHE_EXPIRY_DAYS || 7;
              const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
              await PlacesRepository.saveCacheRecord(ghat.id, type, radiusMeters, places, expiresAt);
              warmedEntries++;
            } catch (err) {
              console.warn(
                `[PlacesService] Failed to pre-warm cache for ghat ${ghat.id} (${type}, ${radiusKm}km):`,
                err
              );
            }
          } else {
            skippedFresh++;
          }
        }
      }
    }

    console.log(
      `[PlacesService] Pre-warm complete: ${warmedEntries} entries refreshed/warmed, ${skippedFresh} skipped fresh.`
    );
    return {
      ghatsCount: publishedGhats.length,
      warmedEntries,
      skippedFresh,
    };
  }
}
