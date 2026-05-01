"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  Dumbbell, Users, CalendarCheck2, TrendingUp, AlertTriangle,
  Loader2, RefreshCw, LogIn, Plus,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface Stats {
  activeMembers: number;
  todayAttendance: number;
  monthRevenue: number;
  expiringCount: number;
  expiringMembers: Array<{ id: string; name: string; phone: string; membershipEnd: string; plan?: { name: string } }>;
  todayCheckIns: Array<{ id: string; checkIn: string; member: { name: string; memberId: string } }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const GYM_COLOR = "#7C3AED";
const GYM_BG = "#F5F3FF";

export default function DashboardGym({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const salutation = userGender === "মহিলা" ? "আপু" : "ভাই";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/gym/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: GYM_COLOR }} /></div>;

  const statCards = [
    { label: "সক্রিয় সদস্য",     value: `${stats?.activeMembers ?? 0}জন`,   icon: Users,          color: GYM_COLOR, bg: GYM_BG,      href: "/gym/members" },
    { label: "আজকের উপস্থিতি",   value: `${stats?.todayAttendance ?? 0}জন`, icon: CalendarCheck2, color: "#0F6E56",  bg: "#E1F5EE",   href: "/gym/attendance" },
    { label: "এই মাসের আয়",      value: formatBDT(stats?.monthRevenue ?? 0), icon: TrendingUp,     color: "#0891B2",  bg: "#ECFEFF",   href: "/gym/reports" },
    { label: "মেয়াদ শেষ হচ্ছে",  value: `${stats?.expiringCount ?? 0}জন`,   icon: AlertTriangle,  color: "#D97706",  bg: "#FEF3C7",   href: "/gym/members?status=expired" },
  ];

  const quickActions = [
    { href: "/gym/attendance",  icon: LogIn,       label: "Check-In করুন", color: GYM_COLOR, bg: GYM_BG },
    { href: "/gym/members",     icon: Plus,        label: "নতুন সদস্য",    color: "#0F6E56", bg: "#E1F5EE" },
    { href: "/gym/memberships", icon: Dumbbell,    label: "প্ল্যান দেখুন", color: "#0891B2", bg: "#ECFEFF" },
    { href: "/gym/reports",     icon: TrendingUp,  label: "রিপোর্ট",       color: "#D97706", bg: "#FEF3C7" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>
            স্বাগতম, {userName} {salutation}! 💪
          </h1>
          <p className="text-sm" style={{ color: S.muted }}>{shopName}</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
          <RefreshCw size={16} style={{ color: S.muted }} />
        </button>
      </div>

      {/* Expiry alert banner */}
      {stats && stats.expiringCount > 0 && (
        <div className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}>
          <AlertTriangle size={18} style={{ color: "#D97706" }} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#B45309" }}>{stats.expiringCount}জন সদস্যের মেম্বারশিপ ৭ দিনে শেষ হবে</p>
            <p className="text-xs" style={{ color: "#D97706" }}>{stats.expiringMembers.slice(0, 3).map(m => m.name).join(", ")}{stats.expiringCount > 3 ? ` এবং আরো...` : ""}</p>
          </div>
          <Link href="/gym/members?status=expired" className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ backgroundColor: "#D97706", color: "#fff" }}>
            দেখুন
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <Link key={card.label} href={card.href} className="rounded-2xl border p-4 block transition-shadow hover:shadow-md" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon size={17} style={{ color: card.color }} />
              </div>
              <p className="text-[11px] font-medium leading-tight" style={{ color: S.muted }}>{card.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map(a => (
          <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-3 rounded-2xl border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.bg }}>
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-semibold leading-tight" style={{ color: S.text }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Currently in gym */}
      {stats && stats.todayCheckIns.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-bold" style={{ color: S.text }}>এখন জিমে আছেন ({stats.todayCheckIns.length}জন)</h2>
            </div>
            <Link href="/gym/attendance" className="text-xs font-medium" style={{ color: GYM_COLOR }}>সব দেখুন</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.todayCheckIns.slice(0, 8).map(a => {
              const mins = Math.round((Date.now() - new Date(a.checkIn).getTime()) / 60000);
              const dur = mins < 60 ? `${mins}মি` : `${Math.floor(mins / 60)}ঘ ${mins % 60}মি`;
              return (
                <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: GYM_BG }}>
                  <span className="font-semibold" style={{ color: GYM_COLOR }}>{a.member.name}</span>
                  <span style={{ color: S.muted }}>{dur}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expiring members list */}
      {stats && stats.expiringMembers.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: S.text }}>মেয়াদ শেষ হচ্ছে</h2>
            <Link href="/gym/reports" className="text-xs font-medium" style={{ color: GYM_COLOR }}>রিপোর্ট দেখুন</Link>
          </div>
          <div className="space-y-2">
            {stats.expiringMembers.slice(0, 5).map(m => {
              const end = new Date(m.membershipEnd);
              const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
              return (
                <Link key={m.id} href={`/gym/members/${m.id}`}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: S.border }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{m.name}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{m.phone} — {m.plan?.name ?? "কোনো প্ল্যান নেই"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: days <= 0 ? "#DC2626" : days <= 3 ? "#EF4444" : "#D97706" }}>
                      {days > 0 ? `${days} দিন` : "শেষ"}
                    </p>
                    <p className="text-[11px]" style={{ color: S.muted }}>{end.toLocaleDateString("bn-BD")}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
