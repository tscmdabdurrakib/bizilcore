"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart2, Loader2, TrendingUp } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)",
};
const SPA_COLOR = "#9333EA";

const MONTH_LABELS: Record<string, string> = {
  "01": "জানু", "02": "ফেব্রু", "03": "মার্চ", "04": "এপ্রিল",
  "05": "মে", "06": "জুন", "07": "জুলাই", "08": "আগস্ট",
  "09": "সেপ্টে", "10": "অক্টো", "11": "নভে", "12": "ডিসে",
};

const PIE_COLORS = ["#9333EA", "#EC4899", "#0891B2", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6"];

interface ReportData {
  monthlyChart: { month: string; revenue: number; count: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  peakHoursChart: { hour: string; count: number }[];
  roomUtilization: { name: string; sessions: number; revenue: number }[];
  therapistPerformance: { name: string; sessions: number; revenue: number }[];
  totalCompleted: number;
  totalRevenue: number;
}

export default function SpaReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/spa/reports");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: SPA_COLOR }} />
      </div>
    );
  }

  const monthlyFormatted = (data?.monthlyChart ?? []).map(m => ({
    ...m,
    label: MONTH_LABELS[m.month.slice(5, 7)] ?? m.month.slice(5, 7),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
          <BarChart2 size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>স্পা রিপোর্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>গত ৬ মাসের বিশ্লেষণ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "মোট সেশন (৬ মাস)", value: `${data?.totalCompleted ?? 0}টি`, color: SPA_COLOR },
          { label: "মোট আয় (৬ মাস)", value: formatBDT(data?.totalRevenue ?? 0), color: "#0891B2" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: S.muted }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>মাসিক আয় ও সেশন</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyFormatted}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={((v: number, name: string) => [
                name === "revenue" ? `৳${v.toLocaleString("en")}` : `${v}টি`,
                name === "revenue" ? "আয়" : "সেশন",
              ]) as never}
              contentStyle={{ borderRadius: 8, border: `1px solid ${S.border}`, backgroundColor: S.surface, fontSize: 12 }}
            />
            <Bar dataKey="revenue" fill={SPA_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="count" fill="#E9D5FF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>জনপ্রিয় সার্ভিস</h2>
          {(data?.topServices ?? []).length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: S.muted }}>ডেটা নেই</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data?.topServices ?? []} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name.length > 8 ? name.slice(0, 8) + "..." : name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {(data?.topServices ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={((v: number) => [`${v}টি সেশন`]) as never} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>পিক আওয়ার</h2>
          {(data?.peakHoursChart ?? []).length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: S.muted }}>ডেটা নেই</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.peakHoursChart ?? []}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: S.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: S.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#C084FC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>রুম ব্যবহার</h2>
        {(data?.roomUtilization ?? []).length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: S.muted }}>কোনো রুম ডেটা নেই</p>
        ) : (
          <div className="space-y-3">
            {(data?.roomUtilization ?? []).map(r => (
              <div key={r.name} className="flex items-center justify-between py-2 border-b" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{r.name}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{r.sessions}টি সেশন</p>
                </div>
                <p className="text-sm font-bold" style={{ color: SPA_COLOR }}>{formatBDT(r.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>থেরাপিস্ট পারফরম্যান্স</h2>
        {(data?.therapistPerformance ?? []).length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: S.muted }}>কোনো থেরাপিস্ট ডেটা নেই</p>
        ) : (
          <div className="space-y-3">
            {(data?.therapistPerformance ?? []).map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: S.border }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{t.name}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{t.sessions}টি সেশন</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: SPA_COLOR }}>{formatBDT(t.revenue)}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp size={10} style={{ color: S.muted }} />
                    <p className="text-[10px]" style={{ color: S.muted }}>
                      ৳{t.sessions > 0 ? Math.round(t.revenue / t.sessions).toLocaleString("en") : 0}/সেশন
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
