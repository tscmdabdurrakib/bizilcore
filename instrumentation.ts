export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const CRON_SECRET = process.env.CRON_SECRET ?? "bizilcore-cron";
    const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

    async function runSubscriptionCheck() {
      try {
        const baseUrl = process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : `http://localhost:${process.env.PORT ?? 5000}`;

        const res = await fetch(`${baseUrl}/api/cron/check-subscriptions`, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
        });
        const data = await res.json();
        console.log(`[Cron] Subscription check: ${data.checked} checked, ${data.expired} expired.`);
      } catch (err) {
        console.error("[Cron] Subscription check failed:", err);
      }
    }

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    (async () => {
      await delay(30_000);
      runSubscriptionCheck();
      setInterval(runSubscriptionCheck, INTERVAL_MS);
    })();
  }
}
