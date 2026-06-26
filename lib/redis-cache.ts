/**
 * Cross-instance cache via Upstash Redis REST API (same env as rate-limit).
 * Falls back to in-memory lib/cache.ts when Redis is not configured.
 */

import { cacheGet, cacheSet, cacheDel, cacheDelPrefix } from "@/lib/cache";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = Boolean(REST_URL && REST_TOKEN);

async function redisGet<T>(key: string): Promise<T | null> {
  if (!hasRedis) return cacheGet<T>(key);
  try {
    const res = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
      cache: "no-store",
    });
    const data = (await res.json()) as { result: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return cacheGet<T>(key);
  }
}

async function redisSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!hasRedis) {
    cacheSet(key, value, ttlSeconds);
    return;
  }
  try {
    await fetch(`${REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?EX=${ttlSeconds}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}` },
    });
  } catch {
    cacheSet(key, value, ttlSeconds);
  }
}

export async function sharedCacheGet<T>(key: string): Promise<T | null> {
  return redisGet<T>(key);
}

export async function sharedCacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await redisSet(key, value, ttlSeconds);
}

export function sharedCacheDel(key: string): void {
  cacheDel(key);
}

export function sharedCacheDelPrefix(prefix: string): void {
  cacheDelPrefix(prefix);
}

export async function cachedFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = await sharedCacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fetcher();
  await sharedCacheSet(key, value, ttlSeconds);
  return value;
}
