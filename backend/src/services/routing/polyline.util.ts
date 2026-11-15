/**
 * Encodes and decodes Google polyline format (5 decimals precision).
 */
export function decodePolyline(str: string, precision = 5): Array<[number, number]> {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: Array<[number, number]> = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let byte = 0;
    let shift = 0;
    let result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

export function encodePolyline(points: Array<[number, number]>, precision = 5): string {
  const factor = Math.pow(10, precision);
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point[0] * factor);
    const lng = Math.round(point[1] * factor);

    output += encodePointDelta(lat - prevLat);
    output += encodePointDelta(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return output;
}

function encodePointDelta(val: number): string {
  let v = val < 0 ? ~(val << 1) : (val << 1);
  let chunk = '';
  while (v >= 0x20) {
    chunk += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  chunk += String.fromCharCode(v + 63);
  return chunk;
}

/**
 * Calculates straight line (haversine) distance between two points in meters.
 */
export function haversineDistanceMeters(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

