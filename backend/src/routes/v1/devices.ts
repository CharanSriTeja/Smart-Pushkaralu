import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { optionalAuth } from '../../middleware/auth.js';
import { subscribeTokenToTopics, formatTopicName } from '../../lib/push.js';

export const devicesRouter = Router();

export interface DeviceTokenRecord {
  id?: string;
  user_id?: string | null;
  fcm_token?: string;
  token?: string;
  language?: string;
  topics?: string[];
  ghat_topics?: string[];
  platform?: string;
  updated_at?: Date;
}

/**
 * Unified POST /v1/devices
 * Registers or updates a device token for push notifications and topic subscriptions.
 * Supports both platform payload ({ fcmToken, language, topics, platform })
 * and news/topic payload ({ token, language, ghat_topics }).
 */
devicesRouter.post(
  '/devices',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fcmToken, token, fcm_token, language, topics, ghat_topics, platform } = req.body;

      // Handle empty token validation
      const rawToken = fcmToken || token || fcm_token;
      if (rawToken === '' || (token !== undefined && typeof token === 'string' && token.trim().length === 0)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Device FCM token is required.',
          },
        });
        return;
      }

      if (!rawToken || typeof rawToken !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Device FCM token is required.',
          },
        });
        return;
      }

      const cleanToken = rawToken.trim();
      const preferredLanguage = ['en', 'te', 'hi'].includes(language) ? language : 'en';
      const userId = (req as any).user?.userId || null;
      const devicePlatform = ['android', 'ios', 'web'].includes(platform) ? platform : 'android';

      // Distinguish if request was sent using the news schema (token, ghat_topics) or platform schema (fcmToken, topics)
      const isNewsSchema = token !== undefined || ghat_topics !== undefined;

      if (isNewsSchema) {
        const cleanTopics: string[] = Array.isArray(ghat_topics)
          ? ghat_topics
          : Array.isArray(topics)
          ? topics
          : [];

        const { rows } = await query<DeviceTokenRecord>(
          `INSERT INTO device_tokens (
            token, fcm_token, language, ghat_topics, topics, user_id, updated_at
          ) VALUES ($1, $1, $2, $3, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (token) DO UPDATE SET
            language = EXCLUDED.language,
            ghat_topics = EXCLUDED.ghat_topics,
            topics = EXCLUDED.topics,
            user_id = COALESCE(EXCLUDED.user_id, device_tokens.user_id),
            updated_at = CURRENT_TIMESTAMP
          RETURNING *`,
          [cleanToken, preferredLanguage, cleanTopics, userId]
        );

        const record: any = rows[0] || {
          token: cleanToken,
          fcm_token: cleanToken,
          language: preferredLanguage,
          ghat_topics: cleanTopics,
          topics: cleanTopics,
          user_id: userId,
        };
        record.token = record.token || cleanToken;
        record.fcm_token = record.fcm_token || cleanToken;
        record.ghat_topics = record.ghat_topics || cleanTopics;
        record.topics = record.topics || cleanTopics;

        res.status(200).json({
          success: true,
          message: 'Device registered and topic subscriptions synced successfully.',
          data: record,
          device: record,
        });
        return;
      }

      // Platform schema (fcmToken, language, topics, platform)
      const languageTopic = `lang-${preferredLanguage}`;
      const inputTopics = Array.isArray(topics) ? topics : [];
      const allTopics = Array.from(
        new Set([languageTopic, ...inputTopics.map(formatTopicName)])
      );

      const { rows } = await query<DeviceTokenRecord>(
        `INSERT INTO device_tokens (user_id, fcm_token, language, topics, platform, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (fcm_token)
         DO UPDATE SET
           user_id = COALESCE(EXCLUDED.user_id, device_tokens.user_id),
           language = EXCLUDED.language,
           topics = EXCLUDED.topics,
           platform = EXCLUDED.platform,
           updated_at = NOW()
         RETURNING *`,
        [userId, cleanToken, preferredLanguage, allTopics, devicePlatform]
      );

      subscribeTokenToTopics(cleanToken, allTopics).catch(() => {});

      const record: any = rows[0] || {
        user_id: userId,
        fcm_token: cleanToken,
        token: cleanToken,
        language: preferredLanguage,
        topics: allTopics,
        ghat_topics: allTopics,
        platform: devicePlatform,
      };
      record.token = record.token || cleanToken;
      record.fcm_token = record.fcm_token || cleanToken;
      record.ghat_topics = record.ghat_topics || allTopics;
      record.topics = record.topics || allTopics;

      res.status(200).json({
        success: true,
        message: 'Device registered successfully',
        device: record,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /v1/devices/:token
 */
devicesRouter.get(
  '/devices/:token',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.params;
      const { rows } = await query<DeviceTokenRecord>(
        'SELECT * FROM device_tokens WHERE token = $1 OR fcm_token = $1 LIMIT 1',
        [token]
      );

      if (rows.length === 0) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Device registration not found.',
          },
        });
        return;
      }

      res.status(200).json({ data: rows[0], device: rows[0] });
    } catch (err) {
      next(err);
    }
  }
);
