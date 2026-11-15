import { Request, Response } from 'express';
import { query } from '../../db/index.js';
import { routingService } from '../../services/routing/routing.service.js';
import { findTemplesAlongRoute } from '../../services/routing/corridor.service.js';
import { writeAudit } from '../../lib/audit.js';
import { ROUTING_ATTRIBUTION, ROUTE_SAFETY_DISCLAIMER } from '../../constants/attribution.js';
import { RouteMode } from '../../types/routes.js';

// --- PUBLIC ROUTING HANDLERS ---

export async function getGhatAccessPoints(req: Request, res: Response): Promise<void> {
  const { ghatId } = req.params;
  try {
    const result = await query(
      `SELECT id, ghat_id, kind, name, lat, lng, coordinates_precision, notes, is_default, active, source_url, created_at, updated_at
       FROM ghat_access_points
       WHERE ghat_id = $1 AND active = true
       ORDER BY is_default DESC, kind ASC`,
      [ghatId]
    );

    const points = result.rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      name: typeof r.name === 'string' ? JSON.parse(r.name) : r.name,
      notes: r.notes ? (typeof r.notes === 'string' ? JSON.parse(r.notes) : r.notes) : null,
    }));

    res.json({ success: true, access_points: points });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function getRouteOrigins(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, name, kind, lat, lng, district, state, sort_order, active, created_at, updated_at
       FROM route_origins
       WHERE active = true
       ORDER BY sort_order ASC, name->>'en' ASC`
    );

    const origins = result.rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      name: typeof r.name === 'string' ? JSON.parse(r.name) : r.name,
    }));

    res.json({ success: true, origins });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function getStandardRoute(req: Request, res: Response): Promise<void> {
  const { originId, accessPointId, mode = 'car' } = req.query;

  if (!originId || !accessPointId) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'originId and accessPointId are required.' } });
    return;
  }

  try {
    const result = await query(
      `SELECT id, origin_id, access_point_id, mode, distance_m, duration_s, polyline, provider, computed_at, stale
       FROM standard_routes
       WHERE origin_id = $1 AND access_point_id = $2 AND mode = $3
       LIMIT 1`,
      [originId, accessPointId, mode]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No precomputed standard route found.' } });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      standard_route: {
        ...row,
        distanceMeters: row.distance_m,
        durationSeconds: row.duration_s,
        encodedPolyline: row.polyline,
        attribution: ROUTING_ATTRIBUTION.OSM,
        safetyDisclaimer: ROUTE_SAFETY_DISCLAIMER.en,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function computeLiveRoute(req: Request, res: Response): Promise<void> {
  const {
    originLat,
    originLng,
    destLat,
    destLng,
    mode = 'car',
    ghatId,
  } = req.query;

  if (!originLat || !originLng || !destLat || !destLng) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'originLat, originLng, destLat, and destLng are required.' } });
    return;
  }

  const origin = { lat: parseFloat(originLat as string), lng: parseFloat(originLng as string) };
  const destination = { lat: parseFloat(destLat as string), lng: parseFloat(destLng as string) };

  if (isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Coordinates must be valid numbers.' } });
    return;
  }

  try {
    const route = await routingService.getRoute(
      {
        origin,
        destination,
        mode: mode as RouteMode,
      },
      ghatId as string | undefined
    );

    res.json({ success: true, route });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ROUTING_ERROR', message: err.message } });
  }
}

export async function getTemplesAlongRouteHandler(req: Request, res: Response): Promise<void> {
  const { polyline, bufferKm = '3', maxResults = '30' } = req.query;

  if (!polyline || typeof polyline !== 'string') {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'polyline is required.' } });
    return;
  }

  const bufferMeters = Math.min(10000, Math.max(500, parseFloat(bufferKm as string) * 1000 || 3000));
  const max = Math.min(50, Math.max(1, parseInt(maxResults as string, 10) || 30));

  try {
    const temples = await findTemplesAlongRoute({
      encodedPolyline: polyline,
      bufferMeters,
      maxResults: max,
    });

    res.json({
      success: true,
      temples,
      attribution: ROUTING_ATTRIBUTION.OSM,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'CORRIDOR_ERROR', message: err.message } });
  }
}

export async function recalculateWithStops(req: Request, res: Response): Promise<void> {
  const { origin, destination, waypoints = [], mode = 'car', ghatId } = req.body;

  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'origin and destination objects with lat, lng are required.' } });
    return;
  }

  try {
    const route = await routingService.getRoute(
      {
        origin,
        destination,
        waypoints,
        mode: mode as RouteMode,
      },
      ghatId
    );

    res.json({ success: true, route });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ROUTING_ERROR', message: err.message } });
  }
}

export async function getActiveClosures(req: Request, res: Response): Promise<void> {
  const now = new Date().toISOString();
  try {
    const result = await query(
      `SELECT id, title, description, severity, ST_AsGeoJSON(geometry) as geometry_json, starts_at, ends_at, active, source_name, source_url
       FROM route_closures
       WHERE active = true AND starts_at <= $1 AND ends_at >= $1
       ORDER BY severity = 'blocked' DESC, starts_at DESC`,
      [now]
    );

    const closures = result.rows.map((r) => ({
      ...r,
      title: typeof r.title === 'string' ? JSON.parse(r.title) : r.title,
      description: r.description ? (typeof r.description === 'string' ? JSON.parse(r.description) : r.description) : null,
      geometry: r.geometry_json ? JSON.parse(r.geometry_json) : null,
    }));

    res.json({ success: true, closures });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

// --- ADMIN HANDLERS ---

export async function adminGetOrigins(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, name, kind, lat, lng, district, state, sort_order, active, created_at, updated_at
       FROM route_origins
       ORDER BY sort_order ASC, created_at DESC`
    );
    const origins = result.rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      name: typeof r.name === 'string' ? JSON.parse(r.name) : r.name,
    }));
    res.json({ success: true, origins });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function adminCreateOrigin(req: Request, res: Response): Promise<void> {
  const { name, kind, lat, lng, district, state, sort_order = 0, active = true } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    const result = await query(
      `INSERT INTO route_origins (name, kind, lat, lng, district, state, sort_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [JSON.stringify(name), kind, lat, lng, district, state, sort_order, active]
    );

    await writeAudit({
      adminId,
      action: 'route_origin.create',
      entityType: 'route_origin',
      entityId: result.rows[0].id,
      newValue: { name, kind, lat, lng },
    });

    res.status(201).json({ success: true, origin: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: err.message } });
  }
}

export async function adminUpdateOrigin(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { name, kind, lat, lng, district, state, sort_order, active } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    const result = await query(
      `UPDATE route_origins
       SET name = COALESCE($1, name),
           kind = COALESCE($2, kind),
           lat = COALESCE($3, lat),
           lng = COALESCE($4, lng),
           district = COALESCE($5, district),
           state = COALESCE($6, state),
           sort_order = COALESCE($7, sort_order),
           active = COALESCE($8, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name ? JSON.stringify(name) : null, kind, lat, lng, district, state, sort_order, active, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Origin not found.' } });
      return;
    }

    await writeAudit({
      adminId,
      action: 'route_origin.update',
      entityType: 'route_origin',
      entityId: id,
      newValue: { changes: req.body },
    });

    res.json({ success: true, origin: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'UPDATE_ERROR', message: err.message } });
  }
}

