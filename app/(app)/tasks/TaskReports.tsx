"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const BRAND_COLORS = ["#0F6E56", "#1BAA78", "#0A5240", "#2DD4A0", "#166E50", "#4ECBA0", "#37996B", "#10B981"];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#0F6E56",
  primaryLight: "#1BAA78",
  danger: "#E24B4A",
  warn: "#CA8A04",
};

const statusLabel: Record<string, string> = {
  todo: "করতে হবে",
  in_progress: "চলছে",
  review: "রিভিউ",
  done: "সম্পন্ন",
};

const priorityLabel: Record<string, string> = {
  urgent: "জরুরি",
  high: "হাই",
  medium: "মিডিয়াম",
  low: "লো",
};

const categoryLabel: Record<string, string> = {
  order: "অর্ডার",
  delivery: "ডেলিভারি",
  supplier: "সাপ্লায়ার",
  accounts: "একাউন্টস",
  general: "সাধারণ",
};

interface KPI {
  total: number;
  done: number;
  completionRate: number;
  avgDaysToComplete: number;
  overdue: number;
  overdueRate: number;
}

interface WeekData { week: string; count: number }
interface CategoryData { name: string; value: number }
interface MemberData { name: string; open: number; completed: number; overdue: number }
interface StuckTask {
  id: string;
  title: string;
  status: string;
  category: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assignedTo: string | null;
  isOverdue: boolean;
  ageInDays: number;
}

interface ReportData {
  kpi: KPI;
  weeklyCompletion: WeekData[];
  categoryDistribution: CategoryData[];
  memberStats: MemberData[];
  oldestStuck: StuckTask[];
}

const RANGE_OPTIONS = [
  { value: "7", label: "শেষ ৭ দিন" },
  { value: "30", label: "শেষ ৩০ দিন" },
  { value: "90", label: "শেষ ৯০ দিন" },
];

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-2"
      style={{ backgroundColor: S.surface, borderColor: S.border }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: color ?? S.primary }}>{icon}</span>
        <span className="text-xs font-medium" style={{ color: S.muted }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: S.text }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: S.muted }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-3 py-2 text-xs shadow" style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}>
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i}>{p.value}</div>
      ))}
    </div>
  );
}

export default function TaskReports() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/reports?days=${days}`);
      if (res.ok) setData(await res.json());
    } catch { }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold" style={{ color: S.text }}>টাস্ক রিপোর্ট</h2>
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className="px-3 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: days === opt.value ? S.primary : "transparent",
                color: days === opt.value ? "#fff" : S.muted,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: S.primary }} />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-sm" style={{ color: S.muted }}>ডেটা লোড করা যায়নি</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<TrendingUp size={18} />}
              label="মোট টাস্ক"
              value={data.kpi.total}
              sub={`${data.kpi.done}টি সম্পন্ন`}
            />
            <KPICard
              icon={<CheckCircle2 size={18} />}
              label="সম্পন্নের হার"
              value={`${data.kpi.completionRate}%`}
              sub={`${data.kpi.done} / ${data.kpi.total}`}
              color={data.kpi.completionRate >= 70 ? "#16A34A" : S.warn}
            />
            <KPICard
              icon={<Clock size={18} />}
              label="গড় সময় (দিন)"
              value={data.kpi.avgDaysToComplete}
              sub="সম্পন্ন করতে"
            />
            <KPICard
              icon={<AlertTriangle size={18} />}
              label="মেয়াদোত্তীর্ণ হার"
              value={`${data.kpi.overdueRate}%`}
              sub={`${data.kpi.overdue}টি মেয়াদোত্তীর্ণ`}
              color={data.kpi.overdueRate > 20 ? S.danger : S.warn}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly completion bar chart */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: S.text }}>সাপ্তাহিক সম্পন্ন টাস্ক</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.weeklyCompletion} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: S.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: S.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={S.primary} radius={[4, 4, 0, 0]} name="সম্পন্ন" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category donut chart */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: S.text }}>ক্যাটাগরি বিতরণ</h3>
              {data.categoryDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.categoryDistribution.map((_, i) => (
                        <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v) || 0}টি`]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Team member chart */}
          {data.memberStats.length > 0 && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: S.text }}>সদস্যপ্রতি টাস্ক</h3>
              <ResponsiveContainer width="100%" height={Math.max(180, data.memberStats.length * 44)}>
                <BarChart
                  data={data.memberStats}
                  layout="vertical"
                  margin={{ top: 4, right: 8, bottom: 0, left: 60 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: S.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="open" stackId="a" fill="#1BAA78" radius={[0, 0, 0, 0]} name="খোলা" />
                  <Bar dataKey="completed" stackId="a" fill="#0F6E56" radius={[0, 4, 4, 0]} name="সম্পন্ন" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Oldest stuck tasks table */}
          {data.oldestStuck.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
                <h3 className="text-sm font-semibold" style={{ color: S.text }}>সবচেয়ে পুরনো অমীমাংসিত টাস্ক</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {["শিরোনাম", "স্ট্যাটাস", "ক্যাটাগরি", "প্রায়োরিটি", "দায়িত্বপ্রাপ্ত", "বয়স", "ডেডলাইন"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: S.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.oldestStuck.map((t, i) => (
                      <tr
                        key={t.id}
                        style={{
                          borderBottom: i < data.oldestStuck.length - 1 ? `1px solid ${S.border}` : undefined,
                          backgroundColor: t.isOverdue ? "rgba(226,75,74,0.04)" : undefined,
                        }}
                      >
                        <td className="px-4 py-3 font-medium max-w-[200px] truncate" style={{ color: S.text }} title={t.title}>
                          {t.title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{
                              backgroundColor: t.status === "todo" ? "#F1F5F9" : t.status === "in_progress" ? "#DBEAFE" : "#FEF9C3",
                              color: t.status === "todo" ? "#475569" : t.status === "in_progress" ? "#1D4ED8" : "#854D0E",
                            }}
                          >
                            {statusLabel[t.status] ?? t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: S.muted }}>{categoryLabel[t.category] ?? t.category}</td>
                        <td className="px-4 py-3" style={{ color: S.muted }}>{priorityLabel[t.priority] ?? t.priority}</td>
                        <td className="px-4 py-3" style={{ color: S.muted }}>{t.assignedTo ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span style={{ color: t.ageInDays > 14 ? S.danger : S.muted }}>{t.ageInDays} দিন</span>
                        </td>
                        <td className="px-4 py-3">
                          {t.dueDate ? (
                            <span style={{ color: t.isOverdue ? S.danger : S.muted }}>
                              {new Date(t.dueDate).toLocaleDateString("bn-BD")}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
