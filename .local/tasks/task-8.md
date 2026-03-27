---
title: Salon Module (Services, Appointments, Commission)
---
# Salon / Beauty Parlor Module

## What & Why
Implement the complete salon module for the salon business type: service management, appointment booking calendar, walk-in tracking, and staff commission reporting. Salon owners need to manage bookings by date/time slot, assign services to staff, and track commissions earned.

## Done looks like
- `/services` page lists services by category (hair/skin/nail/makeup/other) with add/edit/toggle-active controls. All labels are in Bangla.
- `/appointments` page has a day-view timeline (9am–9pm) and a list-view toggle. Appointment cards show time, customer name, services, assigned staff, and a status badge with Confirm / Start / Complete / Cancel action buttons.
- "নতুন অ্যাপয়েন্টমেন্ট" modal: customer search, date+time (30-min slots), multi-select services (prices auto-sum), optional staff assign, note field. On save, an SMS is sent: "আপনার appointment নিশ্চিত হয়েছে [date] [time] এ। - [ShopName]"
- "Walk-in নিন" quick button on dashboard creates an immediate appointment at current time.
- `/hr` (staff) page gains a commission tab: per-completed-appointment commission breakdown (default 30% per service, configurable), monthly totals, and a "Commission দিয়েছি" mark button.
- Salon nav in `lib/modules.ts` includes `/services` and `/appointments`.

## Out of scope
- Automated SMS reminder 2 hours before appointment (requires a cron job — future task).
- Online customer self-booking widget.

## Tasks
1. **DB schema** — Add `Service`, `Appointment`, `AppointmentItem` models to `prisma/schema.prisma` as specified (including `staffCommission Float @default(0)` on AppointmentItem). Add `appointments[]` relation to `StaffMember` and `Customer`. Run `npx prisma db push && npx prisma generate`.

2. **Service APIs** — Create `/api/services` (GET/POST) and `/api/services/[id]` (PATCH/DELETE) scoped by shopId. Validate name, category, price, durationMins.

3. **Appointment APIs** — Create `/api/appointments` (GET with date filter, POST creates appointment + AppointmentItems + sends SMS confirmation via existing SMS util). Create `/api/appointments/[id]` (GET, PATCH for status transitions: scheduled→confirmed→in_progress→completed→cancelled). On status=completed, compute staffCommission per item (default 30% of price, or per-staff configurable rate).

4. **Services page** — Create `/services/page.tsx`: category-tabbed list, add/edit modal with name, category, price, duration, default staff assignment, active toggle. Full Bangla labels.

5. **Appointments page** — Create `/appointments/page.tsx`: toggle between day-view (timeline grid 9am–9pm with appointment blocks) and list-view (card grid). "নতুন অ্যাপয়েন্টমেন্ট" modal wired to POST `/api/appointments`. Status action buttons call PATCH `/api/appointments/[id]`. Walk-in button on salon dashboard creates instant appointment.

6. **Staff commission tab** — Add a "কমিশন" tab to `/hr/page.tsx` (or a sub-page `/hr/commission`): monthly breakdown per staff showing services done, revenue, commission earned, and a "Commission দিয়েছি" mark-paid button (PATCH `/api/appointments/[id]` or a dedicated commission mark endpoint).

7. **Nav and dashboard** — Update salon nav in `lib/modules.ts` to include `/services`. Add "Walk-in নিন" quick button to `DashboardSalon.tsx`.

## Relevant files
- `prisma/schema.prisma`
- `lib/modules.ts`
- `app/(app)/hr/page.tsx`
- `app/api/sms/route.ts`