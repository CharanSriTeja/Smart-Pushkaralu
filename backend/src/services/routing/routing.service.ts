import { query } from '../../db/index.js';
import { logApiUsage } from '../../lib/usage.js';
import {
  ComputeRouteParams,
  DegradedRouteResult,
  IRoutingProvider,
  RouteResult,
} from '../../types/routes.js';
import { ROUTING_ATTRIBUTION, ROUTE_SAFETY_DISCLAIMER } from '../../constants/attribution.js';
import { MockRoutingProvider } from './mock.provider.js';
import { OrsRoutingProvider } from './ors.provider.js';
import { OsrmRoutingProvider } from './osrm.provider.js';
import { buildGoogleMapsLink } from './google-maps-link.js';
import { haversineDistanceMeters } from './polyline.util.js';
import { getActiveDelayFactor } from './delay-factor.service.js';
import { findClosuresOnRoute } from './closures.service.js';

interface CachedRoute {
  result: RouteResult;
  expiresAt: number;
}

export class RoutingService {
  private primaryProvider: IRoutingProvider;
  private mockProvider: MockRoutingProvider;
  private cache = new Map<string, CachedRoute>();
  private inFlight = new Map<string, Promise<RouteResult>>();

  constructor() {
    this.mockProvider = new MockRoutingProvider();

    const providerType = (process.env.ROUTING_PROVIDER || 'ors').toLowerCase();

    if (providerType === 'mock' || process.env.NODE_ENV === 'test') {
      this.primaryProvider = this.mockProvider;
    } else if (providerType === 'osrm') {
      this.primaryProvider = new OsrmRoutingProvider();
    } else {
      // Default to ORS if API key is present, else fall back to mock
      const hasOrsKey = Boolean(process.env.ORS_API_KEY || process.env.OPENROUTESERVICE_API);
      if (hasOrsKey) {
        this.primaryProvider = new OrsRoutingProvider();
      } else {
        console.warn('[Routing] No ORS_API_KEY found. Falling back to MockRoutingProvider.');
        this.primaryProvider = this.mockProvider;
      }
    }
  }

  getProviderName(): string {
    return this.primaryProvider.name;
  }

  setProvider(provider: IRoutingProvider) {
    this.primaryProvider = provider;
  }

  /**
   * Checks if daily or per-minute rate limit threshold is exceeded for the provider.
   */
  async isBudgetExceeded(providerName: string): Promise<boolean> {
    if (providerName === 'mock' || process.env.NODE_ENV === 'test') return false;

    try {
      // 1. Fetch configured thresholds from settings (or defaults)
      let dailyLimit = 1800; // Safe threshold for ORS 2000/day
      let perMinuteLimit = 35; // Safe threshold for ORS 40/min

      const settingsRes = await query(
        `SELECT key, value FROM settings WHERE key IN ('routes.provider_daily_limit', 'routes.provider_per_minute_limit')`
      );

      for (const row of settingsRes.rows) {
        if (row.key === 'routes.provider_daily_limit') dailyLimit = parseInt(row.value, 10) || dailyLimit;
        if (row.key === 'routes.provider_per_minute_limit') perMinuteLimit = parseInt(row.value, 10) || perMinuteLimit;
      }

      // 2. Count calls in last 24 hours
      const dailyRes = await query(
        `SELECT COUNT(*) as count 
         FROM api_usage_logs 
         WHERE provider = $1 
           AND created_at >= NOW() - INTERVAL '24 hours'`,
        [providerName]
      );
      const dailyCalls = parseInt(dailyRes.rows[0]?.count || '0', 10);
      if (dailyCalls >= dailyLimit) {
        console.warn(`[Routing Budget] Daily limit exceeded (${dailyCalls}/${dailyLimit}) for ${providerName}`);
        return true;
      }

      // 3. Count calls in last 60 seconds
      const minuteRes = await query(
        `SELECT COUNT(*) as count 
         FROM api_usage_logs 
         WHERE provider = $1 
           AND created_at >= NOW() - INTERVAL '1 minute'`,
        [providerName]
      );
      const minuteCalls = parseInt(minuteRes.rows[0]?.count || '0', 10);
      if (minuteCalls >= perMinuteLimit) {
        console.warn(`[Routing Budget] Per-minute limit exceeded (${minuteCalls}/${perMinuteLimit}) for ${providerName}`);
        return true;
      }

      return false;
    } catch (err: any) {
      console.warn('[Routing Budget] Error checking limits, allowing request:', err.message);
      return false;
    }
  }

