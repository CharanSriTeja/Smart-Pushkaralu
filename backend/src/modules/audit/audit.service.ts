import { query } from '../../db/index.js';
import { AuditLog } from '../../types/ghats.js';

export interface CreateAuditLogParams {
  adminId?: string | null;
  /** Deprecated alias kept for backward compatibility with existing callers. Not stored in DB. */
  adminEmail?: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  /** New field name matching DB column */
  oldValue?: any;
  /** Old field name alias – maps to old_value DB column */
  oldValues?: any;
  /** New field name matching DB column */
  newValue?: any;
  /** Old field name alias – maps to new_value DB column */
  newValues?: any;
  sourceUrl?: string | null;
  reason?: string | null;
  /** Deprecated – not stored in DB column, ignored silently */
  ipAddress?: string | null;
}

export class AuditService {
  /**
   * Records an administrative action in the audit_logs table.
   * Logs admin, timestamp, old value, new value, source URL, and reason.
   */
  static async record(params: CreateAuditLogParams): Promise<AuditLog> {
    const resolvedOld = params.oldValue ?? params.oldValues ?? null;
    const resolvedNew = params.newValue ?? params.newValues ?? null;

    const { rows } = await query<AuditLog>(
      `INSERT INTO audit_logs (
        admin_id, admin_email, action, entity_type, entity_id,
        old_values, new_values, source_url, reason, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        params.adminId || null,
        params.adminEmail || 'admin',
        params.action,
        params.entityType,
        params.entityId || null,
        resolvedOld ? JSON.stringify(resolvedOld) : null,
        resolvedNew ? JSON.stringify(resolvedNew) : null,
        params.sourceUrl || null,
        params.reason || null,
        params.ipAddress || null,
      ]
    );

    return rows[0];
  }

  /**
   * Retrieves audit logs for an entity or by filter.
   */
  static async getLogs(options: {
    entityType?: string;
    entityId?: string;
    adminId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (options.entityType) {
      conditions.push(`entity_type = $${idx++}`);
      values.push(options.entityType);
    }

    if (options.entityId) {
      conditions.push(`entity_id = $${idx++}`);
      values.push(options.entityId);
    }

    if (options.adminId) {
      conditions.push(`admin_id = $${idx++}`);
      values.push(options.adminId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(options.limit || 50, 100);
    const offset = options.offset || 0;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const logRes = await query<AuditLog>(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return {
      logs: logRes.rows,
      total,
    };
  }
}

