import crypto from 'crypto';
import { query } from '../../db/index.js';
import {
  IssueReport,
  IssueUpdate,
  CreateIssueDTO,
  IssueCategory,
  IssueStatus,
  IssueFilterParams,
} from '../../types/issues.js';

export class IssuesRepository {
  /**
   * Generates a collision-resistant, human-friendly Pushkaralu ticket number.
   * Example: SP-2027-9X4B2A
   */
  static generateTicketNo(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude 0, 1, I, O for visual clarity
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return `SP-2027-${code}`;
  }

  /**
   * Duplicate detection: Finds an open issue with the same category within
   * a given distance (default 100 meters) and time window (default 30 minutes).
   */
  static async findDuplicate(
    category: IssueCategory,
    lat: number,
    lng: number,
    timeWindowMinutes = 30,
    distanceMeters = 100
  ): Promise<(IssueReport & { distance_meters: number }) | null> {
    // Haversine distance formula directly in SQL (works universally with or without PostGIS extension)
    const sql = `
      SELECT *,
        (6371000 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($1)) * cos(radians(lat)) *
            cos(radians(lng) - radians($2)) +
            sin(radians($1)) * sin(radians(lat))
          ))
        )) AS distance_meters
      FROM issue_reports
      WHERE category = $3
        AND status IN ('submitted', 'under_review', 'in_progress')
        AND created_at >= CURRENT_TIMESTAMP - ($4 || ' minutes')::interval
      ORDER BY distance_meters ASC
      LIMIT 1
    `;

    const { rows } = await query<IssueReport & { distance_meters: string | number }>(sql, [
      lat,
      lng,
      category,
      timeWindowMinutes.toString(),
    ]);

    if (rows.length > 0) {
      const row = rows[0];
      const dist = typeof row.distance_meters === 'string' ? parseFloat(row.distance_meters) : row.distance_meters;
      if (dist <= distanceMeters) {
        return {
          ...row,
          lat: Number(row.lat),
          lng: Number(row.lng),
          distance_meters: Math.round(dist * 10) / 10,
        };
      }
    }

    return null;
  }

  /**
   * Automatically resolves closest ghat within 5km if ghat_id wasn't explicitly supplied
   */
  static async findNearestGhatId(lat: number, lng: number): Promise<string | null> {
    try {
      const sql = `
        SELECT id,
          (6371000 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($1)) * cos(radians(lat)) *
              cos(radians(lng) - radians($2)) +
              sin(radians($1)) * sin(radians(lat))
            ))
          )) AS distance_meters
        FROM ghats
        WHERE publish_status = 'published'
        ORDER BY distance_meters ASC
        LIMIT 1
      `;
      const { rows } = await query<{ id: string; distance_meters: string | number }>(sql, [lat, lng]);
      if (rows.length > 0) {
        const dist = typeof rows[0].distance_meters === 'string' ? parseFloat(rows[0].distance_meters) : rows[0].distance_meters;
        if (dist <= 5000) {
          // within 5km
          return rows[0].id;
        }
      }
    } catch {
      // If ghats table query fails, continue gracefully
    }
    return null;
  }

  /**
   * Inserts a new issue report and its initial timeline update
   */
  static async createIssue(
    dto: CreateIssueDTO,
    reporter?: { id?: string | null; phone?: string | null }
  ): Promise<IssueReport> {
    let ticketNo = this.generateTicketNo();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await this.findByTicketNo(ticketNo);
      if (!existing) break;
      ticketNo = this.generateTicketNo();
      attempts++;
    }

    const ghatId = dto.ghat_id || (await this.findNearestGhatId(dto.lat, dto.lng));

