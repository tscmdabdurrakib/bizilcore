"use client";

import { useEffect, useState } from "react";
import { BarChart2, Loader2, Users, TrendingUp, AlertTriangle, CalendarCheck2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Stats {
  activeMembers: number;
  todayAttendance: number;
  monthRevenue: number;
  expiringCount: number;
  expiringMembers: Array<{ id: string; name: string; phone: string; membershipEnd: string; plan?: { name: string } }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const MONTH_LABELS: Record<string, string> = {
  "01": "জানু", "02": "ফেব্রু", "03": "মার্চ", "04": "এপ্রিল",
  "05": "মে", "06": "জুন", "07": "জুলাই", "08": "আগস্ট",
  "09": "সেপ্টে", "10": "অক্টো", "11": "নভে", "12": "ডিসে",
};

export default function GymReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gym/stats").then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} /></div>;

  const chartData = stats?.monthlyRevenue.map(m => ({
    name: MONTH_LABELS[m.month.split("-")[1]] ?? m.month.split("-")[1],
    amount: m.amount,
  })) ?? [];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: S.text }}>জিম রিপোর্ট</h1>
        <p className="text-sm" style={{ color: S.muted }}>সার্বিক পরিসংখ্যান</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users,          label: "সক্রিয় সদস্য",     value: `${stats?.activeMembers ?? 0}জন`,   color: "#7C3AED", bg: "#F5F3FF" },
          { icon: TrendingUp,     label: "এই মাসের আয়",     value: formatBDT(stats?.monthRevenue ?? 0), color: "#0F6E56", bg: "#E1F5EE" },
          { icon: CalendarCheck2, label: "আজকের উপস্থিতি",  value: `${stats?.todayAttendance ?? 0}জন`,  color: "#0891B2", bg: "#ECFEFF" },
          { icon: AlertTriangle,  label: "মেয়াদ শেষ হচ্ছে", value: `${stats?.expiringCount ?? 0}জন`,   color: "#D97706", bg: "#FEF3C7" },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon size={15} style={{ color: card.color }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: S.muted }}>{card.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly revenue chart */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} style={{ color: "#7C3AED" }} />
          <h2 className="font-bold" style={{ color: S.text }}>মাসিক আয় (শেষ ৬ মাস)</h2>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: S.muted }}>কোনো ডেটা নেই</p>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatBDT(Number(v)), "আয়"]} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? "#7C3AED" : "#C4B5FD"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Expiring members */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} style={{ color: "#D97706" }} />
          <h2 className="font-bold" style={{ color: S.text }}>৭ দিনে মেয়াদ শেষ হচ্ছে</h2>
        </div>
        {!stats?.expiringMembers?.length ? (
          <p className="text-sm py-4 text-center" style={{ color: S.muted }}>কেউ নেই</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: S.border }}>
                  {["নাম", "ফোন", "প্ল্যান", "মেয়াদ শেষ", "দিন বাকি"].map(h => (
                    <th key={h} className="text-left pb-2 pr-3 text-xs font-bold" style={{ color: S.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.expiringMembers.map(m => {
                  const end = new Date(m.membershipEnd);
                  const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={m.id} className="border-b" style={{ borderColor: S.border }}>
                      <td className="py-2 pr-3 font-medium" style={{ color: S.text }}>{m.name}</td>
                      <td className="py-2 pr-3" style={{ color: S.muted }}>{m.phone}</td>
                      <td className="py-2 pr-3" style={{ color: S.muted }}>{m.plan?.name ?? "—"}</td>
                      <td className="py-2 pr-3" style={{ color: S.muted }}>{end.toLocaleDateString("bn-BD")}</td>
                      <td className="py-2 font-bold" style={{ color: days <= 0 ? "#DC2626" : days <= 3 ? "#EF4444" : "#D97706" }}>
                        {days > 0 ? `${days} দিন` : "মেয়াদ শেষ"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
