"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatBDT } from "@/lib/utils";
import { Loader2, TrendingUp, GraduationCap, Receipt } from "lucide-react";

interface MonthlyFee { month: string; total: number; collected: number; due: number; count: number }
interface BatchInfo { id: string; name: string; count: number }
interface StatusCount { status: string; _count: { status: number } }
interface AttCount { status: string; _count: { status: number } }
interface ReportData {
  year: number; monthlyFees: MonthlyFee[];
  totalRevenue: number; totalCollected: number; totalDue: number;
  studentsByStatus: StatusCount[]; batches: BatchInfo[]; attendance: AttCount[];
}

const MONTH_LABELS = ["জানু","ফেব্রু","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্ট","অক্টো","নভে","ডিসে"];
const PIE_COLORS = ["#2563EB","#0F6E56","#EF4444","#EF9F27","#7C3AED","#EC4899"];
const STATUS_LABEL: Record<string, string> = { active: "সক্রিয়", inactive: "নিষ্ক্রিয়", tc_issued: "TC দেওয়া", graduated: "পাস" };
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };

export default function SchoolReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/school/reports?year=${year}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#2563EB" }} /></div>;
  if (!data) return null;

  const chartData = data.monthlyFees.map((m, i) => ({
    name: MONTH_LABELS[i], সংগৃহীত: m.collected, বাকি: m.due, বুকিং: m.count,
  }));

  const statusPie = data.studentsByStatus.map((s) => ({ name: STATUS_LABEL[s.status] ?? s.status, value: s._count.status }));
  const totalStudents = data.studentsByStatus.reduce((s, x) => s + x._count.status, 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>School রিপোর্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>বার্ষিক বিশ্লেষণ</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border text-sm" style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}>
          {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y} সাল</option>)}
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট শিক্ষার্থী",  value: `${totalStudents}জন`,          color: "#2563EB", bg: "#EFF6FF", icon: GraduationCap },
          { label: "মোট ফি আয়",      value: formatBDT(data.totalRevenue),  color: "#0F6E56", bg: "#E1F5EE", icon: TrendingUp   },
          { label: "সংগৃহীত",         value: formatBDT(data.totalCollected),color: "#7C3AED", bg: "#F5F3FF", icon: Receipt      },
          { label: "বকেয়া",           value: formatBDT(data.totalDue),      color: "#EF4444", bg: "#FEE2E2", icon: Receipt      },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.bg }}>
                <c.icon size={15} style={{ color: c.color }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: S.muted }}>{c.label}</p>
            </div>
            <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Fee Chart */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>মাসিক ফি সংগ্রহ ({year})</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--c-text-muted)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--c-text-muted)" }} tickFormatter={(v) => `৳${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={((v: number, name: string) => [formatBDT(v), name]) as never} contentStyle={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="সংগৃহীত" fill="#0F6E56" radius={[4,4,0,0]} />
            <Bar dataKey="বাকি"    fill="#EF4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Student Status Pie */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>শিক্ষার্থীর অবস্থান</h2>
          {statusPie.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: S.muted }}>কোনো তথ্য নেই</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span style={{ fontSize: 10, color: "var(--c-text-muted)" }}>{v}</span>} />
                <Tooltip formatter={((v: number) => [`${v}জন`, "শিক্ষার্থী"]) as never} contentStyle={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Batch Sizes */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: S.text }}>ব্যাচভিত্তিক শিক্ষার্থী</h2>
          {data.batches.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: S.muted }}>কোনো ব্যাচ নেই</p>
          ) : (
            <div className="space-y-3">
              {data.batches.map((b, i) => {
                const max = Math.max(...data.batches.map((x) => x.count), 1);
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold" style={{ color: S.text }}>{b.name}</p>
                      <p className="text-xs font-bold" style={{ color: "#2563EB" }}>{b.count}জন</p>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                      <div className="h-2 rounded-full" style={{ width: `${(b.count / max) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Revenue vs Due */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: S.text }}>আয় বিশ্লেষণ</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "মোট ফি",   value: data.totalRevenue,  color: "#2563EB", bg: "#EFF6FF" },
            { label: "সংগৃহীত", value: data.totalCollected, color: "#0F6E56", bg: "#E1F5EE" },
            { label: "বকেয়া",   value: data.totalDue,       color: "#EF4444", bg: "#FEE2E2" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: item.bg }}>
              <p className="text-[10px] font-medium mb-1" style={{ color: item.color }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{formatBDT(item.value)}</p>
              <div className="h-1.5 rounded-full mt-1.5" style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
                <div className="h-1.5 rounded-full" style={{ width: data.totalRevenue > 0 ? `${Math.round((item.value / data.totalRevenue) * 100)}%` : "0%", backgroundColor: item.color }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: item.color }}>{data.totalRevenue > 0 ? Math.round((item.value / data.totalRevenue) * 100) : 0}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
