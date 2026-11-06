import admin from 'firebase-admin';
import { NewsPost, SupportedLanguage } from '../types/news.js';

export interface SentNotificationRecord {
  topic: string;
  language: SupportedLanguage;
  title: string;
  body: string;
  data: Record<string, string>;
  sentAt: string;
}

export class FCMService {
  private static sentHistory: SentNotificationRecord[] = [];

  /**
   * Broadcast news publication to appropriate topic subscribers in their respective languages.
   * Topics format:
   * - Category: news_{category}_{lang} (e.g. news_urgent_te, news_facility_en)
   * - Ghat-specific: ghat_{ghatId}_{lang} (e.g. ghat_a1b2_te)
   * - Global/urgent: news_all_{lang}
   */
  static async sendNewsNotification(news: NewsPost): Promise<{
    success: boolean;
    topicsCount: number;
    dispatchedTopics: string[];
  }> {
    const languages: SupportedLanguage[] = ['en', 'te', 'hi'];
    const dispatchedTopics: string[] = [];

    for (const lang of languages) {
      // Localized title & body with English fallback
      const localizedTitle = news.title[lang] || news.title.en || 'Godavari Pushkaralu Update';
      const localizedBody =
        news.summary?.[lang] ||
        news.content[lang] ||
        news.summary?.en ||
        news.content.en ||
        'New official update has been published.';

      const payloadData: Record<string, string> = {
        newsId: news.id,
        category: news.category,
        priority: news.priority,
        isOfficial: String(news.is_official),
        publishedAt: news.published_at || new Date().toISOString(),
        sourceUrl: news.source_url || '',
      };

      // 1. Target by category
      const categoryTopic = `news_${news.category}_${lang}`;
      await this.deliverToTopic(categoryTopic, lang, localizedTitle, localizedBody, payloadData);
      dispatchedTopics.push(categoryTopic);

      // 2. Global all-news or urgent topic
      if (news.category === 'urgent' || news.priority === 'urgent') {
        const urgentTopic = `news_urgent_${lang}`;
        await this.deliverToTopic(urgentTopic, lang, localizedTitle, localizedBody, payloadData);
        dispatchedTopics.push(urgentTopic);
      } else {
        const allTopic = `news_all_${lang}`;
        await this.deliverToTopic(allTopic, lang, localizedTitle, localizedBody, payloadData);
        dispatchedTopics.push(allTopic);
      }

      // 3. Ghat-specific topics if ghat_ids present
      if (Array.isArray(news.ghat_ids) && news.ghat_ids.length > 0) {
        for (const ghatId of news.ghat_ids) {
          const ghatTopic = `ghat_${ghatId}_${lang}`;
          await this.deliverToTopic(ghatTopic, lang, localizedTitle, localizedBody, payloadData);
          dispatchedTopics.push(ghatTopic);
        }
      }
    }

    return {
      success: true,
      topicsCount: dispatchedTopics.length,
      dispatchedTopics,
    };
  }

  /**
   * Internal delivery helper: Sends to Firebase Admin if configured, always records history
   */
  private static async deliverToTopic(
    topic: string,
    language: SupportedLanguage,
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<void> {
    const record: SentNotificationRecord = {
      topic,
      language,
      title,
      body,
      data,
      sentAt: new Date().toISOString(),
    };

    this.sentHistory.push(record);

    try {
      // Check if Firebase Admin is initialized with active project credentials
      if (admin.apps && admin.apps.length > 0) {
        await admin.messaging().send({
          topic,
          notification: {
            title,
            body,
          },
          data,
        });
      }
    } catch (err: any) {
      // Log warning in local/dev/offline environments without crashing
      console.warn(`[FCMService] FCM topic send note (${topic}):`, err.message || err);
    }
  }

  /**
   * Returns copy of dispatched notifications history for testing & auditing
   */
  static getSentHistory(): SentNotificationRecord[] {
    return [...this.sentHistory];
  }

  /**
   * Clears dispatched notifications history (useful in test suites)
   */
  static clearHistory(): void {
    this.sentHistory = [];
  }
}

