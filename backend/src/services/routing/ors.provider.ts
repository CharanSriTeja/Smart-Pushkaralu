import {
  ComputeRouteParams,
  IRoutingProvider,
  RouteResult,
} from '../../types/routes.js';
import { ROUTING_ATTRIBUTION, ROUTE_SAFETY_DISCLAIMER } from '../../constants/attribution.js';
import { buildGoogleMapsLink } from './google-maps-link.js';

export interface OrsQuotaInfo {
  remainingMinute?: number;
  remainingDaily?: number;
}

export class OrsRoutingProvider implements IRoutingProvider {
  name = 'ors';
  private apiKey: string;
  private lastQuota: OrsQuotaInfo = {};

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      process.env.ORS_API_KEY ||
      process.env.OPENROUTESERVICE_API ||
      '';

    if (!this.apiKey) {
      console.warn('[ORS] No OpenRouteService API key configured. ORS calls will fail unless configured.');
    }
  }

  getLastQuota(): OrsQuotaInfo {
    return this.lastQuota;
  }

  async computeRoute(params: ComputeRouteParams): Promise<RouteResult> {
    if (!this.apiKey) {
      throw new Error('OpenRouteService API key is missing. Set ORS_API_KEY or OPENROUTESERVICE_API.');
    }

    const { origin, destination, waypoints = [], mode } = params;

    // ORS profiles: driving-car, foot-walking, cycling-regular
    let profile = 'driving-car';
    if (mode === 'walk') {
      profile = 'foot-walking';
    } else if (mode === 'bike') {
      // cycling-regular or driving-car
      profile = 'cycling-regular';
    }

    // Coordinates formatted as [[lng, lat], ...]
    const coordinates = [
      [origin.lng, origin.lat],
      ...waypoints.map((wp) => [wp.lng, wp.lat]),
      [destination.lng, destination.lat],
    ];

    const url = `https://api.openrouteservice.org/v2/directions/${profile}`;

    const body = {
      coordinates,
      radiuses: coordinates.map(() => 5000), // Snap search radius up to 5km for rural ghat access
      instructions: false,
      elevation: false,
      geometry_simplify: true,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json, application/geo+json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Track quota headers
      const remMin = res.headers.get('x-ratelimit-remaining-minute');
      const remDaily = res.headers.get('x-ratelimit-remaining');
      if (remMin) this.lastQuota.remainingMinute = parseInt(remMin, 10);
      if (remDaily) this.lastQuota.remainingDaily = parseInt(remDaily, 10);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let errJson: any = null;
        try {
          errJson = JSON.parse(errorText);
        } catch {
          // not json
        }

        const errorCode = errJson?.error?.code;
        const errorMsg = errJson?.error?.message || errorText;

        if (res.status === 403 || res.status === 401) {
          throw new Error(`ORS_QUOTA_OR_AUTH_ERROR: ${errorMsg}`);
        }
        if (res.status === 429) {
          throw new Error(`ORS_RATE_LIMIT_EXCEEDED: ${errorMsg}`);
        }
        if (errorCode === 2010) {
          throw new Error('NO_ROUTE_FOUND: Could not compute route between these locations.');
        }
        if (errorCode === 2004) {
          throw new Error('POINT_NOT_NEAR_ROAD: One of the locations is too far from a routable road.');
        }

        throw new Error(`ORS error (${res.status}): ${errorMsg}`);
      }

      const data: any = await res.json();
      const route = data.routes?.[0];
      if (!route) {
        throw new Error('No routes returned from OpenRouteService.');
      }

      const summary = route.summary;
      const distanceMeters = Math.round(summary.distance);
      let durationSeconds = Math.round(summary.duration);
      let isEstimatedForBike = false;

      if (mode === 'bike' && profile === 'driving-car') {
        durationSeconds = Math.round(distanceMeters / 7.5);
        isEstimatedForBike = true;
      }

      return {
        distanceMeters,
        durationSeconds,
        estimatedDurationSeconds: durationSeconds,
        delayFactor: 1.0,
        encodedPolyline: route.geometry,
        legs: (route.segments || []).map((seg: any, idx: number) => ({
          distanceMeters: Math.round(seg.distance),
          durationSeconds: Math.round(seg.duration),
          startLocation: { lat: coordinates[idx][1], lng: coordinates[idx][0] },
          endLocation: { lat: coordinates[idx + 1][1], lng: coordinates[idx + 1][0] },
        })),
        alternatives: [],
        warnings: (route.warnings || []).map((w: any) => w.message || String(w)),
        providerName: this.name,
        isEstimatedForBike,
        attribution: ROUTING_ATTRIBUTION.ORS,
        safetyDisclaimer: ROUTE_SAFETY_DISCLAIMER.en,
        googleMapsLink: buildGoogleMapsLink({ origin, destination, waypoints, mode }),
      };
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }
}

