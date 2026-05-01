"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  Building2, PartyPopper, CalendarCheck, TrendingDown,
  Loader2, RefreshCw, Users, Clock, AlertCircle,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface UpcomingEvent {
  id: string;
  bookingNumber: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  dueAmount: number;
  hall: { name: string };
}

interface HallUtil {
  id: string;
  name: string;
  bookedDays: number;
  totalDays: number;
  pct: number;
}

interface Stats {
  monthEvents: number;
  todayEvents: number;
  totalAdvance: number;
  totalDue: number;
  upcomingEvents: UpcomingEvent[];
  hallUtilization: HallUtil[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "💍 বিবাহ",
  birthday: "🎂 জন্মদিন",
  aqiqa: "👶 আকিকা",
  corporate: "💼 Corporate",
  seminar: "🎓 Seminar",
  mehndi: "💃 Mehndi",
  reception: "🎉 Reception",
  other: "🎊 অন্যান্য",
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardConvention({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/convention/dashboard-stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {}
    if (silent) setRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const greeting =
    userGender === "আপু" ? "আপু, স্বাগতম!" :
    userGender === "ভাই" ? "ভাইয়া, স্বাগতম!" :
    "স্বাগতম!";

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    );
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 55%, #4C1D95 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">কনভেনশন হল ম্যানেজমেন্ট</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">এই মাসের বুকিং</p>
              <p className="text-white text-2xl font-bold leading-none">{stats.monthEvents}টি</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের ইভেন্ট</p>
              <p className="text-white text-2xl font-bold leading-none">{stats.todayEvents}টি</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/convention/events?new=1", icon: PartyPopper,  label: "নতুন বুকিং", color: "#7C3AED", bg: "#F5F3FF" },
          { href: "/convention/halls",        icon: Building2,     label: "হল দেখুন",   color: "#0F6E56", bg: "#E1F5EE" },
          { href: "/convention/packages",     icon: CalendarCheck, label: "প্যাকেজ",    color: "#EF9F27", bg: "#FFF3DC" },
          { href: "/customers/new",           icon: Users,         label: "কাস্টমার",   color: "#3B82F6", bg: "#EFF6FF" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl flex-shrink-0 transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95"
            style={{ backgroundColor: a.bg, minWidth: "88px" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/60">
              <a.icon size={20} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: a.color }}>
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "এই মাসের বুকিং", value: `${stats.monthEvents}টি`, color: "#7C3AED", bg: "#F5F3FF", icon: PartyPopper },
          { label: "আজকের ইভেন্ট",   value: `${stats.todayEvents}টি`, color: "#0F6E56", bg: "#E1F5EE", icon: CalendarCheck },
          { label: "মোট Advance",     value: formatBDT(stats.totalAdvance), color: "#EF9F27", bg: "#FFF3DC", icon: Clock },
          { label: "মোট Pending বাকি", value: formatBDT(stats.totalDue),    color: "#EF4444", bg: "#FEE2E2", icon: TrendingDown },
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

      {/* Upcoming Events Timeline */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: S.text }}>আসন্ন ইভেন্ট (পরবর্তী ১৪ দিন)</h3>
          <button
            onClick={() => fetchStats(true)}
            className="p-1.5 rounded-lg transition-all hover:scale-105"
            style={{ backgroundColor: S.border }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} style={{ color: S.muted }} />
          </button>
        </div>

        {stats.upcomingEvents.length === 0 ? (
          <div className="text-center py-8" style={{ color: S.muted }}>
            <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">পরবর্তী ১৪ দিনে কোনো ইভেন্ট নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.upcomingEvents.map((ev) => {
              const evDate = new Date(ev.eventDate);
              const evDay = new Date(evDate); evDay.setHours(0,0,0,0);
              const isToday = evDay.getTime() === today.getTime();
              const isTomorrow = evDay.getTime() === tomorrow.getTime();
              const pillColor = isToday ? "#0F6E56" : isTomorrow ? "#EF9F27" : "#6B7280";
              const pillBg = isToday ? "#E1F5EE" : isTomorrow ? "#FFF3DC" : "#F3F4F6";

              return (
                <Link
                  key={ev.id}
                  href={`/convention/events/${ev.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)" }}
                >
                  <div className="rounded-lg px-2 py-1 text-center flex-shrink-0" style={{ backgroundColor: pillBg, minWidth: 52 }}>
                    <p className="text-[10px] font-bold" style={{ color: pillColor }}>
                      {isToday ? "আজ" : isTomorrow ? "কাল" : evDate.toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{ev.clientName}</p>
                    <p className="text-[11px] truncate" style={{ color: S.muted }}>
                      {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType} · {ev.hall.name} · {ev.guestCount} জন
                    </p>
                  </div>
                  {ev.dueAmount > 0 && (
                    <div className="rounded-lg px-2 py-1 flex-shrink-0" style={{ backgroundColor: "#FEE2E2" }}>
                      <p className="text-[11px] font-bold" style={{ color: "#EF4444" }}>বাকি {formatBDT(ev.dueAmount)}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        <Link href="/convention/events" className="block mt-3 text-center text-xs font-semibold py-2 rounded-xl" style={{ color: "#7C3AED", backgroundColor: "#F5F3FF" }}>
          সব ইভেন্ট দেখুন →
        </Link>
      </div>

      {/* Hall Utilization */}
      {stats.hallUtilization.length > 0 && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: S.text }}>এই মাসে হলের ব্যবহার</h3>
          <div className="space-y-3">
            {stats.hallUtilization.map((h) => (
              <div key={h.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold" style={{ color: S.text }}>{h.name}</p>
                  <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>{h.bookedDays}/{h.totalDays} দিন ({h.pct}%)</p>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${h.pct}%`, backgroundColor: "#7C3AED" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
