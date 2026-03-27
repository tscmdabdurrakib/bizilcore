# COD Reconciliation Dashboard

## What & Why
In Bangladesh, ~90% of e-commerce sales are Cash on Delivery (COD). Couriers collect cash from customers but take 3–10 days to remit it to the seller. Sellers currently have no way to track: how much cash is sitting with each courier, what's been received, what's overdue. This leads to cash flow confusion, missed reconciliations, and inability to chase late remittances. This feature adds a dedicated COD money tracker page.

## Done looks like
- A new sidebar item "COD ট্র্যাকার" (or under হিসাব section) shows a reconciliation dashboard.
- Top KPI bar shows: Total COD Pending (with couriers), Total Collected This Month, Overdue >7 Days, Total Orders COD.
- A table of all shipped/delivered COD orders grouped by courier (Pathao, eCourier, etc.), showing: order ID, customer name, COD amount, courier, shipped date, delivery status, and "Remitted?" toggle.
- Sellers can mark individual orders as "remittance received" (with an optional received date). This updates a `codRemitted` boolean and `codRemittedAt` date on the Order.
- A "courier summary" card section shows per-courier: total orders, total COD pending, total remitted, overdue amount (>7 days since delivery with no remittance).
- Date range filter (this week / this month / last 30 days / custom range via two date pickers).
- CSV export of the reconciliation table.
- In the existing Order detail page, a "COD স্ট্যাটাস" row shows remittance status and allows toggling remitted directly.

## Out of scope
- Automated courier API remittance fetch (future — couriers don't expose this API)
- Bank account reconciliation
- Multi-currency

## Tasks
1. **Schema migration** — Add `codRemitted` (Boolean, default false) and `codRemittedAt` (DateTime?) to the Order model. Run migration.

2. **COD API endpoints** — Create `GET /api/cod` returning COD orders with filters (courieName, dateFrom, dateTo, remitted) and aggregate KPIs. Create `PATCH /api/cod/[orderId]` to toggle remittance status.

3. **COD dashboard page** — Build `app/(app)/cod/page.tsx` with KPI cards, per-courier summary cards, filterable orders table, and CSV export. Add "COD ট্র্যাকার" to the sidebar navigation.

4. **Order detail integration** — Add a COD remittance status row to `app/(app)/orders/[id]/page.tsx` with a toggle button for marking remittance received.

## Relevant files
- `prisma/schema.prisma`
- `app/(app)/orders/[id]/page.tsx`
- `app/(app)/hisab/page.tsx`
- `components/AppSidebar.tsx`
- `app/api/orders/route.ts`
