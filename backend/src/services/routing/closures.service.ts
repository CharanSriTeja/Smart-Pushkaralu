import { query } from '../../db/index.js';
import { RouteClosure } from '../../types/routes.js';
import { decodePolyline } from './polyline.util.js';

export async function findClosuresOnRoute(
  encodedPolyline: string,
  bufferMeters = 50
): Promise<RouteClosure[]> {
  const coords = decodePolyline(encodedPolyline);
  if (coords.length < 2) return [];

  // Convert coords to GeoJSON LineString coordinates [[lng, lat], ...]
  const geojsonCoords = coords.map(([lat, lng]) => [lng, lat]);
  const geojsonLineString = {
    type: 'LineString',
    coordinates: geojsonCoords,
  };

  const now = new Date().toISOString();

  try {
    const res = await query(
      `SELECT id, title, description, severity, ST_AsGeoJSON(geometry) as geometry_json, starts_at, ends_at, active, source_name, source_url
       FROM route_closures
       WHERE active = true
         AND starts_at <= $1
         AND ends_at >= $1
         AND ST_DWithin(
           geometry::geography,
           ST_SetSRID(ST_GeomFromGeoJSON($2), 4326)::geography,
           $3
         )
       ORDER BY severity = 'blocked' DESC, severity = 'warning' DESC`,
      [now, JSON.stringify(geojsonLineString), bufferMeters]
    );

    return res.rows.map((row) => ({
      id: row.id,
      title: typeof row.title === 'string' ? JSON.parse(row.title) : row.title,
      description: row.description ? (typeof row.description === 'string' ? JSON.parse(row.description) : row.description) : null,
      severity: row.severity,
      geometry: row.geometry_json ? JSON.parse(row.geometry_json) : null,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      active: row.active,
      source_name: row.source_name,
      source_url: row.source_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err: any) {
    console.warn('[Closures] Error querying closures on route:', err.message);
    return [];
  }
}

