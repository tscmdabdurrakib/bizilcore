# Multi-Vertical DB Foundation & Module Helper

## What & Why
BizilCore এখন শুধু f-commerce seller-দের জন্য। এই task-এ database-এ business type support যোগ করা হবে এবং একটি central helper তৈরি হবে যার উপর পরবর্তী সব feature নির্ভর করবে। Shop model-এ `businessType`, `businessConfig`, `activeModules` field যোগ হবে।

## Done looks like
- `prisma/schema.prisma`-এ Shop model-এ `businessType` (default: "fcommerce"), `businessConfig` (Json?), `activeModules` (String[]) field আছে
- `lib/modules.ts` helper file তৈরি — `getModules(type)`, `hasModule(type, module)`, `getNavItems(type)` function কাজ করছে
- `npx prisma db push` সফলভাবে run হয়েছে, existing shop data ভাঙেনি
- Onboarding API (`PATCH /api/onboarding`) businessType এবং activeModules সঠিকভাবে save করে

## Out of scope
- কোনো UI পরিবর্তন এই task-এ নেই
- Sidebar বা Dashboard dynamic করা এই task-এ নেই

## Tasks
1. **Schema update** — `prisma/schema.prisma`-এ Shop model-এ তিনটি নতুন field যোগ করো: `businessType String @default("fcommerce")`, `businessConfig Json?`, `activeModules String[]`. তারপর `npx prisma db push` run করো।

2. **Module helper তৈরি** — `lib/modules.ts` নামে নতুন file তৈরি করো। প্রতিটি business type-এর জন্য active module list define করো (fcommerce, restaurant, pharmacy, retail, salon, tailor)। `getModules()`, `hasModule()`, `getNavItems()` — তিনটি function export করো। `getNavItems()` প্রতিটি business type-এর জন্য সঠিক Bangla label, route, এবং lucide icon সহ nav items array return করবে।

3. **Onboarding API update** — `app/api/onboarding/route.ts`-এ PATCH handler update করো যাতে step 1 এ `businessType` receive করতে পারে এবং shop create/update করার সময় `businessType` ও `activeModules` (from getModules()) সঠিকভাবে save হয়।

## Relevant files
- `prisma/schema.prisma:81-131`
- `app/api/onboarding/route.ts`
- `lib/modules.ts`
