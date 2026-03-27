# Task Management System (Pro/Business)

## What & Why
Add a full-featured Task Management module to BizilCore for small ecommerce/retail teams (1–5 members) to manage orders, deliveries, suppliers, accounts, and general team work. All UI labels are in Bangla. The feature is gated behind Pro and Business plans — Free plan users cannot access it.

## Done looks like
- `/tasks` page is accessible to Pro and Business subscribers; Free users see a locked upgrade screen
- Kanban board (default) shows 4 columns (করতে হবে / চলছে / রিভিউ / সম্পন্ন) with drag-and-drop via @dnd-kit/core
- List view has sortable columns, bulk actions, inline status change, and pagination
- Calendar view (react-calendar or similar) shows tasks by due date, color-coded by priority
- Clicking any task opens a full Task Detail panel with inline editing, rich description, comments, activity log, attachments, recurring toggle, linked order, tags, and reminder picker
- Create Task modal with all required fields
- Dashboard has an "আজকের টাস্ক" widget with overdue/today/in-progress/done counts and top 5 upcoming tasks
- Sidebar shows "টাস্ক" nav item with a red badge for overdue count; item is visually locked for Free users
- In-app bell notifications fire when reminder_at is reached
- Smart auto-tasks are created when: a new order is placed, an order ships, stock drops below threshold, or a payment becomes overdue
- Pricing page lists Task Management as a Pro/Business feature

## Out of scope
- Email reminder sending (in-app notification only for now)
- Real-time websocket comments (re-fetch on submit is sufficient)
- Mobile push notifications

## Tasks

1. **Prisma schema** — Add `Task`, `TaskComment`, and `TaskActivityLog` models to `prisma/schema.prisma` with all required fields (status enum, priority enum, category enum, recurrence enum, tags as String[], attachments as String[], foreign keys to User, Shop, StaffMember, Order). Run `prisma migrate dev`.

2. **Feature gating** — Add `taskManagement` to `lib/features.ts` PLAN_LIMITS (false for Free, true for Pro and Business). Add a `taskManagement` feature entry in `PlanGate.tsx` with an appropriate icon, title, and benefits list. Add `/tasks` to the `PRO_LOCKED_HREFS` list in `AppSidebar.tsx` so Free users see the PRO badge. Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `react-calendar` packages.

3. **API routes** — Create all task API endpoints under `app/api/tasks/`: `GET/POST /api/tasks` (list with filters + create), `GET/PUT/DELETE /api/tasks/[id]` (single task with comments + logs), `PATCH /api/tasks/[id]/status` (kanban drag quick update), `POST /api/tasks/[id]/comments` (add comment), `GET /api/tasks/stats` (overdue/today/done counts). All endpoints must authenticate via the existing `auth()` helper, scope data to the user's shop, and log changes to `TaskActivityLog`.

4. **Kanban board view** — Build `app/(app)/tasks/page.tsx` with the top bar (title, "+ নতুন টাস্ক" button, view toggle, filter bar, search). Implement the Kanban board as the default view using `@dnd-kit/core` for drag-and-drop between the 4 status columns. Each card shows title, priority badge (color-coded), category badge, assigned member avatar/name, due date (red if overdue), order link badge, and comment count. Column headers show task count.

5. **List and Calendar views** — Implement the List view as a sortable table with bulk-select checkboxes, bulk actions (Mark Done, Delete, Change Priority, Reassign), inline status dropdown, and pagination (20/page). Implement the Calendar view using `react-calendar` showing tasks on their due dates, color-coded by priority; clicking a date shows that day's tasks; clicking a task opens the detail panel.

6. **Task Detail panel and Create modal** — Build a slide-over detail panel (or modal) for viewing and editing a task, including: inline-editable title, status/priority dropdowns, rich text description, assigned-to dropdown, due date + reminder pickers, tags input, linked order search, recurring toggle with recurrence type, file attachment upload/list, comments list with submit input, and activity log. Build the Create Task modal with all required fields and "টাস্ক তৈরি করুন" submit button.

7. **Dashboard widget** — Add an "আজকের টাস্ক" widget card to the existing dashboard page. It shows counts (Overdue / Due Today / In Progress / Done Today) and a list of top 5 upcoming tasks with priority badges, a quick "সম্পন্ন" checkbox per task, and a "সব টাস্ক দেখুন →" link to `/tasks`.

8. **Sidebar navigation and overdue badge** — Add a "টাস্ক" nav item to `AppSidebar.tsx` (with a clipboard/checkbox icon) that links to `/tasks`. Fetch the overdue task count from `/api/tasks/stats` and show a red badge on the sidebar item when count > 0. Reflect the same lock visual (PRO badge + 60% opacity) for Free plan users.

9. **In-app reminder notifications** — Add a polling or server-side check (e.g., in a Next.js Route Handler or middleware) that finds tasks where `reminder_at` is past and `completed_at` is null, then surfaces them via the existing bell/notification UI in the navbar. Mark reminders as delivered to avoid repeat notifications.

10. **Smart auto-task creation** — Hook into existing order creation, order status update, stock movement, and payment/expense logic to auto-create tasks: new order → "অর্ডার #ID প্রস্তুত করুন" (category: order, priority: high, due: today); order shipped → "ডেলিভারি কনফার্ম করুন #ID" (category: delivery, priority: medium, due: +2 days); stock below threshold → "স্টক রিফিল করুন: {product}" (category: supplier, priority: urgent); payment overdue → "পেমেন্ট কালেক্ট করুন: {customer}" (category: accounts, priority: high).

11. **Pricing page update** — Add Task Management to the features comparison section of `app/(marketing)/pricing/page.tsx`, showing it as available on Pro and Business plans but not Free.

## Relevant files
- `prisma/schema.prisma`
- `lib/features.ts`
- `components/PlanGate.tsx`
- `components/AppSidebar.tsx`
- `app/(marketing)/pricing/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/api/orders/route.ts`
- `lib/theme.ts`
- `app/globals.css`
