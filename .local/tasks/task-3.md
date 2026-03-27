---
title: Multi-Vertical: Dynamic Sidebar & Dashboards
---
# Dynamic Sidebar & Business-Type Dashboards

## What & Why
Sidebar navigation এখন সবার জন্য একই। এই task-এ sidebar fully dynamic হবে — user-এর businessType দেখে সঠিক nav items দেখাবে। একই সাথে dashboard-ও dynamic হবে: restaurant, pharmacy, retail, salon, tailor — প্রতিটির জন্য আলাদা dashboard widget set তৈরি হবে।

## Done looks like
- F-Commerce user: বর্তমান nav ও dashboard অপরিবর্তিত থাকে
- Restaurant user: সাইডবারে টেবিল, মেনু, কিচেন, স্টাফ দেখায়; dashboard-এ আজকের বিক্রি, খোলা টেবিল, pending orders, active table map দেখায়
- Pharmacy user: সাইডবারে ওষুধ স্টক, প্রেসক্রিপশন, মেয়াদ সতর্কতা দেখায়; dashboard-এ expiry alert list দেখায়
- Retail user: সাইডবারে "দ্রুত বিক্রয় (POS)" prominent button দেখায়; dashboard-এ quick POS shortcut আছে
- Salon user: সাইডবারে অ্যাপয়েন্টমেন্ট, সার্ভিস, স্টাফ দেখায়; dashboard-এ আজকের appointment timeline দেখায়
- Tailor user: সাইডবারে অর্ডার, মাপজোখ, কাপড় স্টক দেখায়; dashboard-এ "আজ Delivery দিতে হবে" list দেখায়
- `app/(app)/layout.tsx` shop-এর `businessType` fetch করে sidebar-এ pass করে
- Mobile bottom nav ও "More" menu-ও businessType অনুযায়ী সঠিক items দেখায়

## Out of scope
- Business-type specific module pages তৈরি করা (restaurant POS, pharmacy prescription management ইত্যাদি — এগুলো future work)
- Dashboard widget-এর real data সংযোগ: restaurant table map, salon appointment timeline, pharmacy expiry list — এগুলো placeholder/mock data দিয়ে তৈরি হবে যা পরে real API দিয়ে replace হবে
- Settings থেকে business type পরিবর্তন (অন্য task)

## Tasks
1. **Layout update** — `app/(app)/layout.tsx`-এ shop fetch করার সময় `businessType` include করো এবং `AppSidebar`-এ prop হিসেবে pass করো।

2. **Dynamic sidebar** — `AppSidebar.tsx` refactor করো। `businessType` prop নাও, `getNavItems(businessType)` call করো `lib/modules.ts` থেকে, এবং সেই items দিয়ে nav render করো। Mobile bottom nav ও "More" menu-ও dynamic করো। Existing fcommerce users-এর জন্য কোনো পরিবর্তন হবে না।

3. **Dashboard routing** — `app/(app)/dashboard/page.tsx`-এ businessType fetch করো এবং conditionally আলাদা component render করো: `DashboardFCommerce` (existing), `DashboardRestaurant`, `DashboardPharmacy`, `DashboardRetail`, `DashboardSalon`, `DashboardTailor`।

4. **Restaurant dashboard** — `components/dashboards/DashboardRestaurant.tsx` তৈরি করো। আজকের বিক্রি, খোলা/বন্ধ টেবিল count, pending orders, আজকের লাভ stat cards। নিচে একটি simple table grid map যেখানে কোন টেবিল occupied/free দেখায় (mock data)।

5. **Pharmacy dashboard** — `components/dashboards/DashboardPharmacy.tsx` তৈরি করো। আজকের বিক্রি, মেয়াদ শেষের সতর্কতা count, কম স্টক count, লাভ। নিচে "৭ দিনের মধ্যে মেয়াদ শেষ" product list (mock data দিয়ে শুরু)।

6. **Retail dashboard** — `components/dashboards/DashboardRetail.tsx` তৈরি করো। আজকের বিক্রি, মোট লেনদেন, কম স্টক, লাভ stats। একটি বড় "দ্রুত বিক্রয় শুরু করুন (POS)" CTA button prominent-ভাবে।

7. **Salon dashboard** — `components/dashboards/DashboardSalon.tsx` তৈরি করো। আজকের appointment count, আজকের আয়, walk-in count, লাভ। নিচে আজকের appointment timeline (সময়ের তালিকা, mock data)।

8. **Tailor dashboard** — `components/dashboards/DashboardTailor.tsx` তৈরি করো। চলমান অর্ডার, আজ delivery, বাকি কাপড়, আয়। নিচে "আজ Delivery দিতে হবে" order list (mock data)।

## Relevant files
- `app/(app)/layout.tsx`
- `components/AppSidebar.tsx`
- `app/(app)/dashboard/page.tsx`
- `lib/modules.ts`