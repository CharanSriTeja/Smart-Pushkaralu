import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { initFirebase } from '../services/firebase.js';
import { logger } from './logger.js';
import { logApiUsage } from './usage.js';
import { env } from '../config/env.js';

let messagingInstance: Messaging | null = null;

function getMessagingClient(): Messaging | null {
  if (messagingInstance) return messagingInstance;
  const app = initFirebase();
  if (app) {
    try {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    } catch (err: any) {
      logger.warn({ err }, 'Failed to initialize Firebase Messaging instance');
    }
  }
  return null;
}

/**
 * Standard topic naming helpers:
 * - Language topics: `lang-en`, `lang-te`, `lang-hi`
 * - Ghat topics: `ghat-<id>`
 */
export function formatTopicName(rawTopic: string): string {
  const sanitized = rawTopic.trim().toLowerCase().replace(/[^a-zA-Z0-9-_.~%]/g, '_');
  return sanitized;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Reference database entity id to ensure content was stored prior to sending */
  sourceEntityId?: string;
}

/**
 * POLICY:
 * Never send notification content that is not already stored in the database.
 * The sourceEntityId or associated news/alert record must exist in DB.
 */
export async function sendToTopic(
  topic: string,
  payload: NotificationPayload
): Promise<{ success: boolean; messageId?: string }> {
  const sanitizedTopic = formatTopicName(topic);
  const messaging = getMessagingClient();

  if (!messaging || env.NODE_ENV === 'test' || !env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    logger.info(
      { topic: sanitizedTopic, payload },
      '[Push Mock] FCM service not configured or test mode. Notification simulated.'
    );
    await logApiUsage('firebase_messaging', 'sendToTopic', 200, 0.0);
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  }

  try {
    const response = await messaging.send({
      topic: sanitizedTopic,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'pushkaralu_alerts',
          priority: 'max',
          sound: 'default',
        },
      },
    });

    await logApiUsage('firebase_messaging', 'sendToTopic', 200, 0.0);
    return { success: true, messageId: response };
  } catch (err: any) {
    logger.error({ err, topic: sanitizedTopic }, 'Failed to send topic notification');
    await logApiUsage('firebase_messaging', 'sendToTopic', 500, 0.0);
    return { success: false };
  }
}

/**
 * Subscribes a device token to multiple topics (e.g. language and ghat alerts).
 */
export async function subscribeTokenToTopics(
  token: string,
  topics: string[]
): Promise<void> {
  if (!token || topics.length === 0) return;
  const messaging = getMessagingClient();

  for (const rawTopic of topics) {
    const topic = formatTopicName(rawTopic);
    if (!messaging) {
      logger.info({ token: token.slice(0, 10) + '...', topic }, '[Push Mock] Subscribed token to topic');
      continue;
    }

    try {
      await messaging.subscribeToTopic(token, topic);
      await logApiUsage('firebase_messaging', 'subscribeToTopic', 200, 0.0);
    } catch (err: any) {
      logger.warn({ err, topic }, 'Failed to subscribe token to topic');
    }
  }
}

/**
 * Unsubscribes a device token from topics.
 */
export async function unsubscribeTokenFromTopics(
  token: string,
  topics: string[]
): Promise<void> {
  if (!token || topics.length === 0) return;
  const messaging = getMessagingClient();

  for (const rawTopic of topics) {
    const topic = formatTopicName(rawTopic);
    if (!messaging) {
      logger.info({ token: token.slice(0, 10) + '...', topic }, '[Push Mock] Unsubscribed token from topic');
      continue;
    }

    try {
      await messaging.unsubscribeFromTopic(token, topic);
      await logApiUsage('firebase_messaging', 'unsubscribeFromTopic', 200, 0.0);
    } catch (err: any) {
      logger.warn({ err, topic }, 'Failed to unsubscribe token from topic');
    }
  }
}
