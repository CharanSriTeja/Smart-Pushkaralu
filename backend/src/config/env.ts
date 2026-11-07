import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/smart_pushkaralu'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('smart-pushkaralu-dev-secret-super-safe-key-32chars'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  ADMIN_PHONES: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:8081,http://localhost:3000'),
  ICCC_ENABLED: z.coerce.boolean().default(false),
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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

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
