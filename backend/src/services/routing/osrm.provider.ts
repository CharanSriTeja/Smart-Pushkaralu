import {
  ComputeRouteParams,
  IRoutingProvider,
  RouteResult,
} from '../../types/routes.js';
import { ROUTING_ATTRIBUTION, ROUTE_SAFETY_DISCLAIMER } from '../../constants/attribution.js';
import { buildGoogleMapsLink } from './google-maps-link.js';

export class OsrmRoutingProvider implements IRoutingProvider {
  name = 'osrm';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OSRM_BASE_URL || 'http://localhost:5000';

    // Strictly forbid router.project-osrm.org unless NODE_ENV is development
    if (this.baseUrl.includes('router.project-osrm.org')) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'OSRM public demo server (router.project-osrm.org) is strictly prohibited in production. Provide a self-hosted OSRM endpoint.'
        );
      } else {
        console.warn(
          '[OSRM] WARNING: Using public demo server router.project-osrm.org in development. Demo server is rate-limited and unreliable.'
        );
      }
    }
  }

  async computeRoute(params: ComputeRouteParams): Promise<RouteResult> {
    const { origin, destination, waypoints = [], mode } = params;

    // Map mode to OSRM profile
    let profile = 'driving';
    if (mode === 'walk') {
      profile = 'walking';
    }

    // Coordinates formatted as lng,lat in OSRM
    const allCoords = [origin, ...waypoints, destination];
    const coordsStr = allCoords.map((c) => `${c.lng},${c.lat}`).join(';');

    const url = `${this.baseUrl}/route/v1/${profile}/${coordsStr}?overview=full&geometries=polyline&steps=false&alternatives=false`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`OSRM returned HTTP ${res.status}: ${res.statusText}`);
      }

      const data: any = await res.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`OSRM routing failed: ${data.code || 'No route found'}`);
      }

      const route = data.routes[0];
      const distanceMeters = Math.round(route.distance);
      let durationSeconds = Math.round(route.duration);
      let isEstimatedForBike = false;

      if (mode === 'bike') {
        // Adjust driving duration for bike estimate (typical two-wheeler Pushkaralu speed ~25-30 km/h)
        durationSeconds = Math.round(distanceMeters / 7.5);
        isEstimatedForBike = true;
      }

      return {
        distanceMeters,
        durationSeconds,
        estimatedDurationSeconds: durationSeconds,
        delayFactor: 1.0,
        encodedPolyline: route.geometry,
        legs: (route.legs || []).map((leg: any, idx: number) => ({
          distanceMeters: Math.round(leg.distance),
          durationSeconds: Math.round(leg.duration),
          startLocation: allCoords[idx],
          endLocation: allCoords[idx + 1],
        })),
        alternatives: [],
        warnings: [],
        providerName: this.name,
        isEstimatedForBike,
        attribution: ROUTING_ATTRIBUTION.OSRM,
        safetyDisclaimer: ROUTE_SAFETY_DISCLAIMER.en,
        googleMapsLink: buildGoogleMapsLink({ origin, destination, waypoints, mode }),
      };
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }
}

