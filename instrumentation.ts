export async function onRequestError(
  err: unknown,
  request: { path?: string; method?: string },
) {
  const { captureError } = await import("@/lib/observability");
  captureError(err, { path: request?.path, method: request?.method, source: "onRequestError" });
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const shouldRunLocalCron =
      process.env.ENABLE_INSTRUMENTATION_CRON === "true" ||
      !!process.env.REPLIT_DEV_DOMAIN;

    if (!shouldRunLocalCron) return;

    const CRON_SECRET = process.env.CRON_SECRET ?? "bizilcore-cron-dev-only";
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    function getBaseUrl() {
      return process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `http://localhost:${process.env.PORT ?? 5000}`;
    }

    async function parseCronResponse(res: Response) {
      const text = await res.text();
      if (!text) return { data: null as Record<string, unknown> | null, text: "" };
      try {
        return { data: JSON.parse(text) as Record<string, unknown>, text };
      } catch {
        return { data: null, text };
      }
    }

    async function runSubscriptionCheck() {
      try {
        const res = await fetch(`${getBaseUrl()}/api/cron/check-subscriptions`, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        });
        const { data, text } = await parseCronResponse(res);
        if (!res.ok) {
          const detail =
            (data?.error as string) ||
            (data?.message as string) ||
            text ||
            res.statusText;
          console.error(`[Cron] Subscription check HTTP ${res.status}: ${detail}`);
          return;
        }
        console.log(
          `[Cron] Subscription check: ${data?.subscriptionsExpired ?? 0} expired, ${data?.referrerRewarded ?? 0} referrer rewards.`
        );
      } catch (err) {
        console.error("[Cron] Subscription check failed:", err);
      }
    }

    async function runDailyBackup() {
      try {
        const res = await fetch(`${getBaseUrl()}/api/cron/daily-backup`, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        });
        const { data, text } = await parseCronResponse(res);
        if (!res.ok) {
          const detail =
            (data?.error as string) ||
            (data?.message as string) ||
            text ||
            res.statusText;
          console.error(`[Cron] Daily backup HTTP ${res.status}: ${detail}`);
          return;
        }
        if (data?.success) {
          console.log(`[Cron] Daily backup created: ${data.filename}`);
        } else {
          console.error(`[Cron] Daily backup failed:`, data?.error ?? text);
        }
      } catch (err) {
        console.error("[Cron] Daily backup failed:", err);
      }
    }

    async function runRefreshSocialTokens() {
      try {
        const res = await fetch(`${getBaseUrl()}/api/cron/refresh-social-tokens`, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        });
        const { data, text } = await parseCronResponse(res);
        if (!res.ok) {
          const detail = (data?.error as string) || (data?.message as string) || text || res.statusText;
          console.error(`[Cron] Social token refresh HTTP ${res.status}: ${detail}`);
          return;
        }
        console.log(`[Cron] Social token refresh: ${data?.refreshed ?? 0} refreshed, ${data?.expired ?? 0} expired.`);
      } catch (err) {
        console.error("[Cron] Social token refresh failed:", err);
      }
    }

    (async () => {
      await delay(30_000);

      // Subscription check — every 6 hours
      runSubscriptionCheck();
      setInterval(runSubscriptionCheck, 6 * 60 * 60 * 1000);

      // Social token refresh — every 24 hours
      runRefreshSocialTokens();
      setInterval(runRefreshSocialTokens, 24 * 60 * 60 * 1000);

      // Daily backup — every 24 hours (first run after 1 hour of startup)
      await delay(60 * 60 * 1000);
      runDailyBackup();
      setInterval(runDailyBackup, 24 * 60 * 60 * 1000);
    })();
  }
}
