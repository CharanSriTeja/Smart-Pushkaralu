import { describe, it, expect, vi } from 'vitest';
import {
  decodePolyline,
  encodePolyline,
  haversineDistanceMeters,
} from '../src/services/routing/polyline.util.js';
import { buildGoogleMapsLink } from '../src/services/routing/google-maps-link.js';
import { MockRoutingProvider } from '../src/services/routing/mock.provider.js';
import { OsrmRoutingProvider } from '../src/services/routing/osrm.provider.js';
import { RoutingService } from '../src/services/routing/routing.service.js';
import { ROUTING_ATTRIBUTION, ROUTE_SAFETY_DISCLAIMER } from '../src/constants/attribution.js';

describe('Module 2 - Route Optimisation Tests', () => {
  describe('Polyline & Distance Utilities', () => {
    it('encodes and decodes polylines accurately', () => {
      const originalPoints: Array<[number, number]> = [
        [17.0005, 81.7801],
        [17.0123, 81.7954],
        [17.0256, 81.8102],
      ];

      const encoded = encodePolyline(originalPoints);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = decodePolyline(encoded);
      expect(decoded.length).toBe(originalPoints.length);

      for (let i = 0; i < originalPoints.length; i++) {
        expect(decoded[i][0]).toBeCloseTo(originalPoints[i][0], 4);
        expect(decoded[i][1]).toBeCloseTo(originalPoints[i][1], 4);
      }
    });

    it('calculates haversine distance correctly', () => {
      // Rajahmundry (17.0005, 81.7800) to Kovvur (17.0116, 81.7289) ~ 5.5 - 6.0 km
      const p1 = { lat: 17.0005, lng: 81.78 };
      const p2 = { lat: 17.0116, lng: 81.7289 };

      const dist = haversineDistanceMeters(p1, p2);
      expect(dist).toBeGreaterThan(5000);
      expect(dist).toBeLessThan(7000);
    });
  });

  describe('Google Maps Universal Link Builder', () => {
    it('maps driving mode correctly', () => {
      const link = buildGoogleMapsLink({
        origin: { lat: 17.0, lng: 81.78 },
        destination: { lat: 17.02, lng: 81.8 },
        mode: 'car',
      });
      expect(link).toContain('https://www.google.com/maps/dir/?');
      expect(link).toContain('travelmode=driving');
      expect(link).toContain('origin=17%2C81.78');
      expect(link).toContain('destination=17.02%2C81.8');
    });

    it('maps walking mode correctly', () => {
      const link = buildGoogleMapsLink({
        origin: { lat: 17.0, lng: 81.78 },
        destination: { lat: 17.01, lng: 81.785 },
        mode: 'walk',
      });
      expect(link).toContain('travelmode=walking');
    });

    it('maps bus and train modes to transit', () => {
      const busLink = buildGoogleMapsLink({
        origin: { lat: 17.0, lng: 81.78 },
        destination: { lat: 17.02, lng: 81.8 },
        mode: 'bus',
      });
      const trainLink = buildGoogleMapsLink({
        origin: { lat: 17.0, lng: 81.78 },
        destination: { lat: 17.02, lng: 81.8 },
        mode: 'train',
      });
      expect(busLink).toContain('travelmode=transit');
      expect(trainLink).toContain('travelmode=transit');
    });

    it('formats multiple waypoints correctly', () => {
      const link = buildGoogleMapsLink({
        origin: { lat: 17.0, lng: 81.78 },
        destination: { lat: 17.05, lng: 81.85 },
        waypoints: [
          { lat: 17.01, lng: 81.79 },
          { lat: 17.03, lng: 81.81 },
        ],
        mode: 'car',
      });
      expect(link).toContain('waypoints=17.01%2C81.79%7C17.03%2C81.81');
    });
  });

  describe('Routing Providers', () => {
    it('MockRoutingProvider returns expected fields and safety disclaimer', async () => {
      const provider = new MockRoutingProvider();
      const result = await provider.computeRoute({
        origin: { lat: 17.0005, lng: 81.78 },
        destination: { lat: 17.02, lng: 81.81 },
        mode: 'car',
      });

      expect(result.distanceMeters).toBeGreaterThan(0);
      expect(result.durationSeconds).toBeGreaterThan(0);
      expect(result.encodedPolyline).toBeTruthy();
      expect(result.legs.length).toBe(1);
      expect(result.attribution).toBe(ROUTING_ATTRIBUTION.MOCK);
      expect(result.safetyDisclaimer).toBe(ROUTE_SAFETY_DISCLAIMER.en);
      expect(result.googleMapsLink).toContain('google.com/maps/dir');
    });

    it('OsrmRoutingProvider rejects public demo server in production', () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      expect(() => {
        new OsrmRoutingProvider('https://router.project-osrm.org');
      }).toThrow(/strictly prohibited in production/);

      process.env.NODE_ENV = prevEnv;
    });
  });

  describe('RoutingService & Budget Guard', () => {
    it('returns degraded result with straight-line distance and google maps link when requested', () => {
      const service = new RoutingService();
      const degraded = service.buildDegradedResult({
        origin: { lat: 17.0005, lng: 81.78 },
        destination: { lat: 17.05, lng: 81.85 },
        waypoints: [{ lat: 17.02, lng: 81.81 }],
        mode: 'car',
      });

      expect(degraded.degraded).toBe(true);
      expect(degraded.straightLineDistanceMeters).toBeGreaterThan(0);
      expect(degraded.googleMapsLink).toContain('google.com/maps/dir');
      expect(degraded.orderedStops?.length).toBe(1);
      expect(degraded.attribution).toBe(ROUTING_ATTRIBUTION.OSM);
      expect(degraded.safetyDisclaimer).toBeTruthy();
    });

    it('computes and caches route cleanly using mock provider', async () => {
      const service = new RoutingService();
      service.setProvider(new MockRoutingProvider());

      const res1 = await service.getRoute({
        origin: { lat: 17.0005, lng: 81.78 },
        destination: { lat: 17.02, lng: 81.81 },
        mode: 'car',
      });

      expect('distanceMeters' in res1).toBe(true);

      const res2 = await service.getRoute({
        origin: { lat: 17.0005, lng: 81.78 },
        destination: { lat: 17.02, lng: 81.81 },
        mode: 'car',
      });

      expect(res1).toEqual(res2);
    });
  });
});

