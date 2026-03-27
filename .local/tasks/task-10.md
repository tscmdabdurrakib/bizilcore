---
title: Store Foundation & Public Storefront
---
# BizilCore Store — Foundation & Public Storefront

## What & Why
Add a fully-featured public e-commerce storefront to BizilCore. Every shop owner gets their own store at `/store/[slug]` — a mobile-first, theme-able site where customers can browse products, add to cart, and place orders. This is the customer-facing half of the Store feature.

## Done looks like
- Visiting `/store/[slug]` shows a live storefront with the shop's products, banner, and branding
- Customers can browse products, filter by category, view product detail with variant selection, add items to cart, and complete checkout with COD / bKash / Nagad
- After checkout, customers see a success page with their order number and can track their order at `/store/[slug]/track`
- The storefront theme (one of 5) is applied based on the shop's `storeTheme` setting; primary/accent colors can be overridden
- Cart state persists across page navigations (Zustand + localStorage); cart clears if shop changes
- Each store page has proper Bangla SEO metadata (title, description, OG image)
- Placing a store order sends SMS to both shop owner and customer (via existing SMS infrastructure)
- A new StoreOrder in DB also auto-creates a corresponding Order in BizilCore's main orders table so it appears in the dashboard

## Out of scope
- Dashboard management pages for the store (Task 11)
- Store analytics / page view tracking (Task 12)
- Custom domain support (future work)
- Review submission UI on product detail page (reviews display only; submission deferred to Task 11)

## Tasks

1. **DB schema additions** — Add 22 new fields to the Shop model (`storeSlug`, `storeEnabled`, `storeTheme`, `storePrimaryColor`, `storeAccentColor`, `storeBannerUrl`, `storeTagline`, `storeAbout`, `storeShowReviews`, `storeShowStock`, `storeCODEnabled`, `storeBkashNumber`, `storeNagadNumber`, `storeMinOrder`, `storeFreeShipping`, `storeShippingFee`, `storeCustomDomain`, `storeSocialFB`, `storeSocialIG`, `storeSocialWA`, `storeVisits` for basic analytics). Add 4 new models: `StoreOrder` (with `StoreOrderItem` relation), `StoreReview`, and `Coupon`. Run `prisma db push && prisma generate`.

2. **Theme system** — Create `/themes/` folder with 5 theme config files (elegant, vibrant, minimal, bold, classic). Each exports a `ThemeConfig` object with nav/hero/product card style, font choices, border radius, and default color palette. Create `components/store/ThemeProvider.tsx` that injects CSS variables and applies the theme class to the store layout.

3. **Store layout & Zustand cart** — Create `app/store/[slug]/layout.tsx` as a server component that fetches shop data by slug, checks `storeEnabled`, applies `ThemeProvider`, and renders `StoreNavbar` and `StoreFooter`. Create `lib/store/cart.ts` with a Zustand store (persist middleware) for cart items; cart auto-clears on slug change.

4. **Store home page** — Build `app/store/[slug]/page.tsx` with all sections: navbar, hero banner (auto-generated gradient fallback if no banner), horizontal category filter pills, featured products grid, full products grid with sort (newest/price asc/price desc), about section, and footer. Use skeleton loaders while data fetches.

5. **Product list & detail pages** — Create `app/store/[slug]/products/page.tsx` with category filter sidebar (mobile: bottom sheet), price range filter, and grid/list toggle. Create `app/store/[slug]/products/[productId]/page.tsx` with image gallery, variant selectors (size/color circles), quantity input, "কার্টে যোগ করুন" and "এখনই কিনুন" buttons, product description, and approved reviews section.

6. **Cart page** — Create `app/store/[slug]/cart/page.tsx` showing cart items with quantity controls and remove, coupon input with `/api/store/validate-coupon` call, order summary (subtotal, shipping, discount, total), and "চেকআউট করুন" button.

7. **Checkout page** — Create `app/store/[slug]/checkout/page.tsx` as a single-page checkout: customer info fields, district/upazila dropdowns (with auto shipping fee update: ৳60 Dhaka / ৳120 outside), payment method radio (COD / bKash / Nagad — shown conditionally), order note, and sticky order summary. On submit, POST to `/api/store/orders` which creates `StoreOrder` + `Order` (main dashboard) in a DB transaction, then sends SMS to shop owner and customer.

8. **Order success & tracking pages** — Create `app/store/[slug]/order-success/page.tsx` with animated checkmark, order number, and navigation links. Create `app/store/[slug]/track/page.tsx` with phone + order number inputs and a timeline view of order status stages.

9. **Store public API routes** — Create route handlers: `GET /api/store/[slug]` (shop info), `GET /api/store/[slug]/products` (product list with filters), `GET /api/store/[slug]/products/[id]` (product detail + variants + approved reviews), `POST /api/store/orders` (create order, transaction-safe), `POST /api/store/validate-coupon` (coupon validation), `GET /api/store/track` (order tracking by phone + order number). All routes are public (no auth required).

## Relevant files
- `prisma/schema.prisma`
- `app/(catalog)/s/[slug]/layout.tsx`
- `app/(catalog)/s/[slug]/page.tsx`
- `lib/sms.ts`
- `lib/prisma.ts`
- `lib/modules.ts`
- `lib/theme.ts`
- `components/AppSidebar.tsx`