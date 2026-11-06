import { query } from '../../db/index.js';
import { CrowdLevel, CrowdReport, CrowdStatus, LocalizedString } from '../../types/ghats.js';
import { isWithinGhatProximity } from '../../utils/geo.js';
import { GhatsRepository } from '../ghats/ghats.repository.js';
import { AuditService } from '../audit/audit.service.js';

const PROXIMITY_THRESHOLD_METERS = 1000; // 1 km radius around ghat
const RATE_LIMIT_WINDOW_MINUTES = 15; // 1 report per device per ghat every 15 min

export interface SubmitCrowdReportParams {
  ghatId: string;
  userId?: string | null;
  deviceFingerprint: string;
  reportedCrowdLevel: 'low' | 'medium' | 'high' | 'very_high';
  lat: number;
  lng: number;
  ipAddress?: string | null;
}

export class CrowdService {
  /**
   * Submit a crowd report with GPS proximity check and anti-spam verification.
   */
  static async submitReport(params: SubmitCrowdReportParams): Promise<{
    report: CrowdReport;
    isVerifiedProximity: boolean;
    distanceMeters: number;
    message: LocalizedString;
  }> {
    // 1. Fetch ghat to get official coordinates
    const ghat = await GhatsRepository.findGhatById(params.ghatId);
    if (!ghat) {
      throw new Error('GHAT_NOT_FOUND');
    }

    // 2. Anti-spam check: Did this device submit for this ghat in the last 15 minutes?
    const { rows: recentReports } = await query(
      `SELECT id, created_at FROM crowd_reports 
       WHERE device_fingerprint = $1 AND ghat_id = $2 
         AND created_at >= NOW() - INTERVAL '${RATE_LIMIT_WINDOW_MINUTES} minutes'
       LIMIT 1`,
      [params.deviceFingerprint, params.ghatId]
    );

    if (recentReports.length > 0) {
      const err: any = new Error('RATE_LIMIT_EXCEEDED');
      err.retryAfterMinutes = RATE_LIMIT_WINDOW_MINUTES;
      throw err;
    }

    // 3. Proximity calculation
    const proximity = isWithinGhatProximity(
      params.lat,
      params.lng,
      Number(ghat.lat),
      Number(ghat.lng),
      PROXIMITY_THRESHOLD_METERS
    );

    // 4. Save report in database
    const { rows } = await query<CrowdReport>(
      `INSERT INTO crowd_reports (
        ghat_id, user_id, device_fingerprint, reported_crowd_level,
        reported_lat, reported_lng, distance_meters, is_verified_proximity,
        ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        params.ghatId,
        params.userId || null,
        params.deviceFingerprint,
        params.reportedCrowdLevel,
        params.lat,
        params.lng,
        proximity.distanceMeters,
        proximity.isWithin,
        params.ipAddress || null,
      ]
    );

    const report = rows[0];

    // 5. Automatically recalculate crowd status from recent reports
    await this.recalculateGhatCrowdStatus(params.ghatId);

    const message: LocalizedString = proximity.isWithin
      ? {
          en: `Thank you! Your on-site crowd report (${proximity.distanceMeters}m from ghat) was verified and recorded.`,
          te: `ధన్యవాదాలు! మీ స్థానిక రద్దీ సమాచారం (${proximity.distanceMeters}మీ దూరం) ధృవీకరించబడి నమోదు చేయబడింది.`,
          hi: `धन्यवाद! आपका मौके पर किया गया भीड़ विवरण (${proximity.distanceMeters}मी दूरी) सत्यापित कर दर्ज कर लिया गया है।`,
        }
      : {
          en: `Report received. You appear to be ${Math.round(proximity.distanceMeters / 1000)}km away; report noted with secondary weighting.`,
          te: `నివేదిక అందింది. మీరు ఘాట్‌కు ${Math.round(proximity.distanceMeters / 1000)}కి.మీ దూరంలో ఉన్నారు; ద్వితీయ ప్రాధాన్యతతో నమోదు చేయబడింది.`,
          hi: `विवरण प्राप्त हुआ। आप घाट से ${Math.round(proximity.distanceMeters / 1000)}किमी दूर प्रतीत होते हैं; रिपोर्ट दर्ज कर ली गई है।`,
        };

    return {
      report,
      isVerifiedProximity: proximity.isWithin,
      distanceMeters: proximity.distanceMeters,
      message,
    };
  }

  /**
   * Recalculate crowd status for a ghat using verified reports from the last 60 minutes.
   * If an official override is in place and newer than 4 hours, it remains in effect.
   */
  static async recalculateGhatCrowdStatus(ghatId: string): Promise<CrowdStatus | null> {
    // Check if there is an active official override
    const { rows: currentStatusRows } = await query<CrowdStatus>(
      `SELECT * FROM crowd_status WHERE ghat_id = $1 LIMIT 1`,
      [ghatId]
    );

    const current = currentStatusRows[0];
    if (
      current &&
      current.source_type === 'official_override' &&
      new Date(current.updated_at).getTime() > Date.now() - 4 * 60 * 60 * 1000
    ) {
      // Official override remains until 4 hours or until explicitly cleared
      return current;
    }

    // Aggregate verified proximity reports from the past 60 minutes
    const { rows: recentReports } = await query<{ reported_crowd_level: string; count: string }>(
      `SELECT reported_crowd_level, COUNT(*) as count
       FROM crowd_reports
       WHERE ghat_id = $1
         AND is_verified_proximity = true
         AND created_at >= NOW() - INTERVAL '60 minutes'
       GROUP BY reported_crowd_level`,
      [ghatId]
    );

    const levelWeights: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      very_high: 4,
    };

    let totalWeight = 0;
    let totalCount = 0;

    for (const r of recentReports) {
      const count = parseInt(r.count, 10);
      const weight = levelWeights[r.reported_crowd_level] || 2;
      totalWeight += weight * count;
      totalCount += count;
    }

    if (totalCount === 0) {
      // No recent reports, keep default baseline
      return current || null;
    }

    const avgWeight = totalWeight / totalCount;
    let computedLevel: CrowdLevel = 'low';
    if (avgWeight >= 3.3) computedLevel = 'very_high';
    else if (avgWeight >= 2.5) computedLevel = 'high';
    else if (avgWeight >= 1.6) computedLevel = 'medium';
    else computedLevel = 'low';

    // Confidence score based on number of reports (scales from 0.5 up to 0.95)
    const confidenceScore = Math.min(0.95, 0.5 + totalCount * 0.05);

    const note: LocalizedString = {
      en: `Aggregated from ${totalCount} verified pilgrim reports in the past hour`,
      te: `గత గంటలో ${totalCount} మంది భక్తుల ధృవీకరించిన నివేదికల ఆధారంగా అంచనా వేయబడింది`,
      hi: `पिछले एक घंटे में ${totalCount} सत्यापित तीर्थयात्रियों की रिपोर्ट के आधार पर संकलित`,
    };

    const { rows: updatedRows } = await query<CrowdStatus>(
      `INSERT INTO crowd_status (
        ghat_id, current_level, source_type, confidence_score,
        recent_report_count, note, updated_at
      ) VALUES ($1, $2, 'crowdsourced_aggregate', $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (ghat_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        source_type = EXCLUDED.source_type,
        confidence_score = EXCLUDED.confidence_score,
        recent_report_count = EXCLUDED.recent_report_count,
        note = EXCLUDED.note,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [ghatId, computedLevel, confidenceScore, totalCount, JSON.stringify(note)]
    );

    // Also update ghats table crowd_level column
    await query('UPDATE ghats SET crowd_level = $1 WHERE id = $2', [computedLevel, ghatId]);

    return updatedRows[0];
  }

  /**
   * Get current crowd status for a ghat
   */
  static async getCrowdStatus(ghatId: string): Promise<CrowdStatus | null> {
    const { rows } = await query<CrowdStatus>(
      `SELECT * FROM crowd_status WHERE ghat_id = $1 LIMIT 1`,
      [ghatId]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  /**
   * Administrative crowd level override with required audit logging.
   */
  static async adminOverrideCrowd(params: {
    ghatId: string;
    adminId: string;
    adminEmail: string;
    crowdLevel: CrowdLevel;
    note?: LocalizedString;
    reason: string;
    sourceUrl?: string;
    ipAddress?: string;
  }): Promise<CrowdStatus> {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('AUDIT_REASON_REQUIRED');
    }

    const current = await this.getCrowdStatus(params.ghatId);

    const overrideNote: LocalizedString = params.note || {
      en: `Official control room override: ${params.reason}`,
      te: `అధికారిక కంట్రోల్ రూమ్ ద్వారా నిర్ధారించబడింది: ${params.reason}`,
      hi: `आधिकारिक नियंत्रण कक्ष द्वारा अधिलेखित: ${params.reason}`,
    };

    const { rows } = await query<CrowdStatus>(
      `INSERT INTO crowd_status (
        ghat_id, current_level, source_type, override_by_admin_id,
        confidence_score, note, updated_at
      ) VALUES ($1, $2, 'official_override', $3, 1.00, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (ghat_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        source_type = 'official_override',
        override_by_admin_id = EXCLUDED.override_by_admin_id,
        confidence_score = 1.00,
        note = EXCLUDED.note,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [params.ghatId, params.crowdLevel, params.adminId, JSON.stringify(overrideNote)]
    );

    // Sync ghats table
    await query('UPDATE ghats SET crowd_level = $1 WHERE id = $2', [params.crowdLevel, params.ghatId]);

    // Record audit log
    await AuditService.record({
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: 'ghat.crowd_override',
      entityType: 'ghat',
      entityId: params.ghatId,
      oldValues: {
        crowd_level: current?.current_level,
        source_type: current?.source_type,
      },
      newValues: {
        crowd_level: params.crowdLevel,
        source_type: 'official_override',
        note: overrideNote,
      },
      sourceUrl: params.sourceUrl,
      reason: params.reason,
      ipAddress: params.ipAddress,
    });

    return rows[0];
  }
}

