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
  LayoutGrid, List, CalendarDays, BarChart2, Plus, Search,
  SlidersHorizontal, Download, User, BookmarkPlus, X,
  AlertCircle, Clock, CheckCircle2, LayoutTemplate,
  ChevronDown, ChevronUp, ClipboardList, Zap, Activity,
  TrendingUp, Users, Tag as TagIcon, Loader2, ArrowRight,
  Flame,
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

type ViewMode = "kanban" | "list" | "calendar" | "reports" | "activity";

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
    csvCell(t.title), csvCell(statusMap[t.status] ?? t.status),
    csvCell(priorityMap[t.priority] ?? t.priority), csvCell(categoryMap[t.category] ?? t.category),
    csvCell(t.assignedTo?.name),
    csvCell(t.dueDate ? new Date(t.dueDate).toLocaleDateString("bn-BD") : ""),
    csvCell((t.tags ?? []).join(", ")),
    csvCell(new Date(t.createdAt).toLocaleDateString("bn-BD")),
  ]);
  const csv = [headers.map(h => csvCell(h)).join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  bg: "var(--c-bg)",
};

function PillFilter({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; color?: string; bg?: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: S.muted }}>{label}</span>
      <div className="flex items-center gap-1 flex-wrap">
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <button key={opt.value} onClick={() => onChange(opt.value)}
              className="px-3 py-1 rounded-full text-[11px] font-bold border transition-all"
              style={{
                backgroundColor: active ? (opt.bg ?? "var(--c-primary-light)") : "transparent",
                color: active ? (opt.color ?? "var(--c-primary)") : S.muted,
                borderColor: active ? (opt.color ?? "var(--c-primary)") : S.border,
                boxShadow: active ? `0 1px 6px ${opt.color ?? "var(--c-primary)"}30` : "none",
              }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const [tagFilter, setTagFilter] = useState("all");
  const [focusMode, setFocusMode] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAdding, setQuickAdding] = useState(false);
  const [activityFeed, setActivityFeed] = useState<{id:string;title:string;action:string;at:string;by:string;priority:string;status:string}[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const presetInputRef = useRef<HTMLInputElement>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const hasActiveFilter = statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all" ||
    assigneeFilter !== "all" || dueDateFilter !== "all" || myTasksOnly || completedTodayFilter ||
    tagFilter !== "all" || focusMode;

  useEffect(() => { setPresets(loadPresets()); }, []);

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
    setSummaryStats({
      overdue: (overdueAll as Task[]).filter(t => t.status !== "done").length,
      today: (todayAll as Task[]).filter(t => t.status !== "done").length,
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
        params.set("dueDateFrom", today.toISOString()); params.set("dueDateTo", tomorrow.toISOString());
      } else if (dueDateFilter === "3days") {
        const from = new Date(); from.setHours(0, 0, 0, 0);
        const to = new Date(from); to.setDate(to.getDate() + 3);
        params.set("dueDateFrom", from.toISOString()); params.set("dueDateTo", to.toISOString());
      } else if (dueDateFilter === "week") {
        const from = new Date(); from.setHours(0, 0, 0, 0);
        const to = new Date(from); to.setDate(to.getDate() + 7);
        params.set("dueDateFrom", from.toISOString()); params.set("dueDateTo", to.toISOString());
      } else if (dueDateFilter === "overdue") {
        params.set("dueDateTo", new Date().toISOString());
      }
    }
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (myTasksOnly) params.set("myTasks", "1");
    else if (assigneeFilter !== "all") params.set("assignedToId", assigneeFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, [statusFilter, priorityFilter, categoryFilter, assigneeFilter, search, dueDateFilter, myTasksOnly, completedTodayFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchSummaryStats(); }, [fetchSummaryStats]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : null }
      : t));
    fetchSummaryStats();
  };

  const applyPreset = (preset: FilterPreset) => {
    setStatusFilter(preset.statusFilter); setPriorityFilter(preset.priorityFilter);
    setCategoryFilter(preset.categoryFilter); setDueDateFilter(preset.dueDateFilter);
    setMyTasksOnly(preset.myTasksOnly); setCompletedTodayFilter(false);
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated); savePresets(updated);
  };

  const saveCurrentPreset = () => {
    const name = presetName.trim(); if (!name) return;
    const newPreset: FilterPreset = { name, statusFilter, priorityFilter, categoryFilter, dueDateFilter, myTasksOnly };
    const updated = [...presets.filter(p => p.name !== name), newPreset];
    setPresets(updated); savePresets(updated); setPresetName(""); setSavingPreset(false);
  };

  const clearFilters = () => {
    setStatusFilter("all"); setPriorityFilter("all"); setCategoryFilter("all");
    setAssigneeFilter("all"); setDueDateFilter("all"); setMyTasksOnly(false); setCompletedTodayFilter(false);
    setTagFilter("all"); setFocusMode(false);
  };

  const quickAddTask = async () => {
    const title = quickAddTitle.trim();
    if (!title) return;
    setQuickAdding(true);
    await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status: "todo", priority: "medium", category: "general" }),
    });
    setQuickAddTitle("");
    setQuickAdding(false);
    fetchTasks(); fetchSummaryStats();
  };

  const fetchActivityFeed = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await fetch("/api/tasks?all=1&limit=50");
      if (res.ok) {
        const data: Task[] = await res.json();
        const recent = [...data]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 20)
          .map(t => ({
            id: t.id, title: t.title, priority: t.priority, status: t.status,
            action: t.status === "done" ? "সম্পন্ন করেছেন" : t.status === "in_progress" ? "শুরু করেছেন" : "আপডেট করেছেন",
            at: t.updatedAt, by: t.assignedTo?.name ?? t.user?.name ?? "আপনি",
          }));
        setActivityFeed(recent);
      }
    } catch {}
    setActivityLoading(false);
  }, []);

  useEffect(() => {
    if (view === "activity") fetchActivityFeed();
  }, [view, fetchActivityFeed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setCreateInitialData(undefined); setCreateOpen(true); }
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setFilterOpen(v => !v); }
      if (e.key === "Escape") { setSelectedTaskId(null); setCreateOpen(false); setTemplateOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleTemplateSelect = (template: TaskTemplate) => {
    setCreateInitialData({
      title: template.title, description: template.description,
      category: template.category, priority: template.priority,
      tags: template.tags, subtasks: template.subtasks,
    });
    setTemplateOpen(false); setCreateOpen(true);
  };

  const { overdue: overdueCount, today: todayCount, doneToday: doneTodayCount } = summaryStats;
  const totalTasks = tasks.length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const donePercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const VIEW_TABS = [
    { mode: "kanban" as ViewMode, icon: LayoutGrid, label: "কানবান", color: "#8B5CF6", bg: "#F5F3FF" },
    { mode: "list" as ViewMode, icon: List, label: "লিস্ট", color: "#3B82F6", bg: "#EFF6FF" },
    { mode: "calendar" as ViewMode, icon: CalendarDays, label: "ক্যালেন্ডার", color: "#0F6E56", bg: "#E8F5F0" },
    { mode: "reports" as ViewMode, icon: BarChart2, label: "রিপোর্ট", color: "#EF4444", bg: "#FEF2F2" },
    { mode: "activity" as ViewMode, icon: Activity, label: "অ্যাক্টিভিটি", color: "#F59E0B", bg: "#FFFBEB" },
  ];

  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags ?? []))).filter(Boolean);
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const urgentCount = tasks.filter(t => t.priority === "urgent" && t.status !== "done").length;

  const workload = staffMembers.map(m => ({
    name: m.user.name,
    count: tasks.filter(t => t.assignedToId === m.userId && t.status !== "done").length,
  })).filter(w => w.count > 0).sort((a, b) => b.count - a.count);

  const displayedTasks = focusMode
    ? tasks.filter(t => (t.priority === "urgent" || t.priority === "high") && t.status !== "done")
    : tagFilter !== "all"
      ? tasks.filter(t => (t.tags ?? []).includes(tagFilter))
      : tasks;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>
            <ClipboardList size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: S.text }}>টাস্ক ম্যানেজমেন্ট</h1>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: S.muted }}>অর্ডার, ডেলিভারি, সাপ্লায়ার ও টিমের কাজ ট্র্যাক করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(tasks)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
            style={{ borderColor: S.border, color: S.muted, backgroundColor: S.surface }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={() => setTemplateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
            style={{ borderColor: "#8B5CF6", color: "#8B5CF6", backgroundColor: "#F5F3FF" }}>
            <LayoutTemplate size={13} /> টেমপ্লেট
          </button>
          <button onClick={() => { setCreateInitialData(undefined); setCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 shadow-md"
            style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>
            <Plus size={16} /> নতুন টাস্ক
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {view !== "reports" && view !== "activity" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          {/* Total / Progress */}
          <div className="col-span-2 sm:col-span-1 rounded-2xl p-4 border relative overflow-hidden"
            style={{ borderColor: "#A7F3D0", background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
              style={{ backgroundColor: "#059669", transform: "translate(30%, -30%)" }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "#059669" }}>মোট টাস্ক</p>
            <p className="text-3xl font-black leading-none" style={{ color: "#059669" }}>{totalTasks}</p>
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: "#059669" }}>
                <span>সম্পন্ন</span><span>{donePercent}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#A7F3D0" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${donePercent}%`, background: "linear-gradient(90deg, #059669, #10B981)" }} />
              </div>
            </div>
          </div>

          {/* Overdue */}
          <button onClick={() => { setDueDateFilter("overdue"); setStatusFilter("all"); setCompletedTodayFilter(false); }}
            className="rounded-2xl p-4 border text-left transition-all hover:shadow-lg active:scale-95 relative overflow-hidden"
            style={{
              borderColor: overdueCount > 0 ? "#FCA5A5" : S.border,
              background: overdueCount > 0 ? "linear-gradient(135deg, #FFF1F1, #FEE2E2)" : S.surface,
            }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: overdueCount > 0 ? "#EF4444" : "#9CA3AF", transform: "translate(30%, -30%)" }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: overdueCount > 0 ? "#FEE2E2" : "#F3F4F6" }}>
              <AlertCircle size={16} style={{ color: overdueCount > 0 ? "#EF4444" : "#9CA3AF" }} />
            </div>
            <p className="text-2xl font-black leading-none" style={{ color: overdueCount > 0 ? "#EF4444" : S.muted }}>{overdueCount}</p>
            <p className="text-[11px] font-bold mt-1" style={{ color: overdueCount > 0 ? "#EF4444" : S.muted }}>মেয়াদোত্তীর্ণ</p>
          </button>

          {/* Today */}
          <button onClick={() => { setDueDateFilter("today"); setStatusFilter("all"); setCompletedTodayFilter(false); }}
            className="rounded-2xl p-4 border text-left transition-all hover:shadow-lg active:scale-95 relative overflow-hidden"
            style={{
              borderColor: todayCount > 0 ? "#FCD34D" : S.border,
              background: todayCount > 0 ? "linear-gradient(135deg, #FEFCE8, #FEF3C7)" : S.surface,
            }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: todayCount > 0 ? "#F59E0B" : "#9CA3AF", transform: "translate(30%, -30%)" }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: todayCount > 0 ? "#FEF3C7" : "#F3F4F6" }}>
              <Clock size={16} style={{ color: todayCount > 0 ? "#CA8A04" : "#9CA3AF" }} />
            </div>
            <p className="text-2xl font-black leading-none" style={{ color: todayCount > 0 ? "#CA8A04" : S.muted }}>{todayCount}</p>
            <p className="text-[11px] font-bold mt-1" style={{ color: todayCount > 0 ? "#CA8A04" : S.muted }}>আজকের টাস্ক</p>
          </button>

          {/* Done today */}
          <button onClick={() => { setCompletedTodayFilter(true); setStatusFilter("all"); setDueDateFilter("all"); }}
            className="rounded-2xl p-4 border text-left transition-all hover:shadow-lg active:scale-95 relative overflow-hidden"
            style={{
              borderColor: doneTodayCount > 0 ? "#6EE7B7" : S.border,
              background: doneTodayCount > 0 ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)" : S.surface,
            }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: doneTodayCount > 0 ? "#10B981" : "#9CA3AF", transform: "translate(30%, -30%)" }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: doneTodayCount > 0 ? "#DCFCE7" : "#F3F4F6" }}>
              <CheckCircle2 size={16} style={{ color: doneTodayCount > 0 ? "#16A34A" : "#9CA3AF" }} />
            </div>
            <p className="text-2xl font-black leading-none" style={{ color: doneTodayCount > 0 ? "#16A34A" : S.muted }}>{doneTodayCount}</p>
            <p className="text-[11px] font-bold mt-1" style={{ color: doneTodayCount > 0 ? "#16A34A" : S.muted }}>আজ সম্পন্ন</p>
          </button>

          {/* In Progress */}
          <button onClick={() => { setStatusFilter("in_progress"); setCompletedTodayFilter(false); setDueDateFilter("all"); }}
            className="rounded-2xl p-4 border text-left transition-all hover:shadow-lg active:scale-95 relative overflow-hidden"
            style={{
              borderColor: inProgressCount > 0 ? "#93C5FD" : S.border,
              background: inProgressCount > 0 ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)" : S.surface,
            }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: "#3B82F6", transform: "translate(30%, -30%)" }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: inProgressCount > 0 ? "#DBEAFE" : "#F3F4F6" }}>
              <TrendingUp size={16} style={{ color: inProgressCount > 0 ? "#3B82F6" : "#9CA3AF" }} />
            </div>
            <p className="text-2xl font-black leading-none" style={{ color: inProgressCount > 0 ? "#3B82F6" : S.muted }}>{inProgressCount}</p>
            <p className="text-[11px] font-bold mt-1" style={{ color: inProgressCount > 0 ? "#3B82F6" : S.muted }}>চলছে</p>
          </button>

          {/* Urgent */}
          <button onClick={() => { setPriorityFilter("urgent"); setStatusFilter("all"); setCompletedTodayFilter(false); setDueDateFilter("all"); }}
            className="rounded-2xl p-4 border text-left transition-all hover:shadow-lg active:scale-95 relative overflow-hidden"
            style={{
              borderColor: urgentCount > 0 ? "#FCA5A5" : S.border,
              background: urgentCount > 0 ? "linear-gradient(135deg, #FFF5F5, #FEE2E2)" : S.surface,
            }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ backgroundColor: "#DC2626", transform: "translate(30%, -30%)" }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: urgentCount > 0 ? "#FEE2E2" : "#F3F4F6" }}>
              <Flame size={16} style={{ color: urgentCount > 0 ? "#DC2626" : "#9CA3AF" }} />
            </div>
            <p className="text-2xl font-black leading-none" style={{ color: urgentCount > 0 ? "#DC2626" : S.muted }}>{urgentCount}</p>
            <p className="text-[11px] font-bold mt-1" style={{ color: urgentCount > 0 ? "#DC2626" : S.muted }}>জরুরি</p>
          </button>
        </div>
      )}

      {/* ── View Tabs + Search bar ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
        {/* Tab row */}
        <div className="flex items-stretch border-b" style={{ borderColor: S.border, backgroundColor: S.bg }}>
          {VIEW_TABS.map(({ mode, icon: Icon, label, color, bg }, idx, arr) => {
            const isActive = view === mode;
            return (
              <button key={mode} onClick={() => setView(mode)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all flex-1 justify-center relative"
                style={{
                  backgroundColor: isActive ? bg : "transparent",
                  color: isActive ? color : S.muted,
                  borderRight: idx < arr.length - 1 ? `1px solid var(--c-border)` : "none",
                }}>
                <Icon size={15} />
                <span>{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor: color }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Search + filter strip */}
        {view !== "reports" && view !== "activity" && (
          <div className="space-y-0">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="টাস্ক খুঁজুন... (N = নতুন টাস্ক, F = ফিল্টার)"
                  className="w-full pl-9 pr-3 h-9 text-sm rounded-xl border outline-none transition-all focus:ring-2"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div className="w-px h-6 flex-shrink-0" style={{ backgroundColor: S.border }} />
              <button onClick={() => setMyTasksOnly(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0"
                style={{
                  borderColor: myTasksOnly ? "#0F6E56" : S.border,
                  backgroundColor: myTasksOnly ? "#E8F5F0" : "transparent",
                  color: myTasksOnly ? "#0F6E56" : S.muted,
                }}>
                <User size={13} /> আমার টাস্ক
              </button>
              <button onClick={() => setFocusMode(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0"
                style={{
                  borderColor: focusMode ? "#DC2626" : S.border,
                  backgroundColor: focusMode ? "#FEE2E2" : "transparent",
                  color: focusMode ? "#DC2626" : S.muted,
                }}
                title="জরুরি ও হাই priority task দেখান">
                <Zap size={13} /> ফোকাস
              </button>
              <button onClick={() => setFilterOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0"
                style={{
                  borderColor: hasActiveFilter ? "#0F6E56" : S.border,
                  backgroundColor: filterOpen || hasActiveFilter ? "#E8F5F0" : "transparent",
                  color: hasActiveFilter || filterOpen ? "#0F6E56" : S.muted,
                }}>
                <SlidersHorizontal size={13} />
                ফিল্টার
                {hasActiveFilter && (
                  <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{ backgroundColor: "#0F6E56", color: "#fff" }}>!</span>
                )}
                {filterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {hasActiveFilter && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border transition-opacity hover:opacity-70 flex-shrink-0"
                  style={{ color: "#EF4444", borderColor: "#FCA5A5", backgroundColor: "#FFF1F1" }}>
                  <X size={12} /> রিসেট
                </button>
              )}
            </div>

            {/* Quick Add Bar */}
            <div className="flex items-center gap-2 px-4 pb-2.5 border-t" style={{ borderColor: S.border, paddingTop: "10px" }}>
              <Plus size={14} style={{ color: S.muted, flexShrink: 0 }} />
              <input
                ref={quickAddRef}
                type="text"
                value={quickAddTitle}
                onChange={e => setQuickAddTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") quickAddTask(); }}
                placeholder="দ্রুত টাস্ক যোগ করুন — শিরোনাম লিখে Enter চাপুন..."
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: S.text }}
                disabled={quickAdding}
              />
              {quickAddTitle.trim() && (
                <button onClick={quickAddTask} disabled={quickAdding}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)", color: "#fff" }}>
                  {quickAdding ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                  যোগ করুন
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Saved Presets ── */}
      {view !== "reports" && presets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: S.muted }}>📌 প্রিসেট:</span>
          {presets.map(preset => (
            <div key={preset.name}
              className="flex items-center rounded-2xl border overflow-hidden"
              style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <button onClick={() => applyPreset(preset)}
                className="text-xs font-bold px-3 py-1.5 transition-opacity hover:opacity-70"
                style={{ color: "#0F6E56" }}>
                {preset.name}
              </button>
              <button onClick={() => deletePreset(preset.name)} className="px-2 py-1.5 hover:opacity-70">
                <X size={11} style={{ color: S.muted }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Collapsible Filter Panel ── */}
      {view !== "reports" && filterOpen && (
        <div className="rounded-2xl border p-4 space-y-4" style={{ borderColor: S.border, backgroundColor: S.surface }}>

          <PillFilter label="স্ট্যাটাস" value={statusFilter}
            onChange={v => { setStatusFilter(v); setCompletedTodayFilter(false); }}
            options={[
              { value: "all", label: "সব" },
              { value: "todo", label: "করতে হবে", color: "#6B7280", bg: "#F3F4F6" },
              { value: "in_progress", label: "চলছে", color: "#3B82F6", bg: "#EFF6FF" },
              { value: "review", label: "রিভিউ", color: "#F59E0B", bg: "#FFFBEB" },
              { value: "done", label: "সম্পন্ন", color: "#10B981", bg: "#F0FDF4" },
            ]}
          />

          <PillFilter label="অগ্রাধিকার" value={priorityFilter} onChange={setPriorityFilter}
            options={[
              { value: "all", label: "সব" },
              { value: "urgent", label: "🔥 জরুরি", color: "#DC2626", bg: "#FEE2E2" },
              { value: "high", label: "⬆ হাই", color: "#EA580C", bg: "#FFEDD5" },
              { value: "medium", label: "➡ মিডিয়াম", color: "#CA8A04", bg: "#FEF9C3" },
              { value: "low", label: "⬇ লো", color: "#16A34A", bg: "#DCFCE7" },
            ]}
          />

          <PillFilter label="ক্যাটাগরি" value={categoryFilter} onChange={setCategoryFilter}
            options={[
              { value: "all", label: "সব" },
              { value: "order", label: "📦 অর্ডার", color: "#0F6E56", bg: "#E8F5F0" },
              { value: "delivery", label: "🚚 ডেলিভারি", color: "#3B82F6", bg: "#EFF6FF" },
              { value: "supplier", label: "🏭 সাপ্লায়ার", color: "#8B5CF6", bg: "#F5F3FF" },
              { value: "accounts", label: "💰 একাউন্টস", color: "#D97706", bg: "#FEF3C7" },
              { value: "general", label: "📋 সাধারণ", color: "#6B7280", bg: "#F3F4F6" },
            ]}
          />

          <PillFilter label="তারিখ" value={dueDateFilter}
            onChange={v => { setDueDateFilter(v); setCompletedTodayFilter(false); }}
            options={[
              { value: "all", label: "সব" },
              { value: "today", label: "📅 আজ", color: "#CA8A04", bg: "#FEF3C7" },
              { value: "3days", label: "📆 ৩ দিন", color: "#8B5CF6", bg: "#F5F3FF" },
              { value: "week", label: "🗓 এই সপ্তাহ", color: "#3B82F6", bg: "#EFF6FF" },
              { value: "overdue", label: "⚠ মেয়াদোত্তীর্ণ", color: "#EF4444", bg: "#FEF2F2" },
            ]}
          />

          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0 flex items-center gap-1" style={{ color: S.muted }}>
                <TagIcon size={10} /> ট্যাগ
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setTagFilter("all")}
                  className="px-3 py-1 rounded-full text-[11px] font-bold border transition-all"
                  style={{
                    backgroundColor: tagFilter === "all" ? "#E8F5F0" : "transparent",
                    color: tagFilter === "all" ? "#0F6E56" : S.muted,
                    borderColor: tagFilter === "all" ? "#0F6E56" : S.border,
                  }}>সব</button>
                {allTags.map(tag => (
                  <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)}
                    className="px-3 py-1 rounded-full text-[11px] font-bold border transition-all"
                    style={{
                      backgroundColor: tagFilter === tag ? "#F5F3FF" : "transparent",
                      color: tagFilter === tag ? "#8B5CF6" : S.muted,
                      borderColor: tagFilter === tag ? "#8B5CF6" : S.border,
                    }}>#{tag}</button>
                ))}
              </div>
            </div>
          )}

          {workload.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: S.muted }}>
                <Users size={10} /> দলের ওয়ার্কলোড
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {workload.map(w => (
                  <div key={w.name} className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                    style={{ borderColor: S.border, backgroundColor: S.bg }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                      style={{ backgroundColor: "#0F6E56" }}>
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: S.text }}>{w.name}</p>
                      <p className="text-[10px]" style={{ color: S.muted }}>{w.count}টি টাস্ক</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staffMembers.length > 0 && !myTasksOnly && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত</span>
              <div className="flex items-center gap-1 flex-wrap">
                {[{ value: "all", label: "সবাই" }, { value: "unassigned", label: "অ্যাসাইন হয়নি" },
                  ...staffMembers.map(m => ({ value: m.userId, label: m.user.name }))].map(opt => (
                  <button key={opt.value} onClick={() => setAssigneeFilter(opt.value)}
                    className="px-3 py-1 rounded-full text-[11px] font-bold border transition-all"
                    style={{
                      backgroundColor: assigneeFilter === opt.value ? "#E8F5F0" : "transparent",
                      color: assigneeFilter === opt.value ? "#0F6E56" : S.muted,
                      borderColor: assigneeFilter === opt.value ? "#0F6E56" : S.border,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save preset row */}
          <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: S.border }}>
            {savingPreset ? (
              <div className="flex items-center gap-2">
                <input ref={presetInputRef} type="text" value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveCurrentPreset(); if (e.key === "Escape") setSavingPreset(false); }}
                  placeholder="প্রিসেটের নাম..."
                  className="text-xs bg-transparent outline-none border rounded-xl px-3 py-1.5 w-40"
                  style={{ borderColor: S.border, color: S.text }} autoFocus />
                <button onClick={saveCurrentPreset}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl"
                  style={{ backgroundColor: "#0F6E56", color: "#fff" }}>সেভ</button>
                <button onClick={() => setSavingPreset(false)}
                  className="text-xs px-2 py-1.5 rounded-xl"
                  style={{ color: S.muted }}>বাতিল</button>
              </div>
            ) : (
              <button onClick={() => setSavingPreset(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-opacity hover:opacity-80"
                style={{ borderColor: S.border, color: S.muted, backgroundColor: S.bg }}>
                <BookmarkPlus size={12} /> বর্তমান ফিল্টার সেভ করুন
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Views ── */}
      {view === "reports" ? (
        <TaskReports />
      ) : view === "activity" ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)" }}>
                <Activity size={14} style={{ color: "#F59E0B" }} />
              </div>
              <span className="text-sm font-extrabold" style={{ color: S.text }}>সাম্প্রতিক অ্যাক্টিভিটি</span>
            </div>
            <button onClick={fetchActivityFeed} disabled={activityLoading}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-all hover:opacity-80"
              style={{ borderColor: S.border, color: S.muted, backgroundColor: S.bg }}>
              {activityLoading ? "লোড হচ্ছে..." : "🔄 রিফ্রেশ"}
            </button>
          </div>

          {activityLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: S.bg }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded-full w-3/4" style={{ backgroundColor: S.bg }} />
                    <div className="h-2 rounded-full w-1/3" style={{ backgroundColor: S.bg }} />
                  </div>
                </div>
              ))}
            </div>
          ) : activityFeed.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)" }}>
                <Activity size={22} style={{ color: "#F59E0B" }} />
              </div>
              <p className="text-sm font-bold" style={{ color: S.text }}>কোনো অ্যাক্টিভিটি নেই</p>
              <p className="text-xs mt-1" style={{ color: S.muted }}>টাস্ক তৈরি বা আপডেট করলে এখানে দেখাবে</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: S.border }}>
              {activityFeed.map((item, i) => {
                const STATUS_COLORS: Record<string, string> = { done: "#16A34A", in_progress: "#3B82F6", review: "#F59E0B", todo: "#6B7280" };
                const PRIORITY_COLORS_MAP: Record<string, string> = { urgent: "#DC2626", high: "#EA580C", medium: "#CA8A04", low: "#16A34A" };
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(item.at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return "এইমাত্র";
                  if (mins < 60) return `${mins} মিনিট আগে`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
                  return `${Math.floor(hrs / 24)} দিন আগে`;
                })();
                return (
                  <div key={item.id} onClick={() => setSelectedTaskId(item.id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ backgroundColor: i % 2 === 0 ? S.surface : S.bg }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#F0FDF7"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = i % 2 === 0 ? S.surface : S.bg}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[item.status] ?? "#6B7280" }}>
                      {item.by.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: S.text }}>
                        <span style={{ color: "#0F6E56" }}>{item.by}</span> {item.action}
                      </p>
                      <p className="text-xs truncate" style={{ color: S.muted }}>{item.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLORS_MAP[item.priority] + "20", color: PRIORITY_COLORS_MAP[item.priority] }}>
                        {item.priority === "urgent" ? "🔥" : item.priority === "high" ? "⬆" : item.priority === "medium" ? "➡" : "⬇"}
                      </span>
                      <span className="text-[10px]" style={{ color: S.muted }}>{timeAgo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="rounded-2xl border overflow-hidden p-8 space-y-3 animate-pulse"
          style={{ borderColor: S.border, backgroundColor: S.surface }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex-shrink-0" style={{ backgroundColor: S.bg }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: S.bg }} />
                <div className="h-2.5 rounded-full w-1/3" style={{ backgroundColor: S.bg }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {focusMode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold"
              style={{ borderColor: "#FCA5A5", backgroundColor: "#FFF1F1", color: "#DC2626" }}>
              <Zap size={13} /> ফোকাস মোড চালু — শুধু জরুরি ও হাই প্রায়োরিটি টাস্ক দেখাচ্ছে ({displayedTasks.length}টি)
            </div>
          )}
          {tagFilter !== "all" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold"
              style={{ borderColor: "#C4B5FD", backgroundColor: "#F5F3FF", color: "#8B5CF6" }}>
              <TagIcon size={13} /> ট্যাগ ফিল্টার: #{tagFilter} ({displayedTasks.length}টি টাস্ক)
              <button onClick={() => setTagFilter("all")} className="ml-auto hover:opacity-70"><X size={12} /></button>
            </div>
          )}
          {view === "kanban" && (
            <TaskKanban tasks={displayedTasks} onTaskClick={setSelectedTaskId}
              onStatusChange={handleStatusChange}
              onRefresh={() => { fetchTasks(); fetchSummaryStats(); }} />
          )}
          {view === "list" && (
            <TaskList tasks={displayedTasks} onTaskClick={setSelectedTaskId}
              onStatusChange={handleStatusChange}
              onRefresh={() => { fetchTasks(); fetchSummaryStats(); }} />
          )}
          {view === "calendar" && (
            <TaskCalendar tasks={displayedTasks} onTaskClick={setSelectedTaskId} />
          )}
        </>
      )}

      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)}
          onUpdated={() => { fetchTasks(); fetchSummaryStats(); }} />
      )}
      {templateOpen && (
        <TaskTemplatesModal onSelect={handleTemplateSelect} onClose={() => setTemplateOpen(false)} />
      )}
      {createOpen && (
        <CreateTaskModal
          onClose={() => { setCreateOpen(false); setCreateInitialData(undefined); }}
          onCreated={() => { setCreateOpen(false); setCreateInitialData(undefined); fetchTasks(); fetchSummaryStats(); }}
          initialData={createInitialData} />
      )}
      <FloatingTimer />
    </div>
  );
}

export default function TasksPage() {
  const { loading } = useSubscription();
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--c-primary)" }} />
    </div>
  );
  return (
    <PlanGate feature="taskManagement">
      <TaskTimerProvider>
        <TasksContent />
      </TaskTimerProvider>
    </PlanGate>
  );
}
