# Product Profitability & Inventory Intelligence

## What & Why
Sellers know they're selling, but many don't know which products are actually making money after costs, or which will run out of stock this week. This feature adds a "প্রোডাক্ট ইন্টেলিজেন্স" tab to the Reports page (or Inventory page) that shows per-product profit margins, sales velocity (units/week), stockout forecast (days remaining), and identifies the top/bottom performers. This helps sellers decide what to reorder and what to stop selling.

## Done looks like
- A new "প্রোডাক্ট বিশ্লেষণ" tab appears in `app/(app)/reports/page.tsx` (alongside existing charts).
- **Top section — Profitability table**: all products with columns:
  - Product name, Category, Buy Price (ক্রয়মূল্য), Sell Price (বিক্রয়মূল্য), Margin (৳ and %), Units Sold (last 30 days), Revenue, Gross Profit.
  - Sortable by any column. Color-coded margin: green >40%, yellow 20–40%, red <20%.
  - Search/filter by name or category.
- **Stock Intelligence section**:
  - Sales velocity: units sold per week (avg over last 4 weeks) per product.
  - Days remaining: current stock ÷ weekly sales rate.
  - "Stockout soon" badge (red) for products with <7 days of stock remaining.
  - "Slow mover" badge (grey) for products with <1 unit/week velocity and stock >30 units.
  - Reorder suggestion: a "PO তৈরি করুন" button on any low-stock product that pre-fills a draft Purchase Order to the product's supplier (if linked).
- **Summary KPI cards** at the top: Best Margin Product, Worst Margin Product, Stockout Soon count, Slow Movers count, Total Gross Profit (last 30 days).
- Date range selector (last 7/30/90 days) affects sold units and velocity calculations.
- CSV export of the full profitability table.

## Out of scope
- Automatic PO creation (user must confirm the draft)
- Landed cost tracking (import duties, shipping costs per unit)
- Multi-warehouse stock
- Profit after WhatsApp/SMS costs

## Tasks
1. **Product intelligence API** — Create `GET /api/reports/products?days=30` that joins Product, OrderItem, and PurchaseItem data to return per-product: buyPrice, sellPrice, margin%, unitsSold (in period), revenue, grossProfit, weeklyVelocity, currentStock, daysRemaining, supplierId.

2. **Report tab UI** — Add "প্রোডাক্ট বিশ্লেষণ" tab to `app/(app)/reports/page.tsx` with summary KPI cards, sortable profitability table (with margin color coding and badges), stock intelligence section, and CSV export button.

3. **Quick PO from low-stock** — In the low-stock/stockout section, add a "PO তৈরি করুন" button that navigates to `app/(app)/purchase-orders/new` pre-filled with the product and its linked supplier. Uses existing PO creation flow.

## Relevant files
- `app/(app)/reports/page.tsx`
- `app/api/reports/`
- `prisma/schema.prisma`
- `app/(app)/purchase-orders/`
- `app/(app)/inventory/page.tsx`
