export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const CRON_SECRET = process.env.CRON_SECRET ?? "bizilcore-cron";
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    function getBaseUrl() {
      return process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `http://localhost:${process.env.PORT ?? 5000}`;
    }

    async function runSubscriptionCheck() {
      try {
        const res = await fetch(`${getBaseUrl()}/api/cron/check-subscriptions`, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        });
        const data = await res.json();
        console.log(`[Cron] Subscription check: ${data.checked} checked, ${data.expired} expired.`);
      } catch (err) {
        console.error("[Cron] Subscription check failed:", err);
      }
    }

    async function runDailyBackup() {
      try {
        const res = await fetch(`${getBaseUrl()}/api/cron/daily-backup`, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        });
        const data = await res.json();
        if (data.success) {
          console.log(`[Cron] Daily backup created: ${data.filename}`);
        } else {
          console.error(`[Cron] Daily backup failed:`, data.error);
        }
      } catch (err) {
        console.error("[Cron] Daily backup failed:", err);
      }
    }

    (async () => {
      await delay(30_000);

      // Subscription check — every 6 hours
      runSubscriptionCheck();
      setInterval(runSubscriptionCheck, 6 * 60 * 60 * 1000);

      // Daily backup — every 24 hours (first run after 1 hour of startup)
      await delay(60 * 60 * 1000);
      runDailyBackup();
      setInterval(runDailyBackup, 24 * 60 * 60 * 1000);
    })();
  }
}
