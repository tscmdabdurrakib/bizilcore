# BizilCore

A SaaS web app for Bangladeshi Facebook sellers — stock management (with product variants/Size/Color), order tracking, customer management, financial reporting, courier integration (Pathao API, eCourier API, Steadfast, RedX, Sundarban, Paperfly, CarryBee, Delivery Tiger, Karatoa KCS, Janani Express, Sheba Delivery, SA Paribahan — 12 total), SMS notifications, invoice PDF, barcode/SKU, CSV bulk import, staff management, Excel export, Facebook Page integration (multiple pages), comment-to-order suggestions, subscription/payment (bKash/Nagad), product image upload, in-app notification bell, account settings, super-admin panel, dark mode, activity log, bulk WhatsApp messaging, WhatsApp API (Meta Cloud API) with message history, delivery tracking, return management, supplier detail pages, sales target progress, expense tracker, **invoice management** (card-style list with inline accordion items table, WhatsApp & SMS sending, duplicate, print, overdue detection & bulk-mark, quick-add recent items in create modal, due-date countdown badge, toast notifications), purchase orders (PO), HR management (attendance, shifts), user feedback widget, **COD Reconciliation Dashboard** (courier-grouped COD tracking with remittance dates), **Customer Segments & Smart Campaigns** (auto VIP/New/Active/At-Risk/Dormant segmentation with WhatsApp/SMS bulk campaign send), **Product Profitability & Inventory Intelligence** (per-product margin/velocity/stockout forecasting with PO quick-link), **AI Features** (OpenRouter-powered: product description generation, pricing suggestion, inventory prediction with 6hr cache, sales insight with 1hr cache — all in Bangla, with plan-based daily limits), **Order Slip / Packing Slip Generator** (A5 print/PDF/share with live customization panel, QR code, barcode, shareable public link at `/slip/[orderId]`), **Combo Pack** (bundle multiple products into a combo, sell as one line item, auto-deduct component stock on order, availableStock = min(component stocks ÷ qty), full CRUD + inventory tab + combo picker in new order + all 6 order slip templates show 📦 badge + component sub-list). Full Bangla UI. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, and NextAuth.js v5 beta.

## Restaurant Module (Task #5 — Complete)
- **DB Models**: `DiningTable`, `MenuItem`, `RestaurantOrder`, `RestaurantOrderItem` — all created and pushed
- **API Routes**: `/api/restaurant/tables`, `/api/restaurant/tables/[id]`, `/api/restaurant/menu-items`, `/api/restaurant/menu-items/[id]`, `/api/restaurant/orders`, `/api/restaurant/orders/[id]`
- **Pages**: `/tables` (floor map), `/menu` (menu management), `/kitchen` (KDS), `/orders` (restaurant-aware wrapper)
- **lib/modules.ts**: Added `/menu` nav item + `ScrollText` icon for restaurant type
- **Orders page**: Converted to server component that renders `RestaurantOrders` or `FCommerceOrders` based on `businessType`
- **Components**: `components/orders/FCommerceOrders.tsx` + `components/orders/RestaurantOrders.tsx`

## Sales Channel Feature (Complete)
- `salesChannel` field on Shop (`online` | `offline` | `both`)
- Onboarding step, settings modal, sidebar filtering all implemented
- `lib/modules.ts`: `SALES_CHANNEL_META`, `ONLINE_ONLY_MODULES`, `OFFLINE_ONLY_MODULES`, `isValidSalesChannel()`
- `/api/settings/sales-channel` PATCH route

## Stack
- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (custom tokens via `@theme` in globals.css)
- **Database**: PostgreSQL (Supabase hosted) + Prisma 7 ORM with `@prisma/adapter-pg`
- **Auth**: NextAuth.js v5 (beta) with CredentialsProvider (email + password + bcrypt)
- **Charts**: Recharts
- **Font**: Inter (Google Fonts)
- **Package manager**: npm

## Running the App
```
npm run dev   # starts on port 5000
```
The "Start application" workflow manages this automatically.

## Database (Supabase)
- **Runtime URL**: `SUPABASE_DATABASE_URL` (transaction pooler, port 6543, `pgbouncer=true`)
- **Migration URL**: `SUPABASE_DIRECT_URL` (session pooler, port 5432) — password has `[brackets]` auto-stripped
- Both secrets set in Replit environment. Fallback to local `DATABASE_URL` if Supabase secrets absent.
- Admin user: `mdabdurrakib806@gmail.com` (isAdmin=true)

## Prisma Quirk (v7)
- `url` is NOT in `prisma/schema.prisma` — it lives in `prisma.config.ts`
- `prisma.config.ts` auto-strips `[brackets]` from password in `SUPABASE_DIRECT_URL`
- Client uses `@prisma/adapter-pg` + `Pool`
- After schema changes: `npx prisma db push && npx prisma generate`

