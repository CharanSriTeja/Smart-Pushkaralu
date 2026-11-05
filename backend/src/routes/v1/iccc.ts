import { Router, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ICCCAlertSchema, ICCCIssueSchema } from '../../lib/iccc.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

export const icccRouter = Router();

/**
 * Middleware checking if ICCC integration is enabled
 */
function requireIcccEnabled(_req: Request, res: Response, next: () => void): void {
  if (!env.ICCC_ENABLED) {
    res.status(501).json({
      error: {
        code: 'ICCC_DISABLED',
        message: 'ICCC integration is currently disabled by feature flag (ICCC_ENABLED=false)',
      },
    });
    return;
  }
  next();
}

/**
 * POST /v1/integrations/iccc/webhook
 * Receives incoming alerts/events from Integrated Command and Control Centre (ICCC).
 */
icccRouter.post('/integrations/iccc/webhook', requireIcccEnabled, (req: Request, res: Response) => {
  const result = ICCCAlertSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid ICCC alert payload',
        details: result.error.issues,
      },
    });
    return;
  }

  res.status(200).json({
    status: 'received',
    alertId: result.data.alertId,
    receivedAt: new Date().toISOString(),
  });
});

/**
 * GET /v1/integrations/iccc/export
 * Exports incidents and issues for ICCC ingestion. Protected by admin auth.
 */
icccRouter.get(
  '/integrations/iccc/export',
  requireIcccEnabled,
  requireAuth,
  requireAdmin,
  (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      exportedAt: new Date().toISOString(),
      issues: [],
      alerts: [],
    });
  }
);

