import { apiRequest } from './api';
import { getCached, setCached } from '../storage/cache';
import {
  GhatAccessPoint,
  RouteClosure,
  RouteMode,
  RouteOrigin,
  RouteResult,
  DegradedRouteResult,
  RouteTemple,
} from '../types/routes';

export const ROUTE_ATTRIBUTION_TEXT = '© OpenStreetMap contributors | openrouteservice.org by HeiGIT';

export const ROUTE_SAFETY_NOTICE =
  'Routes and times are estimates. Roads, closures, and police diversions can change suddenly during Pushkaralu. Follow official signs and personnel on the ground.';

/**
 * Fetches curated starting origins (cities, stations, bus stands).
 */
export async function fetchRouteOrigins(): Promise<RouteOrigin[]> {
  const cacheKey = 'route_origins_list';
  const cached = await getCached<RouteOrigin[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const res = await apiRequest<{ success: boolean; origins: RouteOrigin[] }>('/v1/route-origins');
    if (res.success && res.origins) {
      await setCached(cacheKey, res.origins, 86400); // Cache for 24h
      return res.origins;
    }
  } catch (err) {
    console.warn('[routeService] Error fetching origins from API, checking cache:', err);
  }

  return cached || [];
}

/**
 * Fetches verified access points for a specific ghat (parking, gates, drop-off).
 */
export async function fetchGhatAccessPoints(ghatId: string): Promise<GhatAccessPoint[]> {
  const cacheKey = `ghat_access_points_${ghatId}`;
  const cached = await getCached<GhatAccessPoint[]>(cacheKey);

  try {
    const res = await apiRequest<{ success: boolean; access_points: GhatAccessPoint[] }>(
      `/v1/ghats/${ghatId}/access-points`
    );
    if (res.success && res.access_points) {
      await setCached(cacheKey, res.access_points, 86400);
      return res.access_points;
    }
  } catch (err) {
    console.warn(`[routeService] Error fetching access points for ghat ${ghatId}:`, err);
  }

  return cached || [];
}

/**
 * Fetches precomputed standard route between an origin and a ghat access point.
 */
export async function fetchStandardRoute(
  originId: string,
  accessPointId: string,
  mode: RouteMode = 'car'
): Promise<RouteResult | null> {
  const cacheKey = `std_route_${originId}_${accessPointId}_${mode}`;
  const cached = await getCached<RouteResult>(cacheKey);

  try {
    const res = await apiRequest<{ success: boolean; standard_route: any }>(
      `/v1/route/standard?originId=${originId}&accessPointId=${accessPointId}&mode=${mode}`
    );
    if (res.success && res.standard_route) {
      const routeResult: RouteResult = {
        distanceMeters: res.standard_route.distanceMeters,
        durationSeconds: res.standard_route.durationSeconds,
        estimatedDurationSeconds: res.standard_route.durationSeconds,
        delayFactor: 1.0,
        encodedPolyline: res.standard_route.encodedPolyline,
        legs: [
          {
            distanceMeters: res.standard_route.distanceMeters,
            durationSeconds: res.standard_route.durationSeconds,
            startLocation: { lat: 0, lng: 0 },
            endLocation: { lat: 0, lng: 0 },
            encodedPolyline: res.standard_route.encodedPolyline,
          },
        ],
        warnings: [],
        providerName: res.standard_route.provider || 'ors',
        attribution: res.standard_route.attribution || ROUTE_ATTRIBUTION_TEXT,
        safetyDisclaimer: res.standard_route.safetyDisclaimer || ROUTE_SAFETY_NOTICE,
        googleMapsLink: '',
      };
      await setCached(cacheKey, routeResult, 43200); // 12h
      return routeResult;
    }
  } catch {
    // Fallback to cached
  }

  return cached || null;
}

/**
 * Fetches live route with delay factor and closures applied.
 */
export async function fetchLiveRoute(params: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: RouteMode;
  ghatId?: string;
}): Promise<RouteResult | DegradedRouteResult> {
  const { origin, destination, mode, ghatId } = params;
  const cacheKey = `live_route_${origin.lat.toFixed(3)}_${origin.lng.toFixed(3)}_${destination.lat.toFixed(3)}_${destination.lng.toFixed(3)}_${mode}`;

  try {
    let url = `/v1/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}&mode=${mode}`;
    if (ghatId) url += `&ghatId=${ghatId}`;

    const res = await apiRequest<{ success: boolean; route: RouteResult | DegradedRouteResult }>(url);
    if (res.success && res.route) {
      if (!('degraded' in res.route)) {
        await setCached(cacheKey, res.route, 1800); // Cache 30m
      }
      return res.route;
    }
  } catch (err) {
    console.warn('[routeService] Error computing live route, checking cache:', err);
  }

  const cached = await getCached<RouteResult>(cacheKey);
  if (cached) return cached;

  throw new Error('Unable to compute route. Check network connection or use Open in Google Maps.');
}

/**
 * Fetches Hindu pilgrimage temples along the route corridor within buffer distance.
 */
export async function fetchTemplesAlongRoute(
  encodedPolyline: string,
  bufferKm: number = 3
): Promise<RouteTemple[]> {
  try {
    const res = await apiRequest<{ success: boolean; temples: RouteTemple[] }>(
      `/v1/route/temples?polyline=${encodeURIComponent(encodedPolyline)}&bufferKm=${bufferKm}`
    );
    if (res.success && res.temples) {
      return res.temples;
    }
  } catch (err) {
    console.warn('[routeService] Error fetching corridor temples:', err);
  }
  return [];
}

/**
 * Recalculates route with chosen waypoint stops.
 */
export async function recalculateRouteWithStops(params: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints: Array<{ lat: number; lng: number }>;
  mode: RouteMode;
  ghatId?: string;
}): Promise<RouteResult | DegradedRouteResult> {
  const res = await apiRequest<{ success: boolean; route: RouteResult | DegradedRouteResult }>(
    '/v1/route/stops',
    {
      method: 'POST',
      body: JSON.stringify(params),
    }
  );

  if (res.success && res.route) {
    return res.route;
  }
  throw new Error('Failed to recalculate route with stops.');
}

/**
 * Fetches active police diversions and road closures.
 */
export async function fetchActiveClosures(): Promise<RouteClosure[]> {
  try {
    const res = await apiRequest<{ success: boolean; closures: RouteClosure[] }>('/v1/route-closures');
    if (res.success && res.closures) {
      return res.closures;
    }
  } catch (err) {
    console.warn('[routeService] Error fetching route closures:', err);
  }
  return [];
}

/**
 * Module 4 Interoperability: exports route plan given origin, destination, and mode.
 */
export async function getRoutePlan(params: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode?: RouteMode;
  ghatId?: string;
}): Promise<RouteResult | DegradedRouteResult> {
  return fetchLiveRoute({
    origin: params.origin,
    destination: params.destination,
    mode: params.mode || 'car',
    ghatId: params.ghatId,
  });
}

