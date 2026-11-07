import crypto from 'crypto';
import QRCode from 'qrcode';
import { z } from 'zod';
import { query, withTransaction } from '../../db/index.js';
import { logger } from '../../lib/logger.js';
import { writeAudit } from '../../lib/audit.js';
import { env } from '../../config/env.js';
import { calculateHaversineDistance } from '../../utils/geo.js';
import {
  SosAlertRecord,
  SosUpdateRecord,
  SosType,
  SosStatus,
  SosChannel,
  QrZoneRecord,
  EmergencyContactRecord,
} from '../../types/sos.js';
import { emitSosNew, emitSosUpdated, trackAlertForCluster } from '../../services/sos-socket.js';
import { SosNotificationService } from '../../services/sos-notification.js';

export const createAlertSchema = z.object({
  channel: z.enum(['app', 'sms', 'qr', 'call']).default('app'),
  type: z.enum(['medical', 'police', 'fire', 'lost_person', 'other', 'general']).default('general'),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  accuracyM: z.number().positive().optional().nullable(),
  zoneCode: z.string().trim().max(50).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  deviceId: z.string().trim().max(150).optional().nullable(),
  idempotencyKey: z.string().trim().max(150).optional().nullable(),
  language: z.string().trim().max(10).default('en'),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema> & {
  userId?: string | null;
};

export class SosService {
  /**
   * Creates a new SOS alert with deduplication, nearest ghat lookup, and automated notifications.
   */
  static async createAlert(input: CreateAlertInput): Promise<{
    alert: SosAlertRecord;
    statusToken: string;
    trackingUrl: string;
    isDuplicate?: boolean;
    clusterTriggered?: boolean;
  }> {
    const validated = createAlertSchema.parse(input);

    // 1. Idempotency Check
    if (validated.idempotencyKey) {
      const { rows: existingRows } = await query<SosAlertRecord>(
        'SELECT * FROM sos_alerts WHERE idempotency_key = $1 LIMIT 1',
        [validated.idempotencyKey]
      );
      if (existingRows.length > 0) {
        const existing = existingRows[0];
        return {
          alert: existing,
          statusToken: existing.status_token,
          trackingUrl: `${env.SOS_WEB_BASE_URL}/v1/sos/${existing.id}/status?token=${existing.status_token}`,
        };
      }
    }

    // 2. Zone & Ghat Resolution
    let resolvedGhatId: string | null = null;
    let resolvedGhatName: string | null = null;
    let resolvedZoneId: string | null = null;
    let resolvedZoneCode: string | null = validated.zoneCode || null;
    let finalLat = validated.lat ?? null;
    let finalLng = validated.lng ?? null;

    if (validated.zoneCode) {
      const { rows: zoneRows } = await query<QrZoneRecord>(
        'SELECT * FROM qr_zones WHERE zone_code ILIKE $1 AND active = true LIMIT 1',
        [validated.zoneCode.trim()]
      );
      if (zoneRows.length > 0) {
        const zone = zoneRows[0];
        resolvedZoneId = zone.id;
        resolvedZoneCode = zone.zone_code;
        resolvedGhatId = zone.ghat_id;
        if (finalLat === null && zone.lat !== null) finalLat = Number(zone.lat);
        if (finalLng === null && zone.lng !== null) finalLng = Number(zone.lng);
      }
    }

    // If ghatId is not resolved yet and GPS coords are present, lookup nearest ghat
    if (!resolvedGhatId && finalLat !== null && finalLng !== null) {
      resolvedGhatId = await this.findNearestGhatId(finalLat, finalLng);
    }

    if (resolvedGhatId) {
      const { rows: ghatRows } = await query<{ name: any }>(
        'SELECT name FROM ghats WHERE id = $1 LIMIT 1',
        [resolvedGhatId]
      );
      if (ghatRows.length > 0) {
        resolvedGhatName =
          typeof ghatRows[0].name === 'object'
            ? ghatRows[0].name.en || Object.values(ghatRows[0].name)[0]
            : String(ghatRows[0].name);
      }
    }

    // 3. Deduplication Check
    // If an open alert exists for this phone, device, or zone within the dedup window, merge into it
    const dedupMinutes = env.SOS_DEDUP_WINDOW_MINUTES || 5;
    const dedupCutoff = new Date(Date.now() - dedupMinutes * 60 * 1000);

    const dedupConditions: string[] = [];
    const dedupParams: any[] = [dedupCutoff];
    let pIdx = 2;

    if (validated.phone) {
      dedupConditions.push(`phone = $${pIdx++}`);
      dedupParams.push(validated.phone);
    }
    if (validated.deviceId) {
      dedupConditions.push(`device_id = $${pIdx++}`);
      dedupParams.push(validated.deviceId);
    }
    if (resolvedZoneCode) {
      dedupConditions.push(`zone_code = $${pIdx++}`);
      dedupParams.push(resolvedZoneCode);
    }

    if (dedupConditions.length > 0) {
      const dedupSql = `
        SELECT * FROM sos_alerts
        WHERE created_at >= $1
          AND status IN ('new', 'acknowledged', 'dispatched')
          AND (${dedupConditions.join(' OR ')})
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const { rows: dupRows } = await query<SosAlertRecord>(dedupSql, dedupParams);

      if (dupRows.length > 0) {
        const primaryAlert = dupRows[0];
        // Insert a non-public update noting duplicate report
        await query(
          `INSERT INTO sos_updates (alert_id, note, is_public)
           VALUES ($1, $2, false)`,
          [
            primaryAlert.id,
            `Duplicate report received via ${validated.channel} (Type: ${validated.type}). Automatically attached.`,
          ]
        );

        return {
          alert: primaryAlert,
          statusToken: primaryAlert.status_token,
          trackingUrl: `${env.SOS_WEB_BASE_URL}/v1/sos/${primaryAlert.id}/status?token=${primaryAlert.status_token}`,
          isDuplicate: true,
        };
      }
    }

    // 4. Default Severity Mapping
    const severityMap: Record<SosType, number> = {
      medical: 1,
      fire: 1,
      police: 2,
      lost_person: 2,
      general: 2,
      other: 3,
    };
    const severity = severityMap[validated.type] || 2;

    // 5. Generate secure random status token
    const statusToken = crypto.randomBytes(24).toString('hex');

    // 6. Insert new SOS record
    const insertSql = `
      INSERT INTO sos_alerts (
        user_id, phone, channel, type, lat, lng, accuracy_m,
        ghat_id, zone_id, zone_code, language, status, severity,
        device_id, idempotency_key, status_token, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new', $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const { rows: insertedRows } = await query<SosAlertRecord>(insertSql, [
      input.userId || null,
      validated.phone || null,
      validated.channel,
      validated.type,
      finalLat,
      finalLng,
      validated.accuracyM || null,
      resolvedGhatId,
      resolvedZoneId,
      resolvedZoneCode,
      validated.language,
      severity,
      validated.deviceId || null,
      validated.idempotencyKey || null,
      statusToken,
      validated.metadata ? JSON.stringify(validated.metadata) : null,
    ]);

    const alert = insertedRows[0];

    // 7. Initial update log entry
    await query(
      `INSERT INTO sos_updates (alert_id, note, is_public)
       VALUES ($1, $2, true)`,
      [alert.id, `Emergency SOS alert logged via ${alert.channel.toUpperCase()}. Help desk notified.`]
    );

    // 8. Mask sensitive info for logs
    const maskedPhone = validated.phone ? `***${validated.phone.slice(-4)}` : 'none';
    logger.info(
      {
        alertId: alert.id,
        type: alert.type,
        channel: alert.channel,
        phone: maskedPhone,
        ghatId: resolvedGhatId,
        zoneCode: resolvedZoneCode,
      },
      '[SosService] New SOS alert registered'
    );

    // 9. Dispatch Real-time and Background Notifications
    emitSosNew(alert);

    // Cluster sliding-window check
    const cluster = trackAlertForCluster({
      alertId: alert.id,
      ghatId: resolvedGhatId,
      ghatName: resolvedGhatName,
      zoneCode: resolvedZoneCode,
    });

    // Notify admins via FCM
    SosNotificationService.notifyAdminsNewAlert(alert, resolvedGhatName).catch(() => {});

    // High severity backup SMS
    if (alert.severity === 1) {
      SosNotificationService.sendBackupSmsAlert(alert, resolvedGhatName).catch(() => {});
    }

    const trackingUrl = `${env.SOS_WEB_BASE_URL}/v1/sos/${alert.id}/status?token=${statusToken}`;

    return {
      alert,
      statusToken,
      trackingUrl,
      clusterTriggered: Boolean(cluster),
    };
  }

  /**
   * Retrieves public tracking status of an SOS alert using the secret status token.
   */
  static async getAlertStatus(
    alertId: string,
    statusToken: string
  ): Promise<{
    alert: SosAlertRecord;
    updates: SosUpdateRecord[];
  } | null> {
    const { rows: alertRows } = await query<SosAlertRecord>(
      `SELECT a.*, g.name as ghat_name, z.label as zone_label
       FROM sos_alerts a
       LEFT JOIN ghats g ON a.ghat_id = g.id
       LEFT JOIN qr_zones z ON a.zone_id = z.id
       WHERE a.id = $1 AND a.status_token = $2
       LIMIT 1`,
      [alertId, statusToken]
    );

    if (alertRows.length === 0) {
      return null;
    }

    const alert = alertRows[0];

    const { rows: updates } = await query<SosUpdateRecord>(
      `SELECT * FROM sos_updates
       WHERE alert_id = $1 AND is_public = true
       ORDER BY created_at ASC`,
      [alertId]
    );

    return { alert, updates };
  }

  /**
   * Reporter cancellation / false alarm submission
   */
  static async cancelAlert(
    alertId: string,
    statusToken: string,
    reason?: string
  ): Promise<boolean> {
    const { rows } = await query<SosAlertRecord>(
      'SELECT * FROM sos_alerts WHERE id = $1 AND status_token = $2 LIMIT 1',
      [alertId, statusToken]
    );

    if (rows.length === 0) return false;
    const alert = rows[0];

    if (alert.status === 'resolved' || alert.status === 'false_alarm') {
      return true; // Already closed
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE sos_alerts SET status = 'false_alarm', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [alertId]
      );

      await client.query(
        `INSERT INTO sos_updates (alert_id, note, is_public, status)
         VALUES ($1, $2, true, 'false_alarm')`,
        [alertId, reason || 'Reporter cancelled alert (marked as false alarm).']
      );
    });

    const updatedAlert = { ...alert, status: 'false_alarm' as SosStatus };
    emitSosUpdated(updatedAlert);
    return true;
  }

  /**
   * Retrieves active emergency contacts with national 112 as primary
   */
  static async getEmergencyContacts(ghatId?: string | null): Promise<EmergencyContactRecord[]> {
    const sql = `
      SELECT c.*, g.name as ghat_name
      FROM emergency_contacts c
      LEFT JOIN ghats g ON c.ghat_id = g.id
      WHERE c.active = true AND (c.ghat_id IS NULL OR c.ghat_id = $1)
      ORDER BY c.sort_order ASC, c.created_at ASC
    `;
    const { rows } = await query<EmergencyContactRecord>(sql, [ghatId || null]);
    return rows;
  }

  /**
   * Admin: List SOS alerts with filtering and pagination
   */
  static async getAdminAlerts(filters: {
    status?: string;
    type?: string;
    ghatId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: SosAlertRecord[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (filters.status) {
      conditions.push(`a.status = $${pIdx++}`);
      params.push(filters.status);
    }
    if (filters.type) {
      conditions.push(`a.type = $${pIdx++}`);
      params.push(filters.type);
    }
    if (filters.ghatId) {
      conditions.push(`a.ghat_id = $${pIdx++}`);
      params.push(filters.ghatId);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sos_alerts a ${whereSql}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const queryParams = [...params, limit, offset];
    const { rows } = await query<SosAlertRecord>(
      `SELECT a.*, g.name as ghat_name, z.label as zone_label
       FROM sos_alerts a
       LEFT JOIN ghats g ON a.ghat_id = g.id
       LEFT JOIN qr_zones z ON a.zone_id = z.id
       ${whereSql}
       ORDER BY (a.status = 'new') DESC, a.severity ASC, a.created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx++}`,
      queryParams
    );

    return { items: rows, total, page, limit };
  }

  /**
   * Admin: Get single alert with full updates (public & internal) and merged duplicates
   */
  static async getAdminAlertById(id: string): Promise<{
    alert: SosAlertRecord;
    updates: SosUpdateRecord[];
    duplicates: SosAlertRecord[];
  } | null> {
    const { rows: alertRows } = await query<SosAlertRecord>(
      `SELECT a.*, g.name as ghat_name, z.label as zone_label
       FROM sos_alerts a
       LEFT JOIN ghats g ON a.ghat_id = g.id
       LEFT JOIN qr_zones z ON a.zone_id = z.id
       WHERE a.id = $1
       LIMIT 1`,
      [id]
    );

    if (alertRows.length === 0) return null;
    const alert = alertRows[0];

    const { rows: updates } = await query<SosUpdateRecord>(
      `SELECT u.*, adm.name as admin_name
       FROM sos_updates u
       LEFT JOIN users adm ON u.admin_id = adm.id
       WHERE u.alert_id = $1
       ORDER BY u.created_at ASC`,
      [id]
    );

    const { rows: duplicates } = await query<SosAlertRecord>(
      `SELECT * FROM sos_alerts WHERE merged_into_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return { alert, updates, duplicates };
  }

  /**
   * Admin: Update alert status
   */
  static async updateStatus(params: {
    alertId: string;
    adminId: string;
    status: SosStatus;
    note: string;
    isPublic?: boolean;
  }): Promise<SosAlertRecord | null> {
    const { alertId, adminId, status, note, isPublic = true } = params;

    const { rows: currentRows } = await query<SosAlertRecord>(
      'SELECT * FROM sos_alerts WHERE id = $1 LIMIT 1',
      [alertId]
    );
    if (currentRows.length === 0) return null;
    const oldAlert = currentRows[0];

    const { rows: updatedRows } = await query<SosAlertRecord>(
      `UPDATE sos_alerts
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, alertId]
    );
    const updatedAlert = updatedRows[0];

    // Insert update note
    await query(
      `INSERT INTO sos_updates (alert_id, admin_id, status, note, is_public)
       VALUES ($1, $2, $3, $4, $5)`,
      [alertId, adminId, status, note, isPublic]
    );

    // Audit log
    await writeAudit({
      adminId,
      action: 'sos.status_update',
      entityType: 'sos_alerts',
      entityId: alertId,
      oldValue: { status: oldAlert.status },
      newValue: { status, note, isPublic },
    });

    // Notify connected admin dashboards
    emitSosUpdated(updatedAlert, { status, note, isPublic });

    // Notify reporter if status changed or note is public
    if (isPublic) {
      SosNotificationService.notifyReporterUpdate({
        alert: updatedAlert,
        status,
        publicNote: note,
      }).catch(() => {});
    }

    return updatedAlert;
  }

  /**
   * Admin: Assign responder / field team
   */
  static async assignResponder(params: {
    alertId: string;
    adminId: string;
    assignedToName: string;
    assignedToPhone?: string;
    note?: string;
  }): Promise<SosAlertRecord | null> {
    const { alertId, adminId, assignedToName, assignedToPhone, note } = params;

    const { rows } = await query<SosAlertRecord>(
      `UPDATE sos_alerts
       SET assigned_to_name = $1, assigned_to_phone = $2, status = CASE WHEN status = 'new' THEN 'acknowledged' ELSE status END, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [assignedToName, assignedToPhone || null, alertId]
    );

    if (rows.length === 0) return null;
    const updatedAlert = rows[0];

    const updateNote = note || `Assigned to responder: ${assignedToName}${assignedToPhone ? ` (${assignedToPhone})` : ''}`;
    await query(
      `INSERT INTO sos_updates (alert_id, admin_id, note, is_public)
       VALUES ($1, $2, $3, true)`,
      [alertId, adminId, updateNote]
    );

    await writeAudit({
      adminId,
      action: 'sos.assign_responder',
      entityType: 'sos_alerts',
      entityId: alertId,
      newValue: { assignedToName, assignedToPhone },
    });

    emitSosUpdated(updatedAlert, { assignedToName, assignedToPhone });
    return updatedAlert;
  }

  /**
   * Admin: Add internal or public note to alert
   */
  static async addNote(params: {
    alertId: string;
    adminId: string;
    note: string;
    isPublic: boolean;
  }): Promise<SosUpdateRecord> {
    const { alertId, adminId, note, isPublic } = params;

    const { rows } = await query<SosUpdateRecord>(
      `INSERT INTO sos_updates (alert_id, admin_id, note, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [alertId, adminId, note, isPublic]
    );

    await writeAudit({
      adminId,
      action: 'sos.add_note',
      entityType: 'sos_alerts',
      entityId: alertId,
      newValue: { note, isPublic },
    });

    const { rows: alertRows } = await query<SosAlertRecord>(
      'SELECT * FROM sos_alerts WHERE id = $1',
      [alertId]
    );
    if (alertRows.length > 0) {
      emitSosUpdated(alertRows[0], rows[0]);
      if (isPublic) {
        SosNotificationService.notifyReporterUpdate({
          alert: alertRows[0],
          publicNote: note,
        }).catch(() => {});
      }
    }

    return rows[0];
  }

  /**
   * Admin: Merge duplicate alerts manually
   */
  static async mergeAlerts(params: {
    sourceAlertId: string;
    targetAlertId: string;
    adminId: string;
    reason: string;
  }): Promise<boolean> {
    const { sourceAlertId, targetAlertId, adminId, reason } = params;

    return await withTransaction(async (client) => {
      await client.query(
        `UPDATE sos_alerts
         SET merged_into_id = $1, status = 'resolved', updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [targetAlertId, sourceAlertId]
      );

      await client.query(
        `INSERT INTO sos_updates (alert_id, admin_id, note, is_public)
         VALUES ($1, $2, $3, false)`,
        [sourceAlertId, adminId, `Alert merged into target alert #${targetAlertId.slice(0, 8)}. Reason: ${reason}`]
      );

      await client.query(
        `INSERT INTO sos_updates (alert_id, admin_id, note, is_public)
         VALUES ($1, $2, $3, false)`,
        [targetAlertId, adminId, `Merged duplicate alert #${sourceAlertId.slice(0, 8)}. Reason: ${reason}`]
      );

      await writeAudit({
        adminId,
        action: 'sos.merge_duplicate',
        entityType: 'sos_alerts',
        entityId: sourceAlertId,
        newValue: { targetAlertId, reason },
      });

      return true;
    });
  }

  /**
   * Generates printable QR poster HTML for a given zone
   */
  static async generatePosterHtml(zoneCode: string): Promise<string> {
    const { rows: zones } = await query<QrZoneRecord>(
      `SELECT z.*, g.name as ghat_name
       FROM qr_zones z
       LEFT JOIN ghats g ON z.ghat_id = g.id
       WHERE z.zone_code ILIKE $1
       LIMIT 1`,
      [zoneCode]
    );

    if (zones.length === 0) {
      throw new Error(`Zone ${zoneCode} not found`);
    }

    const zone = zones[0];
    const targetUrl = `${env.SOS_WEB_BASE_URL}/sos?zone=${encodeURIComponent(zone.zone_code)}`;
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#991b1b', // Emergency dark red
        light: '#ffffff',
      },
    });

    const labelEn = zone.label?.en || zone.zone_code;
    const labelTe = zone.label?.te || '';
    const labelHi = zone.label?.hi || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Emergency SOS QR Poster - ${zone.zone_code}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      color: #111827;
      background: #ffffff;
      text-align: center;
    }
    .poster-border {
      border: 8px solid #dc2626;
      border-radius: 20px;
      padding: 32px 20px;
      box-sizing: border-box;
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      background: #dc2626;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .headline {
      font-size: 32px;
      font-weight: 900;
      margin: 16px 0 6px 0;
      color: #991b1b;
    }
    .headline-te {
      font-size: 26px;
      font-weight: 700;
      color: #1f2937;
      margin: 4px 0;
    }
    .headline-hi {
      font-size: 24px;
      font-weight: 600;
      color: #374151;
      margin: 4px 0 16px 0;
    }
    .qr-container {
      margin: 10px 0;
      padding: 16px;
      background: #fef2f2;
      border: 3px dashed #ef4444;
      border-radius: 24px;
      display: inline-block;
    }
    .qr-img {
      width: 320px;
      height: 320px;
      display: block;
    }
    .zone-box {
      background: #111827;
      color: #ffffff;
      padding: 12px 30px;
      border-radius: 12px;
      font-size: 26px;
      font-weight: 800;
      margin: 12px 0;
      letter-spacing: 1px;
    }
    .location-desc {
      font-size: 18px;
      color: #4b5563;
      margin: 4px 0 16px 0;
      max-width: 500px;
    }
    .helpline-box {
      width: 100%;
      background: #fee2e2;
      border: 2px solid #f87171;
      border-radius: 16px;
      padding: 16px;
      box-sizing: border-box;
      margin-top: 10px;
    }
    .helpline-num {
      font-size: 34px;
      font-weight: 900;
      color: #991b1b;
      margin: 4px 0;
    }
    .instructions {
      font-size: 15px;
      color: #4b5563;
      margin-top: 8px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="poster-border">
    <div>
      <div class="badge">EMERGENCY SOS • అత్యవసర సహాయం</div>
      <div class="headline">SCAN FOR IMMEDIATE RESCUE</div>
      <div class="headline-te">తక్షణ అత్యవసర సహాయం కొరకు స్కాన్ చేయండి</div>
      <div class="headline-hi">तत्काल आपातकालीन सहायता के लिए स्कैन करें</div>
    </div>

    <div class="qr-container">
      <img src="${qrDataUrl}" alt="SOS QR Code" class="qr-img" />
    </div>

    <div class="zone-box">
      ZONE CODE: ${zone.zone_code}
    </div>

    <div class="location-desc">
      <strong>${labelEn}</strong><br/>
      ${labelTe ? `<span>${labelTe}</span><br/>` : ''}
      ${labelHi ? `<span>${labelHi}</span>` : ''}
    </div>

    <div class="helpline-box">
      <div style="font-size: 16px; font-weight: 700; color: #7f1d1d; text-transform: uppercase;">
        OFFICIAL NATIONAL EMERGENCY HELPLINE
      </div>
      <div class="helpline-num">DIAL 112</div>
      <div class="instructions">
        No internet? Send SMS: <strong>SOS ${zone.zone_code}</strong> to <strong>${env.SOS_DEFAULT_NUMBER || '112'}</strong>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Resolves closest ghat using Haversine calculation fallback
   */
  private static async findNearestGhatId(lat: number, lng: number): Promise<string | null> {
    try {
      const { rows } = await query<{ id: string; lat: any; lng: any }>(
        'SELECT id, lat, lng FROM ghats WHERE lat IS NOT NULL AND lng IS NOT NULL'
      );

      if (rows.length === 0) return null;

      let nearestGhatId: string | null = null;
      let minDistance = Infinity;

      for (const g of rows) {
        const ghatLat = Number(g.lat);
        const ghatLng = Number(g.lng);
        if (isNaN(ghatLat) || isNaN(ghatLng)) continue;

        const distance = calculateHaversineDistance(lat, lng, ghatLat, ghatLng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestGhatId = g.id;
        }
      }

      return nearestGhatId;
    } catch {
      return null;
    }
  }
}

