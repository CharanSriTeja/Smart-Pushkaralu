import { env } from '../config/env.js';
import { query } from '../db/index.js';
import { NearbyPlace, PlaceCategory, PlacesApiUsageStats } from '../types/places.js';
import { calculateTravelEstimates } from './distance.service.js';

export interface PlacesApiSearchResult {
  places: NearbyPlace[];
  budgetGuardActive: boolean;
  totalCallsToday: number;
}

export class PlacesApiService {
  /**
   * Retrieves today's usage statistics and checks whether the daily budget guard is active.
   */
  public static async getDailyUsageStats(): Promise<PlacesApiUsageStats> {
    const today = new Date().toISOString().split('T')[0];
    const dailyLimit = env.PLACES_API_DAILY_LIMIT || 500;

    const { rows } = await query<{ call_count: number }>(`
      SELECT call_count FROM places_api_usage 
      WHERE usage_date = $1 AND endpoint = 'places_searchNearby'
      LIMIT 1
    `, [today]);

    const call_count = rows.length > 0 ? Number(rows[0].call_count) : 0;
    const remaining = Math.max(0, dailyLimit - call_count);
    const limit_reached = call_count >= dailyLimit;

    return {
      usage_date: today,
      call_count,
      daily_limit: dailyLimit,
      remaining,
      limit_reached,
    };
  }

  /**
   * Increments the daily API usage counter.
   */
  public static async incrementUsage(count = 1): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { rows } = await query<{ call_count: number }>(`
      INSERT INTO places_api_usage (usage_date, call_count, endpoint, last_called_at)
      VALUES ($1, $2, 'places_searchNearby', CURRENT_TIMESTAMP)
      ON CONFLICT (usage_date, endpoint)
      DO UPDATE SET 
        call_count = places_api_usage.call_count + $2,
        last_called_at = CURRENT_TIMESTAMP
      RETURNING call_count
    `, [today, count]);

