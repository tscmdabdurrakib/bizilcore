# Tailor / Boutique Module

## What & Why
Implement the tailor business type module: customer measurements, order pipeline with status tracking, and a delivery calendar. Tailor shops need to capture garment measurements per customer, manage orders through cutting → stitching → finishing → ready → delivered stages, and see which orders are due for delivery on any given day.

## Done looks like
- `/measurements` page shows all customers with a measurement card per customer. Clicking a customer opens a full measurement form (chest, waist, hip, shoulder, sleeve, length, neck, inseam in inches + freeform notes). "শেষ আপডেট" date is shown. Measurements are editable.
- Customer profile page gains a "মাপজোখ" tab that shows/edits that customer's measurement card inline.
- `/orders` page (tailor variant) has a "নতুন অর্ডার" form: customer picker (auto-loads saved measurements), description field with quick-template buttons (সালোয়ার কামিজ / শাড়ি ব্লাউজ / পাঞ্জাবি / শার্ট / প্যান্ট), fabric source toggle (Customer এনেছে / আমাদের কাপড়), style reference photo URL, measurement snapshot, delivery date picker, total/advance/due fields, "অর্ডার নিন" button.
- Order cards display a status pipeline badge (কাপড় পেয়েছি → কাটা হচ্ছে → সেলাই হচ্ছে → ফিনিশিং → রেডি → দেওয়া হয়েছে) with a "পরবর্তী ধাপ" advance button. On reaching "রেডি", an SMS is sent: "আপনার [description] তৈরি হয়ে গেছে। যেকোনো দিন নিয়ে যেতে পারেন। - [ShopName]"
- `/delivery` page (tailor variant, separate from the courier delivery page) shows a calendar/list of orders grouped by delivery date with color-coded urgency: red=overdue, amber=today, yellow=tomorrow, gray=future. Dashboard shows an "আজ Deliver করতে হবে" widget with today's count.
- Business type gate: tailor-specific pages are only accessible when `businessType === "tailor"`.

## Out of scope
- Fabric inventory linkage for "আমাদের কাপড়" option (reads from existing inventory but does not deduct stock automatically in this task).
- Actual image file upload for style reference (URL input only, same pattern as pharmacy prescriptions).
- Measurement history versioning (only latest measurement stored per customer).

## Tasks
1. **DB schema** — Add `Measurement` (customerId→Customer, shopId→Shop, optional Float fields for all measurements, notes, updatedAt) and `TailorOrder` (shopId, customerId→Customer, description, fabricSource, fabricDetails, measurements Json snapshot, advanceAmount, totalAmount, dueAmount, deliveryDate, status, styleImageUrl, notes, createdAt) to `prisma/schema.prisma`. Add `measurements[]` and `tailorOrders[]` to `Customer` and `Shop`. Run `npx prisma db push && npx prisma generate`.

2. **Measurement APIs** — Create `/api/measurements` (GET list by shop with customer name, POST upsert by customerId) and `/api/measurements/[customerId]` (GET single customer's measurement, PATCH update). Scope all to shopId.

3. **TailorOrder APIs** — Create `/api/tailor-orders` (GET with status/date filters, POST create with measurement snapshot) and `/api/tailor-orders/[id]` (GET, PATCH for status advance and due amount update). On PATCH to status="ready", trigger SMS via existing SMS util. Scope all to shopId.

4. **Measurements page** — Create `/measurements/page.tsx`: customer list with a measurement card per row showing key dimensions. "+ মাপ যোগ/সম্পাদনা" opens a full measurement form modal. Wire to measurement APIs.

5. **Tailor orders page** — Create or update `/orders/page.tsx` with a tailor-specific branch (gated on businessType): new order form (customer picker loads measurements, description templates, fabric toggle, delivery date, amounts), order list with status pipeline badges and advance button, SMS confirmation on ready status.

6. **Tailor delivery calendar** — Create `/delivery/page.tsx` with a tailor-specific branch alongside the existing courier delivery view (gate by businessType). Shows orders by delivery date with color-coded rows (overdue=red, today=amber, tomorrow=yellow, future=gray). Add "আজ Deliver করতে হবে" widget to `DashboardTailor.tsx`.

7. **Nav update** — Add `/tailor-orders` or confirm `/orders` in tailor nav in `lib/modules.ts`; ensure `/measurements` and `/delivery` nav entries are correct for tailor.

## Relevant files
- `prisma/schema.prisma`
- `lib/modules.ts`
- `app/(app)/delivery/page.tsx`
- `app/(app)/orders/page.tsx`
- `app/(app)/customers/page.tsx`
- `app/api/sms/route.ts`
