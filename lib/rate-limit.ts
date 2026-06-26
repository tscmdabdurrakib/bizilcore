/**
 * Durable, serverless-safe rate limiting.
 *
 * In-memory Maps do NOT work on serverless/Vercel because each invocation may
 * run in a different instance — the counter resets constantly, so the limit is
 * effectively never enforced. This module uses Upstash Redis (via its REST API,
 * no extra dependency) when configured, and only falls back to an in-memory
 * counter for local development.
 *
 * Configure in production:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const hasRedis = Boolean(REST_URL && REST_TOKEN);

// ── In-memory fallback (dev only) ─────────────────────────────────
const memoryMap = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (memoryMap.size > 10_000) {
    for (const [k, v] of memoryMap) if (now > v.resetAt) memoryMap.delete(k);
  }
  const entry = memoryMap.get(key);
  if (!entry || now > entry.resetAt) {
    memoryMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (entry.count >= max) return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  entry.count += 1;
  return { allowed: true, remaining: max - entry.count };
}

// ── Upstash Redis (production) ────────────────────────────────────
async function redisCommand<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = (await res.json()) as { result: T };
  return data.result;
}

async function redisLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;
  // INCR then set TTL on first hit (atomic-enough for rate limiting).
  const count = await redisCommand<number>(["INCR", redisKey]);
  if (count === 1) {
    await redisCommand(["EXPIRE", redisKey, windowSec]);
  }
  if (count > max) {
    const ttl = await redisCommand<number>(["PTTL", redisKey]);
    return { allowed: false, remaining: 0, retryAfterMs: ttl > 0 ? ttl : windowMs };
  }
  return { allowed: true, remaining: Math.max(0, max - count) };
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

/**
 * Increment and check a rate-limit bucket.
 * @param key    Unique bucket key (e.g. `store-order:${ip}`)
 * @param max    Max requests allowed in the window
 * @param windowMs  Window length in milliseconds
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  if (hasRedis) {
    try {
      return await redisLimit(key, max, windowMs);
    } catch (err) {
      console.error("[rate-limit] Redis error, falling back to memory:", err);
      return memoryLimit(key, max, windowMs);
    }
  }
  return memoryLimit(key, max, windowMs);
}

/** Extract the best-effort client IP from request headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
