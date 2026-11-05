import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
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

  const statusCode = typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}

