import { getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { NewsPost, SupportedLanguage } from '../types/news.js';
import { query } from '../db/index.js';

export interface SentNotificationRecord {
  topic?: string;
  token?: string;
  language?: SupportedLanguage;
  title: string;
  body: string;
  data: Record<string, string>;
  sentAt: string;
}

export class FCMService {
  private static sentHistory: SentNotificationRecord[] = [];

  /**
   * Dispatches issue status notification to the reporter's device
   */
  static async sendIssueStatusNotification(params: {
    ticketNo: string;
    status: string;
    reporterDeviceToken?: string | null;
    reporterId?: string | null;
    publicNote?: string | null;
    language?: SupportedLanguage;
  }): Promise<{ dispatched: boolean; count: number }> {
    const lang: SupportedLanguage = params.language || 'en';

    const statusTitles: Record<SupportedLanguage, Record<string, string>> = {
      en: {
        submitted: `Issue #${params.ticketNo} Submitted`,
        under_review: `Issue #${params.ticketNo} Under Review`,
        in_progress: `Issue #${params.ticketNo} In Progress`,
        resolved: `Issue #${params.ticketNo} Resolved`,
        rejected: `Issue #${params.ticketNo} Update`,
      },
      te: {
        submitted: `సమస్య #${params.ticketNo} సమర్పించబడింది`,
        under_review: `సమస్య #${params.ticketNo} పరిశీలనలో ఉంది`,
        in_progress: `సమస్య #${params.ticketNo} ప్రగతిలో ఉంది`,
        resolved: `సమస్య #${params.ticketNo} పరిష్కరించబడింది`,
        rejected: `సమస్య #${params.ticketNo} తాజా సమాచారం`,
      },
      hi: {
        submitted: `समस्या #${params.ticketNo} दर्ज की गई`,
        under_review: `समस्या #${params.ticketNo} समीक्षाधीन है`,
        in_progress: `समस्या #${params.ticketNo} पर कार्य जारी है`,
        resolved: `समस्या #${params.ticketNo} सुलझा ली गई`,
        rejected: `समस्या #${params.ticketNo} अपडेट`,
      },
    };

    const statusBodies: Record<SupportedLanguage, Record<string, string>> = {
      en: {
        submitted: 'Your report has been received and logged in the Pushkaralu system.',
        under_review: 'Pushkaralu field team is inspecting the reported grievance.',
        in_progress: 'Municipal and ghat teams are currently resolving the issue.',
        resolved: 'Action has been completed and verified at the location.',
        rejected: 'Report has been closed. Please check the status notes for details.',
      },
      te: {
        submitted: 'మీ నివేదిక పుష్కరాల వ్యవస్థలో నమోదు చేయబడింది.',
        under_review: 'పుష్కరాల క్షేత్ర స్థాయి బృందం మీ సమస్యను పరిశీలిస్తోంది.',
        in_progress: 'మున్సిపల్ మరియు ఘాట్ బృందాలు సమస్యను పరిష్కరిస్తున్నాయి.',
        resolved: 'సంబంధిత ప్రాంతంలో సమస్య విజయవంతంగా పరిష్కరించబడింది.',
        rejected: 'నివేదిక మూసివేయబడింది. దయచేసి నోట్స్ పరిశీలించండి.',
      },
      hi: {
        submitted: 'आपकी रिपोर्ट पुष्करालु प्रणाली में दर्ज कर ली गई है।',
        under_review: 'पुष्करालु फील्ड टीम समस्या की समीक्षा कर रही है।',
        in_progress: 'नगर निगम और घाट टीम समस्या निवारण में जुटी हुई है।',
        resolved: 'स्थान पर आवश्यक कार्रवाई पूरी कर ली गई है।',
        rejected: 'रिपोर्ट बंद कर दी गई है। विवरण के लिए नोट्स देखें।',
      },
    };

    const title = statusTitles[lang]?.[params.status] || statusTitles.en[params.status] || `Issue #${params.ticketNo} Update`;
    let body = params.publicNote || statusBodies[lang]?.[params.status] || statusBodies.en[params.status] || `Status updated to ${params.status}`;

    const dataPayload: Record<string, string> = {
      type: 'issue_update',
      ticketNo: params.ticketNo,
      status: params.status,
      updatedAt: new Date().toISOString(),
    };

    let dispatchCount = 0;

    // 1. Send directly to reporterDeviceToken if provided
    if (params.reporterDeviceToken) {
      await this.deliverToToken(params.reporterDeviceToken, lang, title, body, dataPayload);
      dispatchCount++;
    }

    // 2. If reporterId is provided, deliver to all device tokens registered for this user
    if (params.reporterId) {
      try {
        const { rows } = await query<{ token: string; language: string }>(
          'SELECT token, language FROM device_tokens WHERE user_id = $1',
          [params.reporterId]
        );
        for (const row of rows) {
          if (row.token && row.token !== params.reporterDeviceToken) {
            const userLang = (row.language as SupportedLanguage) || lang;
            const userTitle = statusTitles[userLang]?.[params.status] || title;
            const userBody = params.publicNote || statusBodies[userLang]?.[params.status] || body;
            await this.deliverToToken(row.token, userLang, userTitle, userBody, dataPayload);
            dispatchCount++;
          }
        }
      } catch (err: any) {
        console.warn('[FCMService] Error fetching user device tokens:', err.message);
      }
    }

    // 3. Deliver to ticket topic in case app subscribed via ticket
    const ticketTopic = `issue_${params.ticketNo}`;
    await this.deliverToTopic(ticketTopic, lang, title, body, dataPayload);
    dispatchCount++;

    return { dispatched: dispatchCount > 0, count: dispatchCount };
  }

  /**
   * Internal delivery helper: Sends to specific device token
   */
  private static async deliverToToken(
    token: string,
    language: SupportedLanguage,
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<void> {
    const record: SentNotificationRecord = {
      token,
      language,
      title,
      body,
      data,
      sentAt: new Date().toISOString(),
    };

    this.sentHistory.push(record);

    try {
      if (getApps().length > 0) {
        await getMessaging().send({
          token,
          notification: { title, body },
          data,
        });
      }
    } catch (err: any) {
      console.warn(`[FCMService] FCM token send note:`, err.message || err);
    }
  }

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
      if (getApps().length > 0) {
        await getMessaging().send({
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

