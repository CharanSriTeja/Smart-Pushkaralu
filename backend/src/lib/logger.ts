import pino from 'pino';
import { pinoHttp } from 'pino-http';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { Request, Response } from 'express';

// Phone masking function: "+91 9876543210" -> "+91 ******3210"
export function maskPhoneString(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '****';
  return cleaned.substring(0, Math.min(3, cleaned.length - 4)) + '******' + cleaned.slice(-4);
}

export const logger = pino({
  level: env.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.idToken',
      'req.body.refreshToken',
      'req.body.accessToken',
      'req.body.otp',
      'req.body.code',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: Request) => {
    const existing = req.headers['x-request-id'];
    if (typeof existing === 'string' && existing.length > 0) {
      return existing;
    }
    return crypto.randomUUID();
  },
  customProps: (req: Request, res: Response) => {
    // Expose request ID in response header
    const reqId = req.id || req.headers['x-request-id'];
    if (reqId && !res.headersSent) {
      res.setHeader('x-request-id', reqId as string);
    }
    return {
      requestId: reqId,
    };
  },
  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
      // Mask phone number in query or headers if present
      phone: req.query?.phone ? maskPhoneString(req.query.phone) : undefined,
    }),
  },
});

