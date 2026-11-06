import { query, pool } from '../../db/index.js';
import {
  NearbyPlace,
  NearbyPlacesCacheRecord,
  CuratedHotel,
  CuratedTemple,
  CuratedTransportHub,
  PlaceOverride,
  PlaceCategory,
  QueryPlaceType,
} from '../../types/places.js';
import { calculateTravelEstimates } from '../../services/distance.service.js';

export class PlacesRepository {
  /**
   * Retrieves basic details of a ghat by its UUID.
   */
  public static async getGhat(ghatId: string): Promise<{
    id: string;
    name: any;
    lat: number;
    lng: number;
    publish_status: string;
  } | null> {
    const { rows } = await query<{
      id: string;
      name: any;
      lat: string;
      lng: string;
      publish_status: string;
    }>(
      `SELECT id, name, lat, lng, publish_status FROM ghats WHERE id = $1 LIMIT 1`,
      [ghatId]
    );

    if (rows.length === 0) return null;
    return {
      id: rows[0].id,
      name: rows[0].name,
      lat: parseFloat(rows[0].lat),
      lng: parseFloat(rows[0].lng),
      publish_status: rows[0].publish_status,
    };
  }

  /**
   * Retrieves all published ghats for cache pre-warming.
   */
  public static async getAllPublishedGhats(): Promise<
    Array<{ id: string; name: any; lat: number; lng: number }>
  > {
    const { rows } = await query<{
      id: string;
      name: any;
      lat: string;
      lng: string;
    }>(
      `SELECT id, name, lat, lng FROM ghats WHERE publish_status = 'published'`
    );

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
    }));
  }

  /**
   * Fetch curated hotels within the given radius (meters) using Haversine calculation in SQL.
   */
  public static async getCuratedHotels(
    ghatLat: number,
    ghatLng: number,
    radiusMeters: number
  ): Promise<NearbyPlace[]> {
    const sql = `
      SELECT 
        id, name, description, address, phone, lat, lng, rating, 
        price_range, room_types, photo_url, website_url, is_verified, source_url,
        (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - $2) / 2), 2)
          ))
        ) AS distance_meters
      FROM hotels
      WHERE is_hidden = FALSE
        AND (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - $2) / 2), 2)
          ))
        ) <= $3
      ORDER BY distance_meters ASC
    `;

    const { rows } = await query<any>(sql, [ghatLat, ghatLng, radiusMeters]);

    return rows.map((r) => {
      const dist = Math.round(parseFloat(r.distance_meters));
      const est = calculateTravelEstimates(ghatLat, ghatLng, parseFloat(r.lat), parseFloat(r.lng), dist);

      return {
        id: r.id,
        name: r.name,
        type: 'hotel',
        source_type: 'curated',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        distance_m: est.distance_m,
        distance_km: est.distance_km,
        driving_time_minutes: est.driving_time_minutes,
        walking_time_minutes: est.walking_time_minutes,
        estimated_time_text: est.estimated_time_text,
        google_maps_url: est.google_maps_url,
        address: r.address || undefined,
        phone: r.phone || undefined,
        rating: r.rating ? parseFloat(r.rating) : undefined,
        price_range: r.price_range || undefined,
        room_types: r.room_types || undefined,
        photo_url: r.photo_url || undefined,
        website_url: r.website_url || undefined,
        is_verified: r.is_verified ?? true,
        source_url: r.source_url || undefined,
      };
    });
  }

  /**
   * Fetch curated temples within the given radius (meters).
   */
  public static async getCuratedTemples(
    ghatLat: number,
    ghatLng: number,
    radiusMeters: number
  ): Promise<NearbyPlace[]> {
    const sql = `
      SELECT 
        id, name, description, address, phone, lat, lng,
        deity, darshan_timings, special_entry_info, photo_url, website_url, is_verified, source_url,
        (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - $2) / 2), 2)
          ))
        ) AS distance_meters
      FROM temples
      WHERE is_hidden = FALSE
        AND (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - $2) / 2), 2)
          ))
        ) <= $3
      ORDER BY distance_meters ASC
    `;

    const { rows } = await query<any>(sql, [ghatLat, ghatLng, radiusMeters]);

    return rows.map((r) => {
      const dist = Math.round(parseFloat(r.distance_meters));
      const est = calculateTravelEstimates(ghatLat, ghatLng, parseFloat(r.lat), parseFloat(r.lng), dist);

      return {
        id: r.id,
        name: r.name,
        type: 'temple',
        source_type: 'curated',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        distance_m: est.distance_m,
        distance_km: est.distance_km,
        driving_time_minutes: est.driving_time_minutes,
        walking_time_minutes: est.walking_time_minutes,
        estimated_time_text: est.estimated_time_text,
        google_maps_url: est.google_maps_url,
        address: r.address || undefined,
        phone: r.phone || undefined,
        deity: r.deity || undefined,
        darshan_timings: r.darshan_timings || undefined,
        special_entry_info: r.special_entry_info || undefined,
        photo_url: r.photo_url || undefined,
        website_url: r.website_url || undefined,
        is_verified: r.is_verified ?? true,
        source_url: r.source_url || undefined,
      };
    });
  }

  /**
   * Fetch curated transport hubs within the given radius (meters).
   */
  public static async getCuratedTransportHubs(
    ghatLat: number,
    ghatLng: number,
    radiusMeters: number
  ): Promise<NearbyPlace[]> {
    const sql = `
      SELECT 
        id, name, description, hub_type, address, phone, lat, lng,
        operating_hours, source_url,
        (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - $2) / 2), 2)
          ))
        ) AS distance_meters
      FROM transport_hubs
      WHERE is_hidden = FALSE
        AND (
          6371000 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(lat - $1) / 2), 2) +
            COS(RADIANS($1)) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - $2) / 2), 2)
          ))
        ) <= $3
      ORDER BY distance_meters ASC
    `;

    const { rows } = await query<any>(sql, [ghatLat, ghatLng, radiusMeters]);

    return rows.map((r) => {
      const dist = Math.round(parseFloat(r.distance_meters));
      const est = calculateTravelEstimates(ghatLat, ghatLng, parseFloat(r.lat), parseFloat(r.lng), dist);

      return {
        id: r.id,
        name: r.name,
        type: 'transport_hub',
        source_type: 'curated',
        hub_type: r.hub_type,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        distance_m: est.distance_m,
        distance_km: est.distance_km,
        driving_time_minutes: est.driving_time_minutes,
        walking_time_minutes: est.walking_time_minutes,
        estimated_time_text: est.estimated_time_text,
        google_maps_url: est.google_maps_url,
        address: r.address || undefined,
        phone: r.phone || undefined,
        operating_hours: r.operating_hours || undefined,
        is_verified: true,
        source_url: r.source_url || undefined,
      };
    });
  }

  /**
   * Retrieves all overrides in a single map for fast lookups.
   */
  public static async getOverridesMap(): Promise<Map<string, PlaceOverride>> {
    const { rows } = await query<PlaceOverride>(`SELECT * FROM place_overrides`);
    const map = new Map<string, PlaceOverride>();
    for (const row of rows) {
      map.set(row.place_id, row);
    }
    return map;
  }

  /**
   * Look up a cache record for (ghat_id, type, radius_m).
   */
  public static async getCacheRecord(
    ghatId: string,
    type: string,
    radiusMeters: number
  ): Promise<NearbyPlacesCacheRecord | null> {
    const { rows } = await query<NearbyPlacesCacheRecord>(
      `SELECT * FROM nearby_places_cache 
       WHERE ghat_id = $1 AND type = $2 AND radius_m = $3
       LIMIT 1`,
      [ghatId, type, radiusMeters]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Save or update a cache record.
   */
  public static async saveCacheRecord(
    ghatId: string,
    type: string,
    radiusMeters: number,
    places: NearbyPlace[],
    expiresAt: Date
  ): Promise<void> {
    await query(
      `INSERT INTO nearby_places_cache (
        ghat_id, type, radius_m, results, fetched_at, expires_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (ghat_id, type, radius_m)
      DO UPDATE SET
        results = EXCLUDED.results,
        fetched_at = CURRENT_TIMESTAMP,
        expires_at = EXCLUDED.expires_at,
        updated_at = CURRENT_TIMESTAMP`,
      [ghatId, type, radiusMeters, JSON.stringify(places), expiresAt]
    );
  }

  /**
   * Invalidate cache entries.
   */
  public static async invalidateCache(
    ghatId?: string,
    type?: string,
    radiusMeters?: number
  ): Promise<number> {
    let sql = `DELETE FROM nearby_places_cache WHERE 1=1`;
    const params: any[] = [];

    if (ghatId) {
      params.push(ghatId);
      sql += ` AND ghat_id = $${params.length}`;
    }
    if (type && type !== 'all') {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }
    if (radiusMeters) {
      params.push(radiusMeters);
      sql += ` AND radius_m = $${params.length}`;
    }

    const res = await query(sql, params);
    return res.rowCount ?? 0;
  }

  /**
   * Lists cache entries with ghat details for admin cache status view.
   */
  public static async getCacheStatusList(): Promise<any[]> {
    const { rows } = await query(`
      SELECT 
        c.id, c.ghat_id, c.type, c.radius_m, 
        c.fetched_at, c.expires_at,
        jsonb_array_length(c.results) AS item_count,
        (CURRENT_TIMESTAMP > c.expires_at) AS is_stale,
        g.name AS ghat_name
      FROM nearby_places_cache c
      LEFT JOIN ghats g ON c.ghat_id = g.id
      ORDER BY c.fetched_at DESC
      LIMIT 100
    `);

    return rows;
  }

  // ================= ADMIN CURATED PLACES CRUD =================

  public static async listAllCuratedPlaces(): Promise<{
    hotels: any[];
    temples: any[];
    transport_hubs: any[];
  }> {
    const [hotelsRes, templesRes, transportRes] = await Promise.all([
      query(`SELECT * FROM hotels ORDER BY created_at DESC`),
      query(`SELECT * FROM temples ORDER BY created_at DESC`),
      query(`SELECT * FROM transport_hubs ORDER BY created_at DESC`),
    ]);

    return {
      hotels: hotelsRes.rows,
      temples: templesRes.rows,
      transport_hubs: transportRes.rows,
    };
  }

  public static async createHotel(data: Partial<CuratedHotel>): Promise<CuratedHotel> {
    const { rows } = await query<CuratedHotel>(
      `INSERT INTO hotels (
        name, description, address, phone, lat, lng, rating, 
        price_range, room_types, photo_url, website_url, is_verified, is_hidden, source_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        JSON.stringify(data.name),
        data.description ? JSON.stringify(data.description) : null,
        data.address ? JSON.stringify(data.address) : null,
        data.phone || null,
        data.lat,
        data.lng,
        data.rating || null,
        data.price_range || 'mid_range',
        data.room_types ? JSON.stringify(data.room_types) : null,
        data.photo_url || null,
        data.website_url || null,
        data.is_verified ?? true,
        data.is_hidden ?? false,
        data.source_url || null,
      ]
    );
    return rows[0];
  }

  public static async updateHotel(id: string, data: Partial<CuratedHotel>): Promise<CuratedHotel | null> {
    const { rows } = await query<CuratedHotel>(
      `UPDATE hotels SET
        name = COALESCE($1, name),
        description = CASE WHEN $2::jsonb IS NOT NULL THEN $2 ELSE description END,
        address = CASE WHEN $3::jsonb IS NOT NULL THEN $3 ELSE address END,
        phone = COALESCE($4, phone),
        lat = COALESCE($5, lat),
        lng = COALESCE($6, lng),
        rating = COALESCE($7, rating),
        price_range = COALESCE($8, price_range),
        room_types = CASE WHEN $9::jsonb IS NOT NULL THEN $9 ELSE room_types END,
        photo_url = COALESCE($10, photo_url),
        website_url = COALESCE($11, website_url),
        is_verified = COALESCE($12, is_verified),
        is_hidden = COALESCE($13, is_hidden),
        source_url = COALESCE($14, source_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
      [
        data.name ? JSON.stringify(data.name) : null,
        data.description ? JSON.stringify(data.description) : null,
        data.address ? JSON.stringify(data.address) : null,
        data.phone,
        data.lat,
        data.lng,
        data.rating,
        data.price_range,
        data.room_types ? JSON.stringify(data.room_types) : null,
        data.photo_url,
        data.website_url,
        data.is_verified,
        data.is_hidden,
        data.source_url,
        id,
      ]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  public static async deleteHotel(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM hotels WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public static async createTemple(data: Partial<CuratedTemple>): Promise<CuratedTemple> {
    const { rows } = await query<CuratedTemple>(
      `INSERT INTO temples (
        name, description, address, phone, lat, lng,
        deity, darshan_timings, special_entry_info, photo_url, website_url,
        is_verified, is_hidden, source_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        JSON.stringify(data.name),
        data.description ? JSON.stringify(data.description) : null,
        data.address ? JSON.stringify(data.address) : null,
        data.phone || null,
        data.lat,
        data.lng,
        data.deity ? JSON.stringify(data.deity) : null,
        data.darshan_timings ? JSON.stringify(data.darshan_timings) : null,
        data.special_entry_info ? JSON.stringify(data.special_entry_info) : null,
        data.photo_url || null,
        data.website_url || null,
        data.is_verified ?? true,
        data.is_hidden ?? false,
        data.source_url || null,
      ]
    );
    return rows[0];
  }

  public static async updateTemple(id: string, data: Partial<CuratedTemple>): Promise<CuratedTemple | null> {
    const { rows } = await query<CuratedTemple>(
      `UPDATE temples SET
        name = COALESCE($1, name),
        description = CASE WHEN $2::jsonb IS NOT NULL THEN $2 ELSE description END,
        address = CASE WHEN $3::jsonb IS NOT NULL THEN $3 ELSE address END,
        phone = COALESCE($4, phone),
        lat = COALESCE($5, lat),
        lng = COALESCE($6, lng),
        deity = CASE WHEN $7::jsonb IS NOT NULL THEN $7 ELSE deity END,
        darshan_timings = CASE WHEN $8::jsonb IS NOT NULL THEN $8 ELSE darshan_timings END,
        special_entry_info = CASE WHEN $9::jsonb IS NOT NULL THEN $9 ELSE special_entry_info END,
        photo_url = COALESCE($10, photo_url),
        website_url = COALESCE($11, website_url),
        is_verified = COALESCE($12, is_verified),
        is_hidden = COALESCE($13, is_hidden),
        source_url = COALESCE($14, source_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
      [
        data.name ? JSON.stringify(data.name) : null,
        data.description ? JSON.stringify(data.description) : null,
        data.address ? JSON.stringify(data.address) : null,
        data.phone,
        data.lat,
        data.lng,
        data.deity ? JSON.stringify(data.deity) : null,
        data.darshan_timings ? JSON.stringify(data.darshan_timings) : null,
        data.special_entry_info ? JSON.stringify(data.special_entry_info) : null,
        data.photo_url,
        data.website_url,
        data.is_verified,
        data.is_hidden,
        data.source_url,
        id,
      ]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  public static async deleteTemple(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM temples WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public static async createTransportHub(data: Partial<CuratedTransportHub>): Promise<CuratedTransportHub> {
    const { rows } = await query<CuratedTransportHub>(
      `INSERT INTO transport_hubs (
        name, description, hub_type, address, phone, lat, lng,
        operating_hours, is_hidden, source_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        JSON.stringify(data.name),
        data.description ? JSON.stringify(data.description) : null,
        data.hub_type,
        data.address ? JSON.stringify(data.address) : null,
        data.phone || null,
        data.lat,
        data.lng,
        data.operating_hours ? JSON.stringify(data.operating_hours) : null,
        data.is_hidden ?? false,
        data.source_url || null,
      ]
    );
    return rows[0];
  }

  public static async updateTransportHub(
    id: string,
    data: Partial<CuratedTransportHub>
  ): Promise<CuratedTransportHub | null> {
    const { rows } = await query<CuratedTransportHub>(
      `UPDATE transport_hubs SET
        name = COALESCE($1, name),
        description = CASE WHEN $2::jsonb IS NOT NULL THEN $2 ELSE description END,
        hub_type = COALESCE($3, hub_type),
        address = CASE WHEN $4::jsonb IS NOT NULL THEN $4 ELSE address END,
        phone = COALESCE($5, phone),
        lat = COALESCE($6, lat),
        lng = COALESCE($7, lng),
        operating_hours = CASE WHEN $8::jsonb IS NOT NULL THEN $8 ELSE operating_hours END,
        is_hidden = COALESCE($9, is_hidden),
        source_url = COALESCE($10, source_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        data.name ? JSON.stringify(data.name) : null,
        data.description ? JSON.stringify(data.description) : null,
        data.hub_type,
        data.address ? JSON.stringify(data.address) : null,
        data.phone,
        data.lat,
        data.lng,
        data.operating_hours ? JSON.stringify(data.operating_hours) : null,
        data.is_hidden,
        data.source_url,
        id,
      ]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  public static async deleteTransportHub(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM transport_hubs WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  public static async listOverrides(): Promise<PlaceOverride[]> {
    const { rows } = await query<PlaceOverride>(`SELECT * FROM place_overrides ORDER BY created_at DESC`);
    return rows;
  }

  public static async upsertOverride(data: Partial<PlaceOverride>): Promise<PlaceOverride> {
    const { rows } = await query<PlaceOverride>(
      `INSERT INTO place_overrides (
        place_id, name_override, phone_override, address_override,
        custom_notes, is_hidden, verified_by_admin_id, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (place_id)
      DO UPDATE SET
        name_override = COALESCE(EXCLUDED.name_override, place_overrides.name_override),
        phone_override = COALESCE(EXCLUDED.phone_override, place_overrides.phone_override),
        address_override = COALESCE(EXCLUDED.address_override, place_overrides.address_override),
        custom_notes = COALESCE(EXCLUDED.custom_notes, place_overrides.custom_notes),
        is_hidden = EXCLUDED.is_hidden,
        verified_by_admin_id = COALESCE(EXCLUDED.verified_by_admin_id, place_overrides.verified_by_admin_id),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        data.place_id,
        data.name_override ? JSON.stringify(data.name_override) : null,
        data.phone_override || null,
        data.address_override ? JSON.stringify(data.address_override) : null,
        data.custom_notes ? JSON.stringify(data.custom_notes) : null,
        data.is_hidden ?? false,
        data.verified_by_admin_id || null,
      ]
    );
    return rows[0];
  }

  public static async deleteOverride(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM place_overrides WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
