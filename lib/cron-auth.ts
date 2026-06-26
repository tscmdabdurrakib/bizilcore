/**
 * Shared cron authentication.
 *
 * Vercel Cron Jobs automatically send `Authorization: Bearer <CRON_SECRET>`
 * when the `CRON_SECRET` env var is configured. The in-process scheduler in
 * instrumentation.ts uses the same header. This helper enforces that secret.
 *
 * Security: in production a real CRON_SECRET is REQUIRED — there is no weak
 * default fallback. A missing secret causes every cron request to be rejected
 * (fail closed) rather than silently accepting a guessable default.
 */

const DEV_FALLBACK_SECRET = "bizilcore-cron-dev-only";

export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET;
  if (secret && secret.trim()) return secret;
  // Only allow a known dev fallback outside production so local runs work.
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_SECRET;
  return null;
}

/**
 * Returns true when the incoming request carries a valid cron bearer token.
 */
export function isAuthorizedCron(req: Request): boolean {
  const expected = getCronSecret();
  if (!expected) return false; // fail closed: no secret configured in prod
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}
