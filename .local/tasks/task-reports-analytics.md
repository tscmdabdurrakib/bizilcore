# Task Reports & Analytics Tab

## What & Why
Business owners need to understand their team's productivity at a glance — how many tasks are being completed each week, which categories are falling behind, and which team members are most/least loaded. This adds a new "রিপোর্ট" tab to the tasks page with visual charts and metrics.

## Done looks like
- A fourth tab "রিপোর্ট" appears in the task view toggle bar (alongside Kanban, List, Calendar).
- Top row shows 4 KPI cards: Total tasks, Completion rate (%), Avg days to complete, Overdue rate (%).
- A bar chart shows tasks completed per week for the last 8 weeks.
- A donut/pie chart shows task distribution by category (অর্ডার, ডেলিভারি, সাপ্লায়ার, একাউন্টস, সাধারণ).
- A bar chart shows open vs completed tasks per team member (staff + owner).
- A table lists the 10 oldest unresolved tasks (overdue or stuck in todo longest).
- Date range filter (last 7 days / last 30 days / last 90 days) applies to all charts.
- All charts are responsive and use the brand color palette (green shades).
- Charts are built with recharts (already a common Next.js charting library — install if missing).

## Out of scope
- PDF/image export of reports (future work)
- Custom date range picker (only preset ranges)
- Per-task time tracking breakdown (covered in Advanced Features task)

## Tasks
1. **Reports API** — Create `/api/tasks/reports` GET endpoint that accepts a `days` query param (7/30/90). Returns: weekly completion counts (last 8 weeks), category distribution, per-member stats (open, completed, overdue), oldest stuck tasks, and aggregate KPIs.

2. **TaskReports component** — Build the `TaskReports.tsx` client component. Install `recharts` if not present. Show 4 KPI cards, weekly completion bar chart, category donut chart, per-member stacked bar chart, and oldest-tasks table. Use brand colors.

3. **Tab integration** — Add the "রিপোর্ট" tab to the view toggle in `page.tsx`. Wire up the date range filter. Ensure the Reports view is also gated behind the PRO plan.

## Relevant files
- `app/(app)/tasks/page.tsx`
- `app/(app)/tasks/taskUtils.ts`
- `app/api/tasks/stats/route.ts`
- `prisma/schema.prisma`
- `lib/taskGuard.ts`
