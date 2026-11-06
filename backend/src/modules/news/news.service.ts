import { NewsRepository } from './news.repository.js';
import {
  NewsPost,
  NewsQueryParams,
  CreateNewsInput,
  UpdateNewsInput,
  DraftTranslationRequest,
  DraftTranslationResult,
  SupportedLanguage,
} from '../../types/news.js';
import { AuditService } from '../audit/audit.service.js';
import { FCMService } from '../../services/fcm.service.js';
import { TranslationService } from '../../services/translation.service.js';

export class NewsService {
  /**
   * List news with filtering, ordering, pagination, and multi-language support
   */
  static async listNews(params: NewsQueryParams): Promise<{ news: NewsPost[]; total: number }> {
    return NewsRepository.findNews(params);
  }

  /**
   * Retrieve single news post by ID
   */
  static async getNewsById(id: string, language?: SupportedLanguage): Promise<NewsPost | null> {
    return NewsRepository.findById(id, language);
  }

  /**
   * Create news post with audit logging and optional FCM topic notification
   */
  static async createNews(
    data: CreateNewsInput,
    adminUser: { userId: string; phone?: string },
    ipAddress?: string
  ): Promise<{ news: NewsPost; notificationSent: boolean }> {
    if (!data.title?.en || data.title.en.trim().length === 0) {
      throw new Error('Title in English is strictly required.');
    }
    if (!data.content?.en || data.content.en.trim().length === 0) {
      throw new Error('Content in English is strictly required.');
    }
    if (!data.audit_reason || data.audit_reason.trim().length === 0) {
      throw new Error('An administrative audit reason is strictly required.');
    }

    const news = await NewsRepository.create(data, adminUser.userId);

    // Audit Logging
    await AuditService.record({
      adminId: adminUser.userId,
      adminEmail: adminUser.phone || 'admin',
      action: 'news.create',
      entityType: 'news_post',
      entityId: news.id,
      oldValues: null,
      newValues: news,
      sourceUrl: news.source_url,
      reason: data.audit_reason.trim(),
      ipAddress,
    });

    // Notify matching topics on publish if notify flag is set
    let notificationSent = false;
    if (news.publish_status === 'published' && data.notify) {
      await FCMService.sendNewsNotification(news);
      await NewsRepository.markNotificationSent(news.id);
      notificationSent = true;
      news.notify_sent = true;
    }

    return { news, notificationSent };
  }

  /**
   * Update news post with audit logging and optional FCM notification
   */
  static async updateNews(
    id: string,
    data: UpdateNewsInput,
    adminUser: { userId: string; phone?: string },
    ipAddress?: string
  ): Promise<{ news: NewsPost; notificationSent: boolean }> {
    if (!data.audit_reason || data.audit_reason.trim().length === 0) {
      throw new Error('An administrative audit reason is strictly required.');
    }

    const oldNews = await NewsRepository.findById(id);
    if (!oldNews) {
      throw new Error('News post not found');
    }

    const updatedNews = await NewsRepository.update(id, data);
    if (!updatedNews) {
      throw new Error('Failed to update news post');
    }

    // Audit Logging
    await AuditService.record({
      adminId: adminUser.userId,
      adminEmail: adminUser.phone || 'admin',
      action: 'news.update',
      entityType: 'news_post',
      entityId: id,
      oldValues: oldNews,
      newValues: updatedNews,
      sourceUrl: updatedNews.source_url,
      reason: data.audit_reason.trim(),
      ipAddress,
    });

    // If published and notify is requested (and not previously notified, or forced)
    let notificationSent = false;
    if (updatedNews.publish_status === 'published' && data.notify && !oldNews.notify_sent) {
      await FCMService.sendNewsNotification(updatedNews);
      await NewsRepository.markNotificationSent(id);
      notificationSent = true;
      updatedNews.notify_sent = true;
    }

    return { news: updatedNews, notificationSent };
  }

  /**
   * Delete news post with audit logging
   */
  static async deleteNews(
    id: string,
    auditReason: string,
    adminUser: { userId: string; phone?: string },
    ipAddress?: string
  ): Promise<boolean> {
    if (!auditReason || auditReason.trim().length === 0) {
      throw new Error('An administrative audit reason is strictly required.');
    }

    const oldNews = await NewsRepository.findById(id);
    if (!oldNews) {
      throw new Error('News post not found');
    }

    const deleted = await NewsRepository.delete(id);
    if (deleted) {
      await AuditService.record({
        adminId: adminUser.userId,
        adminEmail: adminUser.phone || 'admin',
        action: 'news.delete',
        entityType: 'news_post',
        entityId: id,
        oldValues: oldNews,
        newValues: null,
        sourceUrl: oldNews.source_url,
        reason: auditReason.trim(),
        ipAddress,
      });
    }

    return deleted;
  }

  /**
   * Draft translation helper for admin review
   */
  static draftTranslate(req: DraftTranslationRequest): DraftTranslationResult {
    return TranslationService.generateDraft(req);
  }
}

