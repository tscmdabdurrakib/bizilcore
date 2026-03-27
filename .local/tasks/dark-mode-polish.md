# Dark Mode Polish — Beautiful & Readable

## What & Why
The current dark mode has several readability and visual quality problems: status badges use hardcoded light-colored backgrounds that look washed out/harsh, form inputs are hard to distinguish from the page background, card surfaces barely separate from the outer background, and many hardcoded hex colors throughout pages don't adapt to dark mode. The result feels inconsistent and unprofessional.

## Done looks like
- Dark mode has a polished, professional appearance with clear visual hierarchy (background → card surface → elevated elements)
- All text is clearly readable with proper contrast — primary text, secondary text, and muted text are all distinguishable
- Status badges (pending, confirmed, shipped, delivered, returned, cancelled) have proper dark mode colors — visible but not harsh
- Form inputs (text fields, selects, textareas) are clearly visible with readable borders, background, and placeholder text
- Task priority badges and other inline-styled badges render correctly in dark mode
- Switching between light and dark mode produces a consistent, beautiful result throughout the app

## Out of scope
- Invoice/PDF print templates (these are intentionally light for printing)
- Marketing landing pages (separate from the app shell)
- Adding new features or changing layout structure

## Tasks
1. **Improve dark mode CSS variables** — Refine the color palette in `app/globals.css` for better surface hierarchy (deeper outer bg, slightly lighter card surface, distinct elevated surface), improved text contrast ratios, and stronger border visibility so cards are clearly distinguished from the background.

2. **Fix status badge dark mode colors** — The `STATUS_MAP` in `lib/utils.ts` returns hardcoded light background/text hex colors (e.g. `#FFF3DC`/`#EF9F27` for pending, `#E1F0FF`/`#2B7CE9` for confirmed). Add dark-mode-aware badge color output — either by reading the current dark class from the document or by adding global CSS overrides in `app/globals.css` that target the badge background/text colors when `html.dark` is active.

3. **Fix form input dark mode styling** — Add global CSS rules in `app/globals.css` so that `input`, `select`, and `textarea` elements in dark mode get a proper dark background, readable text color, a visible border, and a styled placeholder. Many inputs use Tailwind utility classes or inline styles that don't fully adapt.

4. **Fix hardcoded inline colors throughout pages** — Audit the most-used pages (`dashboard`, `orders`, `inventory`, `customers`, `reports`, `settings`) and replace or override any hardcoded light hex values used for card backgrounds, badge fills, or labels with CSS-variable-based equivalents. Focus on elements that use `background-color: #FFF…` or `color: #1A1A…` directly in inline styles that don't adapt to dark mode.

5. **Add dark mode input/card elevation and shadow** — Add subtle box-shadow rules in `app/globals.css` for card surfaces in dark mode to give them lift against the dark background, improving the visual hierarchy without changing the HTML structure.

## Relevant files
- `app/globals.css`
- `lib/utils.ts`
- `lib/theme.ts`
- `app/(app)/dashboard/TaskQuickComplete.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/orders/page.tsx`
- `app/(app)/orders/[id]/page.tsx`
- `app/(app)/inventory/page.tsx`
- `app/(app)/customers/page.tsx`
- `app/(app)/settings/page.tsx`
- `app/layout.tsx`
