import { query } from '../db/index.js';
import { logger } from './logger.js';

export interface AuditLogEntry {
  adminId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
  sourceUrl?: string | null;
  reason?: string | null;
}

export interface AuditLogRecord {
  id: string;
  admin_id: string | null;
  admin_phone?: string | null;
  admin_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  source_url: string | null;
  reason: string | null;
  created_at: Date;
}

/**
 * Inserts an immutable audit record for tracking admin actions and sensitive modifications.
 */
export async function writeAudit(entry: AuditLogEntry): Promise<AuditLogRecord> {
  try {
    const isUuid = typeof entry.adminId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.adminId);
    let resolvedAdminId: string | null = null;

    if (isUuid) {
      const { rows } = await query<{ id: string }>(
        'SELECT id FROM users WHERE id = $1 LIMIT 1',
        [entry.adminId]
      );
      resolvedAdminId = rows[0]?.id || null;
    }

    const { rows } = await query<AuditLogRecord>(
      `INSERT INTO audit_logs (
        admin_id, action, entity_type, entity_id,
        old_value, new_value, source_url, reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        resolvedAdminId,
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        entry.newValue ? JSON.stringify(entry.newValue) : null,
        entry.sourceUrl || null,
        entry.reason || null,
      ]
    );

    if (!rows[0]) {
      throw new Error('Audit log insert returned no record');
    }

    return rows[0];
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(
      { err: error, action: entry.action, entityType: entry.entityType, entityId: entry.entityId },
      'Failed to record audit log entry'
    );
    throw new Error(
      `Failed to record audit log entry for ${entry.action} on ${entry.entityType}: ${error.message}`,
      { cause: error }
    );
  }
}
