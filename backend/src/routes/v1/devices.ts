import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { optionalAuth } from '../../middleware/auth.js';
import { subscribeTokenToTopics, formatTopicName } from '../../lib/push.js';

export const devicesRouter = Router();

const DeviceRegisterSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
  language: z.enum(['en', 'te', 'hi']).default('en'),
  topics: z.array(z.string()).default([]),
  platform: z.enum(['android', 'ios', 'web']).default('android'),
});

export interface DeviceTokenRecord {
  id: string;
  user_id: string | null;
  fcm_token: string;
  language: string;
  topics: string[];
  platform: string;
  updated_at: Date;
}

/**
 * POST /v1/devices
 * Registers or updates a device token for push notifications. Works for both guests and authenticated users.
 */
devicesRouter.post(
  '/devices',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parseResult = DeviceRegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.issues[0]?.message || 'Invalid device registration data',
          details: parseResult.error.issues,
        },
      });
      return;
    }

    const { fcmToken, language, topics, platform } = parseResult.data;
    const userId = req.user?.userId || null;

    // Build consolidated topic list including language topic and ghat topics
    const languageTopic = `lang-${language}`;
    const allTopics = Array.from(
      new Set([languageTopic, ...topics.map(formatTopicName)])
    );

    try {
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
        [userId, fcmToken, language, allTopics, platform]
      );

      // Subscribe token to the topics via Firebase messaging asynchronously
      subscribeTokenToTopics(fcmToken, allTopics).catch(() => {});

      res.status(200).json({
        message: 'Device registered successfully',
        device: rows[0],
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: err.message || 'Failed to register device',
        },
      });
    }
  }
);

