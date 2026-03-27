---
title: Multi-Vertical: Onboarding Business Type Selection
---
# Onboarding Business Type Selection UI

## What & Why
নতুন user sign up করার সময় সবার আগে business type বেছে নেওয়ার option দেওয়া হবে। এই step টি existing step 1 (shop info) এর আগে আসবে। ৬টি business type card সুন্দর grid-এ দেখাবে যাতে user নিজের ব্যবসার ধরন বুঝে সঠিকটা বেছে নিতে পারে।

## Done looks like
- Onboarding শুরু হলে সবার আগে ৬টি business type card দেখায় (2×3 grid)
- প্রতিটি card-এ colored icon, Bangla নাম, এবং ছোট বাংলা description আছে:
  - F-Commerce: "Facebook / online এ পণ্য বেচি"
  - রেস্তোরাঁ: "খাবারের ব্যবসা করি"
  - ফার্মেসি: "ওষুধের দোকান চালাই"
  - রিটেইল দোকান: "মুদি / কাপড় / অন্য দোকান"
  - সেলুন / পার্লার: "Beauty / grooming service দিই"
  - দর্জি / বুটিক: "কাপড় বানাই / সেলাই করি"
- একটি card select করলে সেটি green border দিয়ে highlight হয়
- "পরবর্তী ধাপ" button click করলে shop info step-এ যায়
- Onboarding শেষ হলে নির্বাচিত businessType সহ shop তৈরি হয়
- Existing users যারা আগেই onboarding করেছেন তাদের জন্য কিছু ভাঙবে না (তাদের businessType default "fcommerce" থাকবে)

## Out of scope
- Business type-এর উপর ভিত্তি করে sidebar বা dashboard পরিবর্তন করা (অন্য task)
- Business type-specific module UI তৈরি করা (অন্য task)

## Tasks
1. **Business type step যোগ করো** — `OnboardingWizard.tsx`-এ নতুন step 0 হিসেবে business type selection যোগ করো। Step numbering shift হবে (আগের step 1 → step 2, step 2 → step 3)। ৬টি card তৈরি করো সঠিক Bangla text, icon, এবং color দিয়ে। Card select করলে state-এ businessType save হবে।

2. **State ও flow আপডেট** — Onboarding wizard-এর local state-এ `businessType` যোগ করো। Step 0 complete হলে (একটি card selected থাকলে) "পরবর্তী ধাপ" button active হবে। Step 1 (shop info) তৈরির সময় businessType state API-তে পাঠানো হবে।

3. **API call update** — Onboarding wizard থেকে PATCH `/api/onboarding` call করার সময় `businessType` field include করো। Server এটি shop-এ save করবে এবং সেই অনুযায়ী `activeModules` set করবে।

## Relevant files
- `components/OnboardingWizard.tsx`
- `app/api/onboarding/route.ts`
- `app/onboarding/page.tsx`