    const insertSql = `
      INSERT INTO issue_reports (
        ticket_no, category, description, photo_url, location_type,
        lat, lng, qr_zone_id, ghat_id, status, priority,
        reporter_id, reporter_phone, reporter_device_token, device_fingerprint,
        is_duplicate, duplicate_of_ticket_no, duplicate_count, client_metadata,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, 'submitted', 'medium',
        $10, $11, $12, $13,
        false, null, 0, $14,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const { rows } = await query<IssueReport>(insertSql, [
      ticketNo,
      dto.category,
      dto.description,
      dto.photo_url || null,
      dto.location_type || 'gps',
      dto.lat,
      dto.lng,
      dto.qr_zone_id || null,
      ghatId,
      reporter?.id || null,
      reporter?.phone || (dto as any).reporter_phone || null,
      dto.reporter_device_token || null,
      dto.device_fingerprint || null,
      dto.client_metadata ? JSON.stringify(dto.client_metadata) : null,
    ]);

    const created = rows[0];

    // Create initial timeline event
    await this.addUpdate({
      issue_id: created.id,
      status: 'submitted',
      public_note: 'Issue reported and queued for verification by Pushkaralu grievance team.',
      internal_note: 'Initial report submitted via mobile portal.',
    });

    return {
      ...created,
      lat: Number(created.lat),
      lng: Number(created.lng),
    };
  }

  /**
   * Increments duplicate count for an existing ticket
   */
  static async incrementDuplicateCount(ticketNo: string): Promise<IssueReport | null> {
    const { rows } = await query<IssueReport>(
      `UPDATE issue_reports
       SET duplicate_count = duplicate_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE ticket_no = $1
       RETURNING *`,
      [ticketNo]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      lat: Number(rows[0].lat),
      lng: Number(rows[0].lng),
    };
  }

  /**
   * Find issue by ticket number (case insensitive)
   */
  static async findByTicketNo(ticketNo: string): Promise<IssueReport | null> {
    const { rows } = await query<IssueReport>(
      `SELECT * FROM issue_reports WHERE LOWER(ticket_no) = LOWER($1) LIMIT 1`,
      [ticketNo.trim()]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      lat: Number(rows[0].lat),
      lng: Number(rows[0].lng),
    };
  }

  /**
   * Find issue by UUID
   */
  static async findById(id: string): Promise<IssueReport | null> {
    const { rows } = await query<IssueReport>(
      `SELECT * FROM issue_reports WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      lat: Number(rows[0].lat),
      lng: Number(rows[0].lng),
    };
  }

  /**
   * Fetches the timeline updates for an issue.
   * If includeInternal is false, internal notes are omitted for public safety.
   */
  static async getTimeline(issueId: string, includeInternal = false): Promise<IssueUpdate[]> {
    let sql: string;
    if (includeInternal) {
      sql = `SELECT * FROM issue_updates WHERE issue_id = $1 ORDER BY created_at ASC`;
    } else {
      sql = `SELECT id, issue_id, status, public_note, resolution_photo_url, created_at, null as internal_note, null as updated_by_admin_id
             FROM issue_updates WHERE issue_id = $1 ORDER BY created_at ASC`;
    }
    const { rows } = await query<IssueUpdate>(sql, [issueId]);
    return rows;
  }

  /**
   * Queries reports filed by the current user or guest device
   */
  static async findMyIssues(params: {
    reporterId?: string | null;
    deviceToken?: string | null;
    deviceFingerprint?: string | null;
  }): Promise<IssueReport[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (params.reporterId) {
      values.push(params.reporterId);
      conditions.push(`reporter_id = $${values.length}`);
    }

    if (params.deviceToken) {
      values.push(params.deviceToken);
      conditions.push(`reporter_device_token = $${values.length}`);
    }

    if (params.deviceFingerprint) {
      values.push(params.deviceFingerprint);
      conditions.push(`device_fingerprint = $${values.length}`);
    }

    if (conditions.length === 0) {
      return [];
    }

    const sql = `
      SELECT * FROM issue_reports
      WHERE ${conditions.join(' OR ')}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const { rows } = await query<IssueReport>(sql, values);
    return rows.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
    }));
  }

  /**
   * Admin list query with filters, search, and pagination
   */
  static async listIssues(filters: IssueFilterParams): Promise<{ issues: IssueReport[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }

    if (filters.category) {
      values.push(filters.category);
      conditions.push(`category = $${values.length}`);
    }

    if (filters.ghat_id) {
      values.push(filters.ghat_id);
      conditions.push(`ghat_id = $${values.length}`);
    }

    if (filters.search && filters.search.trim().length > 0) {
      values.push(`%${filters.search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(ticket_no) LIKE $${values.length} OR LOWER(description) LIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM issue_reports ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    // Pagination & sort
    const limit = Math.min(Math.max(filters.limit || 20, 1), 100);
    const page = Math.max(filters.page || 1, 1);
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT * FROM issue_reports
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const { rows } = await query<IssueReport>(dataSql, values);
    return {
      issues: rows.map((r) => ({
        ...r,
        lat: Number(r.lat),
        lng: Number(r.lng),
      })),
      total,
    };
  }

  /**
   * Updates issue status
   */
  static async updateStatus(id: string, status: IssueStatus): Promise<IssueReport | null> {
    const { rows } = await query<IssueReport>(
      `UPDATE issue_reports
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      lat: Number(rows[0].lat),
      lng: Number(rows[0].lng),
    };
  }

  /**
   * Adds an update to the issue timeline
   */
  static async addUpdate(params: {
    issue_id: string;
    status: IssueStatus;
    public_note?: string | null;
    internal_note?: string | null;
    resolution_photo_url?: string | null;
    updated_by_admin_id?: string | null;
  }): Promise<IssueUpdate> {
    const { rows } = await query<IssueUpdate>(
      `INSERT INTO issue_updates (
        issue_id, status, public_note, internal_note, resolution_photo_url, updated_by_admin_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        params.issue_id,
        params.status,
        params.public_note || null,
        params.internal_note || null,
        params.resolution_photo_url || null,
        params.updated_by_admin_id || null,
      ]
    );
    return rows[0];
  }
}

