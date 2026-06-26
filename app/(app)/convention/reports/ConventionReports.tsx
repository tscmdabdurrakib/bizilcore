"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatBDT } from "@/lib/utils";
import { Loader2, TrendingUp, PartyPopper, Building2, Users } from "lucide-react";

interface MonthlyData {
  month: number;
  count: number;
  revenue: number;
  collected: number;
}

interface HallUtil {
  hallName: string;
  bookedDays: number;
  pct: number;
  revenue: number;
}

interface TopClient {
  name: string;
  phone: string;
  total: number;
  count: number;
}

interface ReportData {
  year: number;
  totalEvents: number;
  totalRevenue: number;
  totalCollected: number;
  totalDue: number;
  avgBookingValue: number;
  monthlyData: MonthlyData[];
  eventTypeCounts: Record<string, number>;
  hallUtilization: HallUtil[];
  topClients: TopClient[];
}

const MONTH_LABELS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "বিবাহ", birthday: "জন্মদিন", aqiqa: "আকিকা",
  corporate: "Corporate", seminar: "Seminar", mehndi: "Mehndi", reception: "Reception", other: "অন্যান্য",
};

const PIE_COLORS = ["#7C3AED", "#0F6E56", "#EF9F27", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6", "#F97316"];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

export default function ConventionReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/convention/reports?year=${year}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    );
  }

  if (!data) return null;

  const monthlyChartData = data.monthlyData.map((m) => ({
    name: MONTH_LABELS[m.month - 1],
    বুকিং: m.count,
    আয়: m.revenue,
    সংগৃহীত: m.collected,
  }));

  const pieData = Object.entries(data.eventTypeCounts)
    .map(([type, count]) => ({ name: EVENT_TYPE_LABELS[type] ?? type, value: count }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>Convention রিপোর্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>সালভিত্তিক বিশ্লেষণ</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}
        >
          {[2024, 2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y} সাল</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট ইভেন্ট",       value: `${data.totalEvents}টি`,          color: "#7C3AED", bg: "#F5F3FF", icon: PartyPopper },
          { label: "মোট রাজস্ব",        value: formatBDT(data.totalRevenue),      color: "#0F6E56", bg: "#E1F5EE", icon: TrendingUp },
          { label: "সংগৃহীত",           value: formatBDT(data.totalCollected),    color: "#EF9F27", bg: "#FFF3DC", icon: Building2 },
          { label: "গড় বুকিং মূল্য",  value: formatBDT(data.avgBookingValue),   color: "#3B82F6", bg: "#EFF6FF", icon: Users },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon size={15} style={{ color: card.color }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: S.muted }}>{card.label}</p>
            </div>
            <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>মাসিক বুকিং ও আয়</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--c-text-muted)" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--c-text-muted)" }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "var(--c-text-muted)" }} />
            <Tooltip
              formatter={((v: number, name: string) => name === "বুকিং" ? [`${v}টি`, name] : [formatBDT(v), name]) as never}
              contentStyle={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", borderRadius: 8, fontSize: 11 }}
            />
            <Bar yAxisId="left" dataKey="আয়" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="সংগৃহীত" fill="#0F6E56" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="বুকিং" fill="#EF9F27" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Event Type Pie & Hall Utilization */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Event Type Breakdown */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>ইভেন্ট ধরনের বিভাজন</h2>
          {pieData.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: S.muted }}>কোনো তথ্য নেই</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ fontSize: 10, color: "var(--c-text-muted)" }}>{value}</span>}
                />
                <Tooltip
                  formatter={((v: number) => [`${v}টি`, "বুকিং"]) as never}
                  contentStyle={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", borderRadius: 8, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hall Utilization */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>হলের ব্যবহার ({year})</h2>
          {data.hallUtilization.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: S.muted }}>কোনো হল পাওয়া যায়নি</p>
          ) : (
            <div className="space-y-3">
              {data.hallUtilization.map((h, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{h.hallName}</p>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>{h.pct}%</p>
                      <p className="text-[10px]" style={{ color: S.muted }}>{h.bookedDays} দিন</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.min(100, h.pct)}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>রাজস্ব: {formatBDT(h.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Clients */}
      {data.topClients.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>সেরা ক্লায়েন্ট</h2>
          <div className="space-y-2">
            {data.topClients.map((client, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: S.bg }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{client.name}</p>
                    <p className="text-[10px]" style={{ color: S.muted }}>{client.phone} · {client.count}টি বুকিং</p>
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: "#7C3AED" }}>{formatBDT(client.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advance vs Due Summary */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: S.text }}>Advance vs বাকি বিশ্লেষণ</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "মোট রাজস্ব",   value: data.totalRevenue,   color: "#7C3AED", bg: "#F5F3FF" },
            { label: "সংগৃহীত",      value: data.totalCollected, color: "#0F6E56", bg: "#E1F5EE" },
            { label: "বকেয়া",        value: data.totalDue,       color: "#EF4444", bg: "#FEE2E2" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: item.bg }}>
              <p className="text-[10px] font-medium mb-1" style={{ color: item.color }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{formatBDT(item.value)}</p>
              <div className="h-1.5 rounded-full mt-1.5" style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: data.totalRevenue > 0 ? `${Math.round((item.value / data.totalRevenue) * 100)}%` : "0%",
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: item.color }}>
                {data.totalRevenue > 0 ? Math.round((item.value / data.totalRevenue) * 100) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