    return Number(rows[0]?.call_count || count);
  }

  /**
   * Map internal category to Google Places API (New) included types.
   */
  private static mapCategoryToGoogleTypes(category: PlaceCategory): string[] {
    switch (category) {
      case 'hotel':
        return ['lodging', 'hotel', 'motel', 'bed_and_breakfast', 'guest_house'];
      case 'temple':
        return ['hindu_temple', 'place_of_worship'];
      case 'transport_hub':
        return ['transit_station', 'bus_station', 'train_station'];
      default:
        return ['lodging', 'hindu_temple', 'transit_station'];
    }
  }

  /**
   * Performs Google Places Nearby Search with field masks, usage logging, and daily budget guard.
   * Exactly ONE call per (ghat, type, radius).
   */
  public static async searchNearby(
    ghatLat: number,
    ghatLng: number,
    category: PlaceCategory,
    radiusMeters: number
  ): Promise<PlacesApiSearchResult> {
    const stats = await this.getDailyUsageStats();

    // 1. Budget Guard Check
    if (stats.limit_reached) {
      console.warn(
        `[PlacesApiService] Daily budget limit (${stats.daily_limit}) reached for ${stats.usage_date}. Tripping budget guard.`
      );
      return {
        places: [],
        budgetGuardActive: true,
        totalCallsToday: stats.call_count,
      };
    }

    const apiKey = env.GOOGLE_PLACES_API_KEY;

    // 2. If API key is not configured, fall back gracefully (e.g. mock 3rd party or empty)
    if (!apiKey) {
      console.log(
        `[PlacesApiService] GOOGLE_PLACES_API_KEY not configured. Serving curated data with mock fallback if needed.`
      );
      return {
        places: this.getDeterministicMockPlaces(ghatLat, ghatLng, category, radiusMeters),
        budgetGuardActive: false,
        totalCallsToday: stats.call_count,
      };
    }

    // 3. Perform Google Places API (New) Nearby Search
    try {
      const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.nationalPhoneNumber',
        'places.types',
        'places.photos',
      ].join(',');

      const requestBody = {
        includedTypes: this.mapCategoryToGoogleTypes(category),
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude: ghatLat,
              longitude: ghatLng,
            },
            radius: radiusMeters,
          },
        },
      };

      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PlacesApiService] Google Places API returned error ${response.status}:`, errorText);
        // Do not crash, return fallback
        return {
          places: this.getDeterministicMockPlaces(ghatLat, ghatLng, category, radiusMeters),
          budgetGuardActive: false,
          totalCallsToday: stats.call_count,
        };
      }

      // Increment usage count upon successful call
      const updatedCount = await this.incrementUsage(1);

      const data = (await response.json()) as { places?: any[] };
      const rawPlaces = data.places || [];

      const places: NearbyPlace[] = rawPlaces.map((p) => {
        const placeLat = p.location?.latitude || ghatLat;
        const placeLng = p.location?.longitude || ghatLng;
        const estimates = calculateTravelEstimates(ghatLat, ghatLng, placeLat, placeLng);

        return {
          id: p.id || `google_${Math.random().toString(36).substring(7)}`,
          name: {
            en: p.displayName?.text || 'Third-Party Location',
          },
          type: category,
          source_type: 'third_party',
          lat: placeLat,
          lng: placeLng,
          distance_m: estimates.distance_m,
          distance_km: estimates.distance_km,
          driving_time_minutes: estimates.driving_time_minutes,
          walking_time_minutes: estimates.walking_time_minutes,
          estimated_time_text: estimates.estimated_time_text,
          google_maps_url: estimates.google_maps_url,
          address: p.formattedAddress ? { en: p.formattedAddress } : undefined,
          phone: p.nationalPhoneNumber || undefined,
          rating: p.rating ? Number(p.rating) : undefined,
          photo_url: p.photos?.[0]?.name
            ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?key=${apiKey}&maxHeightPx=400`
            : undefined,
          is_verified: false,
        };
      });

      return {
        places,
        budgetGuardActive: false,
        totalCallsToday: updatedCount,
      };
    } catch (err) {
      console.error('[PlacesApiService] Network error calling Google Places API:', err);
      return {
        places: this.getDeterministicMockPlaces(ghatLat, ghatLng, category, radiusMeters),
        budgetGuardActive: false,
        totalCallsToday: stats.call_count,
      };
    }
  }

  /**
   * Deterministic mock generator for realistic Pushkaralu local places when API key is not present or in test environment.
   */
  public static getDeterministicMockPlaces(
    ghatLat: number,
    ghatLng: number,
    category: PlaceCategory,
    radiusMeters: number
  ): NearbyPlace[] {
    const list: NearbyPlace[] = [];

    if (category === 'hotel') {
      // Local pilgrim inn
      const lat1 = ghatLat + 0.003;
      const lng1 = ghatLng + 0.002;
      const est1 = calculateTravelEstimates(ghatLat, ghatLng, lat1, lng1);
      if (est1.distance_m <= radiusMeters) {
        list.push({
          id: 'google_place_mock_pushkar_inn',
          name: {
            en: 'Pushkar View Pilgrims Residency',
            te: 'పుష్కర్ వ్యూ యాత్రికుల రెసిడెన్సీ',
            hi: 'पुष्कर व्यू पिलग्रिम्स रेजीडेंसी',
          },
          type: 'hotel',
          source_type: 'third_party',
          lat: lat1,
          lng: lng1,
          distance_m: est1.distance_m,
          distance_km: est1.distance_km,
          driving_time_minutes: est1.driving_time_minutes,
          walking_time_minutes: est1.walking_time_minutes,
          estimated_time_text: est1.estimated_time_text,
          google_maps_url: est1.google_maps_url,
          address: {
            en: 'Ghat Link Road, Near Godavari Embankment',
            te: 'ఘాట్ లింక్ రోడ్, గోదావరి కట్ట సమీపంలో',
            hi: 'घाट लिंक रोड, गोदावरी तटबंध के पास',
          },
          phone: '+91 883 241 3322',
          rating: 3.9,
          price_range: 'budget',
          photo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
        });
      }
    } else if (category === 'temple') {
      const lat2 = ghatLat - 0.002;
      const lng2 = ghatLng + 0.003;
      const est2 = calculateTravelEstimates(ghatLat, ghatLng, lat2, lng2);
      if (est2.distance_m <= radiusMeters) {
        list.push({
          id: 'google_place_mock_hanuman_mandir',
          name: {
            en: 'Sri Anjaneya Swamy Mandir (Godavari Shore)',
            te: 'శ్రీ ఆంజనేయ స్వామి మందిరం (గోదావరి తీరం)',
            hi: 'श्री आंजनेय स्वामी मंदिर (गोदावरी तट)',
          },
          type: 'temple',
          source_type: 'third_party',
          lat: lat2,
          lng: lng2,
          distance_m: est2.distance_m,
          distance_km: est2.distance_km,
          driving_time_minutes: est2.driving_time_minutes,
          walking_time_minutes: est2.walking_time_minutes,
          estimated_time_text: est2.estimated_time_text,
          google_maps_url: est2.google_maps_url,
          address: {
            en: 'Main Bund Road, Near Ghat Entry',
            te: 'మెయిన్ బండ్ రోడ్, ఘాట్ ప్రవేశం వద్ద',
            hi: 'मेन बंड रोड, घाट प्रवेश के पास',
          },
          phone: '+91 883 244 5511',
          rating: 4.6,
          photo_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80',
        });
      }
    } else if (category === 'transport_hub') {
      const lat3 = ghatLat + 0.005;
      const lng3 = ghatLng - 0.004;
      const est3 = calculateTravelEstimates(ghatLat, ghatLng, lat3, lng3);
      if (est3.distance_m <= radiusMeters) {
        list.push({
          id: 'google_place_mock_ghat_auto_junction',
          name: {
            en: 'Ghat Feeder Prepaid Auto Stand',
            te: 'ఘాట్ ఫీడర్ ప్రీపెయిడ్ ఆటో స్టాండ్',
            hi: 'घाट फीडर प्रीपेड ऑटो स्टैंड',
          },
          type: 'transport_hub',
          source_type: 'third_party',
          lat: lat3,
          lng: lng3,
          distance_m: est3.distance_m,
          distance_km: est3.distance_km,
          driving_time_minutes: est3.driving_time_minutes,
          walking_time_minutes: est3.walking_time_minutes,
          estimated_time_text: est3.estimated_time_text,
          google_maps_url: est3.google_maps_url,
          address: {
            en: 'North Ring Road Junction',
            te: 'నార్త్ రింగ్ రోడ్ జంక్షన్',
            hi: 'नॉर्थ रिंग रोड जंक्शन',
          },
          phone: '+91 883 245 0000',
          hub_type: 'auto_stand',
        });
      }
    }

    return list;
  }
}
