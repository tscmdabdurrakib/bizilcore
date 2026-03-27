"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PlanGate from "@/components/PlanGate";
import { useSubscription } from "@/hooks/useSubscription";
import TaskKanban from "./TaskKanban";
import TaskList from "./TaskList";
import TaskCalendar from "./TaskCalendar";
import TaskDetailPanel from "./TaskDetailPanel";
import CreateTaskModal from "./CreateTaskModal";
import TaskReports from "./TaskReports";
import TaskTemplatesModal, { type TaskTemplate } from "./TaskTemplates";
import { TaskTimerProvider, FloatingTimer } from "./TaskTimerContext";
import {
  LayoutGrid,
  List,
  CalendarDays,
  BarChart2,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  User,
  BookmarkPlus,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  LayoutTemplate,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskCategory = "order" | "delivery" | "supplier" | "accounts" | "general";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignedToId?: string | null;
  tags: string[];
  dueDate?: string | null;
  reminderAt?: string | null;
  recurring: boolean;
  recurrence: string;
  orderId?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  comments: { id: string }[];
  subtasks: { id: string; done: boolean }[];
  user?: { name: string };
  assignedTo?: { name: string } | null;
}

type ViewMode = "kanban" | "list" | "calendar" | "reports";

interface FilterPreset {
  name: string;
  statusFilter: string;
  priorityFilter: string;
  categoryFilter: string;
  dueDateFilter: string;
  myTasksOnly: boolean;
}

interface CreateTaskData {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  tags?: string;
  subtasks?: string[];
}

const PRESET_KEY = "bizilcore-task-presets";

function loadPresets(): FilterPreset[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PRESET_KEY) : null;
    if (raw) return JSON.parse(raw) as FilterPreset[];
  } catch {}
  return [];
}

function savePresets(presets: FilterPreset[]) {
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(presets)); } catch {}
}

function csvCell(value: string | null | undefined): string {
  const str = value ?? "";
  return `"${str.replace(/"/g, '""')}"`;
}

