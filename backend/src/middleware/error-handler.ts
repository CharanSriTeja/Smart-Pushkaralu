import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { captureException } from '../lib/sentry.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Report non-4xx / unexpected server errors to Sentry
  const statusCode = typeof err.status === 'number' ? err.status : 500;
  if (statusCode >= 500) {
    captureException(err, { url: req.originalUrl, method: req.method });
    logger.error({ err, url: req.originalUrl }, 'Unhandled server error');
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: details[0]?.message || 'Invalid request data',
        details,
      },
    });
    return;
  }

  // Handle express JSON body parser errors
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload',
      },
    });
    return;
  }

  const isProd = env.NODE_ENV === 'production';
  const message = statusCode >= 500 && isProd
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'ERROR');

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
