import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CrowdService } from './crowd.service.js';
import { GhatsRepository } from '../ghats/ghats.repository.js';
import { PUSHKARALU_SAFETY_DISCLAIMER } from '../../utils/trustVerifier.js';

const submitCrowdReportSchema = z.object({
  ghat_id: z.string().min(1, 'Valid Ghat ID is required'),
  reported_crowd_level: z.enum(['low', 'medium', 'high', 'very_high']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  device_fingerprint: z.string().min(8, 'Device fingerprint is required for verification'),
});

const crowdOverrideSchema = z.object({
  crowd_level: z.enum(['low', 'medium', 'high', 'very_high', 'unknown']),
  note: z.object({
    en: z.string().min(1),
    te: z.string().optional(),
    hi: z.string().optional(),
  }).optional(),
  reason: z.string().min(5, 'Audit reason of at least 5 characters is required for admin crowd overrides'),
  source_url: z.string().url().optional(),
});

export class CrowdController {
  /**
   * GET /v1/ghats/:id/crowd
   * Public crowd status endpoint
   */
  static async getGhatCrowdStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ghat = await GhatsRepository.findGhatById(id);

      if (!ghat) {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_FOUND',
            message: `Ghat with ID '${id}' was not found.`,
          },
        });
        return;
      }

      const status = await CrowdService.getCrowdStatus(id);

      res.json({
        data: {
          ghat_id: id,
          current_level: status?.current_level || ghat.crowd_level || 'unknown',
          source_type: status?.source_type || 'default',
          confidence_score: status?.confidence_score || 0.5,
          recent_report_count: status?.recent_report_count || 0,
          note: status?.note || null,
          updated_at: status?.updated_at || ghat.updated_at,
          safety_disclaimer: PUSHKARALU_SAFETY_DISCLAIMER,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/crowd-reports
   * Public crowd report submission with GPS proximity check & rate limiting
   */
  static async submitCrowdReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = submitCrowdReportSchema.parse(req.body);

      const result = await CrowdService.submitReport({
        ghatId: body.ghat_id,
        userId: req.user?.userId || null,
        deviceFingerprint: body.device_fingerprint,
        reportedCrowdLevel: body.reported_crowd_level,
        lat: body.lat,
        lng: body.lng,
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: {
          report_id: result.report.id,
          is_verified_proximity: result.isVerifiedProximity,
          distance_meters: result.distanceMeters,
          message: result.message,
        },
      });
    } catch (err: any) {
      if (err.message === 'GHAT_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_FOUND',
            message: 'Target ghat does not exist.',
          },
        });
        return;
      }

      if (err.message === 'RATE_LIMIT_EXCEEDED') {
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `You have recently submitted a report for this ghat. Please wait ${err.retryAfterMinutes || 15} minutes before submitting another.`,
          },
        });
        return;
      }

      next(err);
    }
  }

  /**
   * POST /v1/admin/ghats/:id/crowd-override
   * Admin manual override of crowd level with audit log
   */
  static async adminOverrideCrowd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = crowdOverrideSchema.parse(req.body);

      const ghat = await GhatsRepository.findGhatById(id);
      if (!ghat) {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_FOUND',
            message: `Ghat with ID '${id}' was not found.`,
          },
        });
        return;
      }

      const updatedStatus = await CrowdService.adminOverrideCrowd({
        ghatId: id,
        adminId: req.user!.userId,
        adminEmail: req.user!.phone || 'admin',
        crowdLevel: body.crowd_level,
        note: body.note,
        reason: body.reason,
        sourceUrl: body.source_url,
        ipAddress: req.ip,
      });

      res.json({
        data: updatedStatus,
        message: 'Admin crowd status override applied and logged in audit history.',
      });
    } catch (err) {
      next(err);
    }
  }
}
