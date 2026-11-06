import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { PlacesService } from '../src/modules/places/places.service.js';
import { PlacesRepository } from '../src/modules/places/places.repository.js';
import { PlacesApiService } from '../src/services/places-api.service.js';
import { calculateTravelEstimates, calculateHaversineDistanceMeters } from '../src/services/distance.service.js';
import { signAccessToken } from '../src/services/token.js';

// Mock DB query function
vi.mock('../src/db/index.js', () => {
  return {
    query: vi.fn(),
    pool: {
      connect: vi.fn(),
      query: vi.fn(),
    },
    withTransaction: vi.fn(async (callback) => {
      const mockClient = { query: vi.fn() };
      return callback(mockClient);
    }),
  };
});

import { query } from '../src/db/index.js';
const mockedQuery = vi.mocked(query);

describe('Module 5: Nearby Hotels, Temples, Transport Hubs & Cache', () => {
  const mockGhatId = '99999999-9999-9999-9999-999999999999';
  const mockGhat = {
    id: mockGhatId,
    name: { en: 'Kotilingala Ghat', te: 'కోటిలింగాల ఘాట్', hi: 'कोटिलिंगला घाट' },
    lat: 16.9922,
    lng: 81.7656,
    publish_status: 'published',
  };

  let mockUsageCount = 0;

  const adminToken = signAccessToken({
    userId: 'admin-uuid-1',
    phone: '+919876543210',
    firebaseUid: 'admin-f-uid',
    isAdmin: true,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUsageCount = 0;

    mockedQuery.mockImplementation(async (sql: string, params: any[] = []) => {
      const lowerSql = sql.toLowerCase().replace(/\s+/g, ' ');

      // Admin verification
      if (lowerSql.includes('from admins where user_id')) {
        const userId = params[0];
        if (userId === 'admin-uuid-1') {
          return {
            rows: [{ id: 'admin-rec-1', user_id: userId, role: 'super_admin', permissions: ['*'] }],
            rowCount: 1,
          } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      }

      // User lookup
      if (lowerSql.includes('from users where id = $1')) {
        const userId = params[0];
        return {
          rows: [
            {
              id: userId,
              phone: '+919876543210',
              name: 'Admin User',
              language: 'en',
              status: 'active',
              firebase_uid: 'admin-f-uid',
            },
          ],
          rowCount: 1,
        } as any;
      }

      // Usage stats
      if (lowerSql.includes('from places_api_usage')) {
        return {
          rows: [{ call_count: mockUsageCount }],
          rowCount: 1,
        } as any;
      }

      // Audit logs
      if (lowerSql.includes('insert into audit_logs')) {
        return {
          rows: [{ id: 'audit-log-uuid-1' }],
          rowCount: 1,
        } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  describe('Distance & Travel Time Calculations', () => {
    it('calculates Haversine distance accurately', () => {
      // Kotilingala Ghat (16.9922, 81.7656) to Pushkar Ghat (16.9850, 81.7700) is approx ~900-1000m
      const dist = calculateHaversineDistanceMeters(16.9922, 81.7656, 16.9850, 81.7700);
      expect(dist).toBeGreaterThan(800);
      expect(dist).toBeLessThan(1200);
    });

    it('computes realistic Pushkaralu travel estimates with speed factors', () => {
      // 3.0 km distance
      const estimates = calculateTravelEstimates(16.9922, 81.7656, 17.0100, 81.7700, 3000);
      expect(estimates.distance_m).toBe(3000);
      expect(estimates.distance_km).toBe(3.0);
      // At 15 km/h driving: (3.0 / 15) * 60 = 12 mins
      expect(estimates.driving_time_minutes).toBe(12);
      // At 4.5 km/h walking: (3.0 / 4.5) * 60 = 40 mins
      expect(estimates.walking_time_minutes).toBe(40);
      expect(estimates.estimated_time_text).toContain('12 min drive');
      expect(estimates.google_maps_url).toContain('https://www.google.com/maps/dir/?api=1');
      expect(estimates.google_maps_url).toContain('origin=16.9922,81.7656');
    });
  });

  describe('Cache Logic (Hit, Stale Refresh, Miss)', () => {
    it('returns fresh cached places immediately (cache hit)', async () => {
      // Mock ghat lookup
      vi.spyOn(PlacesRepository, 'getGhat').mockResolvedValue(mockGhat);

      const cachedPlaces = [
        {
          id: 'hotel-1',
          name: { en: 'River Bay Resort' },
          type: 'hotel' as const,
          source_type: 'curated' as const,
          lat: 16.995,
          lng: 81.767,
          distance_m: 350,
          distance_km: 0.4,
          driving_time_minutes: 2,
          walking_time_minutes: 5,
          estimated_time_text: '~5 min walk (350m)',
          google_maps_url: 'https://maps.google.com',
        },
      ];

      // Future expiration
      const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      vi.spyOn(PlacesRepository, 'getCacheRecord').mockResolvedValue({
        id: 'cache-1',
        ghat_id: mockGhatId,
        type: 'all',
        radius_m: 3000,
        results: cachedPlaces,
        fetched_at: new Date(),
        expires_at: futureExpiry,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await request(app).get(`/v1/ghats/${mockGhatId}/nearby?type=all&radius=3`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_cached).toBe(true);
      expect(res.body.data.is_stale).toBe(false);
      expect(res.body.data.places.length).toBe(1);
      expect(res.body.data.places[0].name.en).toBe('River Bay Resort');
    });

    it('serves stale cached data immediately and triggers background refresh when expired', async () => {
      vi.spyOn(PlacesRepository, 'getGhat').mockResolvedValue(mockGhat);

      const stalePlaces = [
        {
          id: 'temple-1',
          name: { en: 'Sri Kotilingeshwara Temple' },
          type: 'temple' as const,
          source_type: 'curated' as const,
          lat: 16.9926,
          lng: 81.7658,
          distance_m: 50,
          distance_km: 0.1,
          driving_time_minutes: 1,
          walking_time_minutes: 1,
          estimated_time_text: '~1 min walk (50m)',
          google_maps_url: 'https://maps.google.com',
        },
      ];

      // Past expiration (1 hour ago)
      const pastExpiry = new Date(Date.now() - 3600 * 1000);
      vi.spyOn(PlacesRepository, 'getCacheRecord').mockResolvedValue({
        id: 'cache-2',
        ghat_id: mockGhatId,
        type: 'temple',
        radius_m: 3000,
        results: stalePlaces,
        fetched_at: new Date(Date.now() - 8 * 24 * 3600 * 1000),
        expires_at: pastExpiry,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const backgroundRefreshSpy = vi
        .spyOn(PlacesService, 'refreshCacheInBackground')
        .mockResolvedValue(undefined);

      const res = await request(app).get(`/v1/ghats/${mockGhatId}/nearby?type=temple&radius=3`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_cached).toBe(true);
      expect(res.body.data.is_stale).toBe(true);
      expect(res.body.data.places[0].name.en).toBe('Sri Kotilingeshwara Temple');
      // Background refresh should be queued
      expect(backgroundRefreshSpy).toHaveBeenCalledWith(
        mockGhatId,
        mockGhat.lat,
        mockGhat.lng,
        'temple',
        3,
        3000
      );
    });

    it('computes fresh places and persists to cache on cache miss', async () => {
      vi.spyOn(PlacesRepository, 'getGhat').mockResolvedValue(mockGhat);
      vi.spyOn(PlacesRepository, 'getCacheRecord').mockResolvedValue(null);
      const saveCacheSpy = vi.spyOn(PlacesRepository, 'saveCacheRecord').mockResolvedValue(undefined);

      vi.spyOn(PlacesRepository, 'getCuratedHotels').mockResolvedValue([
        {
          id: 'curated-hotel-1',
          name: { en: 'Hotel Anand Regency', te: 'హోటల్ ఆనంద్ రీజెన్సీ' },
          type: 'hotel',
          source_type: 'curated',
          lat: 16.999,
          lng: 81.778,
          distance_m: 1400,
          distance_km: 1.4,
          driving_time_minutes: 6,
          walking_time_minutes: 19,
          estimated_time_text: '~6 min drive / ~19 min walk',
          google_maps_url: 'https://maps.google.com',
          is_verified: true,
        },
      ]);
      vi.spyOn(PlacesRepository, 'getCuratedTemples').mockResolvedValue([]);
      vi.spyOn(PlacesRepository, 'getCuratedTransportHubs').mockResolvedValue([]);
      vi.spyOn(PlacesApiService, 'searchNearby').mockResolvedValue({
        places: [],
        budgetGuardActive: false,
        totalCallsToday: 5,
      });
      vi.spyOn(PlacesRepository, 'getOverridesMap').mockResolvedValue(new Map());

      const res = await request(app).get(`/v1/ghats/${mockGhatId}/nearby?type=hotel&radius=3`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_cached).toBe(false);
      expect(res.body.data.is_stale).toBe(false);
      expect(res.body.data.places.length).toBe(1);
      expect(saveCacheSpy).toHaveBeenCalled();
    });
  });

  describe('Curated + Third-Party Merging & Deduplication', () => {
    it('labels curated and third-party places, and drops 3rd-party duplicates within 60m', async () => {
      vi.spyOn(PlacesRepository, 'getCuratedHotels').mockResolvedValue([
        {
          id: 'curated-h1',
          name: { en: 'River Bay Official Resort' },
          type: 'hotel',
          source_type: 'curated',
          lat: 16.9950,
          lng: 81.7670,
          distance_m: 350,
          distance_km: 0.4,
          driving_time_minutes: 2,
          walking_time_minutes: 5,
          estimated_time_text: '~5 min walk',
          google_maps_url: 'https://maps.google.com',
        },
      ]);

      // Third party returns 2 items: 1 is duplicate at (16.9951, 81.7671) ~15m away, 1 is distinct at (16.999, 81.770)
      vi.spyOn(PlacesApiService, 'searchNearby').mockResolvedValue({
        places: [
          {
            id: 'google-duplicate',
            name: { en: 'River Bay Hotel (Google Listing)' },
            type: 'hotel',
            source_type: 'third_party',
            lat: 16.9951,
            lng: 81.7671,
            distance_m: 360,
            distance_km: 0.4,
            driving_time_minutes: 2,
            walking_time_minutes: 5,
            estimated_time_text: '~5 min walk',
            google_maps_url: 'https://maps.google.com',
          },
          {
            id: 'google-distinct',
            name: { en: 'Pushkar Guest Inn' },
            type: 'hotel',
            source_type: 'third_party',
            lat: 16.9990,
            lng: 81.7700,
            distance_m: 800,
            distance_km: 0.8,
            driving_time_minutes: 3,
            walking_time_minutes: 11,
            estimated_time_text: '~3 min drive',
            google_maps_url: 'https://maps.google.com',
          },
        ],
        budgetGuardActive: false,
        totalCallsToday: 1,
      });

      vi.spyOn(PlacesRepository, 'getOverridesMap').mockResolvedValue(new Map());

      const result = await PlacesService.computeNearbyPlaces(16.9922, 81.7656, 'hotel', 3000);

      // The duplicate should be dropped; exactly 2 places remain: curated-h1 and google-distinct
      expect(result.places.length).toBe(2);
      expect(result.places[0].id).toBe('curated-h1');
      expect(result.places[0].source_type).toBe('curated');
      expect(result.places[1].id).toBe('google-distinct');
      expect(result.places[1].source_type).toBe('third_party');
    });
  });

  describe('Override Logic & Hiding', () => {
    it('applies admin overrides onto place and hides places marked is_hidden', async () => {
      vi.spyOn(PlacesRepository, 'getCuratedHotels').mockResolvedValue([
        {
          id: 'place-override-target',
          name: { en: 'Old noisy inn' },
          type: 'hotel',
          source_type: 'curated',
          lat: 16.9950,
          lng: 81.7670,
          distance_m: 350,
          distance_km: 0.4,
          driving_time_minutes: 2,
          walking_time_minutes: 5,
          estimated_time_text: '~5 min walk',
          google_maps_url: 'https://maps.google.com',
        },
        {
          id: 'place-hidden-target',
          name: { en: 'Dilapidated Dharmashala' },
          type: 'hotel',
          source_type: 'curated',
          lat: 16.9960,
          lng: 81.7680,
          distance_m: 500,
          distance_km: 0.5,
          driving_time_minutes: 2,
          walking_time_minutes: 7,
          estimated_time_text: '~7 min walk',
          google_maps_url: 'https://maps.google.com',
        },
      ]);

      vi.spyOn(PlacesApiService, 'searchNearby').mockResolvedValue({
        places: [],
        budgetGuardActive: false,
        totalCallsToday: 1,
      });

      const overridesMap = new Map();
      overridesMap.set('place-override-target', {
        id: 'ov-1',
        place_id: 'place-override-target',
        name_override: { en: 'Renovated Pilgrim Shelter', te: 'పునరుద్ధరించిన యాత్రికుల ఆశ్రయం' },
        phone_override: '+91 99999 88888',
        custom_notes: { en: 'Designated for senior citizens only' },
        is_hidden: false,
      });
      overridesMap.set('place-hidden-target', {
        id: 'ov-2',
        place_id: 'place-hidden-target',
        is_hidden: true, // Marked hidden!
      });

      vi.spyOn(PlacesRepository, 'getOverridesMap').mockResolvedValue(overridesMap);

      const result = await PlacesService.computeNearbyPlaces(16.9922, 81.7656, 'hotel', 3000);

      // Hidden target must be filtered out!
      expect(result.places.length).toBe(1);
      const place = result.places[0];
      expect(place.id).toBe('place-override-target');
      // Overridden fields
      expect(place.name.en).toBe('Renovated Pilgrim Shelter');
      expect(place.name.te).toBe('పునరుద్ధరించిన యాత్రికుల ఆశ్రయం');
      expect(place.phone).toBe('+91 99999 88888');
      expect(place.custom_notes?.en).toBe('Designated for senior citizens only');
    });
  });

  describe('Google Places API Daily Budget Guard', () => {
    it('stops external calls and trips budget guard when daily limit is reached', async () => {
      // Set usage count to daily limit
      mockUsageCount = 500;

      const res = await PlacesApiService.searchNearby(16.9922, 81.7656, 'hotel', 3000);

      expect(res.budgetGuardActive).toBe(true);
      expect(res.places).toEqual([]);
      expect(res.totalCallsToday).toBe(500);
    });
  });

  describe('Pre-warm Cache Job', () => {
    it('iterates through published ghats and warms missing/expired cache', async () => {
      vi.spyOn(PlacesRepository, 'getAllPublishedGhats').mockResolvedValue([
        { id: 'ghat-1', name: { en: 'Ghat 1' }, lat: 16.99, lng: 81.76 },
        { id: 'ghat-2', name: { en: 'Ghat 2' }, lat: 17.66, lng: 80.88 },
      ]);

      // Return missing cache
      vi.spyOn(PlacesRepository, 'getCacheRecord').mockResolvedValue(null);
      vi.spyOn(PlacesService, 'computeNearbyPlaces').mockResolvedValue({
        places: [],
        budgetGuardActive: false,
      });
      const saveSpy = vi.spyOn(PlacesRepository, 'saveCacheRecord').mockResolvedValue(undefined);

      const stats = await PlacesService.prewarmPublishedGhats();

      expect(stats.ghatsCount).toBe(2);
      expect(stats.warmedEntries).toBeGreaterThan(0);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Admin Operations & Mandatory Audit Logging', () => {
    it('requires an audit reason when creating a curated hotel', async () => {
      const res = await request(app)
        .post('/v1/admin/places/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'Test Hotel' },
          lat: 16.99,
          lng: 81.76,
          // Missing reason!
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates a curated hotel and records audit log when valid', async () => {
      vi.spyOn(PlacesRepository, 'createHotel').mockResolvedValue({
        id: 'new-hotel-uuid',
        name: { en: 'Pushkaralu Grand Inn' },
        lat: 16.99,
        lng: 81.76,
        is_verified: true,
        is_hidden: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/v1/admin/places/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'Pushkaralu Grand Inn', te: 'పుష్కరాలు గ్రాండ్ ఇన్' },
          lat: 16.99,
          lng: 81.76,
          price_range: 'budget',
          reason: 'Verified official hotel listing for pilgrims',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('new-hotel-uuid');
    });

    it('returns cache status and API usage to admin', async () => {
      vi.spyOn(PlacesRepository, 'getCacheStatusList').mockResolvedValue([
        {
          id: 'c-1',
          ghat_id: mockGhatId,
          type: 'all',
          radius_m: 3000,
          fetched_at: new Date(),
          expires_at: new Date(),
          item_count: 5,
          is_stale: false,
          ghat_name: { en: 'Kotilingala Ghat' },
        },
      ]);

      vi.spyOn(PlacesApiService, 'getDailyUsageStats').mockResolvedValue({
        usage_date: '2026-11-06',
        call_count: 42,
        daily_limit: 500,
        remaining: 458,
        limit_reached: false,
      });

      const res = await request(app)
        .get('/v1/admin/places/cache-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cache_entries.length).toBe(1);
      expect(res.body.data.usage_stats.call_count).toBe(42);
      expect(res.body.data.usage_stats.remaining).toBe(458);
    });
  });
});
