import { Router, Request, Response, NextFunction } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { sosLimiter } from '../../middleware/rate-limiter.js';
import { SosService } from '../../modules/sos/sos.service.js';
import { getSmsGatewayAdapter, parseSmsSosMessage } from '../../services/sms-gateway.js';
import { logger } from '../../lib/logger.js';

export const sosRouter = Router();

/**
 * Public SOS trigger endpoint
 * Accessible without login or with bearer token. Rate limited.
 */
sosRouter.post(
  '/sos',
  sosLimiter,
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await SosService.createAlert({
        ...req.body,
        userId: req.user?.userId || null,
        phone: req.body.phone || req.user?.phone || null,
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.alert.id,
          status: result.alert.status,
          severity: result.alert.severity,
          type: result.alert.type,
          channel: result.alert.channel,
          statusToken: result.statusToken,
          trackingUrl: result.trackingUrl,
          createdAt: result.alert.created_at,
          isDuplicate: result.isDuplicate || false,
        },
        message: 'Emergency SOS alert registered. Stay calm, response teams have been alerted.',
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid SOS payload',
            details: err.errors,
          },
        });
        return;
      }
      next(err);
    }
  }
);

/**
 * Public SOS status polling endpoint
 * Requires ?token=<status_token> for reporter privacy and security
 */
sosRouter.get(
  '/sos/:id/status',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const token = (req.query.token as string) || (req.headers['x-status-token'] as string);

      if (!token) {
        res.status(401).json({
          error: {
            code: 'TOKEN_REQUIRED',
            message: 'Status verification token is required to view alert tracking',
          },
        });
        return;
      }

      const result = await SosService.getAlertStatus(id, token);
      if (!result) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'SOS alert not found or invalid status token',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          alert: {
            id: result.alert.id,
            status: result.alert.status,
            type: result.alert.type,
            severity: result.alert.severity,
            channel: result.alert.channel,
            zoneCode: result.alert.zone_code,
            ghatName: result.alert.ghat_name,
            zoneLabel: result.alert.zone_label,
            assignedToName: result.alert.assigned_to_name,
            assignedToPhone: result.alert.assigned_to_phone,
            createdAt: result.alert.created_at,
            updatedAt: result.alert.updated_at,
          },
          updates: result.updates.map((u) => ({
            id: u.id,
            status: u.status,
            note: u.note,
            createdAt: u.created_at,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Public SOS cancellation endpoint (reporter cancellation / false alarm)
 */
sosRouter.post(
  '/sos/:id/cancel',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { token, reason } = req.body;

      if (!token) {
        res.status(400).json({
          error: {
            code: 'TOKEN_REQUIRED',
            message: 'Status token required to cancel alert',
          },
        });
        return;
      }

      const cancelled = await SosService.cancelAlert(id, token, reason);
      if (!cancelled) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'SOS alert not found or token invalid',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'SOS alert has been cancelled.',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Public SOS add reporter note endpoint
 * Allows the pilgrim/reporter to append additional live situational notes to their active alert
 */
sosRouter.post(
  '/sos/:id/note',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { token, note } = req.body;

      if (!token || !note || typeof note !== 'string' || note.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token and valid note are required',
          },
        });
        return;
      }

      const verified = await SosService.getAlertStatus(id, token);
      if (!verified) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'SOS alert not found or invalid status token',
          },
        });
        return;
      }

      const update = await SosService.addNote({
        alertId: id,
        adminId: 'reporter',
        note: `Pilgrim Note: ${note.trim()}`,
        isPublic: true,
      });

      res.status(201).json({
        success: true,
        data: {
          id: update.id,
          note: update.note,
          createdAt: update.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Public Emergency Contacts endpoint
 */
sosRouter.get(
  '/emergency-contacts',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ghatId = req.query.ghatId as string | undefined;
      const contacts = await SosService.getEmergencyContacts(ghatId);

      res.json({
        success: true,
        data: contacts,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * SMS & Missed Call Webhook Endpoint
 * Ingests inbound SMS or missed call signals from telecom/SMS gateway.
 */
sosRouter.post(
  '/sos/sms-webhook',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adapter = getSmsGatewayAdapter();
      const payload = adapter.parseAndValidate(req);

      if (!payload || !payload.phone) {
        res.status(400).json({
          error: {
            code: 'INVALID_WEBHOOK_PAYLOAD',
            message: 'Failed to parse SMS payload or invalid webhook signature',
          },
        });
        return;
      }

      const parsed = parseSmsSosMessage(payload.message, payload.phone);

      const result = await SosService.createAlert({
        channel: parsed.channel,
        type: parsed.type,
        phone: parsed.phone,
        zoneCode: parsed.zoneCode,
        language: 'en',
        metadata: {
          originalMessage: parsed.originalMessage,
          source: 'sms_webhook',
        },
      });

      // Send automated SMS acknowledgment back to sender
      const ackMessage = `EMERGENCY ALERT LOGGED: Pushkaralu control room received your ${parsed.type.toUpperCase()} alert. Teams alerted. Dial 112 for direct dispatch. Ref: ${result.alert.id.slice(0, 8)}`;
      adapter.sendSms(parsed.phone, ackMessage).catch((err) => {
        logger.warn({ err: err.message }, '[SmsWebhook] Failed to send acknowledgment SMS');
      });

      res.status(200).json({
        success: true,
        alertId: result.alert.id,
        status: result.alert.status,
      });
    } catch (err) {
      next(err);
    }
  }
);

