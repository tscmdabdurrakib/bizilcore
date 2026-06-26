/**
 * Lightweight, dependency-free error reporting.
 *
 * - Always emits a structured `console.error` line that Vercel log drains /
 *   uptime monitors can parse.
 * - If `@sentry/nextjs` is installed AND a DSN is configured, errors are also
 *   forwarded to Sentry via a lazy dynamic import (no hard dependency, so the
 *   build never breaks when the SDK is absent).
 *
 * Usage:
 *   import { captureError } from "@/lib/observability";
 *   catch (err) { captureError(err, { route: "store/orders", shopId }); }
 */

type ErrorContext = Record<string, unknown>;

let sentryModule: { captureException?: (e: unknown, hint?: unknown) => void } | null | undefined;

async function getSentry() {
  if (sentryModule !== undefined) return sentryModule;
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    sentryModule = null;
    return null;
  }
  try {
    // Dynamic specifier avoids bundler static resolution when SDK is not installed.
    const specifier = "@sentry/nextjs";
    sentryModule = await import(/* webpackIgnore: true */ specifier);
  } catch {
    sentryModule = null;
  }
  return sentryModule;
}

export function captureError(err: unknown, context: ErrorContext = {}): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  // Structured log — picked up by Vercel/observability tooling.
  console.error(
    JSON.stringify({
      level: "error",
      message,
      ...context,
      stack,
      ts: new Date().toISOString(),
    }),
  );

  // Best-effort forward to Sentry if available.
  void getSentry().then((s) => {
    try {
      s?.captureException?.(err, { extra: context });
    } catch {
      /* never let reporting throw */
    }
  });
}