function exportCSV(tasks: Task[]) {
  const headers = ["শিরোনাম", "স্ট্যাটাস", "অগ্রাধিকার", "ক্যাটাগরি", "দায়িত্বপ্রাপ্ত", "ডেডলাইন", "ট্যাগ", "তৈরির তারিখ"];
  const statusMap: Record<string, string> = { todo: "করতে হবে", in_progress: "চলছে", review: "রিভিউ", done: "সম্পন্ন" };
  const priorityMap: Record<string, string> = { urgent: "জরুরি", high: "হাই", medium: "মিডিয়াম", low: "লো" };
  const categoryMap: Record<string, string> = { order: "অর্ডার", delivery: "ডেলিভারি", supplier: "সাপ্লায়ার", accounts: "একাউন্টস", general: "সাধারণ" };

  const rows = tasks.map(t => [
    csvCell(t.title),
    csvCell(statusMap[t.status] ?? t.status),
    csvCell(priorityMap[t.priority] ?? t.priority),
    csvCell(categoryMap[t.category] ?? t.category),
    csvCell(t.assignedTo?.name),
    csvCell(t.dueDate ? new Date(t.dueDate).toLocaleDateString("bn-BD") : ""),
    csvCell((t.tags ?? []).join(", ")),
    csvCell(new Date(t.createdAt).toLocaleDateString("bn-BD")),
  ]);

  const csv = [headers.map(h => csvCell(h)).join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function TasksContent() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [completedTodayFilter, setCompletedTodayFilter] = useState(false);
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [createInitialData, setCreateInitialData] = useState<CreateTaskData | undefined>(undefined);
  const [staffMembers, setStaffMembers] = useState<{ id: string; userId: string; user: { name: string } }[]>([]);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [summaryStats, setSummaryStats] = useState({ overdue: 0, today: 0, doneToday: 0 });
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const presetInputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilter =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    categoryFilter !== "all" ||
    assigneeFilter !== "all" ||
    dueDateFilter !== "all" ||
    myTasksOnly ||
    completedTodayFilter;

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    fetch("/api/staff").then(r => r.ok ? r.json() : []).then(data => {
      if (Array.isArray(data)) setStaffMembers(data);
    }).catch(() => {});
  }, []);

  const fetchSummaryStats = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [overdueRes, todayRes, doneTodayRes] = await Promise.all([
      fetch(`/api/tasks?all=1&dueDateTo=${now.toISOString()}`),
      fetch(`/api/tasks?all=1&dueDateFrom=${todayStart.toISOString()}&dueDateTo=${tomorrowStart.toISOString()}`),
      fetch(`/api/tasks?all=1&completedToday=1`),
    ]);

    const [overdueAll, todayAll, doneTodayAll] = await Promise.all([
      overdueRes.ok ? overdueRes.json() : [],
      todayRes.ok ? todayRes.json() : [],
      doneTodayRes.ok ? doneTodayRes.json() : [],
    ]);

    const overdueCount = (overdueAll as Task[]).filter(t => t.status !== "done").length;
    const todayCount = (todayAll as Task[]).filter(t => t.status !== "done").length;

    setSummaryStats({
      overdue: overdueCount,
      today: todayCount,
      doneToday: Array.isArray(doneTodayAll) ? doneTodayAll.length : 0,
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ all: "1" });
    if (completedTodayFilter) {
      params.set("completedToday", "1");
    } else {
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dueDateFilter === "today") {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        params.set("dueDateFrom", today.toISOString());
        params.set("dueDateTo", tomorrow.toISOString());
      } else if (dueDateFilter === "week") {
        const from = new Date(); from.setHours(0, 0, 0, 0);
        const to = new Date(from); to.setDate(to.getDate() + 7);
        params.set("dueDateFrom", from.toISOString());
        params.set("dueDateTo", to.toISOString());
      } else if (dueDateFilter === "overdue") {
        params.set("dueDateTo", new Date().toISOString());
      }
    }
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (myTasksOnly) {
      params.set("myTasks", "1");
    } else if (assigneeFilter !== "all") {
      params.set("assignedToId", assigneeFilter);
    }
    if (search) params.set("search", search);
    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
    setLoading(false);
  }, [statusFilter, priorityFilter, categoryFilter, assigneeFilter, search, dueDateFilter, myTasksOnly, completedTodayFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchSummaryStats(); }, [fetchSummaryStats]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : null }
          : t
      )
    );
    fetchSummaryStats();
  };

  const applyPreset = (preset: FilterPreset) => {
    setStatusFilter(preset.statusFilter);
    setPriorityFilter(preset.priorityFilter);
    setCategoryFilter(preset.categoryFilter);
    setDueDateFilter(preset.dueDateFilter);
    setMyTasksOnly(preset.myTasksOnly);
    setCompletedTodayFilter(false);
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated);
    savePresets(updated);
  };

  const saveCurrentPreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const newPreset: FilterPreset = {
      name, statusFilter, priorityFilter, categoryFilter, dueDateFilter, myTasksOnly,
    };
    const updated = [...presets.filter(p => p.name !== name), newPreset];
    setPresets(updated);
    savePresets(updated);
    setPresetName("");
    setSavingPreset(false);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setAssigneeFilter("all");
    setDueDateFilter("all");
    setMyTasksOnly(false);
    setCompletedTodayFilter(false);
  };

  const handleTemplateSelect = (template: TaskTemplate) => {
    setCreateInitialData({
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority,
      tags: template.tags,
      subtasks: template.subtasks,
    });
    setTemplateOpen(false);
    setCreateOpen(true);
  };

  const { overdue: overdueCount, today: todayCount, doneToday: doneTodayCount } = summaryStats;

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    primary: "var(--c-primary)",
    primaryLight: "var(--c-primary-light)",
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: S.text }}>টাস্ক ম্যানেজমেন্ট</h1>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>অর্ডার, ডেলিভারি, সাপ্লায়ার ও টিমের কাজ ট্র্যাক করুন</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(tasks)}
            title="CSV এক্সপোর্ট"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: S.border, color: S.muted, backgroundColor: S.surface }}
          >
            <Download size={14} />
            CSV
          </button>
          <button
            onClick={() => setTemplateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: "var(--c-primary)", color: "var(--c-primary)", backgroundColor: "var(--c-primary-light)" }}
          >
            <LayoutTemplate size={14} />
            টেমপ্লেট
          </button>
          <button
            onClick={() => { setCreateInitialData(undefined); setCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: S.primary }}
          >
            <Plus size={16} />
            নতুন টাস্ক
          </button>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      {view !== "reports" && (
        <div className="grid grid-cols-3 gap-3">
          {/* Overdue card */}
          <button
            onClick={() => { setDueDateFilter("overdue"); setStatusFilter("all"); setCompletedTodayFilter(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all hover:shadow-md"
            style={{
              borderColor: overdueCount > 0 ? "#FCA5A5" : S.border,
              backgroundColor: overdueCount > 0 ? "#FFF1F1" : S.surface,
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: overdueCount > 0 ? "#FEE2E2" : "#F3F4F6" }}
            >
              <AlertCircle size={18} style={{ color: overdueCount > 0 ? "#E24B4A" : "#9CA3AF" }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ color: overdueCount > 0 ? "#E24B4A" : S.muted }}>
                {overdueCount}
              </p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: overdueCount > 0 ? "#E24B4A" : S.muted }}>
                মেয়াদোত্তীর্ণ
              </p>
            </div>
          </button>

          {/* Today card */}
          <button
            onClick={() => { setDueDateFilter("today"); setStatusFilter("all"); setCompletedTodayFilter(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all hover:shadow-md"
            style={{
              borderColor: todayCount > 0 ? "#FCD34D" : S.border,
              backgroundColor: todayCount > 0 ? "#FEFCE8" : S.surface,
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: todayCount > 0 ? "#FEF3C7" : "#F3F4F6" }}
            >
              <Clock size={18} style={{ color: todayCount > 0 ? "#CA8A04" : "#9CA3AF" }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ color: todayCount > 0 ? "#CA8A04" : S.muted }}>
                {todayCount}
              </p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: todayCount > 0 ? "#CA8A04" : S.muted }}>
                আজকের টাস্ক
              </p>
            </div>
          </button>

          {/* Done today card */}
          <button
            onClick={() => { setCompletedTodayFilter(true); setStatusFilter("all"); setDueDateFilter("all"); }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all hover:shadow-md"
            style={{
              borderColor: doneTodayCount > 0 ? "#6EE7B7" : S.border,
              backgroundColor: doneTodayCount > 0 ? "#F0FDF4" : S.surface,
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: doneTodayCount > 0 ? "#DCFCE7" : "#F3F4F6" }}
            >
              <CheckCircle2 size={18} style={{ color: doneTodayCount > 0 ? "#16A34A" : "#9CA3AF" }} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ color: doneTodayCount > 0 ? "#16A34A" : S.muted }}>
                {doneTodayCount}
              </p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: doneTodayCount > 0 ? "#16A34A" : S.muted }}>
                আজ সম্পন্ন
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ── Saved filter presets row ── */}
      {view !== "reports" && presets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: S.muted }}>প্রিসেট:</span>
          {presets.map(preset => (
            <div
              key={preset.name}
              className="flex items-center rounded-xl border overflow-hidden"
              style={{ borderColor: S.border, backgroundColor: S.surface }}
            >
              <button
                onClick={() => applyPreset(preset)}
                className="text-xs font-medium px-3 py-1.5 transition-opacity hover:opacity-70"
                style={{ color: "var(--c-primary)" }}
              >
                {preset.name}
              </button>
              <button
                onClick={() => deletePreset(preset.name)}
                className="px-2 py-1.5 hover:opacity-70"
              >
                <X size={11} style={{ color: S.muted }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Controls bar ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: S.border, backgroundColor: S.surface }}
      >
        {/* Top strip: view tabs */}
        <div
          className="flex items-stretch border-b"
          style={{ borderColor: S.border, backgroundColor: "#F7F6F2" }}
        >
          {[
            { mode: "kanban" as ViewMode, icon: LayoutGrid, label: "কানবান" },
            { mode: "list" as ViewMode, icon: List, label: "লিস্ট" },
            { mode: "calendar" as ViewMode, icon: CalendarDays, label: "ক্যালেন্ডার" },
            { mode: "reports" as ViewMode, icon: BarChart2, label: "রিপোর্ট" },
          ].map(({ mode, icon: Icon, label }, idx, arr) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all relative flex-1 justify-center"
              style={{
                backgroundColor: view === mode ? S.surface : "transparent",
                color: view === mode ? S.primary : S.muted,
                borderRight: idx < arr.length - 1 ? `1px solid var(--c-border)` : "none",
                boxShadow: view === mode ? "inset 0 -2px 0 var(--c-primary)" : "none",
              }}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Bottom strip: search + actions */}
        {view !== "reports" && (
          <div className="flex items-center gap-2 px-4 py-2.5">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="টাস্ক খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none"
                style={{ borderColor: S.border, backgroundColor: "#F7F6F2", color: S.text }}
              />
            </div>

            {/* Divider */}
            <div className="w-px h-6 flex-shrink-0" style={{ backgroundColor: S.border }} />

            {/* My tasks toggle */}
            <button
              onClick={() => setMyTasksOnly(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex-shrink-0"
              style={{
                borderColor: myTasksOnly ? S.primary : S.border,
                backgroundColor: myTasksOnly ? S.primaryLight : "transparent",
                color: myTasksOnly ? S.primary : S.muted,
              }}
            >
              <User size={13} />
              আমার টাস্ক
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex-shrink-0"
              style={{
                borderColor: hasActiveFilter ? S.primary : S.border,
                backgroundColor: filterOpen || hasActiveFilter ? S.primaryLight : "transparent",
                color: hasActiveFilter || filterOpen ? S.primary : S.muted,
              }}
            >
              <SlidersHorizontal size={13} />
              ফিল্টার
              {hasActiveFilter && (
                <span
                  className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: S.primary, color: "#fff" }}
                >
                  !
                </span>
              )}
              {filterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Clear filters */}
            {hasActiveFilter && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl border transition-opacity hover:opacity-70 flex-shrink-0"
                style={{ color: "#E24B4A", borderColor: "#FCA5A5", backgroundColor: "#FFF1F1" }}
              >
                <X size={12} />
                রিসেট
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Collapsible filter panel ── */}
      {view !== "reports" && filterOpen && (
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: S.border, backgroundColor: S.surface }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: S.muted }}>স্ট্যাটাস:</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCompletedTodayFilter(false); }}
              className="text-xs rounded-lg border px-2 py-1.5"
              style={{ borderColor: S.border, backgroundColor: "#F7F6F2", color: S.text }}
            >
              <option value="all">সব</option>
              <option value="todo">করতে হবে</option>
              <option value="in_progress">চলছে</option>
              <option value="review">রিভিউ</option>
              <option value="done">সম্পন্ন</option>
            </select>

            <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: S.muted }}>অগ্রাধিকার:</span>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="text-xs rounded-lg border px-2 py-1.5"
              style={{ borderColor: S.border, backgroundColor: "#F7F6F2", color: S.text }}
            >
              <option value="all">সব</option>
              <option value="urgent">জরুরি</option>
              <option value="high">হাই</option>
              <option value="medium">মিডিয়াম</option>
              <option value="low">লো</option>
            </select>

            <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: S.muted }}>ক্যাটাগরি:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs rounded-lg border px-2 py-1.5"
              style={{ borderColor: S.border, backgroundColor: "#F7F6F2", color: S.text }}
            >
              <option value="all">সব</option>
              <option value="order">অর্ডার</option>
              <option value="delivery">ডেলিভারি</option>
              <option value="supplier">সাপ্লায়ার</option>
              <option value="accounts">একাউন্টস</option>
              <option value="general">সাধারণ</option>
            </select>

            {staffMembers.length > 0 && !myTasksOnly && (
              <>
                <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত:</span>
                <select
                  value={assigneeFilter}
                  onChange={e => setAssigneeFilter(e.target.value)}
                  className="text-xs rounded-lg border px-2 py-1.5"
                  style={{ borderColor: S.border, backgroundColor: "#F7F6F2", color: S.text }}
                >
                  <option value="all">সবাই</option>
                  <option value="unassigned">অ্যাসাইন হয়নি</option>
                  {staffMembers.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </>
            )}

            <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: S.muted }}>তারিখ:</span>
            <select
              value={dueDateFilter}
              onChange={e => { setDueDateFilter(e.target.value); setCompletedTodayFilter(false); }}
              className="text-xs rounded-lg border px-2 py-1.5"
              style={{ borderColor: S.border, backgroundColor: "#F7F6F2", color: S.text }}
            >
              <option value="all">সব</option>
              <option value="today">আজ</option>
              <option value="week">এই সপ্তাহ</option>
              <option value="overdue">মেয়াদোত্তীর্ণ</option>
            </select>
          </div>

          {/* Save preset row */}
          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: S.border }}>
            {savingPreset ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={presetInputRef}
                  type="text"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveCurrentPreset(); if (e.key === "Escape") setSavingPreset(false); }}
                  placeholder="প্রিসেটের নাম..."
                  className="text-xs bg-transparent outline-none border rounded-lg px-3 py-1.5 w-36"
                  style={{ borderColor: S.border, color: S.text }}
                  autoFocus
                />
                <button onClick={saveCurrentPreset} className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: S.primary, color: "#fff" }}>সেভ</button>
                <button onClick={() => setSavingPreset(false)} className="text-xs px-1.5 py-1.5 rounded-lg" style={{ color: S.muted }}>বাতিল</button>
              </div>
            ) : (
              <button
                onClick={() => setSavingPreset(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-80"
                style={{ borderColor: S.border, color: S.muted, backgroundColor: "#F7F6F2" }}
              >
                <BookmarkPlus size={12} />
                বর্তমান ফিল্টার সেভ করুন
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Views ── */}
      {view === "reports" ? (
        <TaskReports />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: S.primary }} />
        </div>
      ) : (
        <>
          {view === "kanban" && (
            <TaskKanban
              tasks={tasks}
              onTaskClick={setSelectedTaskId}
              onStatusChange={handleStatusChange}
              onRefresh={() => { fetchTasks(); fetchSummaryStats(); }}
            />
          )}
          {view === "list" && (
            <TaskList
              tasks={tasks}
              onTaskClick={setSelectedTaskId}
              onStatusChange={handleStatusChange}
              onRefresh={() => { fetchTasks(); fetchSummaryStats(); }}
            />
          )}
          {view === "calendar" && (
            <TaskCalendar
              tasks={tasks}
              onTaskClick={setSelectedTaskId}
            />
          )}
        </>
      )}

      {/* Task Detail Panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={() => { fetchTasks(); fetchSummaryStats(); }}
        />
      )}

      {/* Template picker */}
      {templateOpen && (
        <TaskTemplatesModal
          onSelect={handleTemplateSelect}
          onClose={() => setTemplateOpen(false)}
        />
      )}

      {/* Create Task Modal */}
      {createOpen && (
        <CreateTaskModal
          onClose={() => { setCreateOpen(false); setCreateInitialData(undefined); }}
          onCreated={() => { setCreateOpen(false); setCreateInitialData(undefined); fetchTasks(); fetchSummaryStats(); }}
          initialData={createInitialData}
        />
      )}

      {/* Floating Timer */}
      <FloatingTimer />
    </div>
  );
}

export default function TasksPage() {
  const { loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--c-primary)" }} />
      </div>
    );
  }

  return (
    <PlanGate feature="taskManagement">
      <TaskTimerProvider>
        <TasksContent />
      </TaskTimerProvider>
    </PlanGate>
  );
}
