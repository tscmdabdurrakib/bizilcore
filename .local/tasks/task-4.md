---
title: Multi-Vertical: Settings Business Type Switch
---
# Settings: Business Type Switch

## What & Why
ব্যবসার ধরন পরিবর্তন করা দরকার হলে বা ভুলে অন্য type বেছে নিলে settings থেকে সহজে পরিবর্তন করা যাবে। Data সব থাকবে, শুধু active modules ও navigation পরিবর্তন হবে।

## Done looks like
- `/settings` page-এ "Business Type" নামে একটি নতুন section আছে
- Current business type একটি colored badge দিয়ে দেখাচ্ছে
- "Business Type পরিবর্তন করুন" button-এ click করলে ৬টি card সহ একটি modal আসে
- Modal-এ warning message: "পরিবর্তন করলে কিছু menu hide হতে পারে। আপনার সব data সুরক্ষিত থাকবে।"
- নতুন type select করে confirm করলে shop-এর `businessType` ও `activeModules` update হয়, page reload হয়, নতুন sidebar দেখায়
- Cancel করলে কোনো পরিবর্তন হয় না

## Out of scope
- Multi-shop creation (Business plan feature — separate task/future work)
- Shop switcher UI in sidebar (future work)
- Per-module data migration বা cleanup

## Tasks
1. **Settings API** — `app/api/settings/business-type/route.ts` নামে নতুন PATCH endpoint তৈরি করো। Authenticated user-এর shop-এ `businessType` ও `activeModules` update করো। Validation: শুধু valid business type values (fcommerce|restaurant|pharmacy|retail|salon|tailor) accept করো।

2. **Settings UI** — `app/(app)/settings/page.tsx`-এ "Business Type" section যোগ করো। Current type badge, "পরিবর্তন করুন" button, এবং confirmation modal (onboarding-এর মতোই ৬টি card, কিন্তু modal-এর ভেতরে)। Confirm হলে API call করো এবং `window.location.reload()` করো।

## Relevant files
- `app/(app)/settings/page.tsx`
- `app/api/settings/business-type/route.ts`
- `lib/modules.ts`