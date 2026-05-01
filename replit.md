# BizilCore

A SaaS web app for Bangladeshi Facebook sellers — stock management (with product variants/Size/Color), order tracking, customer management, financial reporting, courier integration (Pathao API, RedX API, eCourier API, Paperfly, Delivery Tiger — 5 total), SMS notifications, invoice PDF, barcode/SKU, CSV bulk import, staff management, Excel export, Facebook Page integration (multiple pages), comment-to-order suggestions, subscription/payment (bKash/Nagad), product image upload, in-app notification bell, account settings, super-admin panel, dark mode, activity log, bulk WhatsApp messaging, WhatsApp API (Meta Cloud API) with message history, delivery tracking, return management, supplier detail pages, sales target progress, expense tracker, **invoice management** (card-style list with inline accordion items table, WhatsApp & SMS sending, duplicate, print, overdue detection & bulk-mark, quick-add recent items in create modal, due-date countdown badge, toast notifications), purchase orders (PO), HR management (attendance, shifts), user feedback widget, **COD Reconciliation Dashboard** (courier-grouped COD tracking with remittance dates), **Customer Segments & Smart Campaigns** (auto VIP/New/Active/At-Risk/Dormant segmentation with WhatsApp/SMS bulk campaign send), **Product Profitability & Inventory Intelligence** (per-product margin/velocity/stockout forecasting with PO quick-link), **AI Features** (OpenRouter-powered: product description generation, pricing suggestion, inventory prediction with 6hr cache, sales insight with 1hr cache — all in Bangla, with plan-based daily limits), **Order Slip / Packing Slip Generator** (A5 print/PDF/share with live customization panel, QR code, barcode, shareable public link at `/slip/[orderId]`), **Combo Pack** (bundle multiple products into a combo, sell as one line item, auto-deduct component stock on order, availableStock = min(component stocks ÷ qty), full CRUD + inventory tab + combo picker in new order + all 6 order slip templates show 📦 badge + component sub-list). Full Bangla UI. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, and NextAuth.js v5 beta.

## School / Coaching Center Module (Complete)
- **Business Type**: `"school"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (blue #2563EB), `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `Student`, `Batch`, `FeeRecord`, `AttendanceRecord`, `ExamResult` in `prisma/schema.prisma`; relations added to `Shop` (students, batches, feeRecords, attendanceRecords, examResults + 8 school settings) and `StaffMember` (teachingBatches); pushed with `npx prisma db push`
- **API Routes**: `/api/school/dashboard-stats`, `/api/school/students`, `/api/school/students/[id]`, `/api/school/batches`, `/api/school/batches/[id]`, `/api/school/fees` (GET list + POST bulk generate), `/api/school/fees/[id]` (PATCH collect payment), `/api/school/attendance` (GET + POST upsert), `/api/school/exams` (GET grouped + POST bulk entry), `/api/school/reports`
- **Pages**: `/school/students` (list + Suspense + registration form with 5 sections), `/school/students/[id]` (profile with Fees/Attendance/Exam tabs, TC button), `/school/batches` (card grid with teacher assignment), `/school/fees` (monthly fee table, bulk generate, quick collect modal, progress bar), `/school/attendance` (quick mark view with present/absent/late/leave per student, save all at once), `/school/exams` (grouped result view by exam, inline mark entry with auto grade), `/school/reports` (dedicated analytics)
- **Dashboard**: `DashboardSchool` with 4 stat cards, fee alert banner, quick action grid, batch overview table
- **Features**: Auto reg number (STU-YYYY-NNN), auto receipt number, bulk monthly fee generation per batch, grade auto-calculation (A+/A/A-/B/C/D/F), attendance upsert (unique per student+batch+date), attendance % tracking, fee status (due/partial/paid), guardian info capture, TC (transfer certificate) flow
- **Nav**: Dashboard → শিক্ষার্থী → ব্যাচ → ফি ম্যানেজমেন্ট → উপস্থিতি → পরীক্ষার ফলাফল → শিক্ষক/স্টাফ (/hr) → হিসাব → রিপোর্ট (`/school/reports`)

