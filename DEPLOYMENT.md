# BizilCore — fcommerce + POS Production Launch Checklist

This checklist covers the production rollout for the **fcommerce** (online store +
Facebook/Instagram/WhatsApp) and **POS** (retail + restaurant) modules.

> Other verticals (hospital/school/farm etc.) are out of scope for this pass.

---

## 1. Database migrations

```bash
npm run migrate:check   # prisma migrate status — must show no pending drift
npm run migrate:deploy  # apply all migrations (incl. 20260621120000_add_idempotency_key)
```

The Vercel build (`build:vercel`) runs `prisma migrate status` and fails the build
if migrations are pending, so deploy migrations **before** promoting a build.

New tables/indexes in this release:
- `IdempotencyKey` — dedupes offline POS sale replays.

---

## 2. Required environment variables (Vercel → Project → Settings → Environment Variables)

### Core
- `DATABASE_URL`
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — **generate fresh values**, do NOT reuse the dev value in `.env.example`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `NEXTAUTH_URL` — production URL (e.g. `https://app.bizilcore.com`)

### Cron (required — crons fail closed without it)
- `CRON_SECRET` — strong random value:
  ```bash
  node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
  ```

### Rate limiting (serverless-safe)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
  > Without these the limiter falls back to in-memory (per-instance) — fine for dev, ineffective on serverless.

### Error monitoring (optional but recommended)
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
  > If `@sentry/nextjs` is installed and a DSN is set, errors auto-forward; otherwise structured `console.error` logs are emitted.

### Meta (Facebook / Instagram / WhatsApp)
- `META_APP_ID` / `META_APP_SECRET` (or legacy `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`)
- `FACEBOOK_VERIFY_TOKEN` — webhook verify token
- `SOCIAL_TOKEN_ENCRYPTION_KEY` — set explicitly in production (else derived from `AUTH_SECRET`)
- `META_WHATSAPP_CONFIG_ID` — for WhatsApp Embedded Signup

### Payments / SMS / Email / Courier
- `BKASH_*`, `NAGAD_*`, SMS provider keys, `EMAIL_*` / `EMAIL_RESEND_API_KEY`
- Courier creds are stored per-shop in DB (Settings → কুরিয়ার), not env.

---

## 3. Vercel Cron Jobs

`vercel.json` registers (UTC):

| Path | Schedule |
| --- | --- |
| `/api/cron/check-subscriptions` | every 6 hours |
| `/api/cron/referrer-rewards` | daily 02:30 |
| `/api/cron/refresh-social-tokens` | daily 03:00 |
| `/api/cron/daily-backup` | daily 18:00 |

Vercel automatically sends `Authorization: Bearer $CRON_SECRET` to cron paths.

---

## 4. Meta App configuration

1. **Webhook URL** (single canonical endpoint):
   `{NEXTAUTH_URL}/api/webhooks/facebook`
2. **Verify token**: same as `FACEBOOK_VERIFY_TOKEN`.
3. **Subscribe fields**: `feed`, `messages`, `messaging_postbacks`.
4. **App secret**: must match `META_APP_SECRET` — the webhook enforces
   `X-Hub-Signature-256`, so a mismatch rejects all events (401).
5. **OAuth redirect URIs** (whitelist):
   - `{NEXTAUTH_URL}/api/integrations/facebook/callback`
   - `{NEXTAUTH_URL}/api/integrations/whatsapp/callback`

> The legacy duplicate webhooks (`/api/facebook/webhook`, `/api/webhook/facebook`)
> have been removed — only `/api/webhooks/facebook` exists now.

---

## 5. Smoke tests (manual, post-deploy)

- [ ] `GET /api/health` → `{ status: "ok", db: "up" }`
- [ ] Storefront order — COD + manual bKash TxID → order created, merchant email + customer SMS/WhatsApp sent.
- [ ] Cancel a storefront order → stock restored + `StockMovement` row.
- [ ] FB comment with order keyword → `SuggestedOrder` created (verify signature rejects unsigned POST).
- [ ] Retail POS sale (online) → `Order` + `StockMovement` + income `Transaction`; due sale updates customer `dueAmount`.
- [ ] Retail POS sale (offline) → queued, then auto-syncs on reconnect with **no double deduction** (idempotency).
- [ ] Retail barcode scan (USB Enter + camera) adds product; hold/park + resume; thermal receipt prints at 80mm.
- [ ] Retail return → stock restored + refund expense `Transaction`.
- [ ] Restaurant dine-in → KOT → cash payment → `CashDrawerLog` recorded + shift `expectedCash` increments.

---

## 6. Automated tests (money path)

```bash
npm test
```

Covers: retail sale totals/discount clamping, Meta webhook signature verification,
and cron authorization.
