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
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  PLACES_CACHE_EXPIRY_DAYS: z.coerce.number().default(7),
  PLACES_API_DAILY_LIMIT: z.coerce.number().default(500),
  SPEED_FACTOR_DRIVING_KMH: z.coerce.number().default(15),
  SPEED_FACTOR_WALKING_KMH: z.coerce.number().default(4.5),
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

