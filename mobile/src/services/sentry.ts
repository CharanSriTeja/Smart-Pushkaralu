import * as Sentry from '@sentry/react-native';

let isInitialized = false;

export function initMobileSentry() {
  if (isInitialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (dsn && dsn.startsWith('http')) {
    Sentry.init({
      dsn,
      debug: false,
      tracesSampleRate: 0.2,
      enableAutoSessionTracking: true,
    });
    isInitialized = true;
    console.log('[Sentry Mobile] Initialized crash reporting.');
  }
}

export function captureMobileException(err: any, context?: Record<string, any>) {
  if (isInitialized) {
    Sentry.captureException(err, { extra: context });
  } else {
    console.warn('[Error Monitor]', err?.message || err, context);
  }
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;