  /**
   * Generates degraded fallback result with straight-line distance and Google Maps navigation link.
   */
  buildDegradedResult(params: ComputeRouteParams, reasonMessage?: string): DegradedRouteResult {
    const { origin, destination, waypoints = [], mode } = params;
    const straightDist = haversineDistanceMeters(origin, destination);

    const orderedStops = waypoints.map((wp, idx) => ({
      id: `wp_${idx}`,
      name: { en: `Stop ${idx + 1}`, te: `స్టాప్ ${idx + 1}`, hi: `स्टॉप ${idx + 1}` },
      lat: wp.lat,
      lng: wp.lng,
    }));

    return {
      degraded: true,
      straightLineDistanceMeters: straightDist,
      googleMapsLink: buildGoogleMapsLink({ origin, destination, waypoints, mode }),
      message:
        reasonMessage ||
        'Live routing is temporarily under high demand. Use Open in Google Maps for turn-by-turn navigation.',
      attribution: ROUTING_ATTRIBUTION.OSM,
      safetyDisclaimer: ROUTE_SAFETY_DISCLAIMER.en,
      orderedStops,
    };
  }

  /**
   * Calculates route with caching, request coalescing, budget protection, delay factors, and closures.
   */
  async getRoute(
    params: ComputeRouteParams,
    ghatId?: string
  ): Promise<RouteResult | DegradedRouteResult> {
    const { origin, destination, waypoints = [], mode } = params;

    // Cache & coalescing key (coordinates rounded to 4 decimals ~ 11 meters)
    const key = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}_${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}_${mode}_${waypoints.map(w => `${w.lat.toFixed(4)},${w.lng.toFixed(4)}`).join('|')}`;

    // 1. Check cache
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.result;
    }

    // 2. Check in-flight coalescing
    if (this.inFlight.has(key)) {
      return await this.inFlight.get(key)!;
    }

    // 3. Check budget limit
    const budgetExceeded = await this.isBudgetExceeded(this.primaryProvider.name);
    if (budgetExceeded) {
      return this.buildDegradedResult(
        params,
        'Daily directions quota reached for automated routing. Please use the Google Maps link.'
      );
    }

    // 4. Compute route via provider
    const promise = (async () => {
      let rawResult: RouteResult;

      try {
        rawResult = await this.primaryProvider.computeRoute(params);

        // Privacy-safe usage logging (rounded to 2 decimals)
        const privacyOrigin = `${origin.lat.toFixed(2)},${origin.lng.toFixed(2)}`;
        const privacyDest = `${destination.lat.toFixed(2)},${destination.lng.toFixed(2)}`;
        logApiUsage(
          this.primaryProvider.name,
          `/directions/${mode}?o=${privacyOrigin}&d=${privacyDest}`,
          200,
          0
        ).catch(() => {});
      } catch (err: any) {
        console.error(`[Routing] Provider ${this.primaryProvider.name} failed:`, err.message);

        // Try mock provider fallback if primary was external
        if (this.primaryProvider.name !== 'mock') {
          try {
            console.warn('[Routing] Falling back to internal mock routing provider...');
            rawResult = await this.mockProvider.computeRoute(params);
            rawResult.warnings.push('Calculated using fallback routing engine due to temporary provider unavailability.');
          } catch {
            return this.buildDegradedResult(params, 'Routing service currently unavailable.');
          }
        } else {
          return this.buildDegradedResult(params, 'Routing service currently unavailable.');
        }
      }

      // 5. Apply active delay factor
      let delayInfo = { factor: 1.0, label: undefined as any };
      if (process.env.NODE_ENV !== 'test') {
        try {
          delayInfo = await getActiveDelayFactor(ghatId);
        } catch {
          // ignore in tests/offline
        }
      }
      rawResult.delayFactor = delayInfo.factor;
      if (delayInfo.label) {
        rawResult.delayFactorLabel = delayInfo.label;
      }
      rawResult.estimatedDurationSeconds = Math.round(rawResult.durationSeconds * delayInfo.factor);

      // 6. Check active road closures intersecting route
      if (rawResult.encodedPolyline && process.env.NODE_ENV !== 'test') {
        try {
          const closures = await findClosuresOnRoute(rawResult.encodedPolyline);
          if (closures.length > 0) {
            for (const c of closures) {
              const titleEn = c.title?.en || 'Route advisory';
              rawResult.warnings.push(`[${c.severity.toUpperCase()}] ${titleEn}: ${c.description?.en || 'Police diversion or closure active.'}`);
            }
          }
        } catch {
          // ignore in tests/offline
        }
      }

      // Cache successful result for 5 minutes
      this.cache.set(key, {
        result: rawResult,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return rawResult;
    })();

    this.inFlight.set(key, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }
}

export const routingService = new RoutingService();
