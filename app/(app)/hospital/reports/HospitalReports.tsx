"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Loader2, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { formatBDT } from "@/lib/utils";

interface ReportData {
  doctorChartData: { name: string; count: number; revenue: number }[];
  wardOccupancy: { ward: string; occupied: number; total: number }[];
  revenueByType: { type: string; amount: number }[];
  monthly: { month: string; opd: number; ipdCount: number; opdRevenue: number; ipdRevenue: number; totalRevenue: number }[];
  opdTrend: { date: string; count: number }[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const ACC = "#378ADD";
const COLORS = [ACC, "#7C3AED", "#0F6E56", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"];
const CHARGE_LABELS: Record<string, string> = { room: "রুম", doctor_visit: "ডাক্তার ভিজিট", nursing: "নার্সিং", medicine: "ওষুধ", procedure: "পদ্ধতি", lab: "ল্যাব", other: "অন্যান্য" };

export default function HospitalReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hospital/reports?months=6").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: ACC }} /></div>;
  if (!data) return null;

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: S.text }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart2 size={20} style={{ color: ACC }} />
        <h1 className="text-lg font-bold" style={{ color: S.text }}>হাসপাতাল রিপোর্ট</h1>
      </div>

      {data.monthly.length > 0 && (
        <Card title="মাসিক আয় (OPD + IPD)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.monthly}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: S.muted }} />
              <YAxis tick={{ fontSize: 11, fill: S.muted }} width={55} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatBDT(v)} labelStyle={{ color: S.text }} contentStyle={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 12 }} />
              <Bar dataKey="opdRevenue" fill={ACC} name="OPD আয়" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ipdRevenue" fill="#7C3AED" name="IPD আয়" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data.opdTrend.length > 0 && (
        <Card title="এই মাসের দৈনিক OPD রোগী">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data.opdTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: S.muted }} />
              <YAxis tick={{ fontSize: 11, fill: S.muted }} width={30} />
              <Tooltip labelStyle={{ color: S.text }} contentStyle={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 12 }} />
              <Line type="monotone" dataKey="count" stroke={ACC} strokeWidth={2} dot={false} name="রোগী সংখ্যা" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.doctorChartData.length > 0 && (
          <Card title="ডাক্তার-ভিত্তিক রোগী সংখ্যা">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.doctorChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: S.muted }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: S.muted }} width={80} />
                <Tooltip labelStyle={{ color: S.text }} contentStyle={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 12 }} />
                <Bar dataKey="count" fill={ACC} name="রোগী সংখ্যা" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {data.revenueByType.length > 0 && (
          <Card title="চার্জের ধরন অনুযায়ী আয় (IPD)">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={data.revenueByType.map((r) => ({ ...r, name: CHARGE_LABELS[r.type] ?? r.type }))} dataKey="amount" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {data.revenueByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {data.revenueByType.map((r, i) => (
                  <div key={r.type} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span style={{ color: S.text }}>{CHARGE_LABELS[r.type] ?? r.type}</span>
                    <span className="ml-auto font-medium" style={{ color: S.text }}>{formatBDT(r.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {data.wardOccupancy.length > 0 && (
        <Card title="ওয়ার্ড অকুপেন্সি">
          <div className="space-y-3">
            {data.wardOccupancy.map((w) => (
              <div key={w.ward}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: S.text }}>{w.ward}</span>
                  <span style={{ color: S.muted }}>{w.occupied}টি ভর্তি</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: S.border }}>
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (w.occupied / Math.max(1, w.total)) * 100)}%`, backgroundColor: "#7C3AED" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.monthly.length > 0 && (
        <Card title="মাসিক সারসংক্ষেপ (P&L)">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: S.border }}>
                  <th className="text-left py-2 font-semibold" style={{ color: S.muted }}>মাস</th>
                  <th className="text-right py-2 font-semibold" style={{ color: S.muted }}>OPD রোগী</th>
                  <th className="text-right py-2 font-semibold" style={{ color: S.muted }}>IPD ভর্তি</th>
                  <th className="text-right py-2 font-semibold" style={{ color: S.muted }}>OPD আয়</th>
                  <th className="text-right py-2 font-semibold" style={{ color: S.muted }}>IPD আয়</th>
                  <th className="text-right py-2 font-semibold" style={{ color: S.muted }}>মোট আয়</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((m) => (
                  <tr key={m.month} className="border-b last:border-0" style={{ borderColor: S.border }}>
                    <td className="py-2" style={{ color: S.text }}>{m.month}</td>
                    <td className="py-2 text-right" style={{ color: S.muted }}>{m.opd}</td>
                    <td className="py-2 text-right" style={{ color: S.muted }}>{m.ipdCount}</td>
                    <td className="py-2 text-right" style={{ color: ACC }}>{formatBDT(m.opdRevenue)}</td>
                    <td className="py-2 text-right" style={{ color: "#7C3AED" }}>{formatBDT(m.ipdRevenue)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: "#0F6E56" }}>{formatBDT(m.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data.monthly.length === 0 && data.doctorChartData.length === 0 && (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Activity size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>পর্যাপ্ত ডেটা নেই</p>
        </div>
      )}
    </div>
  );
}
