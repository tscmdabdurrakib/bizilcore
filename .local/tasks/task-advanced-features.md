# Task System Advanced Features

## What & Why
The current task system is functional but missing critical productivity features. Bangladeshi Facebook-based sellers need to break down complex tasks, avoid missing deadlines via email, quickly repeat common workflows, and export their task data. This adds subtasks, task duplication, time tracking, recurring auto-generation, email reminders, "My Tasks" filter, CSV export, and full-text search across title/description/tags.

## Done looks like
- A task detail panel shows a Checklist section where users can add/check off subtasks. Progress (e.g. "২/৫ সম্পন্ন") appears on the Kanban card.
- When a recurring task is marked Done, a new copy is automatically created with the due date shifted by the recurrence interval (daily/weekly/monthly).
- When `reminderAt` passes, an email is sent to the task creator (and assignee if different) — in addition to the existing in-app notification.
- Each task card has a Duplicate button in the detail panel that clones the task (same title + fields, status reset to "todo").
- A "আমার টাস্ক" (My Tasks) toggle button appears in the filter bar — clicking it shows only tasks assigned to or created by the current user.
- Task detail panel has Estimated Time (ঘণ্টা/মিনিট) and Actual Time fields. Time summary shows on the list view.
- Tasks page has an Export button that downloads all currently filtered tasks as a CSV file in Bengali.
- Search works across title, description, and tags (not just title).

## Out of scope
- Task dependencies / blocking relationships (separate work)
- Task templates UI (separate work)
- Gantt/timeline view (separate work)

## Tasks
1. **SubTask schema and API** — Add a `SubTask` model linked to `Task` with `title` and `completed` fields. Add a `estimatedMinutes` and `actualMinutes` int field on `Task`. Create API endpoints to list, create, update, and delete subtasks. Update the DB with a migration.

2. **SubTask UI in TaskDetailPanel** — Add a Checklist section to the detail panel. Users can type and add subtasks, check/uncheck them. Show progress bar and count. Save changes immediately on toggle.

3. **Kanban card checklist indicator** — Show a small checklist progress badge (e.g. "2/5 ✓") on Kanban cards that have subtasks.

4. **Recurring task auto-generation** — In the task status API (PATCH `/api/tasks/[id]/status`), when a recurring task is set to "done", clone it with status "todo" and the due date shifted by the recurrence interval. Log the auto-creation in the activity log.

5. **Email reminders** — Update the reminders API (`/api/tasks/reminders`) to also send an email to the task creator and assignee using the existing mailer. The email should show task title, due date, and a link to /tasks.

6. **Task duplication** — Add a POST endpoint `/api/tasks/[id]/duplicate` that clones a task (all fields except id, status → todo, completedAt → null, reminderSent → false). Add a Duplicate button in TaskDetailPanel.

7. **My Tasks filter and time fields** — Add a "My Tasks" toggle to the filter bar that sets assignedToId to the current user's ID. Add estimated/actual time fields to the task detail panel and list view.

8. **CSV export and full-text search** — Add a CSV download button that exports all currently-visible tasks. Update the search API to search title OR description OR tags (using Prisma's `OR` with `contains` on all three). Update the search parameter on the frontend to pass through tags as well.

## Relevant files
- `app/(app)/tasks/page.tsx`
- `app/(app)/tasks/TaskDetailPanel.tsx`
- `app/(app)/tasks/TaskKanban.tsx`
- `app/(app)/tasks/TaskList.tsx`
- `app/(app)/tasks/CreateTaskModal.tsx`
- `app/(app)/tasks/taskUtils.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/tasks/[id]/status/route.ts`
- `app/api/tasks/reminders/route.ts`
- `lib/mailer.ts`
- `prisma/schema.prisma`
