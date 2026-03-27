# Update Public Features Page — New Features

## What & Why
The app has several major features that were added but are not reflected on the public `/features` marketing page. Visitors and potential users cannot discover these capabilities. This task updates the features page to accurately represent all current functionality.

## Done looks like
- `/features` page has a new **HR & Employee Management** category card with: employee attendance (present/absent/leave), shift management & weekly scheduling, staff overview stats
- `/features` page has a new **Task Management** category card with: Kanban board, task calendar, priority & deadline tracking, category filtering, CSV export
- `/features` page has a new **Expense Tracking** category card with: categorized business expenses, monthly chart, Excel export
- The existing **System & Admin** category now includes a **Public Ecommerce Catalog** feature tile (Business plan) — custom URL, product showcase, WhatsApp ordering, QR code sharing
- The existing **Courier Integration** category updates COD to mention the dedicated COD Tracker dashboard
- The `allFeatures` quick-list at the bottom of the page is updated with all new feature names (HR Management, Shift Scheduling, Kanban Tasks, Expense Tracking, Public Catalog)
- Feature count in the stats bar updated from "৩২+" to "৪৫+" to reflect additions

## Out of scope
- Changes to any other marketing pages (pricing, home, blog, etc.)
- Backend changes or new API routes
- Changes to actual app pages

## Tasks
1. **Add HR & Employee Management category** — Add a new `categories` entry with 6 feature tiles covering employee attendance tracking, shift scheduling, staff stats, leave management, payroll overview, and CSV/Excel export for HR data.

2. **Add Task Management category** — Add a new `categories` entry with 6 feature tiles: Kanban board, task calendar, priority levels (urgent/high/medium/low), deadline tracking, category-based filtering, and CSV export of tasks.

3. **Add Expense Tracking category** — Add a new `categories` entry with 4-6 feature tiles: categorized expense entry, monthly expense chart, expense vs income comparison, Excel export.

4. **Update System & Admin + Courier categories** — Add a Public Catalog feature tile (Business plan exclusive, Crown badge) to the System & Admin category. Update the COD tile in Courier Integration to mention the dedicated COD Tracker dashboard.

5. **Update stats bar and allFeatures list** — Change the "৩২+" total features count to "৪৮+", add all new feature names to the `allFeatures` array so they appear in the complete feature checklist at the bottom.

## Relevant files
- `app/(marketing)/features/page.tsx`
- `app/(app)/hr/page.tsx`
- `app/(app)/hr/shifts/page.tsx`
- `app/(app)/tasks/page.tsx`
- `app/(app)/expenses/page.tsx`
- `app/(app)/cod/page.tsx`
- `app/(catalog)/s/[slug]/CatalogPageClient.tsx`