export async function adminDeleteOrigin(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const adminId = (req as any).user?.id || 'admin';

  try {
    await query(`DELETE FROM route_origins WHERE id = $1`, [id]);

    await writeAudit({
      adminId,
      action: 'route_origin.delete',
      entityType: 'route_origin',
      entityId: id,
    });

    res.json({ success: true, message: 'Origin deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DELETE_ERROR', message: err.message } });
  }
}

// Access Points Admin
export async function adminGetAccessPoints(req: Request, res: Response): Promise<void> {
  const { ghatId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM ghat_access_points WHERE ghat_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [ghatId]
    );
    const points = result.rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      name: typeof r.name === 'string' ? JSON.parse(r.name) : r.name,
      notes: r.notes ? (typeof r.notes === 'string' ? JSON.parse(r.notes) : r.notes) : null,
    }));
    res.json({ success: true, access_points: points });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function adminCreateAccessPoint(req: Request, res: Response): Promise<void> {
  const { ghat_id, kind, name, lat, lng, coordinates_precision = 'access_verified', notes, is_default = false, active = true, source_url } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    if (is_default) {
      // Clear previous default
      await query(`UPDATE ghat_access_points SET is_default = false WHERE ghat_id = $1`, [ghat_id]);
    }

    const result = await query(
      `INSERT INTO ghat_access_points (ghat_id, kind, name, lat, lng, coordinates_precision, notes, is_default, active, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [ghat_id, kind, JSON.stringify(name), lat, lng, coordinates_precision, notes ? JSON.stringify(notes) : null, is_default, active, source_url]
    );

    await writeAudit({
      adminId,
      action: 'access_point.create',
      entityType: 'access_point',
      entityId: result.rows[0].id,
      newValue: { ghat_id, kind, name },
    });

    res.status(201).json({ success: true, access_point: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: err.message } });
  }
}

export async function adminUpdateAccessPoint(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { kind, name, lat, lng, coordinates_precision, notes, is_default, active, source_url } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    if (is_default) {
      const apRes = await query(`SELECT ghat_id FROM ghat_access_points WHERE id = $1`, [id]);
      if (apRes.rows.length > 0) {
        await query(`UPDATE ghat_access_points SET is_default = false WHERE ghat_id = $1`, [apRes.rows[0].ghat_id]);
      }
    }

    const result = await query(
      `UPDATE ghat_access_points
       SET kind = COALESCE($1, kind),
           name = COALESCE($2, name),
           lat = COALESCE($3, lat),
           lng = COALESCE($4, lng),
           coordinates_precision = COALESCE($5, coordinates_precision),
           notes = COALESCE($6, notes),
           is_default = COALESCE($7, is_default),
           active = COALESCE($8, active),
           source_url = COALESCE($9, source_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        kind,
        name ? JSON.stringify(name) : null,
        lat,
        lng,
        coordinates_precision,
        notes !== undefined ? (notes ? JSON.stringify(notes) : null) : null,
        is_default,
        active,
        source_url,
        id,
      ]
    );

    await writeAudit({
      adminId,
      action: 'access_point.update',
      entityType: 'access_point',
      entityId: id,
      newValue: { changes: req.body },
    });

    res.json({ success: true, access_point: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'UPDATE_ERROR', message: err.message } });
  }
}

