import { RouteMode } from '../../types/routes.js';

export interface BuildGoogleMapsLinkParams {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: Array<{ lat: number; lng: number }>;
  mode: RouteMode;
}

/**
 * Builds a zero-cost universal Google Maps navigation link.
 * Does not call any Google Directions/Routes APIs.
 */
export function buildGoogleMapsLink(params: BuildGoogleMapsLinkParams): string {
  const { origin, destination, waypoints, mode } = params;

  let travelmode = 'driving';
  switch (mode) {
    case 'car':
      travelmode = 'driving';
      break;
    case 'bike':
      // Google Maps universal URL supports bicycling or two_wheeler/driving
      travelmode = 'driving';
      break;
    case 'walk':
      travelmode = 'walking';
      break;
    case 'bus':
    case 'train':
      travelmode = 'transit';
      break;
    default:
      travelmode = 'driving';
  }

  const queryParams = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    travelmode,
  });

  if (waypoints && waypoints.length > 0) {
    // Up to 9 waypoints supported in universal link
    const wpStr = waypoints
      .slice(0, 9)
      .map((wp) => `${wp.lat},${wp.lng}`)
      .join('|');
    queryParams.set('waypoints', wpStr);
  }

  return `https://www.google.com/maps/dir/?${queryParams.toString()}`;
}

