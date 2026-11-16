import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dns from 'node:dns';
import { env } from '../config/env.js';

// Prioritize IPv4 to avoid hanging on unresponsive IPv6 routes on Windows/Node
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if unsupported
}

// Strip channel_binding if present (node-postgres does not support SCRAM channel binding)
export function sanitizeConnectionString(url: string): string {
  return url
    .replace(/[?&]channel_binding=[^&]+/g, (match) => (match.startsWith('?') ? '?' : ''))
    .replace(/\?&/, '?')
    .replace(/\?$/, '');
}

const sanitizedConnectionString = sanitizeConnectionString(env.DATABASE_URL);

const isRemoteOrSsl =
  sanitizedConnectionString.includes('neon.tech') ||
  sanitizedConnectionString.includes('sslmode=') ||
  env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: sanitizedConnectionString,
  ssl: isRemoteOrSsl ? { rejectUnauthorized: false } : undefined,
  max: 10, // Tuned for pooled connection string on serverless Postgres
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// Set statement timeout on newly connected clients in non-test environments
pool.on('connect', (client) => {
  if (env.NODE_ENV !== 'test') {
    client.query("SET statement_timeout = '15000'").catch((err) => {
      console.warn('[DB] Failed to set statement_timeout on client:', err.message);
    });
  }
});

export function isTransientConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = err.message || '';
  const code = err.code || '';
  return (
    msg.includes('Connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('timeout exceeded') ||
    msg.includes('client has encountered a connection error') ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === '57P01' ||
    code === '08006' ||
    code === '08001'
  );
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const maxAttempts = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await pool.query<T>(text, params);
    } catch (err: any) {
      lastError = err;
      if (isTransientConnectionError(err) && attempt < maxAttempts) {
        const delay = attempt * 500;
        console.warn(`[DB] Transient connection error on query (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, err.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const maxAttempts = 3;
  let client: PoolClient | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err: any) {
      if (isTransientConnectionError(err) && attempt < maxAttempts) {
        const delay = attempt * 500;
        console.warn(`[DB] Connection error acquiring client (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, err.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }

  if (!client) {
    throw new Error('[DB] Unable to acquire database client from pool.');
  }

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verifies that the PostGIS extension is installed and operational.
 * Throws a descriptive error if PostGIS is not available.
 */
export async function verifyPostgis(): Promise<string> {
  try {
    const res = await query('SELECT PostGIS_Version() AS version');
    const version = res.rows[0]?.version;
    if (!version) {
      throw new Error('PostGIS_Version() returned empty result.');
    }
    return version;
  } catch (err: any) {
    throw new Error(
      `PostGIS extension check failed: ${err.message}. ` +
      `Ensure the PostGIS extension is enabled by running "CREATE EXTENSION IF NOT EXISTS postgis;" on your PostgreSQL database.`
    );
  }
}
