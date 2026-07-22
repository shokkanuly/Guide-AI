export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default cache TTL: 1 hour (3600000 ms)
const DEFAULT_TTL = 3600000;

export function getCachedData<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache(): void {
  memoryCache.clear();
}
