# Public Shop Catalog Page

## What & Why
Facebook sellers constantly share product images and prices manually one by one. This feature gives every shop a public shareable URL (e.g. `/s/[shopSlug]`) where customers can browse all products, see prices, and click to WhatsApp/Facebook Message the seller to place an order. The seller just shares one link. This is the single most-requested feature for Facebook commerce sellers in Bangladesh.

## Done looks like
- Each shop gets a unique public slug (auto-generated from shop name on onboarding, editable in Settings).
- `/s/[slug]` is a fully public (no login required) page showing:
  - Shop logo, name, tagline, contact button (WhatsApp/phone).
  - Product grid with product image, name, price (sell price). Out-of-stock products are dimmed with a "স্টক নেই" badge.
  - Search bar to filter products by name.
  - Category filter tabs if the shop has multiple product categories.
  - Clicking a product opens a simple detail modal with image, description, price, and a "অর্ডার করুন" button that opens WhatsApp with a pre-filled message like "আমি [Product Name] কিনতে চাই".
- Settings tab "ক্যাটালগ" allows the seller to: toggle catalog visibility (public/hidden), edit the shop slug (with uniqueness validation), write a custom tagline/bio (max 200 chars), and choose which products appear (show all / show in-stock only).
- The shop's catalog link is shown prominently in the Settings catalog tab with a one-click copy button and a QR code image.
- The catalog page is SEO-friendly with proper meta title/description using the shop name.

## Out of scope
- Customer account / checkout / payment on the catalog page (future: full e-commerce)
- Custom domain support (future)
- Analytics on catalog views (future)
- Video products

## Tasks
1. **Schema + slug migration** — Add `slug` (unique), `catalogEnabled` (bool, default true), `catalogTagline` (String?) to the Shop model. Run migration. Auto-generate slug from shop name during onboarding if not set.

2. **Public catalog API** — Create `GET /api/catalog/[slug]` (no auth) that returns shop info + all enabled, visible products (with image, name, sellPrice, stockQty, category). Returns 404 if shop not found or catalog disabled.

3. **Public catalog page** — Build `app/(catalog)/s/[slug]/page.tsx` as a server-rendered public page with product grid, search, category filters, product detail modal, and WhatsApp order button. Use brand green palette, mobile-first layout.

4. **Settings catalog tab** — Add a "ক্যাটালগ" tab to `app/(app)/settings/page.tsx` with slug editor (uniqueness check via API), tagline field, visibility toggle, stock filter toggle, shareable link with copy button, and a rendered QR code (using `qrcode` npm package).

## Relevant files
- `prisma/schema.prisma`
- `app/(app)/settings/page.tsx`
- `app/api/settings/route.ts`
- `app/(app)/inventory/page.tsx`
