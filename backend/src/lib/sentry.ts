import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';

let isInitialized = false;

export function initSentry() {
  if (isInitialized) return;

  if (env.SENTRY_DSN && env.SENTRY_DSN.startsWith('http')) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
    isInitialized = true;
    console.log('[Sentry] Initialized error monitoring.');
  }
}

export function captureException(err: any, context?: Record<string, any>) {
  if (isInitialized) {
    Sentry.captureException(err, { extra: context });
  }
}

