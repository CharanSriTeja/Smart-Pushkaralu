import { Request, Response, NextFunction } from 'express';
import { NewsService } from './news.service.js';
import {
  NewsCategory,
  SupportedLanguage,
  NewsPublishStatus,
} from '../../types/news.js';

export class NewsController {
  /**
   * GET /v1/news
   * Public endpoint to retrieve published news (pinned first, hides expired)
   */
  static async listNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ghat, category, language, includeExpired, limit, offset, publishStatus } = req.query;

      const result = await NewsService.listNews({
        ghat: ghat ? String(ghat) : undefined,
        category: category ? (String(category) as NewsCategory) : undefined,
        language: language ? (String(language) as SupportedLanguage) : undefined,
        includeExpired: includeExpired === 'true',
        publishStatus: publishStatus ? (String(publishStatus) as NewsPublishStatus) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      res.status(200).json({
        data: result.news,
        meta: {
          total: result.total,
          limit: limit ? parseInt(String(limit), 10) : 50,
          offset: offset ? parseInt(String(offset), 10) : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /v1/news/:id
   * Public endpoint for single news post
   */
  static async getNewsById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { language } = req.query;

      const news = await NewsService.getNewsById(
        id as string,
        language ? (String(language) as SupportedLanguage) : undefined
      );

      if (!news) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'News post not found',
          },
        });
        return;
      }

      res.status(200).json({ data: news });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /v1/admin/news
   * Admin endpoint to create news with audit logging & optional FCM notification
   */
  static async createNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUser = {
        userId: (req as any).user?.userId || 'unknown-admin',
        phone: (req as any).user?.phone,
      };

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await NewsService.createNews(req.body, adminUser, ipAddress);

      res.status(201).json({
        data: result.news,
        meta: {
          notificationSent: result.notificationSent,
          message: 'News post created and audit logged successfully',
        },
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: err.message || 'Failed to create news post',
        },
      });
    }
  }

  /**
   * PATCH /v1/admin/news/:id
   * Admin endpoint to update news with audit logging & optional FCM notification
   */
  static async updateNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminUser = {
        userId: (req as any).user?.userId || 'unknown-admin',
        phone: (req as any).user?.phone,
      };

      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await NewsService.updateNews(id as string, req.body, adminUser, ipAddress);

      res.status(200).json({
        data: result.news,
        meta: {
          notificationSent: result.notificationSent,
          message: 'News post updated and audit logged successfully',
        },
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: err.message || 'Failed to update news post',
        },
      });
    }
  }

  /**
   * DELETE /v1/admin/news/:id
   * Admin endpoint to delete news with audit logging
   */
  static async deleteNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const auditReason = req.body?.audit_reason || req.query?.audit_reason;

      const adminUser = {
        userId: (req as any).user?.userId || 'unknown-admin',
        phone: (req as any).user?.phone,
      };

      const ipAddress = req.ip || req.socket.remoteAddress;

      await NewsService.deleteNews(id as string, String(auditReason || ''), adminUser, ipAddress);

      res.status(200).json({
        success: true,
        message: 'News post deleted and audit logged successfully',
      });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: err.message || 'Failed to delete news post',
        },
      });
    }
  }

  /**
   * POST /v1/admin/news/draft-translate
   * Helper endpoint to generate draft translations for admin review
   */
  static draftTranslate(req: Request, res: Response): void {
    try {
      const result = NewsService.draftTranslate(req.body);
      res.status(200).json({ data: result });
    } catch (err: any) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: err.message || 'Failed to generate draft translation',
        },
      });
    }
  }
}