## Project Structure
```
app/
  (marketing)/          # Public pages (route group)
    page.tsx            # Home (8 sections: hero, features, trust, etc.)
    features/page.tsx   # Features page
    pricing/page.tsx    # Pricing page
    blog/page.tsx       # Blog listing
    about/page.tsx      # About page
    contact/page.tsx    # Contact page
  (auth)/               # Auth pages (route group)
    login/page.tsx      # /login
    signup/page.tsx     # /signup
    forgot-password/    # /forgot-password
  (app)/                # Authenticated app (route group)
    layout.tsx          # App shell: AppSidebar + AppTopbar
    dashboard/page.tsx  # Stats, bar chart, recent orders, low stock
    inventory/page.tsx  # Product list with search/filter/delete
    inventory/new/page.tsx # Add product form
    orders/page.tsx     # Order list with status filter tabs
    orders/new/page.tsx # Complex order form (customer + products + payment)
    orders/[id]/page.tsx # Order detail + status update + payment
    customers/page.tsx  # Customer list with search
    customers/new/page.tsx # Add customer form
    customers/[id]/page.tsx # Customer profile + order history
    hisab/page.tsx      # Transaction ledger + add income/expense modals
    reports/page.tsx    # Charts (trend, pie, top products) + monthly P&L
    settings/page.tsx   # Tabbed settings (shop profile, subscription, notifications)
  onboarding/page.tsx   # 3-step onboarding wizard
  api/
    auth/[...nextauth]/ # NextAuth handler
    register/           # POST — create user
    onboarding/         # PATCH — complete onboarding
    products/           # GET/POST
    products/[id]/      # PATCH/DELETE
    orders/             # GET/POST
    orders/[id]/        # GET/PATCH (status + payment)
    customers/          # GET/POST
    customers/[id]/     # GET/PATCH
    transactions/       # GET/POST/DELETE
    settings/           # GET/PATCH

lib/
  auth.ts               # NextAuth full config (with Prisma, server only)
  prisma.ts             # Prisma client singleton (adapter-pg)
  getShop.ts            # requireShop() — server-side auth + shop check
  utils.ts              # formatBDT, formatBanglaDate, formatRelativeDate, STATUS_MAP, cn()

components/
  AppSidebar.tsx        # Desktop sidebar + mobile bottom nav (client)
  AppTopbar.tsx         # Top bar with page title + new order button (client)
  SalesBarChart.tsx     # Recharts BarChart for 7-day sales (client)

auth.config.ts          # NextAuth lightweight config for proxy (no Prisma)
proxy.ts                # Route protection middleware (Next.js 16 convention)
prisma/schema.prisma    # 9 models: User, Shop, Product, Customer, Order, OrderItem, Transaction, StaffMember, ActivityLog, Subscription, Payment
```

## Auth Flow
- **Signup** → POST /api/register → auto sign-in → /onboarding
- **Login** → `user.onboarded === true` → /dashboard, else → /onboarding
- **Protected routes**: /dashboard, /inventory, /orders, /customers, /hisab, /reports, /settings, /onboarding

## Design Tokens
- Primary: #0F6E56 | PrimaryLight: #E1F5EE
- Bg: #F7F6F2 | Surface: #FFFFFF | Border: #E8E6DF
- Text: #1A1A18 | Secondary: #5A5A56 | Muted: #A8A69E
- Error: #E24B4A | Warning: #EF9F27 | Info: #2B7CE9
- Input: 40px height, 8px border-radius, focus border #0F6E56

