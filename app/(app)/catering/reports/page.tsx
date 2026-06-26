"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart2, TrendingUp, Users, Repeat } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#EA580C",
};

const TYPE_LABELS: Record<string, string> = {
  wedding: "বিয়ে", corporate: "Corporate", birthday: "জন্মদিন",
  aqiqa: "আকিকা", custom: "Custom", mehndi: "মেহেন্দি", other: "অন্যান্য",
};
const PIE_COLORS = ["#EA580C", "#F97316", "#FB923C", "#FED7AA", "#FDBA74", "#7C3AED", "#0891B2"];

type ReportData = {
  monthlyData: { month: string; revenue: number; profit: number; cost: number; count: number }[];
  eventTypePie: { type: string; count: number }[];
  totalRevenue: number; totalProfit: number; totalCost: number;
  avgMargin: number; avgGuests: number; repeatRate: number; totalEvents: number;
};

export default function CateringReportsPage() {
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/catering/reports");
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: S.primary }} />
    </div>
  );

  if (!data) return null;

  const statCards = [
    { label: "মোট ইভেন্ট", value: `${data.totalEvents}টি`, icon: BarChart2, color: S.primary },
    { label: "মোট মুনাফা", value: `৳${data.totalProfit.toLocaleString()}`, icon: TrendingUp, color: "#10B981" },
    { label: "গড় মার্জিন", value: `${data.avgMargin}%`, icon: TrendingUp, color: "#7C3AED" },
    { label: "Repeat ক্লায়েন্ট রেট", value: `${data.repeatRate}%`, icon: Repeat, color: "#0891B2" },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
          <BarChart2 size={20} style={{ color: S.primary }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: S.text }}>ক্যাটারিং রিপোর্ট</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-xs" style={{ color: S.muted }}>{c.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue + Profit */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: S.text }}>মাসিক Revenue ও মুনাফা</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--c-text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--c-text-muted)" }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={((v: number) => `৳${v.toLocaleString()}`) as never} contentStyle={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#EA580C" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit"  name="মুনাফা"  fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Event Type Pie */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: S.text }}>ইভেন্টের ধরন</h2>
          {data.eventTypePie.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.eventTypePie} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label={({ type, percent }: any) => `${TYPE_LABELS[type] ?? type} ${Math.round(percent * 100)}%`}>
                  {data.eventTypePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => TYPE_LABELS[v] ?? v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary Stats */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-semibold" style={{ color: S.text }}>সারসংক্ষেপ</h2>
          {[
            { label: "মোট Revenue (৬ মাস)", value: `৳${data.totalRevenue.toLocaleString()}` },
            { label: "মোট খরচ (৬ মাস)",    value: `৳${data.totalCost.toLocaleString()}` },
            { label: "মোট মুনাফা (৬ মাস)",  value: `৳${data.totalProfit.toLocaleString()}` },
            { label: "গড় মার্জিন",          value: `${data.avgMargin}%` },
            { label: "গড় অতিথি সংখ্যা",    value: `${data.avgGuests} জন` },
            { label: "Repeat ক্লায়েন্ট রেট", value: `${data.repeatRate}%` },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: S.border }}>
              <span style={{ color: S.muted }}>{row.label}</span>
              <span className="font-semibold" style={{ color: S.text }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
