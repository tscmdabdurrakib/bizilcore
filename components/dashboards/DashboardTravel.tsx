"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  Plane, Ticket, MapPin, Stamp, HandCoins, Users,
  Loader2, RefreshCw, CalendarClock, TrendingUp, AlertCircle,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface Stats {
  monthBookings: number;
  upcomingCount: number;
  totalDue: number;
  monthProfit: number;
  upcoming: Array<{
    id: string;
    bookingNumber: string;
    clientName: string;
    destination: string;
    travelDate: string;
    totalPersons: number;
    dueAmount: number;
  }>;
  bookingTypeCounts: Array<{ bookingType: string; _count: number }>;
}

const BOOKING_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  package:    { label: "প্যাকেজ ট্যুর", color: "#0891B2", bg: "#ECFEFF" },
  ticket:     { label: "টিকেট",          color: "#7C3AED", bg: "#F5F3FF" },
  hotel:      { label: "হোটেল",          color: "#B45309", bg: "#FEF3C7" },
  hajj_umrah: { label: "হজ/উমরাহ",       color: "#0F6E56", bg: "#E1F5EE" },
  visa:       { label: "ভিসা",            color: "#DC2626", bg: "#FEE2E2" },
  custom:     { label: "কাস্টম",          color: "#6B7280", bg: "#F3F4F6" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon size={15} style={{ color }} />
        </div>
        <p className="text-[11px] font-medium" style={{ color: S.muted }}>{label}</p>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

export default function DashboardTravel({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/travel/stats", { cache: "no-store" });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} />
      </div>
    );
  }

  const quickActions = [
    { href: "/travel/bookings?new=1", icon: Ticket, label: "নতুন বুকিং", color: "#0891B2", bg: "#ECFEFF" },
    { href: "/travel/packages",       icon: MapPin,  label: "প্যাকেজ",    color: "#7C3AED", bg: "#F5F3FF" },
    { href: "/travel/visa?new=1",     icon: Stamp,   label: "ভিসা আবেদন", color: "#0F6E56", bg: "#E1F5EE" },
    { href: "/customers",             icon: Users,   label: "কাস্টমার",   color: "#B45309", bg: "#FEF3C7" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* Hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0891B2 0%, #0369A1 55%, #0c5980 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane size={18} className="text-white/80" />
              <p className="text-white/80 text-sm font-medium">ট্রাভেল এজেন্সি</p>
            </div>
            <h2 className="text-white text-xl font-bold">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 text-xs font-medium transition-all hover:bg-white/10 self-start sm:self-auto"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl flex-shrink-0 transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95"
            style={{ backgroundColor: a.bg, minWidth: "88px" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/60">
              <a.icon size={20} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight" style={{ color: a.color }}>
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Ticket}      label="এই মাসের বুকিং" value={`${stats?.monthBookings ?? 0}টি`}              color="#0891B2" bg="#ECFEFF" />
        <StatCard icon={CalendarClock} label="আসন্ন ট্যুর (৭ দিন)" value={`${stats?.upcomingCount ?? 0}টি`}    color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={AlertCircle} label="মোট অপেক্ষমান বাকি" value={formatBDT(stats?.totalDue ?? 0)}            color="#DC2626" bg="#FEE2E2" />
        <StatCard icon={TrendingUp}  label="এই মাসের মুনাফা" value={formatBDT(stats?.monthProfit ?? 0)}          color="#0F6E56" bg="#E1F5EE" />
      </div>

      {/* Upcoming + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming travels */}
        <div className="lg:col-span-2 rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>আসন্ন ট্যুর (পরবর্তী ১৪ দিন)</h3>
            <Link href="/travel/bookings" className="text-xs font-medium" style={{ color: "#0891B2" }}>সব দেখুন</Link>
          </div>
          {!stats?.upcoming?.length ? (
            <div className="py-8 text-center" style={{ color: S.muted }}>
              <Plane size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">কোনো আসন্ন ট্যুর নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.upcoming.map((b) => {
                const tDate = new Date(b.travelDate);
                const diffDays = Math.ceil((tDate.getTime() - Date.now()) / 86400000);
                return (
                  <Link key={b.id} href={`/travel/bookings?id=${b.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "#ECFEFF" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0891B2" }}>
                      <span className="text-white text-[10px] font-bold leading-none">{tDate.getDate()}</span>
                      <span className="text-white/80 text-[9px]">{tDate.toLocaleString("default", { month: "short" })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#0C4A6E" }}>{b.clientName}</p>
                      <p className="text-xs truncate" style={{ color: "#0891B2" }}>{b.destination} · {b.totalPersons}জন · {diffDays <= 0 ? "আজ!" : `${diffDays} দিন বাকি`}</p>
                    </div>
                    {b.dueAmount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                        বাকি {formatBDT(b.dueAmount)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking type breakdown */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>বুকিং ধরন</h3>
          {!stats?.bookingTypeCounts?.length ? (
            <div className="py-8 text-center" style={{ color: S.muted }}>
              <p className="text-sm">কোনো ডেটা নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.bookingTypeCounts.map((item) => {
                const meta = BOOKING_TYPE_LABELS[item.bookingType] ?? { label: item.bookingType, color: "#6B7280", bg: "#F3F4F6" };
                return (
                  <div key={item.bookingType} className="flex items-center justify-between p-2.5 rounded-xl" style={{ backgroundColor: meta.bg }}>
                    <span className="text-sm font-medium" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="text-sm font-bold" style={{ color: meta.color }}>{item._count}টি</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
            <Link href="/travel/reports" className="text-xs font-medium flex items-center gap-1" style={{ color: "#0891B2" }}>
              <HandCoins size={12} /> বিস্তারিত রিপোর্ট
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
