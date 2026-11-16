import crypto from 'crypto';
import { Request } from 'express';
import { env } from '../config/env.js';
import { SosType } from '../types/sos.js';
import { logger } from '../lib/logger.js';

export interface SmsWebhookPayload {
  phone: string;
  message: string;
  sender?: string;
  timestamp?: string;
  raw?: any;
}

export interface ParsedSmsSos {
  type: SosType;
  zoneCode: string | null;
  channel: 'sms' | 'call';
  phone: string;
  originalMessage: string;
}

export interface SmsGatewayAdapter {
  parseAndValidate(req: Request): SmsWebhookPayload | null;
  sendSms(to: string, message: string): Promise<boolean>;
}

function hasValidWebhookSignature(req: Request): boolean {
  const secret = env.SOS_WEBHOOK_SECRET;
  const signature = (req.headers['x-signature'] || req.headers['x-webhook-signature']) as
    | string
    | undefined;

  if (!secret) return true;
  if (!signature) {
    if (env.NODE_ENV !== 'production' && env.SOS_SMS_GATEWAY_ADAPTER === 'mock') {
      return true;
    }
    logger.warn('[SmsGateway] Missing webhook signature header');
    return false;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    logger.warn('[SmsGateway] Raw webhook body unavailable for signature verification');
    return false;
  }

  const given = Buffer.from(signature, 'hex');

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    logger.warn('[SmsGateway] Webhook HMAC signature verification failed');
    return false;
  }

  return true;
}

export class MockSmsGatewayAdapter implements SmsGatewayAdapter {
  public static sentMessages: Array<{ to: string; message: string; timestamp: Date }> = [];

  parseAndValidate(req: Request): SmsWebhookPayload | null {
    if (!hasValidWebhookSignature(req)) return null;
    const body = req.body || {};
    const phone = body.phone || body.From || body.from || body.sender || '';
    const message = body.message || body.Body || body.text || body.content || '';

    if (!phone && !message) {
      return null;
    }

    return {
      phone: String(phone).trim(),
      message: String(message).trim(),
      sender: body.sender ? String(body.sender) : undefined,
      raw: body,
    };
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    MockSmsGatewayAdapter.sentMessages.push({
      to,
      message,
      timestamp: new Date(),
    });
    // Never print full phone number in plain logs
    const maskedPhone = to.length > 4 ? `***${to.slice(-4)}` : '****';
    logger.info({ to: maskedPhone, length: message.length }, '[MockSmsGateway] SMS sent successfully');
    return true;
  }
}

export class GenericSmsGatewayAdapter implements SmsGatewayAdapter {
  parseAndValidate(req: Request): SmsWebhookPayload | null {
    if (!hasValidWebhookSignature(req)) return null;

    const body = req.body || {};
    const phone = body.phone || body.From || body.from || body.sender || '';
    const message = body.message || body.Body || body.text || '';

    if (!phone) {
      return null;
    }

    return {
      phone: String(phone).trim(),
      message: String(message).trim(),
      sender: body.sender,
      raw: body,
    };
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    const maskedPhone = to.length > 4 ? `***${to.slice(-4)}` : '****';
    logger.info({ to: maskedPhone, length: message.length }, '[GenericSmsGateway] SMS delivery triggered');
    return true;
  }
}

let activeAdapter: SmsGatewayAdapter | null = null;

export function getSmsGatewayAdapter(): SmsGatewayAdapter {
  if (activeAdapter) return activeAdapter;

  if (env.SOS_SMS_GATEWAY_ADAPTER === 'mock' || env.NODE_ENV === 'test') {
    activeAdapter = new MockSmsGatewayAdapter();
  } else {
    activeAdapter = new GenericSmsGatewayAdapter();
  }

  return activeAdapter;
}

export function setSmsGatewayAdapter(adapter: SmsGatewayAdapter): void {
  activeAdapter = adapter;
}

/**
 * Parses incoming SMS text into structured SOS intent.
 * Format: "SOS [TYPE] [ZONE_CODE]"
 * e.g. "SOS MED G07", "SOS FIRE ZONE-KOTI-A", "SOS HELP", "SOS"
 */
export function parseSmsSosMessage(text: string, phone: string): ParsedSmsSos {
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  // Check for missed call webhook indicator
  if (upper === 'MISSED_CALL' || upper === 'CALL' || !trimmed) {
    return {
      type: 'general',
      zoneCode: null,
      channel: 'call',
      phone,
      originalMessage: trimmed,
    };
  }

  // Regex pattern matching: SOS followed by optional type and optional zone code
  // Example matches: "SOS", "SOS MED", "SOS FIRE G07", "SOS G07"
  const sosRegex = /^SOS(?:\s+([A-Za-z0-9_-]+))?(?:\s+([A-Za-z0-9_-]+))?$/i;
  const match = trimmed.match(sosRegex);

  let type: SosType = 'general';
  let zoneCode: string | null = null;

  if (match) {
    const param1 = match[1]?.toUpperCase();
    const param2 = match[2]?.toUpperCase();

    const typeMap: Record<string, SosType> = {
      MED: 'medical',
      MEDICAL: 'medical',
      AMBULANCE: 'medical',
      POL: 'police',
      POLICE: 'police',
      COP: 'police',
      FIR: 'fire',
      FIRE: 'fire',
      LOST: 'lost_person',
      LOST_PERSON: 'lost_person',
      MISSING: 'lost_person',
      OTH: 'other',
      OTHER: 'other',
      GEN: 'general',
      GENERAL: 'general',
      HELP: 'general',
    };

    if (param1 && typeMap[param1]) {
      type = typeMap[param1];
      if (param2) {
        zoneCode = param2;
      }
    } else if (param1) {
      // First param is not a known type keyword, treat it as zoneCode if second param absent
      zoneCode = param1;
    }
  }

  return {
    type,
    zoneCode,
    channel: 'sms',
    phone,
    originalMessage: trimmed,
  };
}
