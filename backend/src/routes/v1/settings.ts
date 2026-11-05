import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../../db/index.js';
import { requireAuth, requireAdmin, can } from '../../middleware/auth.js';
import { writeAudit } from '../../lib/audit.js';

export const settingsRouter = Router();

export const SAFE_PUBLIC_KEYS = [
  'places_cache_days',
  'route_cache_days',
  'corridor_km',
  'default_language',
  'sos_rate_limit_per_hour',
] as const;

export interface SettingRecord {
  key: string;
  value: any;
  updated_by: string | null;
  updated_at: Date;
}

/**
 * GET /v1/settings/public
 * Returns public, safe client configuration settings without authentication.
 */
settingsRouter.get('/settings/public', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await query<SettingRecord>(
      'SELECT key, value FROM settings WHERE key = ANY($1)',
      [SAFE_PUBLIC_KEYS]
    );

    const result: Record<string, any> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    // Ensure fallback defaults if database had no rows yet
    if (result.places_cache_days === undefined) result.places_cache_days = 7;
    if (result.route_cache_days === undefined) result.route_cache_days = 1;
    if (result.corridor_km === undefined) result.corridor_km = 3;
    if (result.default_language === undefined) result.default_language = 'en';
    if (result.sos_rate_limit_per_hour === undefined) result.sos_rate_limit_per_hour = 5;

    res.json({ settings: result });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: err.message || 'Failed to fetch public settings',
      },
    });
  }
});

/**
 * GET /v1/admin/settings
 * Returns all settings with metadata. Protected by settings.write permission.
 */
settingsRouter.get(
  '/admin/settings',
  requireAuth,
  requireAdmin,
  can('settings.write'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { rows } = await query<SettingRecord>(
        `SELECT s.key, s.value, s.updated_by, s.updated_at, u.name as updated_by_name, u.phone as updated_by_phone
         FROM settings s
         LEFT JOIN users u ON s.updated_by = u.id
         ORDER BY s.key ASC`
      );

      res.json({ settings: rows });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: err.message || 'Failed to fetch admin settings',
        },
      });
    }
  }
);

const SingleUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  reason: z.string().optional(),
});

const BatchUpdateSchema = z.object({
  settings: z.record(z.string(), z.any()),
  reason: z.string().optional(),
});

const PatchSettingsSchema = z.union([SingleUpdateSchema, BatchUpdateSchema]);

/**
 * PATCH /v1/admin/settings
 * Modifies configuration settings. Audited and protected by settings.write permission.
 */
settingsRouter.patch(
  '/admin/settings',
  requireAuth,
  requireAdmin,
  can('settings.write'),
  async (req: Request, res: Response): Promise<void> => {
    const parseResult = PatchSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid settings update format. Provide { key, value } or { settings: { key: value } }',
        },
      });
      return;
    }

    const payload = parseResult.data;
    const updates: Array<{ key: string; value: any }> = [];
    const reason = payload.reason || 'Admin settings updated';

    if ('key' in payload) {
      updates.push({ key: payload.key, value: payload.value });
    } else if ('settings' in payload) {
      for (const [key, value] of Object.entries(payload.settings)) {
        updates.push({ key, value });
      }
    }

    if (updates.length === 0) {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'No settings provided to update',
        },
      });
      return;
    }

    try {
      const updatedRecords: SettingRecord[] = [];

      for (const update of updates) {
        // Fetch current old value for audit logging
        const existing = await query<SettingRecord>(
          'SELECT key, value FROM settings WHERE key = $1',
          [update.key]
        );
        const oldValue = existing.rows[0]?.value ?? null;

        // Upsert new setting value
        const { rows } = await query<SettingRecord>(
          `INSERT INTO settings (key, value, updated_by, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (key)
           DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
           RETURNING *`,
          [update.key, JSON.stringify(update.value), req.user!.userId]
        );

        if (rows[0]) {
          updatedRecords.push(rows[0]);
        }

        // Record audit entry
        await writeAudit({
          adminId: req.user!.userId,
          action: 'settings.update',
          entityType: 'settings',
          entityId: update.key,
          oldValue,
          newValue: update.value,
          sourceUrl: req.originalUrl,
          reason,
        });
      }

      res.json({
        message: 'Settings updated successfully',
        updated: updatedRecords,
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: err.message || 'Failed to update settings',
        },
      });
    }
  }
);

