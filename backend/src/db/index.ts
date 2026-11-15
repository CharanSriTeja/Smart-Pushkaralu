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
  connectionTimeoutMillis: 30000, // 30 seconds allows for Neon serverless wake-up
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  // Avoid unhandled crash if idle client encounters an error
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

function isTransientConnectionError(err: any): boolean {
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
  try {
    return await pool.query<T>(text, params);
  } catch (err: any) {
    if (isTransientConnectionError(err)) {
      console.warn('[DB] Transient connection error detected. Retrying query once...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return await pool.query<T>(text, params);
    }
    throw err;
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (err: any) {
    if (isTransientConnectionError(err)) {
      console.warn('[DB] Connection error while acquiring transaction client. Retrying once...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 800));
      client = await pool.connect();
    } else {
      throw err;
    }
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
