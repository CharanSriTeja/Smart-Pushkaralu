interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in ms
}

// In-memory fallback map for web environment
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Stores a value in local web cache with an optional time-to-live in seconds (default: 24 hours).
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 86400
): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const entry: CacheEntry<T> = { value, expiresAt };
  memoryCache.set(key, entry);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`sp_cache_${key}`, JSON.stringify(entry));
    }
  } catch (err) {
    console.warn(`[Cache Web] Error persisting key ${key}:`, err);
  }
}

/**
 * Retrieves a value from local web cache if it exists and has not expired.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const now = Date.now();

  // Check memory cache first
  const mem = memoryCache.get(key);
  if (mem) {
    if (mem.expiresAt > now) {
      return mem.value as T;
    }
    memoryCache.delete(key);
  }

  // Check localStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`sp_cache_${key}`);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (entry.expiresAt > now) {
          memoryCache.set(key, entry);
          return entry.value;
        } else {
          window.localStorage.removeItem(`sp_cache_${key}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[Cache Web] Error retrieving key ${key}:`, err);
  }

  return null;
}

/**
 * Clears all cached items from memory and localStorage.
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('sp_cache_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('[Cache Web] Error clearing cache:', err);
  }
}

/**
 * Cache-first, network-refresh fetch helper for GET requests.
 * Returns cached data immediately if available, then fetches fresh data in background.
 * If no cache exists, waits for the network fetch.
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
        console.warn(`[Cache Web] Background refresh failed for ${key}:`, err.message);
      });

    return cached;
  }

  const fresh = await fetcher();
  await setCached(key, fresh, ttl);
  return fresh;
}

