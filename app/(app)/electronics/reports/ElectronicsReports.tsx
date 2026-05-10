"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2, BarChart2, Smartphone } from "lucide-react";

const PRIMARY = "#3B82F6";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0891B2", "#84CC16"];

const DEVICE_TYPE_LABELS: Record<string, string> = {
  smartphone: "Smartphone", laptop: "Laptop", tablet: "Tablet",
  tv: "TV", ac: "AC", fridge: "Fridge", washing_machine: "Washing Machine",
  microwave: "Microwave", router: "Router", other: "Other",
};

const MONTH_LABELS: Record<string, string> = {
  "01": "জানু", "02": "ফেব্রু", "03": "মার্চ", "04": "এপ্রিল",
  "05": "মে", "06": "জুন", "07": "জুলাই", "08": "আগ",
  "09": "সেপ্টে", "10": "অক্টো", "11": "নভে", "12": "ডিসে",
};

type ReportData = {
  monthlyRevenue: { month: string; revenue: number; partsTotal: number; profit: number; count: number }[];
  deviceTypeBreakdown: { type: string; count: number }[];
  topComplaints: { complaint: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  warrantyRate: number;
  avgRevenue: number;
  totalJobs: number;
  totalRevenue: number;
};

export default function ElectronicsReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(3);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/electronics/reports?months=${months}`, { cache: "no-store" })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [months]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" style={{ color: PRIMARY }} size={32} />
      </div>
    );
  }
  if (!data) return <div className="p-6 text-center" style={{ color: S.muted }}>ডেটা লোড হয়নি</div>;

  const chartData = data.monthlyRevenue.map(m => ({
    ...m,
    label: `${MONTH_LABELS[m.month.slice(5)] || m.month.slice(5)} ${m.month.slice(2, 4)}`,
  }));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={20} style={{ color: PRIMARY }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>রিপোর্ট</h1>
        </div>
        <select
          value={months}
          onChange={e => setMonths(Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm outline-none"
          style={{ borderColor: S.border, color: S.text, background: S.surface }}
        >
          <option value={1}>১ মাস</option>
          <option value={3}>৩ মাস</option>
          <option value={6}>৬ মাস</option>
          <option value={12}>১২ মাস</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট Job Card", value: data.totalJobs, color: PRIMARY },
          { label: "মোট আয়", value: `৳${data.totalRevenue.toLocaleString("bn-BD")}`, color: "#16A34A" },
          { label: "গড় আয় / জব", value: `৳${data.avgRevenue.toLocaleString("bn-BD")}`, color: "#B45309" },
          { label: "ওয়ারেন্টি হার", value: `${data.warrantyRate}%`, color: "#7C3AED" },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs mt-1" style={{ color: S.muted }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>মাসিক আয় বনাম পার্টস খরচ</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `৳${v.toLocaleString("bn-BD")}`} />
              <Bar dataKey="revenue" name="আয়" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              <Bar dataKey="partsTotal" name="পার্টস খরচ" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="লাভ" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Device Type Breakdown */}
        {data.deviceTypeBreakdown.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>ডিভাইসের ধরন</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.deviceTypeBreakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ type, percent }) => `${DEVICE_TYPE_LABELS[type] || type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.deviceTypeBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, DEVICE_TYPE_LABELS[n as string] || n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Brands */}
        {data.topBrands.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>সবচেয়ে বেশি মেরামত (ব্র্যান্ড)</h3>
            <div className="space-y-2">
              {data.topBrands.map((b, i) => {
                const max = data.topBrands[0].count;
                return (
                  <div key={b.brand} className="flex items-center gap-2">
                    <span className="text-xs w-4 text-right" style={{ color: S.muted }}>{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span style={{ color: S.text }}>{b.brand}</span>
                        <span style={{ color: S.muted }}>{b.count}টি</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(b.count / max) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Complaints */}
      {data.topComplaints.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>সবচেয়ে বেশি সমস্যা (Top 10)</h3>
          <div className="space-y-2">
            {data.topComplaints.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <p className="text-sm flex-1 truncate" style={{ color: S.text }}>{c.complaint}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#EFF6FF", color: PRIMARY }}
                >
                  {c.count}টি
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalJobs === 0 && (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Smartphone size={40} className="mx-auto mb-2 opacity-30" />
          <p>এই সময়ে কোনো Job Card নেই</p>
        </div>
      )}
    </div>
  );
}
