"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Home, TrendingUp, Users, HandCoins, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ReportData {
  totalProps: number; totalLeads: number; totalDeals: number; totalCommission: number;
  propTypeBreakdown: { type: string; count: number }[];
  dealsByMonth: { month: string; commission: number; deals: number }[];
  leadStageBreakdown: { stage: string; count: number }[];
}

const RE_COLOR = "#0891B2";
const COLORS = ["#0891B2","#10B981","#F59E0B","#8B5CF6","#EF4444","#6B7280"];
const TYPE_LABELS: Record<string, string> = { flat: "Flat", house: "House", plot: "Plot", commercial: "Commercial", office: "Office", warehouse: "Warehouse" };
const STAGE_LABELS: Record<string, string> = { new: "নতুন", contacted: "যোগাযোগ", site_visit_done: "Site Visit", negotiating: "আলোচনায়", deal_done: "Deal", lost: "Lost" };
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

export default function RealEstateReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/realestate/reports").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={26} className="animate-spin" style={{ color: RE_COLOR }} /></div>;
  if (!data) return null;

  const statCards = [
    { label: "মোট Property",  value: data.totalProps,                  icon: Home,       color: RE_COLOR,  bg: "#E0F2FE" },
    { label: "মোট Lead",      value: data.totalLeads,                  icon: Users,      color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "সম্পন্ন Deal",  value: data.totalDeals,                  icon: HandCoins,  color: "#F59E0B", bg: "#FFFBEB" },
    { label: "মোট কমিশন",    value: formatBDT(data.totalCommission),   icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      <div className="flex items-center gap-2">
        <Home size={20} style={{ color: RE_COLOR }} />
        <h1 className="text-lg font-black" style={{ color: S.text }}>রিপোর্ট</h1>
      </div>

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

      {data.dealsByMonth.length > 0 && (
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>মাসিক কমিশন আয়</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dealsByMonth} barSize={16}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={((v: number) => [formatBDT(v), "কমিশন"]) as never} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="commission" fill={RE_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>Property Type Breakdown</h3>
          {data.propTypeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={data.propTypeBreakdown.map(r => ({ name: TYPE_LABELS[r.type] ?? r.type, value: r.count }))}
                  cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}:${value}`} labelLine={false}>
                  {data.propTypeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-center py-8" style={{ color: S.muted }}>ডেটা নেই</p>}
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>Lead Conversion Funnel</h3>
          <div className="space-y-2">
            {data.leadStageBreakdown.map(s => (
              <div key={s.stage} className="flex items-center gap-2">
                <span className="text-xs w-24 font-semibold" style={{ color: S.muted }}>{STAGE_LABELS[s.stage] ?? s.stage}</span>
                <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.count / Math.max(...data.leadStageBreakdown.map(x => x.count))) * 100)}%`, backgroundColor: RE_COLOR }} />
                </div>
                <span className="text-xs font-bold w-4 text-right" style={{ color: S.text }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
