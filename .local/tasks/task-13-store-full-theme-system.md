# Store Full Theme System

## What & Why
Replace the existing basic color-picker theme system with a full layout-level theme system. Each of the 5 themes (Bold, Elegant, Fresh, Minimal, Vibrant) becomes a completely different visual experience — with its own nav style, hero style, product card style, footer style, section order, typography, and color palette. When a store owner switches themes, the entire storefront appearance changes dramatically.

## Done looks like
- 5 themes selectable from the dashboard theme page, each showing a rich visual preview mockup (mini nav + hero + product cards), not just color swatches
- Switching theme changes: navbar layout, hero section style, product card design, footer style, font, border radius, and color palette — all at once
- "Bold" theme: black navbar, full-viewport hero image overlay, portrait product images with overlay text, no rounded corners — dramatic fashion look
- "Elegant" theme: centered dark-gold navbar, split text+image hero, borderless gallery-style product cards — luxury jewelry feel
- "Fresh" theme: white navbar, auto-rotating banner slider hero, shadow cards with rounded corners, 4-column green-accented grid — food/grocery feel
- "Minimal" theme: sticky minimal navbar (hamburger links), centered text-only hero, outlined product cards — clean all-purpose look
- "Vibrant" theme: purple navbar, split hero, large rounded shadow cards, 3-column grid — playful kids/gifts feel
- Custom primary/accent color overrides still work on top of any theme
- Google Fonts (Bebas Neue, Cormorant Garamond, Hind Siliguri, Nunito, Inter) load dynamically based on active theme
- Dashboard theme selector: 2-column grid of large theme cards (350px), each showing a real SVG/mini mockup preview of the nav + hero + cards

## Out of scope
- Per-section customisation (drag-and-drop section reordering by the user)
- Video background hero style (spec mentions it but marks it optional)
- Testimonials section rendering (section listed in sectionOrder but content doesn't exist yet)
- Sidebar nav style (complex layout, keep for future)

## Tasks

1. **New theme config system** — Create `lib/themes/index.ts` with the full `ThemeConfig` type (layout, colors, typography, components sub-objects) and define all 5 themes (bold, elegant, fresh, minimal, vibrant). Migrate `themes/index.ts` (root) to re-export from the new location for backward compatibility. Update `components/store/ThemeProvider.tsx` to accept the new `ThemeConfig` type, merge custom colors, and emit all required CSS vars including `--nav-bg`, `--nav-text`, `--theme-font-heading`, `--theme-font-body`.

2. **Dynamic layout components** — Create three new components: `DynamicNav` (topbar_logo_left / topbar_centered / minimal_sticky), `DynamicHero` (fullwidth_image / split_text_image / banner_slider / text_only_centered), and `DynamicProductCard` (image_overlay / borderless / shadow_card / outlined). Each component reads from the theme context to render its appropriate layout variant. Replace `StoreNavbar`, the hero section inside `StoreHomeClient`, and `ProductCard` usage with the new dynamic components where the store layout drives them.

3. **Store layout wiring and Google Fonts** — Update `app/store/[slug]/layout.tsx` to load the Google Font `<link>` tags for the active shop's theme (Bebas Neue, Cormorant Garamond, Hind Siliguri, Nunito, Inter). Update `StoreHomeClient` to respect `theme.layout.sectionOrder` for rendering sections and `theme.layout.productGridCols` for the grid column count. Apply theme background color and section spacing from CSS vars across all store pages.

4. **Redesigned dashboard theme selector** — Replace `app/(app)/dashboard/store/theme/page.tsx` with the new design: 2-column grid of large cards (each 350px tall), top half shows SVG mini-mockup of that theme's nav + hero + product cards, bottom half shows theme name (Bangla + English), description, category badge, "এই থিম ব্যবহার করুন" button, and an active-theme indicator (green border + "✓ ব্যবহার হচ্ছে" badge). Below the grid: optional custom color pickers (primary + accent). Save via `PATCH /api/shop` with `{ storeTheme, storePrimaryColor, storeAccentColor }`.

## Relevant files
- `themes/index.ts`
- `components/store/ThemeProvider.tsx`
- `components/store/StoreNavbar.tsx`
- `components/store/ProductCard.tsx`
- `components/store/StoreFooter.tsx`
- `app/store/[slug]/layout.tsx`
- `app/store/[slug]/StoreHomeClient.tsx`
- `app/(app)/store/theme/page.tsx`
- `app/(app)/dashboard/store/theme/page.tsx`
