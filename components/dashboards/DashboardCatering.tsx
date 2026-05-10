"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, CalendarRange, DollarSign, AlertTriangle, Clock, Plus, ScrollText, Users, BarChart2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#EA580C",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "💍 বিয়ে", birthday: "🎂 জন্মদিন", aqiqa: "🐑 আকিকা",
  corporate: "🏢 Corporate", mehndi: "💜 মেহেন্দি", other: "✨ অন্যান্য",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  enquiry:       { label: "তদন্ত",        bg: "#F3F4F6", color: "#374151" },
  confirmed:     { label: "নিশ্চিত",      bg: "#DCFCE7", color: "#166534" },
  advance_paid:  { label: "অগ্রিম পাওয়া", bg: "#DBEAFE", color: "#1E40AF" },
  preparation:   { label: "Preparation",  bg: "#FEF3C7", color: "#92400E" },
  completed:     { label: "সম্পন্ন",      bg: "#D1FAE5", color: "#065F46" },
  cancelled:     { label: "বাতিল",        bg: "#FEE2E2", color: "#991B1B" },
};

type UpcomingEvent = {
  id: string; bookingNumber: string; clientName: string; clientPhone: string;
  eventType: string; eventDate: string; eventTime: string | null; venue: string;
  guestCount: number; status: string; totalAmount: number; dueAmount: number; staffNeeded: number | null;
};

type DashStats = {
  monthEvents: number; upcomingCount: number; pendingDue: number; monthProfit: number;
  upcomingEvents: UpcomingEvent[];
  nextWeekEventCount: number; totalStaffNeeded: number; preparationAlerts: number;
};

