"use client";

import { useEffect, useState } from "react";
import { BarChart2, Loader2, TrendingUp, Ticket, MapPin, Stamp, HandCoins } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Stats {
  monthBookings: number;
  upcomingCount: number;
  totalDue: number;
  monthProfit: number;
  upcoming: Array<{ id: string; bookingNumber: string; clientName: string; destination: string; travelDate: string; totalPersons: number; dueAmount: number }>;
  bookingTypeCounts: Array<{ bookingType: string; _count: number }>;
}

const TYPE_LABELS: Record<string, string> = {
  package: "প্যাকেজ ট্যুর",
  ticket: "টিকেট",
  hotel: "হোটেল",
  hajj_umrah: "হজ/উমরাহ",
  visa: "ভিসা",
  custom: "কাস্টম",
};

const TYPE_COLORS: Record<string, string> = {
  package: "#0891B2",
  ticket: "#7C3AED",
  hotel: "#B45309",
  hajj_umrah: "#0F6E56",
  visa: "#DC2626",
  custom: "#6B7280",
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function TravelReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/travel/stats").then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} /></div>;

  const chartData = stats?.bookingTypeCounts.map(b => ({
    name: TYPE_LABELS[b.bookingType] ?? b.bookingType,
    count: b._count,
    type: b.bookingType,
  })) ?? [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ color: S.text }}>ট্রাভেল রিপোর্ট</h1>
        <p className="text-sm" style={{ color: S.muted }}>এই মাসের সারসংক্ষেপ</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Ticket,    label: "এই মাসের বুকিং",     value: `${stats?.monthBookings ?? 0}টি`,     color: "#0891B2", bg: "#ECFEFF" },
          { icon: TrendingUp, label: "মাসের মুনাফা",      value: formatBDT(stats?.monthProfit ?? 0),   color: "#0F6E56", bg: "#E1F5EE" },
          { icon: HandCoins,  label: "মোট Pending বাকি",  value: formatBDT(stats?.totalDue ?? 0),      color: "#DC2626", bg: "#FEE2E2" },
          { icon: MapPin,     label: "আসন্ন ট্যুর (৭ দিন)", value: `${stats?.upcomingCount ?? 0}টি`, color: "#7C3AED", bg: "#F5F3FF" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
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

      {/* Booking type chart */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} style={{ color: "#0891B2" }} />
          <h2 className="font-bold" style={{ color: S.text }}>বুকিং ধরন অনুযায়ী বিভাজন</h2>
        </div>
        {chartData.length === 0 ? (
          <div className="py-10 text-center" style={{ color: S.muted }}>
            <p>কোনো ডেটা নেই</p>
          </div>
        ) : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v}টি`, "বুকিং"]} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={TYPE_COLORS[entry.type] ?? "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pending due table */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-3">
          <Stamp size={18} style={{ color: "#DC2626" }} />
          <h2 className="font-bold" style={{ color: S.text }}>আসন্ন ট্যুর — Pending বাকি</h2>
        </div>
        {!stats?.upcoming?.length ? (
          <p className="text-sm py-4 text-center" style={{ color: S.muted }}>কোনো আসন্ন ট্যুর নেই</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: S.border }}>
                  {["ক্লায়েন্ট", "গন্তব্য", "তারিখ", "জন", "বাকি"].map(h => (
                    <th key={h} className="text-left pb-2 pr-3 text-xs font-bold" style={{ color: S.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.upcoming.map((b) => (
                  <tr key={b.id} className="border-b" style={{ borderColor: S.border }}>
                    <td className="py-2 pr-3 font-medium" style={{ color: S.text }}>{b.clientName}</td>
                    <td className="py-2 pr-3" style={{ color: S.muted }}>{b.destination}</td>
                    <td className="py-2 pr-3" style={{ color: S.muted }}>{new Date(b.travelDate).toLocaleDateString("bn-BD")}</td>
                    <td className="py-2 pr-3" style={{ color: S.muted }}>{b.totalPersons}জন</td>
                    <td className="py-2 font-bold" style={{ color: b.dueAmount > 0 ? "#DC2626" : "#0F6E56" }}>
                      {b.dueAmount > 0 ? formatBDT(b.dueAmount) : "পরিশোধিত"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
