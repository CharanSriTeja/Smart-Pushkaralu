import { query } from '../db/index.js';
import { logger } from './logger.js';

export interface ApiUsageRecord {
  id: string;
  provider: string;
  endpoint: string;
  status: number;
  cost_estimate: string | number;
  created_at: Date;
}

/**
 * Logs external and internal API provider usage for cost tracking and quota limits.
 * Handles database errors silently so business flow is never interrupted.
 */
export async function logApiUsage(
  provider: string,
  endpoint: string,
  status: number,
  costEstimate: number = 0.0
): Promise<ApiUsageRecord | null> {
  try {
    const { rows } = await query<ApiUsageRecord>(
      `INSERT INTO api_usage_logs (provider, endpoint, status, cost_estimate)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [provider, endpoint, status, costEstimate]
    );

    return rows[0] || null;
  } catch (err: any) {
    logger.warn({ err, provider, endpoint }, 'Failed to record API usage log');
    return null;
  }
}

