import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { query } from '../../db/index.js';
import { env } from '../../config/env.js';

export const usageRouter = Router();

usageRouter.get(
  '/admin/usage',
  requireAuth,
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const monthlyQuota = env.MONTHLY_API_FREE_QUOTA;

      // 1. Current month usage summary
      const monthSummary = await query<{ count: string; total_cost: string }>(
        `SELECT COUNT(*) as count, COALESCE(SUM(cost_estimate), 0) as total_cost
         FROM api_usage_logs
         WHERE created_at >= date_trunc('month', NOW())`
      );

      const currentMonthUsage = parseInt(monthSummary.rows[0]?.count || '0', 10);
      const currentMonthCost = parseFloat(monthSummary.rows[0]?.total_cost || '0');
      const quotaRemaining = Math.max(0, monthlyQuota - currentMonthUsage);
      const quotaPercentUsed = monthlyQuota > 0 ? (currentMonthUsage / monthlyQuota) * 100 : 0;

      // 2. Providers breakdown
      const providerBreakdown = await query<{ provider: string; count: string; total_cost: string }>(
        `SELECT provider, COUNT(*) as count, COALESCE(SUM(cost_estimate), 0) as total_cost
         FROM api_usage_logs
         GROUP BY provider
         ORDER BY count DESC`
      );

      // 3. Daily usage history for last 30 days
      const dailyBreakdown = await query<{ date: string; provider: string; count: string }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, provider, COUNT(*) as count
         FROM api_usage_logs
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY date, provider
         ORDER BY date DESC, count DESC`
      );

      res.json({
        monthlyQuota,
        currentMonthUsage,
        currentMonthCost,
        quotaRemaining,
        quotaPercentUsed: Number(quotaPercentUsed.toFixed(2)),
        providers: providerBreakdown.rows.map((r) => ({
          provider: r.provider,
          totalCalls: parseInt(r.count, 10),
          totalCost: parseFloat(r.total_cost),
        })),
        dailyUsage: dailyBreakdown.rows.map((r) => ({
          date: r.date,
          provider: r.provider,
          count: parseInt(r.count, 10),
        })),
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: err.message || 'Failed to fetch API usage statistics',
        },
      });
    }
  }
);

