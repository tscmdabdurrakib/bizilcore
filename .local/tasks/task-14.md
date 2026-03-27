---
title: Product descriptions in storefront
---
# Product Descriptions in Storefront

## What & Why
Product descriptions already exist in the database and can be entered via the dashboard, but they are not visible to customers browsing product cards in grid view. This task makes descriptions visible in the public storefront so customers can read about a product before clicking into it.

## Done looks like
- Product grid cards (on both the home page and products listing page) show a short 2-line description excerpt below the product name
- The product detail page shows the full description in a well-formatted, clearly labelled section
- If a product has no description, the card looks the same as before (no empty space)
- The list-view row in the products page already shows a description excerpt and continues to do so

## Out of scope
- Editing descriptions (already available in the dashboard)
- AI-generated descriptions (already built)
- Rich text / formatting support in descriptions

## Tasks
1. **Add description to product card component** — Extend the `ProductCardProduct` interface to include `description`, and render a 2-line clamped excerpt inside the card info section for all card styles (shadow_card, borderless, outlined, image_overlay where layout permits).

2. **Pass description through store data layer** — Ensure the store home page and products listing page API/query includes `description` and passes it to the card component.

3. **Polish product detail page description section** — Make the description section on the product detail page clearly labelled ("পণ্যের বিবরণ") with readable typography, and handle the no-description state gracefully.

## Relevant files
- `components/store/DynamicProductCard.tsx`
- `app/store/[slug]/StoreHomeClient.tsx`
- `app/store/[slug]/products/ProductsPageClient.tsx`
- `app/store/[slug]/products/[productId]/ProductDetailClient.tsx`
- `app/api/store/[slug]/products/route.ts`