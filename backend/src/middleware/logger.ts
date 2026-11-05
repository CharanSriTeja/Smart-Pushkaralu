import { Request, Response, NextFunction } from 'express';

export function maskPhone(phone: string): string {
  if (!phone) return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '****';
  return cleaned.substring(0, Math.min(3, cleaned.length - 4)) + '******' + cleaned.slice(-4);
}

export function sanitizeBody(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeBody);

  const sensitiveKeys = ['idtoken', 'refreshtoken', 'accesstoken', 'token', 'otp', 'code', 'password', 'secret'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (lowerKey.includes('phone') && typeof value === 'string') {
      sanitized[key] = maskPhone(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function secureLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args: any[]): Response {
    const duration = Date.now() - start;
    const sanitizedBody = sanitizeBody(req.body);
    const bodyStr = req.method !== 'GET' ? ` | body: ${JSON.stringify(sanitizedBody)}` : '';
    
    // Mask authorization header in log
    const authHeader = req.headers.authorization ? ' [Bearer token present]' : '';

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)${authHeader}${bodyStr}`
      );
    }

    return (originalEnd as any).apply(res, args);
  } as any;

  next();
}
