import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GhatsRepository } from './ghats.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { isOfficialGovernmentUrl } from '../../utils/trustVerifier.js';

// Localized String Schema { en: string, te?: string, hi?: string }
const localizedStringSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  te: z.string().optional(),
  hi: z.string().optional(),
});

const createGhatSchema = z.object({
  name: localizedStringSchema,
  river: z.string().default('Godavari'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  nearest_town: localizedStringSchema,
  nearest_railway_station: localizedStringSchema,
  nearest_bus_stand: localizedStringSchema,
  official_source_url: z.string().url().nullable().optional(),
  verified_at: z.string().datetime().nullable().optional(),
  record_status: z.enum(['officially_listed', 'reported', 'unverified']).default('unverified'),
  bathing_status: z.enum(['allowed', 'restricted', 'closed', 'unknown']).default('unknown'),
  crowd_level: z.enum(['low', 'medium', 'high', 'very_high', 'unknown']).default('unknown'),
  publish_status: z.enum(['draft', 'published', 'hidden']).default('draft'),
  description: localizedStringSchema.optional(),
  max_capacity: z.number().int().positive().nullable().optional(),
  reason: z.string().min(5, 'Audit reason of at least 5 characters is required for creating a ghat'),
});

const updateGhatSchema = z.object({
  name: localizedStringSchema.optional(),
  river: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  nearest_town: localizedStringSchema.optional(),
  nearest_railway_station: localizedStringSchema.optional(),
  nearest_bus_stand: localizedStringSchema.optional(),
  official_source_url: z.string().url().nullable().optional(),
  verified_at: z.string().datetime().nullable().optional(),
  record_status: z.enum(['officially_listed', 'reported', 'unverified']).optional(),
  bathing_status: z.enum(['allowed', 'restricted', 'closed', 'unknown']).optional(),
  crowd_level: z.enum(['low', 'medium', 'high', 'very_high', 'unknown']).optional(),
  publish_status: z.enum(['draft', 'published', 'hidden']).optional(),
  description: localizedStringSchema.optional(),
  max_capacity: z.number().int().positive().nullable().optional(),
  reason: z.string().min(5, 'Audit reason of at least 5 characters is required for updating a ghat'),
});

const publishStatusSchema = z.object({
  publish_status: z.enum(['draft', 'published', 'hidden']),
  reason: z.string().min(5, 'Audit reason is required for status changes'),
});

export class GhatsController {
  /**
   * GET /v1/ghats
   * Public list & filter endpoint
   */
  static async listGhats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        state,
        district,
        river,
        facilities,
        crowdLevel,
        bathingStatus,
        near,
        maxDistanceMeters,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      // Regular users only see published ghats. Admins can view drafts/hidden by flag.
      const isAdmin = req.user?.isAdmin || false;
      const includeHidden = isAdmin && req.query.includeHidden === 'true';

      const result = await GhatsRepository.findGhats({
        state: state as string,
        district: district as string,
        river: river as string,
        facilities: facilities as string,
        crowdLevel: crowdLevel as any,
        bathingStatus: bathingStatus as any,
        near: near as string,
        maxDistanceMeters: maxDistanceMeters ? Number(maxDistanceMeters) : undefined,
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        includeHidden,
      });

      res.json({
        data: result.ghats,
        pagination: {
          total: result.total,
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          totalPages: Math.ceil(result.total / (Number(limit) || 20)),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /v1/ghats/:id
   * Public detail endpoint
   */
  static async getGhatById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Check publish visibility for non-admin
      if (ghat.publish_status !== 'published' && !req.user?.isAdmin) {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_PUBLISHED',
            message: 'This ghat entry is currently undergoing review and is not published.',
          },
        });
        return;
      }

      res.json({ data: ghat });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/admin/ghats
   * Admin create ghat with audit logging
   */
  static async createGhat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createGhatSchema.parse(req.body);

      // Strict rule check: Never call officially_listed unless official source is a verified government domain
      if (body.record_status === 'officially_listed') {
        const isOfficial = isOfficialGovernmentUrl(body.official_source_url);
        if (!isOfficial) {
          res.status(400).json({
            error: {
              code: 'INVALID_OFFICIAL_SOURCE',
              message: 'Cannot mark ghat as officially_listed without a valid government or district portal URL (.gov.in / .nic.in).',
            },
          });
          return;
        }
      }

      const { reason, ...ghatData } = body;
      const newGhat = await GhatsRepository.createGhat(ghatData);

      // Record audit log
      await AuditService.record({
        adminId: req.user!.userId,
        adminEmail: req.user!.phone || 'admin',
        action: 'ghat.create',
        entityType: 'ghat',
        entityId: newGhat.id,
        oldValues: null,
        newValues: newGhat,
        sourceUrl: body.official_source_url || null,
        reason,
        ipAddress: req.ip,
      });

      res.status(201).json({
        data: newGhat,
        message: 'Ghat created successfully and logged in audit registry.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /v1/admin/ghats/:id
   * Admin update ghat with audit logging
   */
  static async updateGhat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateGhatSchema.parse(req.body);

      const existing = await GhatsRepository.findGhatById(id);
      if (!existing) {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_FOUND',
            message: `Ghat with ID '${id}' was not found.`,
          },
        });
        return;
      }

      // Check record_status change
      const targetRecordStatus = body.record_status || existing.record_status;
      const targetSourceUrl = body.official_source_url !== undefined ? body.official_source_url : existing.official_source_url;

      if (targetRecordStatus === 'officially_listed') {
        const isOfficial = isOfficialGovernmentUrl(targetSourceUrl);
        if (!isOfficial) {
          res.status(400).json({
            error: {
              code: 'INVALID_OFFICIAL_SOURCE',
              message: 'Cannot mark ghat as officially_listed without a valid government or district portal URL (.gov.in / .nic.in).',
            },
          });
          return;
        }
      }

      const { reason, ...updates } = body;
      const updatedGhat = await GhatsRepository.updateGhat(id, updates);

      // Record audit log
      await AuditService.record({
        adminId: req.user!.userId,
        adminEmail: req.user!.phone || 'admin',
        action: 'ghat.update',
        entityType: 'ghat',
        entityId: id,
        oldValues: existing,
        newValues: updatedGhat,
        sourceUrl: targetSourceUrl || null,
        reason,
        ipAddress: req.ip,
      });

      res.json({
        data: updatedGhat,
        message: 'Ghat updated successfully and recorded in audit log.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /v1/admin/ghats/:id/publish-status
   * Publish / hide / draft toggle with audit log
   */
  static async setPublishStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { publish_status, reason } = publishStatusSchema.parse(req.body);

      const existing = await GhatsRepository.findGhatById(id);
      if (!existing) {
        res.status(404).json({
          error: {
            code: 'GHAT_NOT_FOUND',
            message: `Ghat with ID '${id}' was not found.`,
          },
        });
        return;
      }

      const updated = await GhatsRepository.setPublishStatus(id, publish_status);

      // Record audit log
      await AuditService.record({
        adminId: req.user!.userId,
        adminEmail: req.user!.phone || 'admin',
        action: 'ghat.publish_status_change',
        entityType: 'ghat',
        entityId: id,
        oldValues: { publish_status: existing.publish_status },
        newValues: { publish_status },
        sourceUrl: existing.official_source_url,
        reason,
        ipAddress: req.ip,
      });

      res.json({
        data: updated,
        message: `Ghat status changed to '${publish_status}' with audit logging.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

