import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Known insecure defaults – rejected in production
const INSECURE_JWT_DEFAULTS = [
  'smart-pushkaralu-dev-secret-super-safe-key-32chars',
  'smart-pushkaralu-super-secret-jwt-key-2027',
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
  ALLOW_DEV_AUTH: z
    .preprocess((val) => val === 'true' || val === '1', z.boolean())
    .default(false),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/smart_pushkaralu'),
  MIGRATION_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default('smart-pushkaralu-dev-secret-super-safe-key-32chars'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  UPLOAD_SECRET: z.string().min(32).optional(),
  ADMIN_PHONES: z.string().default(''),
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:8081,http://localhost:3000,https://smart-pushkaralu.vercel.app'
    ),
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
  // Storage settings for photo uploads
  STORAGE_ADAPTER: z.enum(['cloudinary', 'firebase', 's3', 'local']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  // Background scheduler flag
  ENABLE_SCHEDULER: z
    .preprocess((val) => val === 'true' || val === '1', z.boolean())
    .default(false),
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
  // Module 2 Routing configuration
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
export const devAuthEnabled = env.NODE_ENV !== 'production' && env.ALLOW_DEV_AUTH;

// ── Production safety checks ──────────────────────────────────────────────────
// These fail loudly on startup so a misconfigured production deploy never serves
// real users with insecure defaults or fake data.
if (env.NODE_ENV === 'production') {
  const errors: string[] = [];

  if (env.ALLOW_DEV_AUTH) {
    errors.push('ALLOW_DEV_AUTH must not be enabled in production.');
  }

  if (!env.DATABASE_URL || env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('postgres:postgres')) {
    errors.push('DATABASE_URL must be configured with production database credentials.');
  }

  // Fall back to DATABASE_URL if MIGRATION_DATABASE_URL is not set separately
  if (!env.MIGRATION_DATABASE_URL) {
    env.MIGRATION_DATABASE_URL = env.DATABASE_URL;
  }

  if (INSECURE_JWT_DEFAULTS.includes(env.JWT_SECRET)) {
    errors.push('JWT_SECRET is set to a known insecure default. Set a random 32+ character secret in Render Environment.');
  }

  // Derive UPLOAD_SECRET and SOS_WEBHOOK_SECRET from JWT_SECRET if not explicitly provided
  if (!env.UPLOAD_SECRET) {
    if (!INSECURE_JWT_DEFAULTS.includes(env.JWT_SECRET)) {
      env.UPLOAD_SECRET = env.JWT_SECRET;
    } else {
      errors.push('UPLOAD_SECRET or JWT_SECRET must be configured in production (min 32 chars).');
    }
  }

  if (INSECURE_SOS_DEFAULTS.includes(env.SOS_WEBHOOK_SECRET)) {
    if (!INSECURE_JWT_DEFAULTS.includes(env.JWT_SECRET)) {
      env.SOS_WEBHOOK_SECRET = env.JWT_SECRET;
    } else {
      errors.push('SOS_WEBHOOK_SECRET is set to a known insecure default.');
    }
  }

  if (!env.ADMIN_PHONES || env.ADMIN_PHONES.trim().length === 0) {
    errors.push('ADMIN_PHONES must be configured in production with at least one authorized E.164 admin phone number.');
  }

  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON && !env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    errors.push('Firebase credentials must be provided in production via FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.');
  }

  if (env.STORAGE_ADAPTER === 'local') {
    console.warn('[Storage Warning] STORAGE_ADAPTER is "local" on production host. Ephemeral container disk will reset uploads on redeploy.');
  } else if (env.STORAGE_ADAPTER === 'cloudinary' && (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)) {
    errors.push('STORAGE_ADAPTER=cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  } else if (env.STORAGE_ADAPTER === 's3' && (!env.AWS_S3_BUCKET || !env.AWS_REGION)) {
    errors.push('STORAGE_ADAPTER=s3 requires AWS_S3_BUCKET and AWS_REGION.');
  } else if (env.STORAGE_ADAPTER === 'firebase' && !env.FIREBASE_STORAGE_BUCKET) {
    errors.push('STORAGE_ADAPTER=firebase requires FIREBASE_STORAGE_BUCKET.');
  }

  if (env.SOS_SMS_GATEWAY_ADAPTER === 'mock') {
    console.warn('[SOS Warning] SOS_SMS_GATEWAY_ADAPTER is "mock". Outgoing SMS alerts will be simulated in server logs.');
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

  if (env.ROUTING_PROVIDER === 'osrm' && !env.OSRM_BASE_URL) {
    errors.push('ROUTING_PROVIDER=osrm requires OSRM_BASE_URL to be set.');
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
  if (!env.CORS_ORIGINS) return [];
  return env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
};

export const isOriginAllowed = (origin?: string | null): boolean => {
  // Allow non-browser requests (mobile native apps, curl, postman, server-to-server)
  if (!origin) return true;

  const allowedOrigins = getCorsOrigins();

  // If wildcard is enabled, allow all origins
  if (allowedOrigins.includes('*')) return true;

  // Exact match
  if (allowedOrigins.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();

    // Support wildcard patterns from env (e.g. *.vercel.app or https://*.vercel.app)
    for (const allowed of allowedOrigins) {
      if (allowed.startsWith('*.')) {
        const domainSuffix = allowed.slice(2).toLowerCase();
        if (hostname === domainSuffix || hostname.endsWith(`.${domainSuffix}`)) {
          return true;
        }
      }
      if (allowed.startsWith('https://*.') || allowed.startsWith('http://*.')) {
        const domainSuffix = allowed.split('://*.')[1].toLowerCase();
        if (hostname === domainSuffix || hostname.endsWith(`.${domainSuffix}`)) {
          return true;
        }
      }
    }

    // Always allow official and preview Vercel deployments for smart-pushkaralu
    if (
      hostname === 'smart-pushkaralu.vercel.app' ||
      (hostname.endsWith('.vercel.app') && hostname.includes('smart-pushkaralu'))
    ) {
      return true;
    }
  } catch {
    // If URL parsing fails, ignore and check regex fallback
  }

  // In development/test only, allow local loopback and local LAN IPs
  if (env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return true;
    }
  }

  return false;
};