export default function DashboardCatering({ shopName, userName, userGender }: {
  shopName: string; userName: string; userGender?: string | null;
}) {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch("/api/catering/dashboard");
    if (r.ok) setStats(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const greeting =
    userGender === "আপু" ? `আপু, আস-সালামু আলাইকুম!` :
    userGender === "ভাই" ? `ভাইয়া, আস-সালামু আলাইকুম!` :
    `আস-সালামু আলাইকুম!`;

  if (loading) return (
    <div className="space-y-5">
      <div className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: S.border }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: S.border }} />)}
      </div>
    </div>
  );

  const statCards = [
    { label: "এই মাসের ইভেন্ট",         value: `${stats?.monthEvents ?? 0}টি`,            color: S.primary,  icon: CalendarRange },
    { label: "আসন্ন ইভেন্ট (৭ দিন)",   value: `${stats?.upcomingCount ?? 0}টি`,           color: "#7C3AED",  icon: Clock },
    { label: "মোট Pending বাকি",         value: formatBDT(stats?.pendingDue ?? 0),          color: "#DC2626",  icon: DollarSign },
    { label: "এই মাসের মুনাফা",         value: formatBDT(stats?.monthProfit ?? 0),         color: "#10B981",  icon: BarChart2 },
  ];

  const quickLinks = [
    { href: "/catering/events",  icon: CalendarRange, label: "নতুন বুকিং", bg: "#FFF7ED", color: S.primary },
    { href: "/catering/menus",   icon: ScrollText,    label: "Menu Templates", bg: "#F5F3FF", color: "#7C3AED" },
    { href: "/customers",        icon: Users,         label: "কাস্টমার",   bg: "#EFF6FF", color: "#2563EB" },
    { href: "/hr",               icon: Users,         label: "স্টাফ",      bg: "#ECFDF5", color: "#10B981" },
    { href: "/hisab",            icon: DollarSign,    label: "হিসাব",      bg: "#FFF7ED", color: S.primary },
    { href: "/catering/reports", icon: BarChart2,     label: "রিপোর্ট",   bg: "#F0FDF4", color: "#16A34A" },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #EA580C 0%, #C2410C 60%, #9A3412 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ChefHat size={18} className="text-white/80" />
              <span className="text-white/70 text-xs font-medium">ক্যাটারিং সার্ভিস</span>
            </div>
            <h2 className="text-white text-xl font-bold">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <Link href="/catering/events"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-orange-700 bg-white/90 self-start sm:self-auto">
            <Plus size={15} /> নতুন বুকিং
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
              <c.icon size={16} style={{ color: c.color }} />
            </div>
            <p className="text-[11px] font-medium leading-tight" style={{ color: S.muted }}>{c.label}</p>
            <p className="text-xl font-bold leading-none" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Staff Planning Alert */}
      {(stats?.nextWeekEventCount ?? 0) > 0 && (
        <div className="rounded-2xl border border-orange-200 p-4 flex items-start gap-3" style={{ backgroundColor: "#FFF7ED" }}>
          <AlertTriangle size={18} style={{ color: S.primary, flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm" style={{ color: "#9A3412" }}>
            আগামী সপ্তাহে <strong>{stats?.nextWeekEventCount}টি ইভেন্ট</strong> আছে।
            মোট <strong>{stats?.totalStaffNeeded} জন staff</strong> দরকার।
          </p>
        </div>
      )}

      {/* Upcoming Events Timeline */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: S.text }}>আসন্ন ইভেন্ট (৭ দিন)</h2>
          <Link href="/catering/events" className="text-xs font-medium" style={{ color: S.primary }}>সব দেখুন →</Link>
        </div>

        {(stats?.upcomingEvents.length ?? 0) === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: S.muted }}>আসন্ন কোনো ইভেন্ট নেই</p>
        ) : (
          <div className="space-y-3">
            {stats?.upcomingEvents.map(ev => {
              const evDate = new Date(ev.eventDate);
              const diff   = Math.ceil((evDate.getTime() - Date.now()) / 86400000);
              const soonAlert = diff <= 3;
              const st = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.confirmed;
              return (
                <Link key={ev.id} href={`/catering/events/${ev.id}`}>
                  <div className={`rounded-xl border p-4 hover:border-orange-300 transition-colors ${soonAlert ? "border-orange-300 bg-orange-50" : ""}`}
                    style={{ borderColor: soonAlert ? "#FDBA74" : S.border, backgroundColor: soonAlert ? "#FFF7ED" : S.surface }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate" style={{ color: S.text }}>{ev.clientName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                            {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: S.muted }}>
                          📍 {ev.venue} · 👥 {ev.guestCount} জন · {ev.eventTime ?? ""}
                        </p>
                        <p className="text-xs font-medium" style={{ color: diff <= 1 ? "#DC2626" : S.primary }}>
                          {diff === 0 ? "আজ!" : diff === 1 ? "কাল" : `${diff} দিন বাকি`}
                          {" · "}{evDate.toLocaleDateString("bn-BD")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: S.text }}>৳{ev.totalAmount.toLocaleString()}</p>
                        {ev.dueAmount > 0 && <p className="text-xs" style={{ color: "#DC2626" }}>বাকি ৳{ev.dueAmount.toLocaleString()}</p>}
                        <p className="text-xs mt-0.5" style={{ color: S.muted }}>{ev.bookingNumber}</p>
                      </div>
                    </div>
                    {soonAlert && (
                      <div className="mt-2 flex gap-2">
                        <a href={`tel:${ev.clientPhone}`}
                          className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium"
                          style={{ backgroundColor: S.primary, color: "white" }}
                          onClick={e => e.stopPropagation()}>
                          📞 Call করুন
                        </a>
                        <span className="flex-1 text-center text-xs py-1.5 rounded-lg font-medium border" style={{ borderColor: S.primary, color: S.primary }}>
                          Preparation শুরু করুন
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {quickLinks.map((l, i) => (
          <Link key={i} href={l.href}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:opacity-80 transition-opacity"
            style={{ backgroundColor: l.bg, borderColor: S.border }}>
            <l.icon size={18} style={{ color: l.color }} />
            <span className="text-[10px] font-medium text-center leading-tight" style={{ color: l.color }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
