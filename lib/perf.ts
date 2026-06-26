/**
 * Lightweight server-side timing helpers (dev + opt-in production logging).
 */

export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const enabled =
    process.env.NODE_ENV === "development" ||
    process.env.PERF_LOG === "true";
  if (!enabled) return fn();

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = Math.round(performance.now() - start);
    if (ms > 100) {
      console.log(`[perf] ${label}: ${ms}ms`);
    }
  }
}
