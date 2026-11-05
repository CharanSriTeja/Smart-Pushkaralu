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
export async function writeAudit(entry: AuditLogEntry): Promise<AuditLogRecord | null> {
  try {
    const { rows } = await query<AuditLogRecord>(
      `INSERT INTO audit_logs (
        admin_id, action, entity_type, entity_id,
        old_value, new_value, source_url, reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        entry.adminId || null,
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        entry.newValue ? JSON.stringify(entry.newValue) : null,
        entry.sourceUrl || null,
        entry.reason || null,
      ]
    );

    return rows[0] || null;
  } catch (err: any) {
    // Fail safely without disrupting the primary request, but log prominently
    logger.error({ err, entry }, 'Failed to record audit log entry');
    return null;
  }
}

