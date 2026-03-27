# Pharmacy Module (Medicine, Expiry, Prescriptions, POS)

## What & Why
Pharmacy business type-এর জন্য সম্পূর্ণ module। সাধারণ inventory-র পরিবর্তে medicine-specific features: batch tracking, expiry management, prescription logging, এবং quick POS sale। বাংলাদেশের pharmacy দোকানের daily workflow মাথায় রেখে তৈরি।

## Done looks like
- `/medicines` — ওষুধের তালিকা। Columns: brand name, generic, category, stock, expiry status badge (সবুজ/হলুদ/লাল/কালো), price, actions। Add medicine modal-এ extra fields: generic name, manufacturer, category (tablet/syrup/injection/cream/drop), unit, requires prescription toggle, controlled drug toggle। Batch tracking: প্রতিটি medicine-এ multiple batches (batch number, expiry date, quantity)। বিক্রির সময় auto-FIFO deduction।
- `/expiry` — মেয়াদ সতর্কতা dashboard। Filter tabs: মেয়াদ শেষ | ১ মাসের মধ্যে | ৩ মাসের মধ্যে। Table: medicine, batch, expiry date, quantity। "Return to supplier" এবং "Discount করুন" action buttons।
- `/prescriptions` — প্রেসক্রিপশন log। Patient name, doctor, date, medicines sold, prescription photo। "প্রেসক্রিপশন যোগ করুন" button। Sale করার সময় requiresRx medicine detect করলে prescription prompt modal আসে (photo upload / manual entry / skip with warning)।
- `/pos` page-এ pharmacy type detect করলে pharmacy-specific POS দেখায়: medicine name autocomplete search, cart, prescription check on checkout, VAT toggle (7.5% non-essential / 0% essential), receipt print।
- Nav: pharmacy type-এর জন্য "ওষুধ স্টক" → `/medicines` route point করে (lib/modules.ts update)।
- সব UI text বাংলায়। Expiry warning-এ red/amber badges।

## Out of scope
- Auto SMS weekly expiry reminder (SMS integration আলাদা task)
- Bangladesh medicine autocomplete database (manual entry only for now)
- Controlled drug special log report (future work)
- External supplier return tracking

## Tasks
1. **DB Schema** — `prisma/schema.prisma`-এ Medicine, MedicineBatch, Prescription model যোগ করো। Shop ও Customer model-এ relation যোগ করো। `npx prisma db push && npx prisma generate` run করো।

2. **Medicine API** — `app/api/medicines/route.ts` (GET list with expiry info, POST create) এবং `app/api/medicines/[id]/route.ts` (PATCH, DELETE) এবং `app/api/medicines/[id]/batches/route.ts` (GET, POST batch) তৈরি করো। Expiry status calculation server-side।

3. **Prescription API** — `app/api/prescriptions/route.ts` (GET list, POST create) এবং `app/api/prescriptions/[id]/route.ts` (GET detail, PATCH) তৈরি করো।

4. **Expiry API** — `app/api/expiry/route.ts` (GET medicines filtered by expiry range: expired/1month/3months) তৈরি করো।

5. **Medicine Inventory page** — `app/(app)/medicines/page.tsx` তৈরি করো। Medicine list with expiry status badges, batch management modal, add/edit medicine form with all pharmacy-specific fields। Pharmacy nav-এ `/medicines` → "ওষুধ স্টক" route করো (`lib/modules.ts` update)।

6. **Expiry Alert page** — `app/(app)/expiry/page.tsx` তৈরি করো। Filter tabs, expiry table, "Return to supplier" ও "Discount করুন" action buttons।

7. **Prescriptions page** — `app/(app)/prescriptions/page.tsx` তৈরি করো। Prescription list, add prescription modal (patient info + photo upload + medicine link), prescription detail view।

8. **Pharmacy POS** — `app/(app)/pos/page.tsx` তৈরি করো (বা থাকলে pharmacy-specific UI যোগ করো)। Medicine autocomplete search, cart, prescription check modal (requiresRx medicine detect করলে), VAT toggle per item, receipt print।

## Relevant files
- `prisma/schema.prisma`
- `lib/modules.ts`
- `app/(app)/inventory/page.tsx`
- `components/dashboards/DashboardPharmacy.tsx`
