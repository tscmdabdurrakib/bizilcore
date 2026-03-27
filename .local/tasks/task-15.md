---
title: Category-grouped product display
---
# Category-Grouped Product Display

## What & Why
Currently the storefront products page shows a single flat grid filtered by category pills. Customers have to click each pill one at a time to browse by category. This task adds a "Browse by Category" view where products are grouped under their category headings so customers can scroll and discover all categories at once.

## Done looks like
- The store products listing page has a "Category View" mode alongside the existing Grid and List toggles
- In Category View, products are grouped under bold category section headers (e.g. "পোশাক — ৫টি পণ্য")
- Each category section shows its products in a horizontal scroll row or small grid
- Products with no category are grouped under an "অন্যান্য" (Other) section at the bottom
- The existing Grid / List view modes and category pill filter continue to work as before
- The store home page's "All Products" section also shows category group headings when more than 2 categories exist

## Out of scope
- Reordering or renaming categories from the storefront (dashboard only)
- Infinite scroll within categories
- Category-specific banner images

## Tasks
1. **Add "Group by Category" view toggle on products page** — Add a third view mode option (alongside Grid/List) that groups products by category with a section heading for each group, rendered as a small horizontal scroll row or compact grid per category.

2. **Category section headings on home page** — On `StoreHomeClient`, when the "All Products" section has products from more than 2 categories and no category pill filter is active, render products grouped under category headings instead of a plain flat grid.

3. **"অন্যান্য" fallback group** — Products with no category set are placed at the end under an "অন্যান্য পণ্য" header so they don't get lost.

## Relevant files
- `app/store/[slug]/products/ProductsPageClient.tsx`
- `app/store/[slug]/StoreHomeClient.tsx`
- `components/store/DynamicProductCard.tsx`