## Environment Variables
- `DATABASE_URL` — Replit managed PostgreSQL (auto-set)
- `AUTH_SECRET` — NextAuth JWT secret (set via Replit secrets)
- `NEXTAUTH_URL` — App URL (set to http://localhost:5000)
- `BKASH_BASE_URL`, `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD` — bKash sandbox/production
- `NAGAD_BASE_URL`, `NAGAD_MERCHANT_ID`, `NAGAD_MERCHANT_PRIVATE_KEY`, `NAGAD_PUBLIC_KEY` — Nagad sandbox/production
- `CRON_SECRET` — Authorization header for /api/cron/check-subscriptions

## Payment + Subscription (Phase 2 Step 4)
- `lib/features.ts` — PLAN_LIMITS map (free/pro/business), canAccessFeature(), isWithinLimit()
- `lib/bkash.ts` — createBkashPayment(), executeBkashPayment(); demo mode fallback when env vars missing
- `lib/nagad.ts` — createNagadPayment(), verifyNagadPayment(); demo mode fallback
- `hooks/useSubscription.ts` — React hook: subscription state, plan, daysLeft, canAccess(), isExpiringSoon
- `app/api/subscription/route.ts` — GET current subscription + payment history; auto-create free sub
- `app/api/payment/bkash/route.ts` — POST create payment + redirect URL
- `app/api/payment/bkash/callback/route.ts` — GET/POST handle bKash callback + activate subscription
- `app/api/payment/nagad/route.ts` — POST create Nagad payment
- `app/api/payment/nagad/callback/route.ts` — GET handle Nagad callback + activate subscription
- `app/api/cron/check-subscriptions/route.ts` — GET daily expiry check (Bearer CRON_SECRET)
- `app/payment/success/page.tsx` — Payment success page with plan details
- `app/payment/cancel/page.tsx` — Payment cancel page

## Upgrade Flow
1. Settings > Subscription tab → "আপগ্রেড করুন"
2. UpgradeModal: Step 1 (plan), Step 2 (duration 1/3/6 months with discounts), Step 3 (bKash/Nagad)
3. POST /api/payment/{method} → redirectUrl (demo) or gateway URL
4. Callback → activateSubscription() → upsert Subscription, complete Payment
5. Redirect to /payment/success?paymentId=...&demo=1 → activate via POST to callback
- In demo mode (no gateway keys): auto-activates subscription for testing

## Status Map (Order)
pending → confirmed → shipped → delivered | returned
All labels shown in Bangla UI via STATUS_MAP in lib/utils.ts

## Courier Integration (Phase 2 Step 1)
- `lib/pathao.ts` — Pathao Merchant API: bookPathaoDelivery(), getPathaoStatus(); token caching
- `lib/ecourier.ts` — eCourier API: bookEcourierDelivery(), getEcourierStatus()
- `app/api/courier/route.ts` — POST (book courier → saves trackingId, sets status=shipped, codStatus=with_courier); GET (refresh status from provider)
- `app/api/webhooks/pathao/route.ts` — POST (receive Pathao status push, update DB)
- `app/api/webhooks/ecourier/route.ts` — POST (receive eCourier status push, update DB)

## Task #10 — Store Foundation & Public Storefront (Complete)
- **Multi-tenant e-commerce storefront**: `/store/[slug]` — public, no auth required
- **Theme system**: Full layout-level theme system in `lib/themes/index.ts` with `ThemeConfig` type. 5 themes: bold, elegant, fresh, minimal, vibrant — each with distinct navStyle, heroStyle, productCardStyle, footerStyle, typography, colors, sectionOrder. `StoreThemeProvider` exposes `{ theme, primary, accent, defaults }` via `useStoreTheme()`.
- **Store pages**: home (hero/categories/featured/all), products list (search/filter/sort), product detail (variants/gallery/reviews), cart (qty/remove/coupon), checkout (name/address/district/payment), order-success, track
- **Dynamic store components**: `DynamicNav` (topbar_logo_left/topbar_centered/minimal_sticky), `DynamicHero` (fullwidth_image/split_text_image/banner_slider/text_only_centered), `DynamicProductCard` (image_overlay/borderless/shadow_card/outlined). Theme selector page at `app/(app)/store/theme/page.tsx` with SVG mockup previews.
- **Zustand cart**: `lib/store/cart.ts` — persisted, auto-clears on shop change
- **Bangladesh shipping**: `lib/store/bangladesh.ts` — Dhaka metro vs outside district logic
- **Public API routes**: `/api/store/[slug]`, `/api/store/[slug]/products`, `/api/store/[slug]/products/[id]`, `/api/store/orders` (POST, creates StoreOrder + SMS), `/api/store/validate-coupon` (POST), `/api/store/track` (GET)
- **DB models**: `StoreOrder`, `StoreOrderItem`, `StoreReview`, `Coupon` — all in schema + pushed
- **Shop store fields**: 22 fields added to Shop (storeSlug @unique, storeEnabled, storeTheme, storePrimaryColor, storeAccentColor, storeBannerUrl, storeTagline, storeAbout, storeShowReviews, storeShowStock, storeCODEnabled, storeBkashNumber, storeNagadNumber, storeMinOrder, storeFreeShipping, storeShippingFee, storeSocialFB, storeSocialIG, storeSocialWA)
- **Product store fields**: `storeVisible`, `storeFeatured` on Product model

### Courier env vars needed:
PATHAO_CLIENT_ID, PATHAO_CLIENT_SECRET, PATHAO_BASE_URL, PATHAO_USERNAME, PATHAO_PASSWORD, PATHAO_STORE_ID
ECOURIER_API_KEY, ECOURIER_API_SECRET, ECOURIER_USER_ID, ECOURIER_PICKUP_ADDRESS

### Order model courier fields:
courierName (pathao|ecourier), courierTrackId, courierStatus (booked/picked/transit/delivered/returned), courierBookedAt
codStatus (with_courier/collected/returned) — already existed, now driven by courier booking
