import {
  ComputeRouteParams,
  IRoutingProvider,
  RouteResult,
} from '../../types/routes.js';
import { ROUTING_ATTRIBUTION, ROUTE_SAFETY_DISCLAIMER } from '../../constants/attribution.js';
import { encodePolyline, haversineDistanceMeters } from './polyline.util.js';
import { buildGoogleMapsLink } from './google-maps-link.js';

export class MockRoutingProvider implements IRoutingProvider {
  name = 'mock';

  async computeRoute(params: ComputeRouteParams): Promise<RouteResult> {
    const { origin, destination, waypoints = [], mode } = params;

    const allPoints = [origin, ...waypoints, destination];
    let totalDistance = 0;
    const polylineCoords: Array<[number, number]> = [];

    for (let i = 0; i < allPoints.length - 1; i++) {
      const p1 = allPoints[i];
      const p2 = allPoints[i + 1];
      const dist = haversineDistanceMeters(p1, p2);
      totalDistance += dist;

      // Add 5 interpolated points per leg
      for (let step = 0; step <= 5; step++) {
        const ratio = step / 5;
        const lat = p1.lat + (p2.lat - p1.lat) * ratio;
        const lng = p1.lng + (p2.lng - p1.lng) * ratio;
        polylineCoords.push([lat, lng]);
      }
    }

    // Speed estimation: car: 40 km/h (11.1 m/s), walk: 4.5 km/h (1.25 m/s), bike: 25 km/h (6.94 m/s)
    let speedMps = 11.1;
    if (mode === 'walk') speedMps = 1.25;
    else if (mode === 'bike') speedMps = 6.94;

    const durationSeconds = Math.max(60, Math.round(totalDistance / speedMps));
    const encodedPolyline = encodePolyline(polylineCoords);

    return {
      distanceMeters: totalDistance,
      durationSeconds,
      estimatedDurationSeconds: durationSeconds,
      delayFactor: 1.0,
      encodedPolyline,
      legs: [
        {
          distanceMeters: totalDistance,
          durationSeconds,
          startLocation: origin,
          endLocation: destination,
          encodedPolyline,
        },
      ],
      alternatives: [],
      warnings: [],
      providerName: this.name,
      attribution: ROUTING_ATTRIBUTION.MOCK,
      safetyDisclaimer: ROUTE_SAFETY_DISCLAIMER.en,
      googleMapsLink: buildGoogleMapsLink({ origin, destination, waypoints, mode }),
    };
  }
}

