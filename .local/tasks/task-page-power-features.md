# Task Page Power Features

## What & Why
BizilCore-এর task management page-এ অনেক feature আছে কিন্তু daily usability কম। ব্যস্ত Facebook seller-দের জন্য ৫টি high-impact upgrade যোগ করা হবে যা তাদের দৈনন্দিন কাজ অনেক দ্রুত ও সহজ করবে।

## Done looks like

### 1. আজকের জরুরি Task Summary Strip
- Task page-এর একদম উপরে একটি summary banner দেখাবে
- মেয়াদোত্তীর্ণ (overdue), আজকের deadline, এবং আজ সম্পন্ন — এই ৩টি সংখ্যা color-coded দেখাবে
- প্রতিটিতে click করলে সেই filter automatically apply হবে

### 2. Smart Task Templates
- "নতুন টাস্ক" button-এর পাশে একটি "টেমপ্লেট" option থাকবে
- ৪টি ready-made template থাকবে: অর্ডার প্রসেস, ডেলিভারি ফলো-আপ, কমপ্লেইন্ট হ্যান্ডেল, স্টক রিফিল
- Template select করলে task modal pre-filled খুলবে — title, category, priority, এবং subtasks সব আগে থেকে ভরা থাকবে
- User চাইলে কাস্টম template-ও save করতে পারবে (বর্তমান open task থেকে)

### 3. Bulk Actions (List View)
- List view-এ প্রতিটি task card-এ checkbox থাকবে
- ১টি+ task select করলে bottom-এ একটি action bar উঠবে
- Bulk action: status পরিবর্তন, assignee পরিবর্তন, delete, category পরিবর্তন
- "সব select করুন" option থাকবে

### 4. Live Task Timer
- Task card ও detail panel-এ ▶️ "শুরু করুন" বাটন থাকবে
- Timer চলার সময় একটি floating timer indicator পেজের corner-এ দেখাবে (কোন task চলছে ও কতক্ষণ)
- Timer stop করলে `actualMinutes` automatically update হবে
- একসময়ে একটিই timer চলতে পারবে (নতুন start করলে আগেরটি থামবে)

### 5. Saved Filter Presets
- Filter bar-এ "সেভ করুন" বাটন থাকবে
- একটি preset-এ নাম দিয়ে সংরক্ষণ করা যাবে (e.g., "জরুরি অর্ডার", "আজকের ডেলিভারি")
- Saved presets filter bar-এ pill হিসেবে দেখাবে — one-click এ apply
- LocalStorage-এ সংরক্ষিত হবে (per-browser)

## Out of scope
- WhatsApp/SMS reminder integration (আলাদা task)
- Order থেকে auto-task creation (আলাদা task)
- Task dependency/blocking chains
- Gantt/Timeline view
- Backend-saved filter presets (শুধু localStorage)

## Tasks
1. **Summary Strip** — Task page header-এর নিচে overdue / আজকের deadline / আজ সম্পন্ন count দেখানো strip তৈরি করুন। প্রতিটি সংখ্যায় click করলে সংশ্লিষ্ট filter apply হবে।

2. **Smart Task Templates** — "নতুন টাস্ক" button-এর পাশে template picker modal তৈরি করুন। ৪টি built-in template (অর্ডার প্রসেস, ডেলিভারি ফলো-আপ, কমপ্লেইন্ট হ্যান্ডেল, স্টক রিফিল) define করুন — প্রতিটিতে title, category, priority, subtasks pre-filled থাকবে। Template select করলে CreateTaskModal সেই data দিয়ে খুলবে।

3. **Bulk Actions** — TaskList component-এ per-row checkbox এবং "সব select" toggle যোগ করুন। ১+ task selected হলে bottom action bar show করুন — status change, assignee, category, delete সব bulk-apply করবে API calls-এর মাধ্যমে।

4. **Live Task Timer** — Task card ও TaskDetailPanel-এ start/stop timer button যোগ করুন। Active timer state React context বা top-level state-এ রাখুন যাতে page-এর যেকোনো জায়গা থেকে access হয়। Floating timer widget page corner-এ দেখাবে। Stop করলে `actualMinutes` PATCH করবে।

5. **Saved Filter Presets** — Filter bar-এ "সেভ করুন" icon button যোগ করুন। Save modal-এ preset নাম input করা যাবে। Saved presets filter bar-এর উপরে pill হিসেবে দেখাবে। LocalStorage থেকে load/save করুন। Delete করার option থাকবে।

## Relevant files
- `app/(app)/tasks/page.tsx`
- `app/(app)/tasks/TaskList.tsx`
- `app/(app)/tasks/TaskKanban.tsx`
- `app/(app)/tasks/TaskDetailPanel.tsx`
- `app/(app)/tasks/CreateTaskModal.tsx`
- `app/(app)/tasks/TaskReports.tsx`
- `app/(app)/tasks/taskUtils.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
