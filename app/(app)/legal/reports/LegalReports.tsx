"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Scale, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";

const CASE_TYPE_LABELS: Record<string, string> = {
  civil: "দেওয়ানী", criminal: "ফৌজদারী", family: "পারিবারিক",
  property: "সম্পত্তি", labor: "শ্রম", business: "বাণিজ্যিক",
  constitutional: "সাংবিধানিক", other: "অন্যান্য",
};

const STATUS_LABELS: Record<string, string> = {
  active: "সক্রিয়", hearing_pending: "শুনানি মুলতবি", judgement_pending: "রায় মুলতবি",
  decided: "সিদ্ধান্ত", appealed: "আপিল", closed: "বন্ধ",
};

const PIE_COLORS = ["#1D4ED8", "#DC2626", "#DB2777", "#D97706", "#16A34A", "#7C3AED", "#0891B2", "#6B7280"];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
  primary: "#1D4ED8",
};

type ReportData = {
  casesByType: { caseType: string; _count: { id: number } }[];
  casesByStatus: { status: string; _count: { id: number } }[];
  pendingFees: { id: string; caseNumber: string; title: string; dueFee: number; client: { name: string; phone: string } }[];
  hearingAttendance: { attended: boolean; _count: { id: number } }[];
  last6Months: { month: string; cases: number; revenue: number }[];
};

export default function LegalReports() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetch("/api/legal/reports").then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const typeData = data.casesByType.map(d => ({
    name: CASE_TYPE_LABELS[d.caseType] ?? d.caseType,
    value: d._count.id,
  }));

  const statusData = data.casesByStatus.map(d => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d._count.id,
  }));

  const attended = data.hearingAttendance.find(h => h.attended)?._count.id ?? 0;
  const notAttended = data.hearingAttendance.find(h => !h.attended)?._count.id ?? 0;
  const totalHearings = attended + notAttended;
  const attendanceRate = totalHearings > 0 ? Math.round((attended / totalHearings) * 100) : 0;

  const totalPendingFee = data.pendingFees.reduce((s, c) => s + c.dueFee, 0);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-6">

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
        <Scale size={13} />
        <span>এই তথ্য সম্পূর্ণ গোপনীয়। শুধুমাত্র আপনার জন্য সংরক্ষিত।</span>
      </div>

      <div>
        <h1 className="text-xl font-bold" style={{ color: S.text }}>আইনি সেবা রিপোর্ট</h1>
        <p className="text-sm" style={{ color: S.muted }}>মামলা, শুনানি ও আয়ের সারাংশ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট মামলা", value: data.casesByType.reduce((s, d) => s + d._count.id, 0), icon: Scale, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "উপস্থিতির হার", value: `${attendanceRate}%`, icon: TrendingUp, color: "#16A34A", bg: "#F0FDF4", isStr: true },
          { label: "মোট শুনানি", value: totalHearings, icon: Scale, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "বকেয়া ফি", value: formatBDT(totalPendingFee), icon: DollarSign, color: "#DC2626", bg: "#FEF2F2", isStr: true },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: S.muted }}>{c.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.bg }}>
                <c.icon size={15} style={{ color: c.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: S.text }}>{c.isStr ? c.value : c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div className="rounded-2xl p-5" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-bold text-base mb-4" style={{ color: S.text }}>মাসিক নতুন মামলা ও আয়</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.last6Months}>
            <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: S.muted }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: S.muted }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: S.muted }} />
            <Tooltip
              contentStyle={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px", fontSize: 12 }}
            />
            <Bar yAxisId="left" dataKey="cases" name="মামলা" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="revenue" name="আয় (৳)" fill="#16A34A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cases by Type */}
        <div className="rounded-2xl p-5" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-bold text-base mb-4" style={{ color: S.text }}>মামলার ধরন অনুযায়ী</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8" style={{ color: S.muted }}>কোনো তথ্য নেই</div>
          )}
        </div>

        {/* Cases by Status */}
        <div className="rounded-2xl p-5" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-bold text-base mb-4" style={{ color: S.text }}>স্ট্যাটাস অনুযায়ী</h3>
          <div className="space-y-2.5">
            {statusData.map((d, i) => {
              const total = statusData.reduce((s, r) => s + r.value, 0);
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: S.text }}>{d.name}</span>
                    <span className="font-semibold" style={{ color: S.muted }}>{d.value}টি ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: S.bg }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending Fee Collection */}
      {data.pendingFees.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} style={{ color: "#DC2626" }} />
            <h3 className="font-bold text-base" style={{ color: S.text }}>বকেয়া ফি সংগ্রহ তালিকা</h3>
          </div>
          <div className="space-y-2">
            {data.pendingFees.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/cases/${c.id}`} className="font-semibold text-sm hover:underline truncate block" style={{ color: S.text }}>
                    {c.caseNumber} — {c.title.length > 40 ? c.title.slice(0, 40) + "…" : c.title}
                  </Link>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>{c.client.name} • {c.client.phone}</p>
                </div>
                <span className="font-bold text-sm flex-shrink-0" style={{ color: "#DC2626" }}>{formatBDT(c.dueFee)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