// Closures Admin
export async function adminGetClosures(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, title, description, severity, ST_AsGeoJSON(geometry) as geometry_json, starts_at, ends_at, active, source_name, source_url, created_at, updated_at
       FROM route_closures
       ORDER BY created_at DESC`
    );
    const closures = result.rows.map((r) => ({
      ...r,
      title: typeof r.title === 'string' ? JSON.parse(r.title) : r.title,
      description: r.description ? (typeof r.description === 'string' ? JSON.parse(r.description) : r.description) : null,
      geometry: r.geometry_json ? JSON.parse(r.geometry_json) : null,
    }));
    res.json({ success: true, closures });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function adminCreateClosure(req: Request, res: Response): Promise<void> {
  const { title, description, severity = 'warning', geometry, starts_at, ends_at, source_name, source_url } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    const geojsonStr = JSON.stringify(geometry);
    const result = await query(
      `INSERT INTO route_closures (title, description, severity, geometry, starts_at, ends_at, source_name, source_url, created_by)
       VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6, $7, $8, $9)
       RETURNING id, title, description, severity, starts_at, ends_at, active, source_name, source_url, created_at`,
      [JSON.stringify(title), description ? JSON.stringify(description) : null, severity, geojsonStr, starts_at, ends_at, source_name, source_url, adminId]
    );

    await writeAudit({
      adminId,
      action: 'route_closure.create',
      entityType: 'route_closure',
      entityId: result.rows[0].id,
      newValue: { title, severity, starts_at, ends_at },
    });

    res.status(201).json({ success: true, closure: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: err.message } });
  }
}

export async function adminDeleteClosure(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const adminId = (req as any).user?.id || 'admin';

  try {
    await query(`DELETE FROM route_closures WHERE id = $1`, [id]);

    await writeAudit({
      adminId,
      action: 'route_closure.delete',
      entityType: 'route_closure',
      entityId: id,
    });

    res.json({ success: true, message: 'Closure removed.' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DELETE_ERROR', message: err.message } });
  }
}

// Delay Factors Admin
export async function adminGetDelayFactors(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT df.*, g.name as ghat_name
       FROM ghat_delay_factors df
       LEFT JOIN ghats g ON df.ghat_id = g.id
       ORDER BY df.created_at DESC`
    );

    const factors = result.rows.map((r) => ({
      ...r,
      factor: Number(r.factor),
      label: typeof r.label === 'string' ? JSON.parse(r.label) : r.label,
      ghat_name: r.ghat_name ? (typeof r.ghat_name === 'string' ? JSON.parse(r.ghat_name) : r.ghat_name) : null,
    }));

    res.json({ success: true, delay_factors: factors });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function adminCreateDelayFactor(req: Request, res: Response): Promise<void> {
  const { ghat_id = null, factor, label, starts_at, ends_at } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    const result = await query(
      `INSERT INTO ghat_delay_factors (ghat_id, factor, label, starts_at, ends_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [ghat_id, factor, JSON.stringify(label), starts_at, ends_at, adminId]
    );

    await writeAudit({
      adminId,
      action: 'delay_factor.create',
      entityType: 'delay_factor',
      entityId: result.rows[0].id,
      newValue: { ghat_id, factor, starts_at, ends_at },
    });

    res.status(201).json({ success: true, delay_factor: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: err.message } });
  }
}

export async function adminDeleteDelayFactor(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const adminId = (req as any).user?.id || 'admin';

  try {
    await query(`DELETE FROM ghat_delay_factors WHERE id = $1`, [id]);

    await writeAudit({
      adminId,
      action: 'delay_factor.delete',
      entityType: 'delay_factor',
      entityId: id,
    });

    res.json({ success: true, message: 'Delay factor removed.' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DELETE_ERROR', message: err.message } });
  }
}

// Temples Admin
export async function adminGetTemples(req: Request, res: Response): Promise<void> {
  try {
    const result = await query(
      `SELECT id, name, lat, lng, district, state, coordinates_precision, source, osm_id, verified, active, created_at, updated_at
       FROM temples
       ORDER BY created_at DESC
       LIMIT 200`
    );

    const temples = result.rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      name: typeof r.name === 'string' ? JSON.parse(r.name) : r.name,
    }));

    res.json({ success: true, temples });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

export async function adminUpdateTemple(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { name, lat, lng, district, state, coordinates_precision, verified, active } = req.body;
  const adminId = (req as any).user?.id || 'admin';

  try {
    const result = await query(
      `UPDATE temples
       SET name = COALESCE($1, name),
           lat = COALESCE($2, lat),
           lng = COALESCE($3, lng),
           district = COALESCE($4, district),
           state = COALESCE($5, state),
           coordinates_precision = COALESCE($6, coordinates_precision),
           verified = COALESCE($7, verified),
           is_verified = COALESCE($7, is_verified),
           active = COALESCE($8, active),
           is_hidden = NOT COALESCE($8, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name ? JSON.stringify(name) : null, lat, lng, district, state, coordinates_precision, verified, active, id]
    );

    await writeAudit({
      adminId,
      action: 'temple.update',
      entityType: 'temple',
      entityId: id,
      newValue: { changes: req.body },
    });

    res.json({ success: true, temple: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'UPDATE_ERROR', message: err.message } });
  }
}

