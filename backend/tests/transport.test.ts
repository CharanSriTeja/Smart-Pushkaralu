import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceMeters,
  calculateTravelEstimates,
} from '../src/services/distance.service.js';
import { calculateHaversineDistance } from '../src/utils/geo.js';
import { transportService } from '../src/modules/transport/transport.service.js';
import { transportController } from '../src/modules/transport/transport.controller.js';
import { busApiAdapter } from '../src/modules/transport/adapters/bus-adapter.js';
import { railApiAdapter } from '../src/modules/transport/adapters/rail-adapter.js';

describe('Module 6: Transport and Shuttles Tests', () => {
  // Pushkar Ghat coordinates (Rajahmundry)
  const PUSHKAR_GHAT_LAT = 17.0005;
  const PUSHKAR_GHAT_LNG = 81.7766;

  // Rajahmundry Central Bus Station
  const RJY_BUS_STAND_LAT = 17.0095;
  const RJY_BUS_STAND_LNG = 81.7892;

  // Rajahmundry Railway Station (RJY)
  const RJY_RAIL_LAT = 16.9934;
  const RJY_RAIL_LNG = 81.7821;

  // Godavari Railway Station (GVN - adjacent halt)
  const GVN_RAIL_LAT = 17.0022;
  const GVN_RAIL_LNG = 81.7745;

  // ==========================================
  // PART 1: DISTANCE CALCULATION TESTS
  // ==========================================
  describe('1. Geographic Distance & Travel Estimates', () => {
    it('accurately calculates Haversine distance between Pushkar Ghat and Rajahmundry Bus Station', () => {
      const distanceMeters = calculateHaversineDistanceMeters(
        PUSHKAR_GHAT_LAT,
        PUSHKAR_GHAT_LNG,
        RJY_BUS_STAND_LAT,
        RJY_BUS_STAND_LNG
      );

      // Distance is ~1.65 km (1400 - 1900 meters)
      expect(distanceMeters).toBeGreaterThan(1400);
      expect(distanceMeters).toBeLessThan(1900);
    });

    it('calculates walking distance from Godavari Station (GVN) to Pushkar Ghat as under 500 meters', () => {
      const distanceMeters = calculateHaversineDistance(
        PUSHKAR_GHAT_LAT,
        PUSHKAR_GHAT_LNG,
        GVN_RAIL_LAT,
        GVN_RAIL_LNG
      );

      // Godavari halt is directly adjacent to Pushkar Ghat
      expect(distanceMeters).toBeLessThan(500);
    });

    it('computes festival travel time estimates with realistic driving speed factors', () => {
      const estimates = calculateTravelEstimates(
        PUSHKAR_GHAT_LAT,
        PUSHKAR_GHAT_LNG,
        RJY_RAIL_LAT,
        RJY_RAIL_LNG
      );

      expect(estimates.distance_km).toBeGreaterThan(0.5);
      expect(estimates.distance_km).toBeLessThan(2.0);
      expect(estimates.driving_time_minutes).toBeGreaterThan(0);
      expect(estimates.walking_time_minutes).toBeGreaterThan(0);
      expect(estimates.google_maps_url).toContain('https://www.google.com/maps/dir/?api=1');
      expect(estimates.google_maps_url).toContain('destination=16.9934,81.7821');
    });
  });

  // ==========================================
  // PART 2: OFFICIAL EXTERNAL LINKS CONFIG TESTS
  // ==========================================
  describe('2. Official External Links Configuration', () => {
    it('configures verified APSRTC and TGSRTC booking portals with official authorities', async () => {
      const repo = transportService.getRepo();
      const busLinks = await repo.getExternalLinks({ category: 'bus' });

      expect(busLinks.length).toBeGreaterThanOrEqual(2);

      const apsrtc = busLinks.find((l) => l.key === 'apsrtc_booking');
      expect(apsrtc).toBeDefined();
      expect(apsrtc?.url).toBe('https://www.apsrtconline.in');
      expect(apsrtc?.official_authority).toContain('APSRTC');
      expect(apsrtc?.is_verified).toBe(true);

      const tgsrtc = busLinks.find((l) => l.key === 'tgsrtc_booking');
      expect(tgsrtc).toBeDefined();
      expect(tgsrtc?.url).toBe('https://www.tgsrtcbus.in');
      expect(tgsrtc?.official_authority).toContain('TGSRTC');
      expect(tgsrtc?.is_verified).toBe(true);
    });

    it('configures official Indian Railways (CRIS / NTES / IRCTC) links for enquiry, availability, PNR, live status, and helpline 139', async () => {
      const repo = transportService.getRepo();
      const railLinks = await repo.getExternalLinks({ category: 'rail' });

      expect(railLinks.length).toBeGreaterThanOrEqual(5);

      const keys = railLinks.map((l) => l.key);
      expect(keys).toContain('rail_ntes_enquiry');
      expect(keys).toContain('irctc_seat_avail');
      expect(keys).toContain('rail_pnr_status');
      expect(keys).toContain('rail_live_status');
      expect(keys).toContain('rail_madad_helpline');

      // Verify all links use HTTPS secure URLs
      for (const link of railLinks) {
        expect(link.url.startsWith('https://')).toBe(true);
        expect(link.is_verified).toBe(true);
      }
    });
  });

  // ==========================================
  // PART 3: ADAPTER INTERFACES & STUB ROUTE TESTS
  // ==========================================
  describe('3. Adapter Interfaces & Stub Routes (Strict Compliance: No Scraping / No Unofficial APIs)', () => {
    it('busApiAdapter returns structured integration_pending stub responses with official portal URLs', async () => {
      const routesStub = await busApiAdapter.getRoutes({ route_number: '101' });
      expect(routesStub.status).toBe('integration_pending');
      expect(routesStub.is_stub).toBe(true);
      expect(routesStub.official_portal_url).toBe('https://www.apsrtconline.in');
      expect(routesStub.policy).toContain('scraping');

      const liveStub = await busApiAdapter.getLiveTracking({ vehicle_no: 'AP28Z1234' });
      expect(liveStub.status).toBe('integration_pending');
      expect(liveStub.official_portal_url).toBe('https://www.apsrtconline.in');

      const stopsStub = await busApiAdapter.getStops({ route_id: 'rjy-101' });
      expect(stopsStub.status).toBe('integration_pending');

      const specialStub = await busApiAdapter.getSpecialServices();
      expect(specialStub.status).toBe('integration_pending');
    });

    it('railApiAdapter returns structured integration_pending stub responses with CRIS / NTES URLs', async () => {
      const stationsStub = await railApiAdapter.getNearbyStations({ lat: 17.0, lng: 81.7 });
      expect(stationsStub.status).toBe('integration_pending');
      expect(stationsStub.is_stub).toBe(true);
      expect(stationsStub.official_portal_url).toBe('https://enquiry.indianrail.gov.in');

      const trainsStub = await railApiAdapter.getTrains({ origin_station: 'BZA', destination_station: 'RJY' });
      expect(trainsStub.status).toBe('integration_pending');

      const scheduleStub = await railApiAdapter.getSchedule({ train_number: '12727' });
      expect(scheduleStub.status).toBe('integration_pending');

      const availStub = await railApiAdapter.getAvailability({ train_number: '12727' });
      expect(availStub.status).toBe('integration_pending');
      expect(availStub.official_portal_url).toBe('https://www.irctc.co.in');
      expect(availStub.policy).toContain('scraping');
    });

    it('controller stub handlers return 200 with integration_pending payload', async () => {
      const mockReq = { query: {} } as any;
      let statusResult: number = 0;
      let jsonResult: any = null;

      const mockRes = {
        status: (code: number) => {
          statusResult = code;
          return mockRes;
        },
        json: (data: any) => {
          jsonResult = data;
        },
      } as any;

      await transportController.getBusRoutesStub(mockReq, mockRes);
      expect(statusResult).toBe(200);
      expect(jsonResult.status).toBe('integration_pending');
      expect(jsonResult.is_stub).toBe(true);

      await transportController.getRailNearbyStationsStub(mockReq, mockRes);
      expect(statusResult).toBe(200);
      expect(jsonResult.status).toBe('integration_pending');
      expect(jsonResult.official_portal_url).toContain('indianrail.gov.in');
    });
  });

  // ==========================================
  // PART 4: PUBLIC TRANSPORT APIS & DISCLAIMER
  // ==========================================
  describe('4. Public Transport Service & Ghat Proximity', () => {
    it('getBusTransport returns nearby hubs sorted by distance and official links', async () => {
      const data = await transportService.getBusTransport();

      expect(data.hubs).toBeDefined();
      expect(data.hubs.length).toBeGreaterThan(0);
      expect(data.hubs[0].distance_m).toBeDefined();
      expect(data.hubs[0].driving_time_minutes).toBeDefined();

      // Verify sorting by distance ascending
      if (data.hubs.length >= 2) {
        expect(data.hubs[0].distance_m).toBeLessThanOrEqual(data.hubs[1].distance_m);
      }

      // Verify disclaimer text exists in Telugu, English, Hindi
      expect(data.disclaimer.en).toBeDefined();
      expect(data.disclaimer.te).toBeDefined();
      expect(data.disclaimer.hi).toBeDefined();
      expect(data.disclaimer.en).toContain('change suddenly');

      // Verify official links
      expect(data.official_links.length).toBeGreaterThanOrEqual(1);
      expect(data.official_links.some((l: any) => l.key === 'apsrtc_booking')).toBe(true);
    });

    it('getRailTransport returns stations with platform info, helplines, and NTES links', async () => {
      const data = await transportService.getRailTransport();

      expect(data.stations).toBeDefined();
      expect(data.stations.length).toBeGreaterThan(0);

      const stationCodes = data.stations.map((s: any) => s.station_code);
      expect(stationCodes).toContain('RJY');

      // Check distance attached
      expect(data.stations[0].distance_km).toBeDefined();

      // Check official links include PNR & NTES
      const linkKeys = data.official_links.map((l: any) => l.key);
      expect(linkKeys).toContain('rail_ntes_enquiry');
      expect(linkKeys).toContain('irctc_seat_avail');
      expect(linkKeys).toContain('rail_pnr_status');
    });

    it('getShuttlesTransport returns free pilgrimage shuttles and intermediate stops', async () => {
      const data = await transportService.getShuttlesTransport();

      expect(data.shuttle_routes).toBeDefined();
      expect(data.shuttle_routes.length).toBeGreaterThan(0);

      const freeShuttles = data.shuttle_routes.filter((s: any) => s.shuttle_type === 'free');
      expect(freeShuttles.length).toBeGreaterThan(0);
      expect(freeShuttles[0].fare).toBe(0);

      // Verify accessibility for elderly and disabled
      expect(data.shuttle_routes.some((s: any) => s.accessible_for_elderly_disabled === true)).toBe(true);

      // Verify stops
      const greenRoute = data.shuttle_routes.find((s: any) => s.route_code === 'SHTL-GREEN-01');
      if (greenRoute && greenRoute.stops) {
        expect(greenRoute.stops.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ==========================================
  // PART 5: ADMIN CRUD & AUDIT LOGGING
  // ==========================================
  describe('5. Admin Transport CRUD & Audit Trail', () => {
    it('allows admin to list hubs and create a new transport hub', async () => {
      const newHubPayload = {
        name: {
          en: 'Kotilingala Temporary Parking & Auto Stand',
          te: 'కోటిలింగాల తాత్కాలిక పార్కింగ్ మరియు ఆటో స్టాండ్',
          hi: 'कोटिशिंगला अस्थायी पार्किंग और ऑटो स्टैंड',
        },
        hub_type: 'auto_stand' as const,
        operator: 'Rajahmundry Municipal Corporation',
        code: 'KOTI-PARK-01',
        phone: '100',
        lat: 17.0048,
        lng: 81.7725,
        reason: 'Added auto stand for Kotilingala Ghat crowd management',
      };

      const mockReq = {
        body: newHubPayload,
        originalUrl: '/v1/admin/transport/hubs',
        user: { id: 'admin-super-01' },
      } as any;

      let statusResult = 0;
      let jsonResult: any = null;
      const mockRes = {
        status: (code: number) => {
          statusResult = code;
          return mockRes;
        },
        json: (data: any) => {
          jsonResult = data;
        },
      } as any;

      await transportController.createAdminHub(mockReq, mockRes);
      expect(statusResult).toBe(201);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.item.code).toBe('KOTI-PARK-01');

      // Update hub
      const updateReq = {
        params: { id: jsonResult.item.id },
        body: { phone: '+91 883 2445566', reason: 'Updated contact phone' },
        originalUrl: `/v1/admin/transport/hubs/${jsonResult.item.id}`,
        user: { id: 'admin-super-01' },
      } as any;

      await transportController.updateAdminHub(updateReq, mockRes);
      expect(statusResult).toBe(200);
      expect(jsonResult.item.phone).toBe('+91 883 2445566');
    });

    it('allows admin to create a Pushkaralu special bus route', async () => {
      const routePayload = {
        route_number: 'SPL-EXP-99',
        operator: 'SPECIAL_RTC' as const,
        origin: { en: 'Dowleswaram Barrage Junction', te: 'ధవళేశ్వరం బ్యారేజ్ జంక్షన్' },
        destination: { en: 'Pushkar Ghat South', te: 'పుష్కర్ ఘాట్ సౌత్' },
        frequency_minutes: 10,
        bus_type: 'electric' as const,
        reason: 'Special electric feeder route across barrage',
      };

      const mockReq = {
        body: routePayload,
        originalUrl: '/v1/admin/transport/bus-routes',
        user: { id: 'admin-super-01' },
      } as any;

      let statusResult = 0;
      let jsonResult: any = null;
      const mockRes = {
        status: (code: number) => {
          statusResult = code;
          return mockRes;
        },
        json: (data: any) => {
          jsonResult = data;
        },
      } as any;

      await transportController.createAdminBusRoute(mockReq, mockRes);
      expect(statusResult).toBe(201);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.item.route_number).toBe('SPL-EXP-99');
    });

    it('allows admin to add a boarding stop to a shuttle route', async () => {
      const stopPayload = {
        stop_order: 4,
        stop_name: {
          en: 'Municipal Water Kiosk Halt',
          te: 'మున్సిపల్ మంచినీటి కియోస్క్ హాల్ట్',
        },
        lat: 17.0018,
        lng: 81.7758,
        is_major_boarding_point: false,
        reason: 'Added drinking water kiosk halt on Green shuttle line',
      };

      const mockReq = {
        params: { id: 'shuttle-green-01' },
        body: stopPayload,
        originalUrl: '/v1/admin/transport/shuttle-routes/shuttle-green-01/stops',
        user: { id: 'admin-super-01' },
      } as any;

      let statusResult = 0;
      let jsonResult: any = null;
      const mockRes = {
        status: (code: number) => {
          statusResult = code;
          return mockRes;
        },
        json: (data: any) => {
          jsonResult = data;
        },
      } as any;

      await transportController.addAdminShuttleStop(mockReq, mockRes);
      expect(statusResult).toBe(201);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.item.stop_order).toBe(4);
    });
  });
});
