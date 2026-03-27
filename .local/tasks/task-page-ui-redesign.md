# Task Page UI/UX Redesign

## What & Why
The current Task Management page feels cluttered and unpolished — too many controls crammed into one row, the Kanban cards lack visual hierarchy, the List view is hard to scan, and the summary strip looks basic. This task redesigns every visual layer of the task page into a clean, professional SaaS-quality experience while keeping all existing functionality intact.

## Done looks like
- **Page header** is clean and breathable — title+subtitle on the left, 3 action buttons on the right (CSV, Template, New Task)
- **Summary strip** shows 3 impactful stat cards with large numbers, colored icons, and clear labels; clicking each applies the correct filter
- **View switcher + filters** are in a separate well-organized control bar; filters collapse into a "ফিল্টার" button that expands a filter panel instead of 5 inline dropdowns
- **Kanban board** has colored column headers with task-count badge; each card has a left-side priority accent border (colored stripe); card footer is clean with avatar circle, due date, timer button all well-spaced
- **Kanban columns** have a subtle tinted background per status (gray/blue/amber/green at low opacity) so the board is visually separated
- **List view** rows are well-spaced with readable text; each row has clear priority badge, status pill (no dropdown clutter), assignee avatar, due date; row hover state is smooth; bulk action bar appears as a sticky bottom bar when items are selected
- **Create Task Modal** has a cleaner 2-section layout (basic info on top, details below); fields are properly grouped and spaced
- **Task Detail Panel** has a polished sidebar with the task title at the top in large bold text, inline status/priority selectors styled as buttons not plain dropdowns, and cleaner section dividers
- **Floating Timer** has a glass-morphism pill style at bottom-right with pulsing dot, task name truncated, live clock, and a stop button
- No regressions in any existing feature (drag-drop, timers, bulk actions, templates, presets, completedToday filter, summary stats refresh)

## Out of scope
- No new features, only visual/UX improvements
- No changes to API routes or Prisma schema
- No changes to authentication, reports tab, or calendar tab internals (only their container styling)

## Tasks
1. **Redesign `page.tsx` header, summary strip, and filter bar** — Make the header compact with only 3 action buttons; redesign the 3 summary chips into stat cards with big numbers; replace the 5 inline filter dropdowns with a collapsible "ফিল্টার" panel that slides open below the control bar; keep all filter state logic intact.

2. **Redesign `TaskKanban.tsx`** — Add status-tinted column backgrounds; add left-border priority accent to each card; polish the card header (badges), body (title, subtask bar), and footer (avatar, date, timer) with better spacing and visual weight; make column headers bolder with larger count badges.

3. **Redesign `TaskList.tsx`** — Improve row design with better spacing, readable priority/status pills; change bulk action bar to a sticky bottom bar style that appears on top of the page when tasks are selected; keep all bulk action functionality (status, category, priority, assignee, delete).

4. **Polish `CreateTaskModal.tsx` and `TaskDetailPanel.tsx`** — Give the create modal two clearly grouped sections (basic + details); give the detail panel a polished header with the task title prominent, inline button-style status/priority pickers, and clean section separators with icons.

5. **Polish `TaskTimerContext.tsx` floating timer widget** — Redesign the FloatingTimer as a glass-morphism pill (backdrop-blur, subtle border, shadow) with a pulsing green dot, truncated task name, live hh:mm:ss, and a red stop button; position anchored bottom-right above any other fixed elements.

## Relevant files
- `app/(app)/tasks/page.tsx`
- `app/(app)/tasks/TaskKanban.tsx`
- `app/(app)/tasks/TaskList.tsx`
- `app/(app)/tasks/CreateTaskModal.tsx`
- `app/(app)/tasks/TaskDetailPanel.tsx`
- `app/(app)/tasks/TaskTimerContext.tsx`
- `app/(app)/tasks/taskUtils.ts`