// Routing Operations Dashboard
export async function adminGetOperations(req: Request, res: Response): Promise<void> {
  try {
    // 1. Daily usage count
    const usageDaily = await query(
      `SELECT provider, COUNT(*) as count 
       FROM api_usage_logs 
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY provider`
    );

    // 2. Precomputed routes count
    const routesCount = await query(
      `SELECT mode, COUNT(*) as count, COUNT(*) FILTER (WHERE stale = false) as fresh_count
       FROM standard_routes
       GROUP BY mode`
    );

    // 3. Active closures count
    const closuresCount = await query(
      `SELECT COUNT(*) as count FROM route_closures WHERE active = true AND starts_at <= NOW() AND ends_at >= NOW()`
    );

    // 4. Origins & Access points count
    const originsCount = await query(`SELECT COUNT(*) as count FROM route_origins WHERE active = true`);
    const apCount = await query(`SELECT COUNT(*) as count FROM ghat_access_points WHERE active = true`);
    const templesCount = await query(`SELECT COUNT(*) as count FROM temples WHERE active = true`);

    res.json({
      success: true,
      operations: {
        activeProvider: routingService.getProviderName(),
        dailyUsage: usageDaily.rows,
        standardRoutes: routesCount.rows,
        activeClosures: parseInt(closuresCount.rows[0]?.count || '0', 10),
        activeOrigins: parseInt(originsCount.rows[0]?.count || '0', 10),
        activeAccessPoints: parseInt(apCount.rows[0]?.count || '0', 10),
        activeTemples: parseInt(templesCount.rows[0]?.count || '0', 10),
        attribution: ROUTING_ATTRIBUTION.COMBINED_ORS,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'DATABASE_ERROR', message: err.message } });
  }
}

