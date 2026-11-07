import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GhatsRepository } from '../ghats/ghats.repository.js';
import { AuditService } from '../audit/audit.service.js';

const localizedStringSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  te: z.string().optional(),
  hi: z.string().optional(),
});

const createNoticeSchema = z.object({
  ghat_id: z.string().min(1, 'Valid Ghat ID is required'),
  title: localizedStringSchema,
  message: localizedStringSchema,
  severity: z.enum(['info', 'warning', 'emergency']).default('info'),
  is_active: z.boolean().default(true),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  reason: z.string().min(5, 'Audit reason of at least 5 characters is required for creating a notice'),
});

export class NoticesController {
  /**
   * GET /v1/ghats/:id/notices
   * Public active notices for a ghat
   */
  static async getGhatNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
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

      const notices = await GhatsRepository.getNoticesForGhat(id);

      res.json({
        data: notices,
        count: notices.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/admin/notices
   * Admin publish notice with audit logging
   */
  static async createNotice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createNoticeSchema.parse(req.body);

      const ghat = await GhatsRepository.findGhatById(body.ghat_id);
      if (!ghat) {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_FOUND',
            message: `Ghat with ID '${body.ghat_id}' was not found.`,
          },
        });
        return;
      }

      const { reason, ...noticeData } = body;
      const newNotice = await GhatsRepository.createNotice(noticeData);

      // Record audit log
      await AuditService.record({
        adminId: req.user!.userId,
        adminEmail: req.user!.phone || 'admin',
        action: 'notice.create',
        entityType: 'notice',
        entityId: newNotice.id,
        oldValues: null,
        newValues: newNotice,
        sourceUrl: ghat.official_source_url,
        reason,
        ipAddress: req.ip,
      });

      res.status(201).json({
        data: newNotice,
        message: 'Ghat notice created successfully and logged in audit registry.',
      });
    } catch (err) {
      next(err);
    }
  }
}
