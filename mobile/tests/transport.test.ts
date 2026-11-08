import { describe, it, expect, vi } from 'vitest';

// Mock native Expo modules before importing services
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(null),
  deleteItemAsync: vi.fn().mockResolvedValue(null),
}));

import { getLocalizedText } from '../src/utils/localized';
import { TransportService } from '../src/services/transportService';

describe('Mobile Module 6: Transport and Shuttles Tests', () => {
  // ==========================================
  // PART 1: LOCALIZATION & ENGLISH FALLBACK
  // ==========================================
  describe('1. Transport Hubs & Services Localization', () => {
    const hubName = {
      en: 'Rajahmundry Central Bus Station',
      te: 'రాజమండ్రి సెంట్రల్ బస్ స్టేషన్',
      hi: 'राजमंड्री सेंट्रल बस स्टेशन',
    };

    it('resolves Telugu name when language is te', () => {
      expect(getLocalizedText(hubName, 'te')).toBe('రాజమండ్రి సెంట్రల్ బస్ స్టేషన్');
    });

    it('resolves Hindi name when language is hi', () => {
      expect(getLocalizedText(hubName, 'hi')).toBe('राजमंड्री सेंट्रल बस स्टेशन');
    });

    it('strictly falls back to English when language is te but te translation is missing', () => {
      const partialHub = {
        en: 'Lalacheruvu Outer Parking',
        hi: 'लालचेरुवु आउटर पार्किंग',
      };
      expect(getLocalizedText(partialHub, 'te')).toBe('Lalacheruvu Outer Parking');
    });
  });

  // ==========================================
  // PART 2: OFFLINE RESILIENT SERVICE TESTS
  // ==========================================
  describe('2. TransportService Offline Fallback & Data Contract', () => {
    it('getBusTransport returns curated bus hubs, routes, special express fleets, and official links', async () => {
      const res = await TransportService.getBusTransport();
      expect(res.data).toBeDefined();

      const hubs = res.data.hubs;
      expect(hubs.length).toBeGreaterThan(0);
      expect(hubs[0].distance_km).toBeDefined();
      expect(hubs[0].driving_time_minutes).toBeGreaterThan(0);

      const specials = res.data.special_services;
      expect(specials.length).toBeGreaterThan(0);
      expect(specials[0].service_code).toContain('PUSH-SPL');

      const links = res.data.official_links;
      expect(links.length).toBeGreaterThanOrEqual(2);
      expect(links.some((l) => l.key === 'apsrtc_booking')).toBe(true);
      expect(links.some((l) => l.key === 'tgsrtc_booking')).toBe(true);
    });

    it('getRailTransport returns railway stations, platform info, and CRIS/NTES/IRCTC links', async () => {
      const res = await TransportService.getRailTransport();
      expect(res.data).toBeDefined();

      const stations = res.data.stations;
      expect(stations.length).toBeGreaterThan(0);
      expect(stations[0].station_code).toBe('RJY');
      expect(stations[0].total_platforms).toBeGreaterThanOrEqual(1);
      expect(stations[0].distance_km).toBeDefined();

      const links = res.data.official_links;
      const keys = links.map((l) => l.key);
      expect(keys).toContain('rail_ntes_enquiry');
      expect(keys).toContain('irctc_seat_avail');
      expect(keys).toContain('rail_pnr_status');
      expect(keys).toContain('rail_live_status');
      expect(keys).toContain('rail_madad_helpline');
    });

    it('getShuttleTransport returns 100% free green corridor shuttles with elderly accessibility', async () => {
      const res = await TransportService.getShuttleTransport();
      expect(res.data).toBeDefined();

      const shuttles = res.data.shuttle_routes;
      expect(shuttles.length).toBeGreaterThan(0);
      expect(shuttles[0].shuttle_type).toBe('free');
      expect(shuttles[0].fare).toBe(0);
      expect(shuttles[0].accessible_for_elderly_disabled).toBe(true);
      expect(shuttles[0].stops).toBeDefined();
      expect(shuttles[0].stops?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================
  // PART 3: CONDITION DISCLAIMER & SECURITY
  // ==========================================
  describe('3. Condition Disclaimer & Security Links', () => {
    it('attaches sudden condition change disclaimer across bus, rail, and shuttle datasets', async () => {
      const [busRes, railRes, shuttleRes] = await Promise.all([
        TransportService.getBusTransport(),
        TransportService.getRailTransport(),
        TransportService.getShuttleTransport(),
      ]);

      expect(busRes.data.disclaimer.en).toContain('change suddenly');
      expect(busRes.data.disclaimer.te).toBeDefined();
      expect(busRes.data.disclaimer.hi).toBeDefined();

      expect(railRes.data.disclaimer.en).toContain('SCR');
      expect(railRes.data.disclaimer.en).toContain('prohibited');

      expect(shuttleRes.data.disclaimer.en).toContain('Free');
      expect(shuttleRes.data.disclaimer.en).toContain('senior citizens');
    });

    it('verifies all external links point to official HTTPS government domains', async () => {
      const busRes = await TransportService.getBusTransport();
      const railRes = await TransportService.getRailTransport();
      const allLinks = [...busRes.data.official_links, ...railRes.data.official_links];

      for (const link of allLinks) {
        expect(link.url.startsWith('https://')).toBe(true);
        expect(link.is_verified).toBe(true);
        expect(link.official_authority.length).toBeGreaterThan(0);
      }
    });
  });
});
