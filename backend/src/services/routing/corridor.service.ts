import { query } from '../../db/index.js';
import { RouteTemple } from '../../types/routes.js';
import { decodePolyline } from './polyline.util.js';

export interface FindTemplesAlongRouteOptions {
  encodedPolyline: string;
  bufferMeters?: number; // default 3000m (3km)
  maxResults?: number; // default 30
}

export async function findTemplesAlongRoute(
  options: FindTemplesAlongRouteOptions
): Promise<RouteTemple[]> {
  const { encodedPolyline, bufferMeters = 3000, maxResults = 30 } = options;

  const coords = decodePolyline(encodedPolyline);
  if (coords.length < 2) return [];

  // PostGIS GeoJSON LineString coordinates: [[lng, lat], ...]
  // To avoid huge SQL payloads on long routes, simplify coordinates if > 300 points
  let sampledCoords = coords;
  if (coords.length > 300) {
    const step = Math.ceil(coords.length / 300);
    sampledCoords = coords.filter((_, idx) => idx % step === 0 || idx === coords.length - 1);
  }

  const geojsonLineString = {
    type: 'LineString',
    coordinates: sampledCoords.map(([lat, lng]) => [lng, lat]),
  };

  const lineStringJson = JSON.stringify(geojsonLineString);

  try {
    const res = await query(
      `WITH route_geom AS (
         SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom,
                ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography AS geog
       )
       SELECT 
         t.id,
         t.name,
         t.lat,
         t.lng,
         COALESCE(t.district, 'East Godavari') AS district,
         COALESCE(t.state, 'Andhra Pradesh') AS state,
         COALESCE(t.coordinates_precision, 'approximate') AS coordinates_precision,
         COALESCE(t.source, 'osm') AS source,
         t.source_url,
         t.osm_id,
         COALESCE(t.verified, t.is_verified, false) AS verified,
         COALESCE(t.active, NOT COALESCE(t.is_hidden, false), true) AS active,
         ROUND(ST_Distance(t.location, r.geog)::numeric, 0) AS distance_from_route_m,
         ST_LineLocatePoint(r.geom, ST_SetSRID(ST_MakePoint(t.lng, t.lat), 4326)) AS fraction_along_route
       FROM temples t, route_geom r
       WHERE (t.active = true OR (t.active IS NULL AND t.is_hidden IS NOT TRUE))
         AND t.lat IS NOT NULL 
         AND t.lng IS NOT NULL
         AND ST_DWithin(t.location, r.geog, $2)
       ORDER BY fraction_along_route ASC`,
      [lineStringJson, bufferMeters]
    );

    const temples: RouteTemple[] = [];
    const minSeparationMeters = 100;

    for (const row of res.rows) {
      const lat = Number(row.lat);
      const lng = Number(row.lng);
      const distFromRoute = Number(row.distance_from_route_m);
      const nameParsed = typeof row.name === 'string' ? JSON.parse(row.name) : row.name;

      // Skip duplicate or extremely close temples (< 100m)
      const isTooClose = temples.some((existing) => {
        const dLat = Math.abs(existing.lat - lat);
        const dLng = Math.abs(existing.lng - lng);
        // Approx ~100m is ~0.0009 degrees
        return dLat < 0.0009 && dLng < 0.0009;
      });

      if (!isTooClose) {
        temples.push({
          id: row.id,
          name: nameParsed,
          lat,
          lng,
          district: row.district,
          state: row.state,
          coordinates_precision: row.coordinates_precision,
          source: row.source,
          source_url: row.source_url,
          osm_id: row.osm_id,
          verified: Boolean(row.verified),
          active: Boolean(row.active),
          distance_from_route_m: distFromRoute,
        });
      }

      if (temples.length >= maxResults) break;
    }

    return temples;
  } catch (err: any) {
    console.error('[Corridor] PostGIS corridor query failed:', err.message);
    return [];
  }
}

