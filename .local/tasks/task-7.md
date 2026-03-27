---
title: Retail POS Module (POS, Cash Register, Offline Mode)
---
# Retail POS Module

## What & Why
Build a full-screen POS interface and cash register for retail/grocery business type. Retail sellers need a fast touchscreen-friendly checkout flow — product grid, cart, multiple payment methods, and a daily cash register open/close — distinct from the existing pharmacy POS which is medicine-specific. Offline mode (IndexedDB via Dexie.js) ensures POS works even during internet outages.

## Done looks like
- `/pos` shows the pharmacy POS for pharmacy accounts and the new retail POS for retail accounts (business-type gated).
- Retail POS has a left product grid with category tabs + search, and a right cart with qty controls, discount, VAT, and four payment buttons (নগদ / bKash / Card / বাকি).
- Completing a sale records a Transaction (reusing existing model) and shows a printable receipt.
- "Cash Register খুলুন" / "বন্ধ করুন" buttons appear in a `/cash-register` page: entering opening cash at day start, closing cash at day end, with a surplus/shortage summary.
- A daily CashRegister row is created/stored in the DB on each open/close event.
- "Offline Mode" banner appears when internet is lost; the product catalogue and sale flow continue to work using IndexedDB; queued sales sync automatically when connectivity returns.

## Out of scope
- SMS receipt delivery (future).
- Barcode USB scanner hardware integration (camera-based only, future).
- Cash register for non-retail business types.

## Tasks
1. **CashRegister DB model** — Add a `CashRegister` model to `prisma/schema.prisma` with fields: shopId, date, openingCash, closingCash (nullable), expectedCash, difference, status ("open"|"closed"). Run `npx prisma db push && npx prisma generate`.

2. **Retail POS API** — Create `/api/pos/sale` (POST) that validates cart items against Product stock (using existing Product/ProductVariant models), deducts stock, and creates a Transaction record. Scope to shop ownership. Create `/api/cash-register` (GET/POST for open, PATCH for close) returning today's register summary.

3. **Retail POS page** — Update `/pos/page.tsx` to detect `businessType` from `/api/settings` and render the retail POS for retail accounts. Retail POS: left panel = product grid (category tabs + search, fetches `/api/products`), right panel = cart (qty controls, customer search, ৳/% discount field, VAT toggle, grand total), four payment buttons, "বিল করুন" → POST to `/api/pos/sale` → printable receipt modal with browser print API.

4. **Cash Register page** — Create `/cash-register/page.tsx`: "Cash Register খুলুন" opens with an opening cash input; "Cash Register বন্ধ করুন" shows opening + sales cash − expenses = expected closing with a difference badge (green surplus / red shortage). Wire to `/api/cash-register`. Add nav entry for retail in `lib/modules.ts`.

5. **Offline mode** — Install Dexie.js, sync product catalogue to IndexedDB on retail POS page load, show "Offline Mode" banner on `navigator.onLine === false`, read products from IndexedDB when offline, queue sales to IndexedDB when offline, flush queue to `/api/pos/sale` when connectivity restores (conflict resolution: server stock wins).

## Relevant files
- `app/(app)/pos/page.tsx`
- `prisma/schema.prisma`
- `lib/modules.ts`
- `app/api/settings/route.ts`
- `app/api/products/route.ts`