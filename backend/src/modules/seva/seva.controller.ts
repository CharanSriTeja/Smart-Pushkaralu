import { Request, Response } from 'express';
import { sevaService } from './seva.service.js';
import { sevaRepository } from './seva.repository.js';
import { writeAudit } from '../../lib/audit.js';

export class SevaController {
  // ==========================================
  // Public Feed Endpoints
  // ==========================================

  /**
   * GET /v1/seva
   * Filters: ?category=aarthi&ghat=pushkar-ghat-01&live=true
   */
  async getPublicVideos(req: Request, res: Response): Promise<void> {
    try {
      const { category, ghat, live } = req.query;
      const result = await sevaService.getPublicVideos({
        category: typeof category === 'string' ? category : undefined,
        ghat: typeof ghat === 'string' ? ghat : undefined,
        live: typeof live === 'string' ? live : undefined,
      });

      res.status(200).json({
        data: result.data,
        meta: {
          total: result.total,
          live_count: result.live_count,
          categories: result.categories,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'SEVA_FETCH_ERROR',
          message: err.message || 'Failed to retrieve virtual seva videos',
        },
      });
    }
  }

  /**
   * GET /v1/seva/:id
   */
  async getPublicVideoById(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const video = await sevaService.getPublicVideoById(id);

      if (!video) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Virtual seva video '${id}' was not found or is unpublished.`,
          },
        });
        return;
      }

      res.status(200).json({
        data: video,
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'SEVA_FETCH_ERROR',
          message: err.message || 'Failed to retrieve video details',
        },
      });
    }
  }

  // ==========================================
  // Admin Endpoints with Audit Logging
  // ==========================================

  /**
   * GET /v1/admin/seva
   */
  async getAdminVideos(req: Request, res: Response): Promise<void> {
    try {
      const { category, published, is_live } = req.query;
      let pubFilter: boolean | undefined = undefined;
      if (published !== undefined) pubFilter = published === 'true';

      let liveFilter: boolean | undefined = undefined;
      if (is_live !== undefined) liveFilter = is_live === 'true';

      const result = await sevaService.getAdminVideos({
        category: typeof category === 'string' ? category : undefined,
        published: pubFilter,
        is_live: liveFilter,
      });

      res.status(200).json({
        data: result.data,
        meta: {
          total: result.total,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'ADMIN_SEVA_ERROR',
          message: err.message || 'Failed to retrieve admin video records',
        },
      });
    }
  }

  /**
   * POST /v1/admin/seva
   */
  async createAdminVideo(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.userId || 'admin-super-01';
      const body = req.body || {};

      if (!body.url) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'A valid YouTube URL is required.',
          },
        });
        return;
      }

      if (!body.title_en || !body.title_te) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Both English (title_en) and Telugu (title_te) titles are mandatory.',
          },
        });
        return;
      }

      const created = await sevaService.createVideo(body);

      // Audit log
      await writeAudit({
        adminId,
        action: 'seva.create',
        entityType: 'seva_video',
        entityId: created.id,
        oldValue: null,
        newValue: created,
        sourceUrl: '/v1/admin/seva',
        reason: body.reason || 'Added new virtual seva YouTube stream/video',
      });

      res.status(201).json({
        data: created,
        message: 'Virtual Seva video added successfully',
      });
    } catch (err: any) {
      const isValidationError = err.message.includes('INVALID_YOUTUBE_URL') || err.message.includes('VALIDATION_ERROR');
      res.status(isValidationError ? 400 : 500).json({
        error: {
          code: isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: err.message || 'Failed to create seva video',
        },
      });
    }
  }

  /**
   * PATCH /v1/admin/seva/:id
   */
  async patchAdminVideo(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const adminId = req.user?.userId || 'admin-super-01';
      const body = req.body || {};

      const existing = await sevaRepository.findVideoById(id, true);
      if (!existing) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Video '${id}' not found`,
          },
        });
        return;
      }

      const updated = await sevaService.updateVideo(id, body);

      // Audit log
      await writeAudit({
        adminId,
        action: 'seva.update',
        entityType: 'seva_video',
        entityId: id,
        oldValue: existing,
        newValue: updated,
        sourceUrl: `/v1/admin/seva/${id}`,
        reason: body.reason || 'Updated seva video metadata or status',
      });

      res.status(200).json({
        data: updated,
        message: 'Virtual Seva video updated successfully',
      });
    } catch (err: any) {
      const isValidationError = err.message.includes('INVALID_YOUTUBE_URL') || err.message.includes('VALIDATION_ERROR');
      res.status(isValidationError ? 400 : 500).json({
        error: {
          code: isValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
          message: err.message || 'Failed to update seva video',
        },
      });
    }
  }

  /**
   * DELETE /v1/admin/seva/:id
   */
  async deleteAdminVideo(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const adminId = req.user?.userId || 'admin-super-01';

      const existing = await sevaRepository.findVideoById(id, true);
      if (!existing) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Video '${id}' not found`,
          },
        });
        return;
      }

      await sevaService.deleteVideo(id);

      // Audit log
      await writeAudit({
        adminId,
        action: 'seva.delete',
        entityType: 'seva_video',
        entityId: id,
        oldValue: existing,
        newValue: null,
        sourceUrl: `/v1/admin/seva/${id}`,
        reason: (req.query.reason as string) || 'Removed seva video by admin',
      });

      res.status(200).json({
        success: true,
        message: `Seva video '${id}' deleted successfully`,
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to delete seva video',
        },
      });
    }
  }

  /**
   * PUT /v1/admin/seva/reorder
   */
  async reorderAdminVideos(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.userId || 'admin-super-01';
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Items array with id and sort_order is required',
          },
        });
        return;
      }

      await sevaService.reorderVideos(items);

      await writeAudit({
        adminId,
        action: 'seva.reorder',
        entityType: 'seva_video',
        entityId: 'bulk',
        oldValue: null,
        newValue: items,
        sourceUrl: '/v1/admin/seva/reorder',
        reason: 'Reordered seva videos sequence',
      });

      res.status(200).json({
        success: true,
        message: 'Seva videos reordered successfully',
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || 'Failed to reorder seva videos',
        },
      });
    }
  }
}

export const sevaController = new SevaController();