## Convention Hall / Event Module (Complete)
- **Business Type**: `"convention"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META` (purple #7C3AED), `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `Hall`, `EventPackage`, `HallEvent`, `EventVendor`, `EventPayment` in `prisma/schema.prisma`; relations added to `Shop` (halls, eventPackages, hallEvents) and `Customer` (hallEvents); pushed with `npx prisma db push`
- **API Routes**: `/api/convention/dashboard-stats`, `/api/convention/halls`, `/api/convention/halls/[id]`, `/api/convention/packages`, `/api/convention/packages/[id]`, `/api/convention/events`, `/api/convention/events/[id]`, `/api/convention/events/[id]/payments`, `/api/convention/events/[id]/vendors`, `/api/convention/reports`
- **Pages**: `/convention/halls` (hall management, capacity/amenities/pricing), `/convention/packages` (event package builder with items), `/convention/events` (calendar + list view, multi-step booking form), `/convention/events/[id]` (full detail: status, payments, vendors, auto-checklist), `/convention/reports` (dedicated analytics with monthly charts, hall utilization, event type breakdown, top clients)
- **Dashboard**: `DashboardConvention` component with 4 stat cards, today's events, upcoming bookings, hall availability quick view
- **Features**: Calendar-based booking with conflict detection, event type auto-checklist (wedding/birthday/aqiqa/corporate etc.), advance payment tracking with due calculation, vendor assignment, hall utilization analytics, Bangla UI throughout
- **Nav**: Dashboard → হলের ইভেন্ট (events) → হল ব্যবস্থাপনা (halls) → প্যাকেজ (packages) → কাস্টমার → হিসাব → রিপোর্ট (`/convention/reports`)

## Lab / Diagnostic Center Module (Complete)
- **Business Type**: `"lab"` — added to `BusinessType`, `BUSINESS_TYPES`, `BUSINESS_TYPE_META`, `BUSINESS_MODULES`, `NAV_BY_TYPE` in `lib/modules.ts`
- **DB Models**: `LabTest`, `TestPackage`, `TestPackageItem`, `TestOrder`, `TestOrderItem`, `TestResult` in `prisma/schema.prisma`; lab relations + settings (`labOrderPrefix`, `labAutoSmsReady`, `labPathologistName`, `labRegistrationNo`) added to `Shop`; `testOrders` relation added to `Customer`
- **API Routes**: `/api/lab/tests` (CRUD for test catalog), `/api/lab/packages` (CRUD for test packages), `/api/lab/orders` (create + list orders), `/api/lab/orders/[id]` (PATCH for sample collection, status updates), `/api/lab/results` (GET pending + POST save results + GET by orderNumber), `/api/lab/dashboard` (stats)
- **Pages**: `/lab/tests` (test catalog with category tabs + add test modal + package management), `/lab/testorders` (3-step registration: patient → tests → payment, with token slip print), `/lab/results` (result entry list with inline panel), `/lab/results/[orderNumber]` (printable report with flag coloring)
- **Dashboard**: `DashboardLab` component with 4 stat cards, today's queue table with sample collection actions, home collection list, quick navigation links
- **Features**: Auto-flag (normal/high/low/critical) based on value vs normal range, critical value alerts, auto order number (LAB-YYYY-NNN), home collection support, urgency (normal/urgent), package shortcuts in order form, patient search with new patient creation

## Garage / Auto Service Center Module (Phase 6 — Complete)
- **DB Models**: `Vehicle`, `JobCard`, `JobCardPart`, `JobCardService` added to `prisma/schema.prisma`; `garageJobPrefix` added to `Shop`; `vehicles` relation added to `Customer`; `jobCardParts` added to `Product`
- **API Routes**: `/api/vehicles`, `/api/vehicles/[id]`, `/api/jobcards`, `/api/jobcards/[id]`, `/api/jobcards/[id]/parts`, `/api/jobcards/[id]/services`, `/api/jobcards/[id]/payment`, `/api/jobcards/[id]/deliver`, `/api/garage/dashboard`, `/api/garage/reports`
- **Pages**: `/dashboard` (DashboardGarage), `/jobcards` (kanban + list view, 3-step new job card modal), `/jobcards/[id]` (full detail: status, parts, services, billing, payment, delivery), `/vehicles` (vehicle list with search), `/vehicles/[id]` (vehicle profile + service history)
- **Kanban Board**: 6 columns — received → diagnosing → waiting_parts → repairing → quality_check → ready + delivered filter
- **Job Card Features**: auto job number, priority (normal/urgent/express), mechanic assignment, estimated delivery, complaint shortcuts, service checklist, parts from stock or manual, live bill calculation, advance tracking, payment collection, delivery with mileage out
- **lib/modules.ts**: garage added to all type maps, nav has dashboard/jobcards/vehicles/inventory/customers/hr/hisab/reports

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

## Brand Logo
- Centralized component: `components/BrandLogo.tsx` — used everywhere. Props: `size` (xs/sm/md/lg/xl), `tone` (dark/light), `iconOnly`, `href`, `showTagline`.
- Icon: `public/brand-icon.png` (green rounded-square with stylized "B" symbol — original supplied by user, do not replace with old `/logo.svg`, `/logo-black.svg`, `/logo-white.svg`).
- Wordmark: "BizilCore" rendered in **Sora** font (loaded via `next/font/google` in `app/layout.tsx` as `--font-sora`). The "**C**" of "Core" is highlighted with a green gradient pill (`#0F6E56→#1BAA78` for dark tone, `#1BAA78→#5EECA0` for light tone) with white letter inside, soft glow, slight upward translate.
- Used in: Navbar, Footer, AppSidebar (collapsed = iconOnly), OnboardingWizard, not-found, login, signup, forgot-password. Old `/logo*.svg` images are NOT referenced in app code anymore (kept only for `/logo-email.png` mailer use).

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
- `lib/redx.ts` — RedX API: bookRedxDelivery(), getRedxStatus()
- `lib/steadfast.ts` — Steadfast Courier API: bookSteadfastDelivery(), getSteadfastStatus()
- `app/api/courier/route.ts` — POST (book courier → saves trackingId, sets status=shipped, codStatus=with_courier); GET (refresh status from provider)
- `app/api/webhooks/pathao/route.ts` — POST (receive Pathao status push, update DB)
- Active couriers: Pathao, RedX, Steadfast (eCourier removed)

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

### Courier settings (stored in DB per user):
- PathaoSettings: clientId, clientSecret, username, password, storeId, sandboxMode
- RedxSettings: apiKey
- SteadfastSettings: apiKey, secretKey

### Order model courier fields:
courierName (pathao|redx|steadfast), courierTrackId, courierStatus (booked/picked/transit/delivered/returned), courierBookedAt
codStatus (with_courier/collected/returned) — driven by courier booking

## Phase 6 — Hotel/Guesthouse Module (Complete)
- **DB models**: `Room`, `Booking`, `RoomServiceOrder`, `HousekeepingLog` + Shop hotel config (checkInTime, checkOutTime, lateFee, earlyFee, minAdvancePct, autoHousekeeping)
- **Booking number**: `BK-YYYY-NNN` per shop, generated **inside** `prisma.$transaction` with `@@unique([shopId, bookingNumber])` and P2002 retry (max 5)
- **APIs (all tenant-scoped, all `logActivity`-audited)**:
  - Rooms: `/api/rooms` GET/POST, `/api/rooms/[id]` GET/PATCH/DELETE (delete blocked when active booking)
  - Bookings: `/api/bookings` GET/POST (with conflict re-check inside transaction → 409), `/api/bookings/[id]` GET/PATCH (cancel)
  - Booking actions: `/api/bookings/[id]/check-in|check-out|payment|services` — check-out clamps NaN/negatives, payment blocks on cancelled
  - Hotel: `/api/hotel/availability` GET, `/api/hotel/dashboard-stats` GET
  - Housekeeping: `/api/housekeeping` GET/POST (tenant-scoped staffId), `/api/housekeeping/[id]` PATCH with strict state machine (`pending→in_progress→done`; cancel from pending/in_progress only)
- **Pages**: `/rooms` (grid), `/bookings` (status tabs + 3-step new modal), `/bookings/[id]` (detail with all actions + room service + payment), `/housekeeping` (3-column kanban)
- **Dashboard**: `components/dashboards/DashboardHotel.tsx` — 4 stat cards, room occupancy mini-grid, today activity feed; wired into `app/(app)/dashboard/page.tsx` via `businessType === "hotel"` branch
- **Modules registry**: `hotel` BusinessType added with Bed icon (green), navigation groups, full module list
- **Migrations applied**: `20260426160000_add_hotel_module`, `20260426170000_booking_number_per_shop_unique`
- **Architect-reviewed**: 5 initial findings + 3 follow-ups all resolved (cross-tenant customerId, atomic conflict check, services status guard, NaN/negative input rejection, housekeeping state machine, per-shop bookingNumber uniqueness with race retry)

## Phase 7 — Review & Testimonial System (Growth Feature 5) (Complete)
- **DB models**: `AppReview` (one per user via `userId @unique`, with `improvementNote` for low ratings), `NPSSurvey`
- **Review prompt eligibility** (server + client checks): account >30 days old, totalOrders >= 10, no existing review; localStorage `review_dismissed_until` snoozes 30 days; sessionStorage prevents repeat in-session
- **Review modal**: 5-star with hover/select labels, free-text body, branches on rating — `>=4` shows Play Store CTA, `<=3` shows improvement note prompt
- **NPS banner** (in-page, dismissible): every 90 days from last survey or signup; 0–10 buttons color-coded (red/amber/green); detractor/passive/promoter follow-ups; promoter routes to `/affiliate`
- **APIs**:
  - `/api/reviews` POST (eligibility + race-safe insert via `P2002` → 409), PATCH (improvement note)
  - `/api/reviews/eligibility` GET
  - `/api/nps` POST (90-day cooldown enforced server-side, 429 if too recent), PATCH (reason)
  - `/api/nps/eligibility` GET
  - `/api/admin/reviews` GET (filter: all|pending|approved|onsite), `/api/admin/reviews/[id]` PATCH/DELETE — `isAdmin` guarded
  - `/api/public/testimonials` GET — masked names (first + last initial), max 6, body truncated to 150 chars
- **Pages**:
  - `/admin/reviews` — approve / show-on-site toggle / un-approve / delete with filter tabs (added to admin nav)
  - Marketing landing — `<TestimonialsSection />` RSC inserted before FAQ; auto-hides if zero approved+visible reviews
- **App-shell wiring**: `components/growth/GrowthPrompts.tsx` mounted in `app/(app)/layout.tsx` — defers eligibility checks 1.5s post-mount, renders modal/banner conditionally
- **Migrations**: `20260426180000_add_review_nps`, `20260426190000_app_review_user_unique`
- **Architect-reviewed (PASS)**: server-side eligibility on review submit, server-side NPS cooldown, DB-level uniqueness on AppReview.userId — all critical findings addressed

## Phase 7.1 — Admin "Request Review" feature (Complete)
- **Problem solved**: organic eligibility (30-day account + 10 orders) makes the review modal hard to test/trigger. Admins now have a manual override.
- **DB**: added `User.reviewRequestedAt: DateTime?` (migration `20260426200000_add_review_requested_at`).
- **APIs**:
  - `POST /api/admin/users/[id]/request-review` — atomic `updateMany` with `appReviews: { none: {} }` predicate (no TOCTOU, returns 409 if already reviewed); refuses admin targets
  - `DELETE /api/admin/users/[id]/request-review` — cancel pending request; validates target exists/non-admin
  - `GET /api/admin/users` — now includes `reviewRequestedAt` and `appReviews[0]` (rating, id) per user
- **Eligibility bypass**:
  - `/api/reviews/eligibility` — if `reviewRequestedAt` set + no existing review → eligible (bypasses age/order checks)
  - `POST /api/reviews` — same bypass; on successful submit, clears `reviewRequestedAt` unconditionally inside the same `prisma.$transaction` as the create (race-safe vs concurrent admin requests)
- **UI** (`/admin/users` page):
  - "Request Review" button (blue) on each active user with no review and no pending request
  - "Cancel" button when a request is pending
  - Status badges: "Review request pending" (blue) and "★ Submitted" (yellow) with the submitted star count
- **Architect-PASS** after 2 rounds: all race conditions (admin flag re-targeting reviewed user, transaction atomicity, target validation on DELETE) resolved.
