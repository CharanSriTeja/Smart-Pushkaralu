import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Known insecure defaults – rejected in production
const INSECURE_JWT_DEFAULTS = [
  'smart-pushkaralu-dev-secret-super-safe-key-32chars',
  'changeme',
  'secret',
  'dev-secret',
];
const INSECURE_SOS_DEFAULTS = [
  'dev-sos-webhook-secret-key-32chars',
  'changeme',
  'secret',
];

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/smart_pushkaralu'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default('smart-pushkaralu-dev-secret-super-safe-key-32chars'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  ADMIN_PHONES: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:8081,http://localhost:3000'),
  ICCC_ENABLED: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
      return Boolean(val);
    }, z.boolean())
    .default(false),
  MONTHLY_API_FREE_QUOTA: z.coerce.number().default(10000),
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  PLACES_CACHE_EXPIRY_DAYS: z.coerce.number().default(7),
  PLACES_API_DAILY_LIMIT: z.coerce.number().default(500),
  SPEED_FACTOR_DRIVING_KMH: z.coerce.number().default(15),
  SPEED_FACTOR_WALKING_KMH: z.coerce.number().default(4.5),
  // Module 7 Emergency SOS configuration
  SOS_DEFAULT_NUMBER: z.string().default('112'),
  SOS_SMS_GATEWAY_ADAPTER: z.enum(['mock', 'generic']).default('mock'),
  SOS_WEBHOOK_SECRET: z.string().default('dev-sos-webhook-secret-key-32chars'),
  SOS_WEB_BASE_URL: z.string().default('http://localhost:4000'),
  SOS_BACKUP_NOTIFY_PHONE: z.string().optional(),
  SOS_RATE_LIMIT_PER_HOUR: z.coerce.number().default(10),
  SOS_DEDUP_WINDOW_MINUTES: z.coerce.number().default(5),
  SOS_CLUSTER_THRESHOLD: z.coerce.number().default(5),
  SOS_CLUSTER_WINDOW_MINUTES: z.coerce.number().default(10),
  // Module 2 Routing configuration (required for real routing)
  ROUTING_PROVIDER: z.enum(['ors', 'osrm', 'mock']).default('ors'),
  ORS_API_KEY: z.string().optional(),
  OPENROUTESERVICE_API: z.string().optional(),
  OSRM_BASE_URL: z.string().url().optional(),
  // Seed/demo data flag
  SEED_DEMO: z
    .preprocess((val) => {
      if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
      return Boolean(val);
    }, z.boolean())
    .default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

// ── Production safety checks ──────────────────────────────────────────────────
// These fail loudly on startup so a misconfigured production deploy never serves
// real users with insecure defaults or fake data.
if (env.NODE_ENV === 'production') {
  const errors: string[] = [];

  if (INSECURE_JWT_DEFAULTS.includes(env.JWT_SECRET)) {
    errors.push('JWT_SECRET is set to a known insecure default. Set a random 64-char secret.');
  }
  if (INSECURE_SOS_DEFAULTS.includes(env.SOS_WEBHOOK_SECRET)) {
    errors.push('SOS_WEBHOOK_SECRET is set to a known insecure default. Set a random 64-char secret.');
  }
  if (env.SOS_SMS_GATEWAY_ADAPTER === 'mock') {
    errors.push(
      'SOS_SMS_GATEWAY_ADAPTER is "mock" in production. Emergency SMS will never be sent. Set SOS_SMS_GATEWAY_ADAPTER=generic and configure gateway credentials.'
    );
  }
  if (env.ROUTING_PROVIDER === 'mock') {
    errors.push(
      'ROUTING_PROVIDER is "mock" in production. Users will receive fake straight-line routes. Set ROUTING_PROVIDER=ors and ORS_API_KEY.'
    );
  }
  if (env.ROUTING_PROVIDER === 'ors' && !env.ORS_API_KEY && !env.OPENROUTESERVICE_API) {
    errors.push(
      'ROUTING_PROVIDER=ors but neither ORS_API_KEY nor OPENROUTESERVICE_API is set. Routing will silently fall back to mock.'
    );
  }
  if (env.SEED_DEMO) {
    errors.push('SEED_DEMO=true in production. This flag must only be used in development/test environments.');
  }

  if (errors.length > 0) {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║   PRODUCTION STARTUP SAFETY CHECK FAILED                     ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    errors.forEach((e) => console.error('  ✗ ' + e));
    console.error('');
    throw new Error(`Production safety check failed with ${errors.length} error(s). See above.`);
  }
}

export const getAdminPhoneList = (): string[] => {
  if (!env.ADMIN_PHONES) return [];
  return env.ADMIN_PHONES.split(',')
    .map((p) => p.trim())
    .filter(Boolean);
};

export const getCorsOrigins = (): string[] => {
  if (!env.CORS_ORIGINS) return ['*'];
  return env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
};
