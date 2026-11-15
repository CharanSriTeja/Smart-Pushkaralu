/**
 * Decodes Google encoded polyline string into array of { latitude, longitude } points.
 */
export function decodePolylineCoordinates(
  str: string,
  precision = 5
): Array<{ latitude: number; longitude: number }> {
  if (!str) return [];

  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: Array<{ latitude: number; longitude: number }> = [];
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

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / factor,
      longitude: lng / factor,
    });
  }

  return coordinates;
}

