---
title: Restaurant Module (Tables, Menu, Kitchen, Orders)
---
# Restaurant Module (Tables, Menu, Orders, Kitchen)

## What & Why
Restaurant business type-এর জন্য সম্পূর্ণ operational module। টেবিল ব্যবস্থাপনা, menu item management, order flow (dine-in/takeaway/delivery), এবং kitchen display system — এই ৪টি পেজ দিয়ে একটি রেস্তোরাঁ সম্পূর্ণভাবে BizilCore দিয়ে চলতে পারবে।

## Done looks like
- `/tables` — রঙিন floor map দেখায়: Empty (white), Occupied (green), Reserved (amber), Cleaning (gray)। Empty table ক্লিক করলে নতুন অর্ডার নেওয়ার modal আসে। Occupied table ক্লিক করলে চলমান অর্ডার + বিল দেখায়। "টেবিল ব্যবস্থাপনা" দিয়ে table যোগ/edit করা যায় (number, capacity, floor)।
- `/menu` — menu item list with category tabs (সব/মেইন/স্টার্টার/পানীয়/মিষ্টি)। Add/edit form-এ: photo upload, নাম (বাংলা + ইংরেজি), category, price, cost price, prep time, veg toggle, available toggle। "আজকের মেনু" batch on/off toggle।
- `/kitchen` — full-screen Kitchen Display System। প্রতিটি active order কার্ড হিসেবে দেখায়: table number (বড়), items + qty, time elapsed (🔴 if >20 min)। Border color: green (<10min), amber (10-20min), red (>20min)। "প্রস্তুত" button → order status "ready" হয়। Auto-refresh every 30 seconds।
- `/orders` page-এ restaurant business type detect করলে restaurant order flow দেখায়: Step 1 = order type (টেবিলে/নিয়ে যাবে/Delivery), Step 2 = table select (dine-in হলে), Step 3 = menu browser + cart sidebar, Step 4 = confirm।
- সব UI text বাংলায়। Design system green primary থাকবে।

## Out of scope
- Real-time WebSocket (polling দিয়ে করতে হবে)
- Kitchen login-less access / IP whitelist
- Online food ordering (external) integration
- Recipe cost calculator dashboard widget (পরের task)
- Payment gateway for restaurant bills

## Tasks
1. **DB Schema** — `prisma/schema.prisma`-এ Table, MenuItem, RestaurantOrder, RestaurantOrderItem model যোগ করো। Shop model-এ relation যোগ করো। `npx prisma db push && npx prisma generate` run করো।

2. **Table API** — `app/api/tables/route.ts` (GET all, POST create) এবং `app/api/tables/[id]/route.ts` (PATCH status/details, DELETE) তৈরি করো। Auth guard দিয়ে shop-scoped data।

3. **Menu Item API** — `app/api/menu-items/route.ts` (GET all with category filter, POST create) এবং `app/api/menu-items/[id]/route.ts` (PATCH, DELETE) তৈরি করো।

4. **Restaurant Order API** — `app/api/restaurant/orders/route.ts` (GET active orders, POST create) এবং `app/api/restaurant/orders/[id]/route.ts` (PATCH status) তৈরি করো।

5. **Tables page** — `app/(app)/tables/page.tsx` তৈরি করো। Floor map grid, colored status cards, new order modal (menu item picker + cart), table management modal।

6. **Menu Management page** — `app/(app)/menu/page.tsx` তৈরি করো। Category tabs, item list, add/edit modal with all fields, available toggle, photo upload।

7. **Kitchen Display page** — `app/(app)/kitchen/page.tsx` তৈরি করো। Full-screen, 3-column order card grid, time-based border colors, "প্রস্তুত" button, 30-second auto-refresh।

8. **Restaurant Orders flow** — `app/(app)/orders/page.tsx`-এ businessType === "restaurant" detect করে restaurant order flow দেখাও (multi-step: type → table → menu → confirm)। Existing fcommerce order list unchanged।

## Relevant files
- `prisma/schema.prisma`
- `lib/modules.ts`
- `app/(app)/orders/page.tsx`
- `components/AppSidebar.tsx`
- `app/(app)/layout.tsx`