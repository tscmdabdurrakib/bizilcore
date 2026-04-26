"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, CheckCircle2, Clock, AlertCircle, Loader2,
  ChevronRight, Plus, Briefcase, TrendingUp, BarChart2,
} from "lucide-react";

interface EmployeeStat {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  stats: {
    total: number;
    done: number;
    inProgress: number;
    review: number;
    todo: number;
    overdue: number;
    dueSoon: number;
    pending: number;
  };
  completion: number;
  recentTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
  }[];
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#0F6E56",
  primaryLight: "#E8F5F0",
  bg: "var(--c-bg)",
};

const ROLE_LABEL: Record<string, string> = {
  manager: "ম্যানেজার",
  staff: "স্টাফ",
  owner: "মালিক",
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#DC2626",
  high: "#EA580C",
  medium: "#CA8A04",
  low: "#16A34A",
};

const STATUS_COLOR: Record<string, string> = {
  todo: "#6B7280",
  in_progress: "#3B82F6",
  review: "#F59E0B",
  done: "#10B981",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "করতে হবে",
  in_progress: "চলছে",
  review: "রিভিউ",
  done: "সম্পন্ন",
};

function avatarColor(name: string) {
  const colors = [
    "#0F6E56", "#3B82F6", "#8B5CF6", "#EF4444",
    "#F59E0B", "#06B6D4", "#EC4899", "#10B981",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface Props {
  onViewTasks: (userId: string, name: string) => void;
  onCreateTask: (userId: string) => void;
}

export default function EmployeeTaskBoard({ onViewTasks, onCreateTask }: Props) {
  const [employees, setEmployees] = useState<EmployeeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "pending" | "overdue" | "completion">("pending");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/employees");
      if (res.ok) setEmployees(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const sorted = [...employees].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "pending") return b.stats.pending - a.stats.pending;
    if (sortBy === "overdue") return b.stats.overdue - a.stats.overdue;
    if (sortBy === "completion") return b.completion - a.completion;
    return 0;
  });

  const totalStats = employees.reduce(
    (acc, e) => ({
      total: acc.total + e.stats.total,
      done: acc.done + e.stats.done,
      pending: acc.pending + e.stats.pending,
      overdue: acc.overdue + e.stats.overdue,
    }),
    { total: 0, done: 0, pending: 0, overdue: 0 }
  );

  if (loading) {
    return (
      <div className="rounded-2xl border p-12 flex flex-col items-center justify-center gap-3"
        style={{ borderColor: S.border, backgroundColor: S.surface }}>
        <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
        <p className="text-sm font-medium" style={{ color: S.muted }}>কর্মীদের টাস্ক লোড হচ্ছে...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
        <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E8F5F0, #C6E8DE)" }}>
            <Users size={28} style={{ color: S.primary }} />
          </div>
          <div>
            <p className="text-base font-extrabold mb-1" style={{ color: S.text }}>কোনো কর্মী নেই</p>
            <p className="text-sm" style={{ color: S.muted }}>
              কর্মী ব্যবস্থাপনা থেকে কর্মী যোগ করুন, তারপর তাদের টাস্ক দিন
            </p>
          </div>
          <a
            href="/hr"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}
          >
            <Users size={14} /> কর্মী ব্যবস্থাপনায় যান
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট কর্মী", value: employees.length, color: "#0F6E56", bg: "#E8F5F0", icon: Users },
          { label: "মোট টাস্ক", value: totalStats.total, color: "#3B82F6", bg: "#EFF6FF", icon: BarChart2 },
          { label: "বাকি টাস্ক", value: totalStats.pending, color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
          { label: "মেয়াদোত্তীর্ণ", value: totalStats.overdue, color: "#EF4444", bg: "#FEF2F2", icon: AlertCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-4 border"
            style={{ borderColor: color + "40", backgroundColor: bg }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color }}>{label}</p>
            </div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>সাজানো</span>
        {[
          { value: "pending", label: "বাকি টাস্ক" },
          { value: "overdue", label: "মেয়াদোত্তীর্ণ" },
          { value: "completion", label: "সম্পন্নের হার" },
          { value: "name", label: "নাম" },
        ].map(opt => (
          <button key={opt.value}
            onClick={() => setSortBy(opt.value as typeof sortBy)}
            className="px-3 py-1 rounded-full text-[11px] font-bold border transition-all"
            style={{
              backgroundColor: sortBy === opt.value ? S.primaryLight : "transparent",
              color: sortBy === opt.value ? S.primary : S.muted,
              borderColor: sortBy === opt.value ? S.primary : S.border,
            }}>
            {opt.label}
          </button>
        ))}
        <button onClick={fetchEmployees}
          className="ml-auto text-[11px] font-bold px-3 py-1 rounded-full border transition-all hover:opacity-80"
          style={{ borderColor: S.border, color: S.muted, backgroundColor: S.surface }}>
          🔄 রিফ্রেশ
        </button>
      </div>

      {/* Employee cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((emp) => {
          const bg = avatarColor(emp.name);
          const initial = emp.name.charAt(0).toUpperCase();
          const hasOverdue = emp.stats.overdue > 0;
          const hasDueSoon = emp.stats.dueSoon > 0;

          return (
            <div
              key={emp.id}
              className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
              style={{ borderColor: hasOverdue ? "#FCA5A580" : S.border, backgroundColor: S.surface }}
            >
              {/* Card header */}
              <div className="px-4 pt-4 pb-3 flex items-start gap-3"
                style={{ borderBottom: `1px solid ${S.border}` }}>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: bg }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold truncate" style={{ color: S.text }}>{emp.name}</p>
                  <p className="text-[11px] truncate" style={{ color: S.muted }}>
                    {emp.jobTitle ?? ROLE_LABEL[emp.role] ?? emp.role}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#E8F5F0", color: "#0F6E56" }}>
                      {ROLE_LABEL[emp.role] ?? emp.role}
                    </span>
                    {hasOverdue && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                        style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                        ⚠ {emp.stats.overdue} মেয়াদোত্তীর্ণ
                      </span>
                    )}
                    {!hasOverdue && hasDueSoon && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#FEF3C7", color: "#CA8A04" }}>
                        ⏰ {emp.stats.dueSoon} শীঘ্রই
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onCreateTask(emp.userId)}
                  title="নতুন টাস্ক দিন"
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                  style={{ backgroundColor: S.primaryLight, color: S.primary }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 divide-x" style={{ borderBottom: `1px solid ${S.border}`, borderColor: S.border }}>
                {[
                  { label: "মোট", value: emp.stats.total, color: S.primary },
                  { label: "চলছে", value: emp.stats.inProgress + emp.stats.review, color: "#3B82F6" },
                  { label: "বাকি", value: emp.stats.todo, color: "#F59E0B" },
                  { label: "সম্পন্ন", value: emp.stats.done, color: "#10B981" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-2 py-2.5 text-center" style={{ borderColor: S.border }}>
                    <p className="text-base font-black leading-none" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: S.muted }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${S.border}` }}>
                <div className="flex justify-between text-[10px] font-bold mb-1.5"
                  style={{ color: emp.completion >= 80 ? "#10B981" : emp.completion >= 50 ? "#F59E0B" : S.muted }}>
                  <span>সম্পন্নের হার</span>
                  <span>{emp.completion}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${emp.completion}%`,
                      background: emp.completion >= 80
                        ? "linear-gradient(90deg, #10B981, #059669)"
                        : emp.completion >= 50
                          ? "linear-gradient(90deg, #F59E0B, #D97706)"
                          : "linear-gradient(90deg, #EF4444, #DC2626)",
                    }}
                  />
                </div>
              </div>

              {/* Recent pending tasks */}
              {emp.recentTasks.length > 0 && (
                <div className="px-4 py-3 space-y-1.5" style={{ borderBottom: `1px solid ${S.border}` }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: S.muted }}>
                    সক্রিয় টাস্ক
                  </p>
                  {emp.recentTasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
                    return (
                      <div key={task.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PRIORITY_COLOR[task.priority] ?? "#6B7280" }} />
                        <p className="flex-1 text-[11px] truncate" style={{ color: S.text }}>{task.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isOverdue && (
                            <span className="text-[9px] font-bold" style={{ color: "#DC2626" }}>⚠</span>
                          )}
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: STATUS_COLOR[task.status] + "20", color: STATUS_COLOR[task.status] }}>
                            {STATUS_LABEL[task.status]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {emp.stats.total === 0 && (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs" style={{ color: S.muted }}>কোনো টাস্ক নেই</p>
                  <button
                    onClick={() => onCreateTask(emp.userId)}
                    className="mt-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: S.primaryLight, color: S.primary }}
                  >
                    + প্রথম টাস্ক দিন
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => onViewTasks(emp.userId, emp.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                  style={{ backgroundColor: S.primaryLight, color: S.primary }}
                >
                  <Briefcase size={12} /> সব টাস্ক দেখুন
                  <ChevronRight size={12} />
                </button>
                <button
                  onClick={() => onCreateTask(emp.userId)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                  style={{ backgroundColor: "#0F6E56", color: "#fff" }}
                >
                  <Plus size={12} /> টাস্ক দিন
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team workload bar */}
      {employees.length > 1 && (
        <div className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: S.primary }} />
            <p className="text-sm font-extrabold" style={{ color: S.text }}>দলীয় কর্মভার বিশ্লেষণ</p>
          </div>
          <div className="space-y-2.5">
            {sorted
              .filter(e => e.stats.total > 0)
              .map(emp => {
                const maxPending = Math.max(...employees.map(e => e.stats.pending), 1);
                const barWidth = Math.round((emp.stats.pending / maxPending) * 100);
                const bg = avatarColor(emp.name);
                return (
                  <div key={emp.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ backgroundColor: bg }}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{emp.name}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {emp.stats.overdue > 0 && (
                            <span className="text-[9px] font-bold" style={{ color: "#DC2626" }}>
                              ⚠ {emp.stats.overdue}
                            </span>
                          )}
                          <span className="text-[10px] font-bold" style={{ color: S.muted }}>
                            {emp.stats.pending} বাকি / {emp.stats.total} মোট
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%`, backgroundColor: bg }} />
                      </div>
                    </div>
                    <button
                      onClick={() => onViewTasks(emp.userId, emp.name)}
                      className="text-[10px] font-bold flex-shrink-0 hover:underline"
                      style={{ color: S.primary }}>
                      দেখুন →
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
