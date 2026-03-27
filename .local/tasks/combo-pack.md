# Combo Pack Feature

## What & Why
Bangladeshi Facebook sellers frequently bundle 2–4 products into a single "combo" and sell at a discounted combined price (e.g. "Dress + Bag combo = ৳1,200"). Currently BizilCore has no way to define these bundles — sellers have to manually track which products were sold, and stock deductions don't happen automatically for bundle components. This feature adds a full combo-pack system: define bundles, sell them in orders, and auto-deduct component stock.

## Done looks like
- A "কমবো প্যাক" section is visible in the Inventory page with a dedicated tab listing all active/inactive combos, their selling price, and available stock (calculated from component stock)
- Sellers can create a combo by giving it a name, price, optional image, and adding 2+ component products (with quantities and optional variant selection)
- When creating a new order, the product picker shows combos alongside regular products with a distinct "Combo" badge
- Adding a combo to an order creates a single line item showing the combo name and price; on save, the system deducts stock from every component product automatically
- The order detail page and order slip render combo items with a "📦 কমবো" label and list the component products beneath it
- Sellers can edit or deactivate a combo without affecting historical orders

## Out of scope
- Combo discount rules or coupon codes (combo price is set manually)
- Combo product images upload (URL field only for v1)
- Combo-specific reports/analytics
- Bulk import of combos via CSV

## Tasks

1. **Schema + DB migration** — Add `ComboProduct` model (id, shopId, name, description, sellPrice, imageUrl, isActive) and `ComboItem` model (comboId, productId, variantId?, quantity). Make `OrderItem.productId` optional (nullable) and add optional `comboId` field to `OrderItem` so a combo line item can be recorded without a specific product. Run `prisma db push` and `prisma generate`.

2. **Combo CRUD API** — Build `GET/POST /api/combos` (list shop combos + create) and `GET/PATCH/DELETE /api/combos/[id]` (detail, update, soft-delete via isActive). Each GET includes component items with product names and variant info. Compute `availableStock` (min of each component's stock ÷ its quantity in the combo) in the API response.

3. **Inventory — Combo management UI** — Add a "কমবো প্যাক" tab to the Inventory page. Tab shows a card/table list of combos with name, price, component count, available stock badge, and active/inactive toggle. Clicking a combo opens an edit drawer/page. A "নতুন কমবো" button opens `/inventory/combos/new` — a form with combo name, price, description, and a dynamic component list (product picker + variant selector + quantity field, same style as the existing product form).

4. **Order integration — create & display** — Update `POST /api/orders` to accept combo items in the `items` array (identified by `comboId`). For each combo item: create one `OrderItem` with `comboId` set (productId null), then deduct stock from all `ComboItem` components. Update `GET /api/orders/[id]` to return combo data on order items. In the New Order page, add combos to the product search/select dropdown with a "Combo" badge. In the order detail page, render combo line items with a badge and an expandable component list.

5. **Order Slip — combo display** — In `OrderSlip.tsx`, detect when an order item has `comboId` and render it with a "📦 কমবো" label. Show the combo name as the item name and list its component products below in smaller text (e.g. "└ Dress × 1, Bag × 1"). Apply this to all 5 slip templates.

## Relevant files
- `prisma/schema.prisma`
- `app/(app)/inventory/page.tsx`
- `app/(app)/inventory/new/page.tsx`
- `app/(app)/orders/new/page.tsx`
- `app/(app)/orders/[id]/page.tsx`
- `app/(app)/orders/[id]/slip/page.tsx`
- `components/OrderSlip.tsx`
- `app/api/orders/route.ts`
- `app/api/orders/[id]/route.ts`
- `app/api/products/route.ts`
