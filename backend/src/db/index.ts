import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '../config/env.js';

// Strip channel_binding if present (node-postgres does not support SCRAM channel binding)
const sanitizedConnectionString = env.DATABASE_URL
  .replace(/[?&]channel_binding=[^&]+/g, (match) => (match.startsWith('?') ? '?' : ''))
  .replace(/\?&/, '?')
  .replace(/\?$/, '');

const isRemoteOrSsl =
  sanitizedConnectionString.includes('neon.tech') ||
  sanitizedConnectionString.includes('sslmode=') ||
  env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: sanitizedConnectionString,
  ssl: isRemoteOrSsl ? { rejectUnauthorized: false } : undefined,
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // 15 seconds allows for Neon serverless wake-up
});

pool.on('error', (err) => {
  // Avoid unhandled crash if idle client encounters an error
  console.error('Unexpected error on idle PostgreSQL client', err.message);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
