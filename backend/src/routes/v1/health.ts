import { Router, Request, Response } from 'express';
import { query } from '../../db/index.js';
import { env } from '../../config/env.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    await query('SELECT 1 as healthy');
    const latencyMs = Date.now() - startTime;

    res.status(200).json({
      status: 'ok',
      service: 'smart-pushkaralu-backend',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'degraded',
      service: 'smart-pushkaralu-backend',
      database: 'disconnected',
      error: err.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
});

healthRouter.get('/version', (_req: Request, res: Response): void => {
  res.status(200).json({
    service: 'smart-pushkaralu-backend',
    version: '1.0.0',
    environment: env.NODE_ENV,
    commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'production',
    buildTime: process.env.BUILD_TIME || '2026-11-16T00:00:00Z',
  });
});
