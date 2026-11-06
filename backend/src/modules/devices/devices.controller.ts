import { Request, Response, NextFunction } from 'express';
import { query } from '../../db/index.js';
import { DeviceTokenRecord } from '../../types/news.js';

export class DevicesController {
  /**
   * POST /v1/devices
   * Register or update an FCM device token with preferred language and subscribed ghat topics.
   */
  static async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, fcm_token, language, ghat_topics, topics } = req.body;

      const deviceToken = token || fcm_token;
      if (!deviceToken || typeof deviceToken !== 'string' || deviceToken.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Device FCM token is required.',
          },
        });
        return;
      }

      const cleanToken = deviceToken.trim();
      const preferredLanguage = ['en', 'te', 'hi'].includes(language) ? language : 'en';
      const cleanTopics: string[] = Array.isArray(ghat_topics)
        ? ghat_topics
        : Array.isArray(topics)
        ? topics
        : [];

      const userId = (req as any).user?.userId || null;

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

      res.status(200).json({
        success: true,
        data: rows[0],
        message: 'Device registered and topic subscriptions synced successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /v1/devices/:token
   * Inspect registered device subscriptions
   */
  static async getDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      res.status(200).json({ data: rows[0] });
    } catch (err) {
      next(err);
    }
  }
}

