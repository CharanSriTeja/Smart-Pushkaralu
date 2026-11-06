/**
 * Geographic utility functions for distance calculation and proximity validation.
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the great-circle distance between two points in meters using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

/**
 * Checks if the reported GPS coordinates are within the acceptable proximity of the ghat.
 * Default max radius is 1000 meters (1.0 km) to allow for large crowds, ghat walkways, and GPS variance.
 */
export function isWithinGhatProximity(
  userLat: number,
  userLng: number,
  ghatLat: number,
  ghatLng: number,
  maxMeters: number = 1000
): { isWithin: boolean; distanceMeters: number } {
  const distanceMeters = calculateHaversineDistance(userLat, userLng, ghatLat, ghatLng);
  return {
    isWithin: distanceMeters <= maxMeters,
    distanceMeters,
  };
}

/**
 * Parses a "lat,lng" string from query parameters into numbers.
 */
export function parseCoordinates(coordString?: string): { lat: number; lng: number } | null {
  if (!coordString) return null;
  const parts = coordString.split(',').map((p) => p.trim());
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

