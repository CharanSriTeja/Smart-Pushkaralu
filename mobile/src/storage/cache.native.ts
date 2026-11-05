import * as SQLite from 'expo-sqlite';

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in ms
}

const memoryCache = new Map<string, CacheEntry<any>>();

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isDbReady = false;

async function getDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (dbInstance && isDbReady) {
    return dbInstance;
  }

  try {
    if (!dbInstance) {
      dbInstance = await SQLite.openDatabaseAsync('pushkaralu_cache.db');
      await dbInstance.execAsync(`
        CREATE TABLE IF NOT EXISTS app_cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expires_at ON app_cache(expires_at);
      `);
      isDbReady = true;
    }
    return dbInstance;
  } catch (err) {
    console.warn('[Cache Native] SQLite not available, falling back to memory cache:', err);
    return null;
  }
}

/**
 * Stores a value in local cache with an optional time-to-live in seconds (default: 24 hours).
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 86400
): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { value, expiresAt });

  try {
    const db = await getDb();
    if (db) {
      const json = JSON.stringify(value);
      await db.runAsync(
        `INSERT INTO app_cache (key, value, expires_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at`,
        [key, json, expiresAt]
      );
    }
  } catch (err) {
    console.warn(`[Cache Native] Error setting cache for key ${key}:`, err);
  }
}

/**
 * Retrieves a value from local cache if it exists and has not expired.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const now = Date.now();

  const mem = memoryCache.get(key);
  if (mem) {
    if (mem.expiresAt > now) {
      return mem.value as T;
    }
    memoryCache.delete(key);
  }

  try {
    const db = await getDb();
    if (db) {
      const row = await db.getFirstAsync<{ value: string; expires_at: number }>(
        'SELECT value, expires_at FROM app_cache WHERE key = ? LIMIT 1',
        [key]
      );

      if (row) {
        if (row.expires_at > now) {
          const parsed = JSON.parse(row.value) as T;
          memoryCache.set(key, { value: parsed, expiresAt: row.expires_at });
          return parsed;
        } else {
          await db.runAsync('DELETE FROM app_cache WHERE key = ?', [key]);
        }
      }
    }
  } catch (err) {
    console.warn(`[Cache Native] Error retrieving cache for key ${key}:`, err);
  }

  return null;
}

/**
 * Clears all cached items.
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();
  try {
    const db = await getDb();
    if (db) {
      await db.runAsync('DELETE FROM app_cache');
    }
  } catch (err) {
    console.warn('[Cache Native] Error clearing cache:', err);
  }
}

/**
 * Cache-first, network-refresh fetch helper for GET requests.
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttlSeconds?: number;
    onFreshData?: (data: T) => void;
  }
): Promise<T> {
  const ttl = options?.ttlSeconds ?? 86400;
  const cached = await getCached<T>(key);

  if (cached !== null) {
    fetcher()
      .then(async (fresh) => {
        await setCached(key, fresh, ttl);
        if (options?.onFreshData) {
          options.onFreshData(fresh);
        }
      })
      .catch((err) => {
        console.warn(`[Cache Native] Background refresh failed for ${key}:`, err.message);
      });

    return cached;
  }

  const fresh = await fetcher();
  await setCached(key, fresh, ttl);
  return fresh;
}

