/**
 * In-memory TTL cache — same interface as Redis, no external service needed.
 * Can be swapped to ioredis/Upstash by replacing these 4 functions.
 */

interface CacheEntry {
  value: unknown;
  expiry: number;
}

const store = new Map<string, CacheEntry>();

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.expiry) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  store.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
}

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { store.delete(key); return null; }
  return entry.value as T;
}

export function cacheDel(key: string): void {
  store.delete(key);
}

export function cacheDelPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheSize(): number {
  return store.size;
}

// TTL constants (seconds)
export const TTL = {
  DASHBOARD: 5 * 60,   // 5 minutes
  PRODUCTS: 2 * 60,    // 2 minutes
  CUSTOMERS: 2 * 60,
  ORDERS: 60,          // 1 minute
  CATEGORIES: 5 * 60,  // 5 minutes
} as const;

// Cache key builders
export const CK = {
  products: (shopId: string) => `shop:${shopId}:products`,
  orders: (shopId: string, status?: string) => `shop:${shopId}:orders:${status ?? "all"}`,
  customers: (shopId: string) => `shop:${shopId}:customers`,
  dashboard: (shopId: string) => `shop:${shopId}:dashboard`,
  fbComments: (shopId: string) => `shop:${shopId}:fb-comments`,
  categories: (shopId: string) => `shop:${shopId}:categories`,
} as const;
