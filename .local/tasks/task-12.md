---
title: Store Analytics Dashboard
---
# BizilCore Store — Analytics Dashboard

## What & Why
Give shop owners visibility into how their storefront is performing — visits, orders, revenue, top products, and conversion rate — so they can make informed decisions about their store.

## Done looks like
- `/dashboard/store/analytics` shows a clean dashboard with: total store visits (last 30 days), total store orders, store revenue, average order value, conversion rate (visits → orders), and top 5 products by store sales
- Visiting any page under `/store/[slug]/` increments a page view counter for that shop (lightweight server action, no third-party tracking)
- Date range picker lets owners view stats for the last 7 days, 30 days, or a custom range
- A simple line chart shows daily visits and orders over the selected period
- Store orders metric is also visible on the main BizilCore dashboard card for shops that have the store enabled

## Out of scope
- Visitor identity / session tracking (privacy-preserving: count only, no cookies)
- Geographic breakdown of visitors
- Product-level view counts
- Export to CSV

## Tasks

1. **Page view tracking** — Add `storeVisits` counter to Shop model (if not added in Task 10) and a `StorePageView` model with `shopId`, `path`, and `visitedAt`. Create a lightweight POST endpoint `/api/store/track-visit` (no auth, rate-limited by IP to prevent inflation) called from the store layout on each navigation.

2. **Analytics API** — Create `GET /api/dashboard/store-analytics` that returns: total visits, total orders, total revenue, average order value, conversion rate, top products (by store order item count), and daily time-series data (visits + orders per day) for the requested date range. Uses `shopId` from the authenticated session.

3. **Analytics page UI** — Build `/dashboard/store/analytics/page.tsx` with stat cards (visits, orders, revenue, AOV, conversion rate), a line chart component for daily trends (use a simple SVG chart or Recharts if already installed), and a top-products table. Include a date range selector (7d / 30d / custom). Add a small "স্টোর" stats row to the main dashboard for shops with `storeEnabled = true`.

## Relevant files
- `prisma/schema.prisma`
- `app/(app)/dashboard/page.tsx`
- `components/dashboards/`
- `app/store/[slug]/layout.tsx`