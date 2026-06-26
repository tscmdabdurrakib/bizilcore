"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PawPrint, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ReportData {
  totalPets: number; monthRevenue: number;
  petTypeBreakdown: { type: string; count: number }[];
  serviceBreakdown: { type: string; count: number; revenue: number }[];
  monthlyChart: { month: string; revenue: number; appointments: number }[];
}

const PET_COLOR = "#EA580C";
const COLORS = ["#EA580C","#10B981","#3B82F6","#8B5CF6","#F59E0B","#6B7280","#EF4444"];
const TYPE_LABELS: Record<string, string> = { dog: "🐕 কুকুর", cat: "🐈 বিড়াল", bird: "🐦 পাখি", fish: "🐟 মাছ", rabbit: "🐇 খরগোশ", turtle: "🐢 কচ্ছপ", other: "🐾 অন্যান্য" };
const APPT_LABELS: Record<string, string> = { checkup: "Checkup", grooming: "Grooming", vaccination: "টিকা", surgery: "অপারেশন", boarding: "Boarding" };
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

export default function PetShopReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/petshop/reports").then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={26} className="animate-spin" style={{ color: PET_COLOR }} /></div>;
  if (!data) return null;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      <div className="flex items-center gap-2">
        <PawPrint size={20} style={{ color: PET_COLOR }} />
        <h1 className="text-lg font-black" style={{ color: S.text }}>রিপোর্ট</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট পশু-পাখি", value: data.totalPets,                icon: PawPrint,   color: PET_COLOR,  bg: "#FFF7ED" },
          { label: "এই মাসের আয়",  value: formatBDT(data.monthRevenue),  icon: TrendingUp, color: "#10B981",  bg: "#ECFDF5" },
          { label: "সব Service",    value: data.serviceBreakdown.reduce((s, r) => s + r.count, 0), icon: Calendar, color: "#3B82F6", bg: "#EFF6FF" },
        ].map((s) => {
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

      {data.monthlyChart.length > 0 && (
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>মাসিক আয়</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.monthlyChart} barSize={18}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={((v: number) => [formatBDT(v), "আয়"]) as never} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="revenue" fill={PET_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>Pet Type Breakdown</h3>
          {data.petTypeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={data.petTypeBreakdown.map(r => ({ name: TYPE_LABELS[r.type] ?? r.type, value: r.count }))}
                  cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }: any) => `${name.split(" ")[1] ?? name}:${value}`} labelLine={false}>
                  {data.petTypeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-center py-8" style={{ color: S.muted }}>ডেটা নেই</p>}
        </div>

        <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>সবচেয়ে বেশি Service</h3>
          <div className="space-y-2">
            {data.serviceBreakdown.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: S.muted }}>ডেটা নেই</p>
            ) : data.serviceBreakdown.map((s, idx) => (
              <div key={s.type} className="flex items-center gap-2">
                <span className="text-xs font-black w-4" style={{ color: S.muted }}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: S.text }}>{APPT_LABELS[s.type] ?? s.type}</span>
                    <span className="text-xs font-bold" style={{ color: PET_COLOR }}>{formatBDT(s.revenue)}</span>
                  </div>
                  <p className="text-xs" style={{ color: S.muted }}>{s.count} appointments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
