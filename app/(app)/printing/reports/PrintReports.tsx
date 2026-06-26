"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Printer, TrendingUp, Package, AlertTriangle, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ReportData {
  monthOrders: number;
  monthRevenue: number;
  totalDue: number;
  byStatus: { status: string; count: number }[];
  topServices: { name: string; qty: number; revenue: number }[];
  dailyChart: { day: string; revenue: number; orders: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  received: "Received", design_approval: "Design Approval",
  printing: "Printing", finishing: "Finishing", ready: "Ready", delivered: "Delivered",
};

const PRINT_COLOR = "#7C3AED";
const PRINT_LIGHT = "#F5F3FF";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

export default function PrintReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/printing/reports")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: PRINT_COLOR }} />
    </div>
  );

  if (!data) return null;

  const statCards = [
    { label: "এই মাসের অর্ডার",  value: data.monthOrders,                icon: Package,      color: PRINT_COLOR, bg: PRINT_LIGHT },
    { label: "এই মাসের আয়",      value: formatBDT(data.monthRevenue),    icon: TrendingUp,   color: "#10B981",   bg: "#ECFDF5" },
    { label: "মোট বাকি আছে",      value: formatBDT(data.totalDue),        icon: AlertTriangle,color: "#F59E0B",   bg: "#FFFBEB" },
    { label: "Delivered অর্ডার",  value: data.byStatus.find(s => s.status === "delivered")?.count ?? 0, icon: Printer, color: "#3B82F6", bg: "#EFF6FF" },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      <div className="flex items-center gap-2">
        <Printer size={20} style={{ color: PRINT_COLOR }} />
        <h1 className="text-lg font-black" style={{ color: S.text }}>রিপোর্ট</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: S.text }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Daily Revenue Chart */}
      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>দৈনিক আয় (গত ৩০ দিন)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.dailyChart} barSize={12}>
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={((v: number) => [formatBDT(v), "আয়"]) as never}
              contentStyle={{ borderRadius: 12, border: "1px solid #E8E6DF", fontSize: 12 }}
            />
            <Bar dataKey="revenue" fill={PRINT_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown + Top Services */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Status */}
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>Status অনুযায়ী অর্ডার</h3>
          <div className="space-y-2">
            {data.byStatus.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: S.text }}>{STATUS_LABELS[s.status] ?? s.status}</span>
                <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: PRINT_LIGHT, color: PRINT_COLOR }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>এই মাসের Top Services</h3>
          <div className="space-y-2">
            {data.topServices.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: S.muted }}>ডেটা পাওয়া যায়নি</p>
            ) : data.topServices.map((s, idx) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs font-black w-5 text-center" style={{ color: S.muted }}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{s.name}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{s.qty} units</p>
                </div>
                <span className="text-sm font-bold" style={{ color: PRINT_COLOR }}>{formatBDT(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
