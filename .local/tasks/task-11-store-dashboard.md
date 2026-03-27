# BizilCore Store — Dashboard Management

## What & Why
Add "আমার স্টোর" management section to the BizilCore dashboard so shop owners can configure, customize, and operate their public storefront without leaving their dashboard. This covers all store settings, appearance, product visibility, order management, coupons, and customer reviews.

## Done looks like
- "আমার স্টোর" appears in the dashboard sidebar between Inventory and Customers for all business types (since any shop can have a store)
- `/dashboard/store/setup` lets owners enable their store, pick and verify their `storeSlug` URL (live availability check), and preview the live store
- `/dashboard/store/theme` shows all 5 theme cards; selecting one applies it with a live iframe preview; color pickers for primary and accent colors update the preview in real time
- `/dashboard/store/appearance` allows uploading a banner image and logo, setting tagline, about text, and social media links
- `/dashboard/store/products` lists all products with per-product "স্টোরে দেখাবে" and "Featured" toggles, plus bulk show/hide actions
- `/dashboard/store/settings` covers delivery fees (Dhaka/outside), payment methods (COD toggle, bKash number, Nagad number), free shipping threshold, minimum order, stock display toggle, and reviews toggle
- `/dashboard/store/orders` shows all store orders with status, payment, and a detail view with fulfill/cancel actions; store orders also appear in the main `/orders` page with a "স্টোর অর্ডার" badge
- `/dashboard/store/coupons` lets owners create percent or fixed-amount coupons with optional min order, max discount, usage limit, and expiry
- `/dashboard/store/reviews` shows all reviews pending approval; owners can approve or reject; only approved reviews show on the storefront

## Out of scope
- Analytics (Task 12)
- Custom domain routing/SSL (infrastructure-level, future work)
- Store page public routes (Task 10)

## Tasks

1. **Sidebar & navigation** — Add "আমার স্টোর" module entry to `lib/modules.ts` for all verticals with sub-nav links (Setup, Theme, Appearance, Products, Settings, Orders, Coupons, Reviews). Update `AppSidebar.tsx` to render this section.

2. **Store Setup page** — Build `/dashboard/store/setup/page.tsx`: enable/disable store toggle (PATCH `/api/shop`), slug input with real-time availability check (debounced GET `/api/store/check-slug?slug=...`), preview link to the live store, and a getting-started checklist.

3. **Theme & Appearance pages** — Build `/dashboard/store/theme/page.tsx` with 5 clickable theme cards and live color pickers that save to shop. Build `/dashboard/store/appearance/page.tsx` with file upload for banner and logo (POST to `/api/uploads`), tagline/about textarea, and social links inputs. Both pages PATCH shop settings via `/api/shop`.

4. **Products visibility page** — Build `/dashboard/store/products/page.tsx` fetching all shop products and displaying them with two toggles each (`storeVisible`, `storeFeatured`). Add bulk "show all / hide all" action. These toggles need two new boolean fields added to the `Product` model (`storeVisible`, `storeFeatured`) — add to schema and push to DB.

5. **Settings page** — Build `/dashboard/store/settings/page.tsx` with form sections for delivery fees, payment method config, COD/bKash/Nagad toggles and numbers, free shipping threshold, minimum order, stock display, and reviews display. Saves via PATCH `/api/shop`.

6. **Store Orders page** — Build `/dashboard/store/orders/page.tsx` listing `StoreOrder` records for the shop with filters (status, payment method, date). Order detail modal/page with status update (pending→confirmed→packed→shipped→delivered) and cancel action. Update main `/orders` page to show store orders with "স্টোর অর্ডার" badge.

7. **Coupons page** — Build `/dashboard/store/coupons/page.tsx` with coupon list and create/edit form (code, type, value, min order, max discount, max use, expiry). API routes: GET/POST `/api/coupons`, PATCH/DELETE `/api/coupons/[id]`.

8. **Reviews page** — Build `/dashboard/store/reviews/page.tsx` listing all `StoreReview` records for the shop. Approve/reject buttons call PATCH `/api/store/reviews/[id]`. Show rating, reviewer name, product link, comment, and date.

## Relevant files
- `lib/modules.ts`
- `components/AppSidebar.tsx`
- `app/(app)/orders/page.tsx`
- `app/api/shop/route.ts`
- `prisma/schema.prisma`
- `app/(app)/inventory/page.tsx`
