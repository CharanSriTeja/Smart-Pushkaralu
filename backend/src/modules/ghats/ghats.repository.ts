import { query, withTransaction } from '../../db/index.js';
import {
  Ghat,
  GhatQueryParams,
  GhatSource,
  GhatFacility,
  GhatAartiTiming,
  GhatNotice,
  CrowdStatus,
  PublishStatus,
} from '../../types/ghats.js';
import { parseCoordinates } from '../../utils/geo.js';
import { evaluateOfficialApproval, PUSHKARALU_SAFETY_DISCLAIMER } from '../../utils/trustVerifier.js';

export class GhatsRepository {
  /**
   * Check if PostGIS extension is available in the current database
   */
  private static async hasPostGIS(): Promise<boolean> {
    try {
      const { rows } = await query("SELECT 1 FROM pg_extension WHERE extname = 'postgis' LIMIT 1");
      return rows.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Search & filter ghats with optional distance sorting and geospatial filtering
   */
  static async findGhats(params: GhatQueryParams): Promise<{ ghats: Ghat[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    // Filter by publish_status (only published unless admin includes hidden)
    if (!params.includeHidden) {
      conditions.push(`g.publish_status = 'published'`);
    } else if (params.includeHidden && params.publishStatus) {
      conditions.push(`g.publish_status = $${idx++}`);
      values.push(params.publishStatus);
    }

    if (params.state) {
      conditions.push(`LOWER(g.state) = LOWER($${idx++})`);
      values.push(params.state);
    }

    if (params.district) {
      conditions.push(`LOWER(g.district) = LOWER($${idx++})`);
      values.push(params.district);
    }

    if (params.river) {
      conditions.push(`LOWER(g.river) = LOWER($${idx++})`);
      values.push(params.river);
    }

    if (params.crowdLevel) {
      conditions.push(`g.crowd_level = $${idx++}`);
      values.push(params.crowdLevel);
    }

    if (params.bathingStatus) {
      conditions.push(`g.bathing_status = $${idx++}`);
      values.push(params.bathingStatus);
    }

    // Filter by facilities if specified
    if (params.facilities) {
      const facilityList = Array.isArray(params.facilities)
        ? params.facilities
        : params.facilities.split(',').map((f) => f.trim()).filter(Boolean);

      if (facilityList.length > 0) {
        conditions.push(`
          EXISTS (
            SELECT 1 FROM ghat_facilities gf
            WHERE gf.ghat_id = g.id
              AND gf.facility_type = ANY($${idx++})
              AND gf.is_operational = true
          )
        `);
        values.push(facilityList);
      }
    }

    // Free text search in English, Telugu, Hindi names and town
    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      conditions.push(`(
        g.name->>'en' ILIKE $${idx} OR
        g.name->>'te' ILIKE $${idx} OR
        g.name->>'hi' ILIKE $${idx} OR
        g.nearest_town->>'en' ILIKE $${idx} OR
        g.district ILIKE $${idx}
      )`);
      values.push(searchTerm);
      idx++;
    }

    // Coordinate / Distance calculation
    const coords = parseCoordinates(params.near);
    let distanceSelectSql = 'NULL AS distance_meters';
    let orderBySql = 'ORDER BY g.created_at DESC';

    if (coords) {
      const userLatIdx = idx++;
      const userLngIdx = idx++;
      values.push(coords.lat);
      values.push(coords.lng);

      // SQL Haversine formula calculation for exact distance in meters
      distanceSelectSql = `
        ROUND(
          6371000 * 2 * ASIN(
            SQRT(
              POWER(SIN(RADIANS(g.lat - $${userLatIdx}) / 2), 2) +
              COS(RADIANS($${userLatIdx})) * COS(RADIANS(g.lat)) *
              POWER(SIN(RADIANS(g.lng - $${userLngIdx}) / 2), 2)
            )
          )
        ) AS distance_meters
      `;

      if (params.maxDistanceMeters) {
        conditions.push(`
          (6371000 * 2 * ASIN(
            SQRT(
              POWER(SIN(RADIANS(g.lat - $${userLatIdx}) / 2), 2) +
              COS(RADIANS($${userLatIdx})) * COS(RADIANS(g.lat)) *
              POWER(SIN(RADIANS(g.lng - $${userLngIdx}) / 2), 2)
            )
          )) <= $${idx++}
        `);
        values.push(params.maxDistanceMeters);
      }

      if (!params.sortBy || params.sortBy === 'distance') {
        orderBySql = 'ORDER BY distance_meters ASC';
      }
    }

    if (params.sortBy && params.sortBy !== 'distance') {
      const dir = params.sortOrder === 'desc' ? 'DESC' : 'ASC';
      if (params.sortBy === 'name') {
        orderBySql = `ORDER BY g.name->>'en' ${dir}`;
      } else if (params.sortBy === 'crowd_level') {
        orderBySql = `ORDER BY g.crowd_level ${dir}`;
      } else if (params.sortBy === 'created_at') {
        orderBySql = `ORDER BY g.created_at ${dir}`;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countSql = `SELECT COUNT(*) AS total FROM ghats g ${whereClause}`;
    const countRes = await query<{ total: string }>(countSql, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Pagination
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT
        g.*,
        ${distanceSelectSql},
        cs.current_level AS live_crowd_level,
        cs.source_type AS crowd_source_type,
        cs.updated_at AS crowd_updated_at,
        (
          SELECT json_agg(gf.*)
          FROM ghat_facilities gf
          WHERE gf.ghat_id = g.id AND gf.is_operational = true
        ) AS facilities,
        (
          SELECT json_agg(gn.*)
          FROM ghat_notices gn
          WHERE gn.ghat_id = g.id AND gn.is_active = true
        ) AS active_notices
      FROM ghats g
      LEFT JOIN crowd_status cs ON cs.ghat_id = g.id
      ${whereClause}
      ${orderBySql}
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataRes = await query<any>(dataSql, [...values, limit, offset]);

    const ghats: Ghat[] = dataRes.rows.map((row) => {
      const approval = evaluateOfficialApproval(row.record_status, row.official_source_url);
      const distanceMeters = row.distance_meters !== null ? Number(row.distance_meters) : undefined;
      const distanceKm = distanceMeters !== undefined ? Math.round((distanceMeters / 1000) * 10) / 10 : undefined;

      return {
        ...row,
        distance_meters: distanceMeters,
        distance_km: distanceKm,
        is_officially_approved: approval.isOfficiallyApproved,
        trust_code: approval.trustCode,
        trust_label: approval.trustLabel,
        safety_disclaimer: PUSHKARALU_SAFETY_DISCLAIMER,
      };
    });

    return { ghats, total };
  }

  /**
   * Find ghat by primary ID with full relations (sources, facilities, aarti timings, active notices, crowd status)
   */
  static async findGhatById(id: string): Promise<Ghat | null> {
    const { rows } = await query<any>(
      `SELECT g.*,
        row_to_json(cs.*) AS crowd_status
       FROM ghats g
       LEFT JOIN crowd_status cs ON cs.ghat_id = g.id
       WHERE g.id = $1
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const ghat = rows[0];

    // Fetch related items
    const [sourcesRes, facilitiesRes, aartiRes, noticesRes] = await Promise.all([
      query<GhatSource>('SELECT * FROM ghat_sources WHERE ghat_id = $1 ORDER BY is_official DESC, created_at ASC', [id]),
      query<GhatFacility>('SELECT * FROM ghat_facilities WHERE ghat_id = $1 ORDER BY facility_type ASC', [id]),
      query<GhatAartiTiming>('SELECT * FROM ghat_aarti_timings WHERE ghat_id = $1 ORDER BY time_start ASC', [id]),
      query<GhatNotice>('SELECT * FROM ghat_notices WHERE ghat_id = $1 AND is_active = true ORDER BY severity DESC, starts_at DESC', [id]),
    ]);

    const approval = evaluateOfficialApproval(ghat.record_status, ghat.official_source_url);

    return {
      ...ghat,
      sources: sourcesRes.rows,
      facilities: facilitiesRes.rows,
      aarti_timings: aartiRes.rows,
      active_notices: noticesRes.rows,
      is_officially_approved: approval.isOfficiallyApproved,
      trust_code: approval.trustCode,
      trust_label: approval.trustLabel,
      safety_disclaimer: PUSHKARALU_SAFETY_DISCLAIMER,
    };
  }

  /**
   * Create a new ghat entry
   */
  static async createGhat(data: {
    name: any;
    river: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
    nearest_town: any;
    nearest_railway_station: any;
    nearest_bus_stand: any;
    official_source_url?: string | null;
    verified_at?: string | null;
    record_status?: string;
    bathing_status?: string;
    crowd_level?: string;
    publish_status?: string;
    description?: any;
    max_capacity?: number | null;
  }): Promise<Ghat> {
    const { rows } = await query<Ghat>(
      `INSERT INTO ghats (
        name, river, district, state, lat, lng,
        nearest_town, nearest_railway_station, nearest_bus_stand,
        official_source_url, verified_at, record_status,
        bathing_status, crowd_level, publish_status,
        description, max_capacity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        JSON.stringify(data.name),
        data.river || 'Godavari',
        data.district,
        data.state,
        data.lat,
        data.lng,
        JSON.stringify(data.nearest_town),
        JSON.stringify(data.nearest_railway_station),
        JSON.stringify(data.nearest_bus_stand),
        data.official_source_url || null,
        data.verified_at || null,
        data.record_status || 'unverified',
        data.bathing_status || 'unknown',
        data.crowd_level || 'unknown',
        data.publish_status || 'draft',
        data.description ? JSON.stringify(data.description) : null,
        data.max_capacity || null,
      ]
    );

    const newGhat = rows[0];

    // Initialize default crowd status
    await query(
      `INSERT INTO crowd_status (ghat_id, current_level, source_type, confidence_score)
       VALUES ($1, $2, 'default', 0.5)
       ON CONFLICT (ghat_id) DO NOTHING`,
      [newGhat.id, newGhat.crowd_level || 'unknown']
    );

    return newGhat;
  }

  /**
   * Update existing ghat
   */
  static async updateGhat(id: string, updates: Record<string, any>): Promise<Ghat | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'nearest_town', 'nearest_railway_station', 'nearest_bus_stand', 'description'].includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      } else if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return this.findGhatById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE ghats SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await query<Ghat>(sql, values);

    if (rows.length === 0) return null;
    return this.findGhatById(id);
  }

  /**
   * Toggle or set publish status (draft / published / hidden)
   */
  static async setPublishStatus(id: string, status: PublishStatus): Promise<Ghat | null> {
    const { rows } = await query<Ghat>(
      'UPDATE ghats SET publish_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Get active notices for a ghat
   */
  static async getNoticesForGhat(ghatId: string): Promise<GhatNotice[]> {
    const { rows } = await query<GhatNotice>(
      `SELECT * FROM ghat_notices 
       WHERE ghat_id = $1 AND is_active = true 
         AND (ends_at IS NULL OR ends_at > CURRENT_TIMESTAMP)
       ORDER BY severity DESC, starts_at DESC`,
      [ghatId]
    );
    return rows;
  }

  /**
   * Add a notice to a ghat
   */
  static async createNotice(data: {
    ghat_id: string;
    title: any;
    message: any;
    severity?: string;
    is_active?: boolean;
    starts_at?: string;
    ends_at?: string | null;
  }): Promise<GhatNotice> {
    const { rows } = await query<GhatNotice>(
      `INSERT INTO ghat_notices (
        ghat_id, title, message, severity, is_active, starts_at, ends_at
      ) VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, CURRENT_TIMESTAMP), $7)
      RETURNING *`,
      [
        data.ghat_id,
        JSON.stringify(data.title),
        JSON.stringify(data.message),
        data.severity || 'info',
        data.is_active !== undefined ? data.is_active : true,
        data.starts_at || null,
        data.ends_at || null,
      ]
    );
    return rows[0];
  }
}

