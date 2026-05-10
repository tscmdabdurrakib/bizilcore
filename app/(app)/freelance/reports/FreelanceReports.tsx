"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Users, Clock, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#6366F1",
};

const PIE_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#14B8A6"];

const PROJECT_TYPE_LABELS: Record<string, string> = {
  web_development: "ওয়েব ডেভেলপমেন্ট",
  app_development: "অ্যাপ ডেভেলপমেন্ট",
  graphic_design: "গ্রাফিক ডিজাইন",
  digital_marketing: "ডিজিটাল মার্কেটিং",
  content_writing: "কন্টেন্ট রাইটিং",
  seo: "SEO",
  data_entry: "ডেটা এন্ট্রি",
  other: "অন্যান্য",
};

type ReportsData = {
  monthlyChart: { label: string; bdtRevenue: number; usdRevenue: number; hours: number }[];
  projectsByType: { type: string; _sum: { totalAmountBDT: number | null }; _count: number }[];
  topClients: { name: string; revenue: number; count: number }[];
  invoiceStats: { total: number; paid: number; overdue: number };
  projectStatus: { status: string; _count: number }[];
};

export default function FreelanceReports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/freelance/reports").then(r => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#E0E7FF", borderTopColor: S.primary }} />
    </div>
  );

  if (!data) return null;

  const collectionRate = data.invoiceStats.total > 0
    ? Math.round((data.invoiceStats.paid / data.invoiceStats.total) * 100)
    : 0;

  const totalRevenue = data.monthlyChart.reduce((s, m) => s + m.bdtRevenue, 0);
  const totalHours = data.monthlyChart.reduce((s, m) => s + m.hours, 0);

  const pieData = data.projectsByType
    .filter(t => (t._sum.totalAmountBDT ?? 0) > 0)
    .map(t => ({
      name: PROJECT_TYPE_LABELS[t.type] ?? t.type,
      value: t._sum.totalAmountBDT ?? 0,
      count: t._count,
    }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div className="flex items-center gap-2">
        <BarChart2 size={22} style={{ color: S.primary }} />
        <h1 className="text-xl font-bold" style={{ color: S.text }}>রিপোর্ট ও বিশ্লেষণ</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট আয় (BDT)", value: `৳${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: S.primary },
          { label: "Collection Rate", value: `${collectionRate}%`, icon: FileText, color: "#10B981" },
          { label: "মোট ঘণ্টা", value: `${totalHours.toFixed(1)} hrs`, icon: Clock, color: "#F59E0B" },
          { label: "Overdue Invoice", value: String(data.invoiceStats.overdue), icon: Users, color: "#EF4444" },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.color + "18" }}>
                  <Icon size={16} style={{ color: c.color }} />
                </div>
                <p className="text-xs font-medium" style={{ color: S.muted }}>{c.label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
        <h2 className="font-semibold mb-4" style={{ color: S.text }}>মাসিক আয় (BDT)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthlyChart} barSize={28}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `৳${(v / 1000).toFixed(0)}k` : `৳${v}`} />
            <Tooltip formatter={(v: number) => [`৳${v.toLocaleString()}`, "আয়"]} />
            <Bar dataKey="bdtRevenue" fill={S.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hours Chart */}
      <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
        <h2 className="font-semibold mb-4" style={{ color: S.text }}>মাসিক কাজের সময় (ঘণ্টা)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.monthlyChart} barSize={28}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: S.muted }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)} hrs`, "সময়"]} />
            <Bar dataKey="hours" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Project Type Pie */}
        {pieData.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
            <h2 className="font-semibold mb-4" style={{ color: S.text }}>প্রজেক্টের ধরন</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Clients */}
        <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
          <h2 className="font-semibold mb-4" style={{ color: S.text }}>শীর্ষ ক্লায়েন্ট</h2>
          {data.topClients.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: S.muted }}>ডেটা নেই</p>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((c, i) => {
                const maxRevenue = data.topClients[0]?.revenue || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-5 text-center" style={{ color: S.muted }}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium" style={{ color: S.text }}>{c.name}</span>
                        <span className="font-bold" style={{ color: S.primary }}>৳{c.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#E0E7FF" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(c.revenue / maxRevenue) * 100}%`, background: S.primary }} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>{c.count}টি প্রজেক্ট</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Status */}
      <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
        <h2 className="font-semibold mb-4" style={{ color: S.text }}>Invoice সংগ্রহের হার</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "মোট Invoice", value: data.invoiceStats.total, color: S.text },
            { label: "পেমেন্ট হয়েছে", value: data.invoiceStats.paid, color: "#10B981" },
            { label: "Overdue", value: data.invoiceStats.overdue, color: "#EF4444" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-sm" style={{ color: S.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
        {data.invoiceStats.total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1" style={{ color: S.muted }}>
              <span>Collection Rate</span>
              <span>{collectionRate}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "#E0E7FF" }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${collectionRate}%`, background: "#10B981" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
