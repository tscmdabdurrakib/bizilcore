"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, CalendarCheck2, AlertTriangle, DollarSign, ChefHat, ClipboardPen, BookOpen, GraduationCap } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#F59E0B",
};

type DashStats = {
  totalChildren: number;
  todayPresent: number;
  absentToday: number;
  totalToday: number;
  allergyCount: number;
  allergyAlerts: { id: string; name: string; foodAllergies: string; section: string | null }[];
  monthRevenue: number;
  reportsSent: number;
  reportsTotal: number;
};

export default function DashboardKindergarten() {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    fetch("/api/kindergarten/dashboard")
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return (
    <div className="p-6 text-center" style={{ color: S.muted }}>
      <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
      লোড হচ্ছে...
    </div>
  );

  const statCards = [
    {
      label: "মোট শিশু",
      value: String(stats.totalChildren),
      sub: "সক্রিয় শিশু",
      icon: Users,
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
    {
      label: "আজকের উপস্থিতি",
      value: String(stats.todayPresent),
      sub: stats.totalToday > 0 ? `অনুপস্থিত: ${stats.absentToday}` : "রেকর্ড নেই",
      icon: CalendarCheck2,
      color: "#10B981",
      bg: "#ECFDF5",
    },
    {
      label: "Food Allergy সতর্কতা",
      value: String(stats.allergyCount),
      sub: "শিশুর allergy আছে",
      icon: AlertTriangle,
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "এই মাসের আয়",
      value: formatBDT(stats.monthRevenue),
      sub: "ফি সংগ্রহ",
      icon: DollarSign,
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      {/* Hero Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 55%, #B45309 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <GraduationCap size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium">কিন্ডারগার্টেন ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold">শিশুদের আজকের অবস্থা</h2>
            <p className="text-white/80 text-sm mt-0.5">
              উপস্থিত {stats.todayPresent} · মোট {stats.totalChildren} শিশু
            </p>
          </div>
        </div>
      </div>

      {/* Allergy Alert Banner — safety critical, always visible */}
      {stats.allergyAlerts.length > 0 && (
        <div className="rounded-xl p-4 border-2" style={{ background: "#FEF2F2", borderColor: "#EF4444" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "#DC2626" }}>
                ⚠️ আজ উপস্থিত শিশুদের মধ্যে food allergy আছে:
              </p>
              <div className="mt-2 space-y-1">
                {stats.allergyAlerts.map(c => (
                  <p key={c.id} className="text-sm" style={{ color: "#7F1D1D" }}>
                    • <span className="font-semibold">{c.name}</span>
                    {c.section ? ` (${c.section})` : ""}
                    {" — "}
                    <span style={{ color: "#DC2626" }}>{c.foodAllergies}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl p-4 space-y-2" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: S.muted }}>{card.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: S.text }}>{card.value}</p>
            <p className="text-xs" style={{ color: S.muted }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Attendance + Daily Report Quick Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Attendance Summary */}
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm" style={{ color: S.text }}>আজকের উপস্থিতি</p>
            <Link href="/school/attendance" className="text-xs font-medium" style={{ color: S.primary }}>
              উপস্থিতি নিন →
            </Link>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg p-3 text-center" style={{ background: "#ECFDF5" }}>
              <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{stats.todayPresent}</p>
              <p className="text-xs mt-0.5" style={{ color: "#065F46" }}>উপস্থিত</p>
            </div>
            <div className="flex-1 rounded-lg p-3 text-center" style={{ background: "#FEF2F2" }}>
              <p className="text-2xl font-bold" style={{ color: "#EF4444" }}>{stats.absentToday}</p>
              <p className="text-xs mt-0.5" style={{ color: "#7F1D1D" }}>অনুপস্থিত</p>
            </div>
            <div className="flex-1 rounded-lg p-3 text-center" style={{ background: "#F9FAFB" }}>
              <p className="text-2xl font-bold" style={{ color: S.text }}>{stats.totalChildren}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>মোট</p>
            </div>
          </div>
        </div>

        {/* Daily Report Status */}
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm" style={{ color: S.text }}>আজকের ডেইলি রিপোর্ট</p>
            <Link href="/daily-report" className="text-xs font-medium" style={{ color: S.primary }}>
              রিপোর্ট লিখুন →
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: stats.reportsTotal > 0 ? `${Math.round((stats.reportsSent / stats.reportsTotal) * 100)}%` : "0%",
                  background: "#10B981",
                }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: S.text }}>
              {stats.reportsSent}/{stats.reportsTotal}
            </span>
          </div>
          <p className="text-xs" style={{ color: S.muted }}>
            {stats.reportsSent} জনের রিপোর্ট পাঠানো হয়েছে
            {stats.reportsTotal > stats.reportsSent ? ` · বাকি ${stats.reportsTotal - stats.reportsSent} জন` : ""}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/children", label: "নতুন শিশু ভর্তি", icon: Users, color: "#F59E0B", bg: "#FFFBEB" },
          { href: "/meals", label: "খাবার ট্র্যাক", icon: ChefHat, color: "#10B981", bg: "#ECFDF5" },
          { href: "/daily-report", label: "ডেইলি রিপোর্ট", icon: ClipboardPen, color: "#8B5CF6", bg: "#F5F3FF" },
          { href: "/school/fees", label: "ফি সংগ্রহ", icon: DollarSign, color: "#3B82F6", bg: "#EFF6FF" },
          { href: "/school/attendance", label: "উপস্থিতি", icon: CalendarCheck2, color: "#EC4899", bg: "#FDF2F8" },
          { href: "/kindergarten/reports", label: "রিপোর্ট", icon: BookOpen, color: "#EF4444", bg: "#FEF2F2" },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-[1.03] active:scale-95"
            style={{ background: a.bg }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60">
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <p className="text-xs font-medium text-center" style={{ color: a.color }}>{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
