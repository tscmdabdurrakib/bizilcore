"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import { Bed, BedDouble, CalendarRange, Sparkles, LogIn, LogOut, Users, Loader2, RefreshCw } from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface Stats {
  counts: {
    totalRooms: number;
    occupied: number;
    vacant: number;
    reserved: number;
    cleaning: number;
    maintenance: number;
    activeBookings: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    pendingHousekeeping: number;
  };
  occupancyRate: number;
  todayIncome: number;
  rooms: Array<{ id: string; number: string; status: string; type: string; floor: string }>;
  todayCheckIns: Array<{ id: string; bookingNumber: string; guestName: string; room: { number: string }; checkIn: string }>;
  todayCheckOuts: Array<{ id: string; bookingNumber: string; guestName: string; room: { number: string }; checkOut: string; dueAmount: number }>;
  recentActivity: Array<{ id: string; action: string; detail: string | null; createdAt: string }>;
}

const ROOM_STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  vacant:      { bg: "#E1F5EE", color: "#0F6E56", label: "খালি" },
  occupied:    { bg: "#E6F1FB", color: "#0C447C", label: "ভরা" },
  reserved:    { bg: "#FFF3DC", color: "#B45309", label: "রিজার্ভড" },
  cleaning:    { bg: "#F1EFE8", color: "#444441", label: "ক্লিনিং" },
  maintenance: { bg: "#FCEBEB", color: "#791F1F", label: "মেইনটেন্যান্স" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardHotel({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/hotel/dashboard-stats", { cache: "no-store" });
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
        <Loader2 size={28} className="animate-spin" style={{ color: "#0F6E56" }} />
      </div>
    );
  }

  const { counts, occupancyRate, todayIncome, rooms, todayCheckIns, todayCheckOuts, recentActivity } = stats;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 55%, #083D31 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">হোটেল / গেস্টহাউস ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের আয়</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todayIncome)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{counts.activeBookings}টি গেস্ট</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">অকুপেন্সি</p>
              <p className="text-white text-2xl font-bold leading-none">{occupancyRate}%</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{counts.occupied}/{counts.totalRooms} রুম</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজ চেক-ইন</p>
              <p className="text-white text-2xl font-bold leading-none">{counts.todayCheckIns}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">নতুন গেস্ট</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/bookings?new=1", icon: CalendarRange, label: "নতুন বুকিং",  color: "#0F6E56", bg: "#E1F5EE" },
          { href: "/rooms",          icon: Bed,           label: "রুম লিস্ট",   color: "#0C447C", bg: "#E6F1FB" },
          { href: "/bookings",       icon: Users,         label: "সব বুকিং",    color: "#B45309", bg: "#FFF3DC" },
          { href: "/housekeeping",   icon: Sparkles,      label: "হাউসকিপিং",   color: "#791F1F", bg: "#FCEBEB" },
        ].map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border flex-shrink-0 transition-all hover:scale-[1.04] hover:shadow-md active:scale-95"
            style={{ backgroundColor: S.surface, borderColor: S.border, minWidth: "90px" }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: a.bg }}>
              <a.icon size={19} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: S.muted }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট রুম",         value: `${counts.totalRooms}টি`,     sub: `${counts.occupied} ভরা · ${counts.vacant} খালি`, color: "#0F6E56", bg: "#E1F5EE" },
          { label: "আজ চেক-ইন",        value: `${counts.todayCheckIns}টি`,  sub: "আজকের নতুন গেস্ট",                              color: "#0C447C", bg: "#E6F1FB" },
          { label: "আজ চেক-আউট",       value: `${counts.todayCheckOuts}টি`, sub: "ছেড়ে যাচ্ছেন",                                  color: "#B45309", bg: "#FFF3DC" },
          { label: "হাউসকিপিং বাকি",   value: `${counts.pendingHousekeeping}টি`, sub: "অপেক্ষমান টাস্ক",                          color: "#791F1F", bg: "#FCEBEB" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: stat.bg }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
            </div>
            <p className="text-[11px] mb-1" style={{ color: S.muted }}>{stat.label}</p>
            <p className="text-lg font-bold" style={{ color: S.text }}>{stat.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Room status grid */}
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E1F5EE" }}>
                <BedDouble size={16} style={{ color: "#0F6E56" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>রুম স্ট্যাটাস</h3>
            </div>
            <button
              onClick={() => fetchStats(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: "#E6F1FB", color: "#0C447C" }}
              title="রিফ্রেশ"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm mb-3" style={{ color: S.muted }}>এখনো কোনো রুম যোগ করা হয়নি</p>
              <Link href="/rooms" className="text-xs font-bold px-4 py-2 rounded-lg inline-block" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                রুম যোগ করুন →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {rooms.map(room => {
                  const s = ROOM_STATUS_COLORS[room.status] ?? ROOM_STATUS_COLORS.vacant;
                  return (
                    <Link
                      key={room.id}
                      href={`/rooms`}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105"
                      style={{ backgroundColor: s.bg, color: s.color }}
                      title={`${s.label} · ${room.type}`}
                    >
                      <span className="text-xs font-bold">{room.number}</span>
                      <span className="text-[9px] mt-0.5">{s.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t" style={{ borderColor: S.border }}>
                {Object.entries(ROOM_STATUS_COLORS).map(([key, s]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px]" style={{ color: S.muted }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Today's check-ins / outs */}
        <div className="space-y-4">
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E6F1FB" }}>
                <LogIn size={16} style={{ color: "#0C447C" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>আজ চেক-ইন</h3>
            </div>
            {todayCheckIns.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: S.muted }}>কেউ নেই</p>
            ) : (
              <div className="space-y-2">
                {todayCheckIns.slice(0, 5).map(b => (
                  <Link key={b.id} href={`/bookings/${b.id}`} className="block p-2 rounded-lg hover:bg-[var(--c-bg-alt,#F8F8F4)]">
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{b.guestName}</p>
                    <p className="text-[10px]" style={{ color: S.muted }}>রুম {b.room.number} · {b.bookingNumber}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFF3DC" }}>
                <LogOut size={16} style={{ color: "#B45309" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>আজ চেক-আউট</h3>
            </div>
            {todayCheckOuts.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: S.muted }}>কেউ নেই</p>
            ) : (
              <div className="space-y-2">
                {todayCheckOuts.slice(0, 5).map(b => (
                  <Link key={b.id} href={`/bookings/${b.id}`} className="block p-2 rounded-lg hover:bg-[var(--c-bg-alt,#F8F8F4)]">
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{b.guestName}</p>
                    <p className="text-[10px]" style={{ color: S.muted }}>রুম {b.room.number} · {b.dueAmount > 0 ? `বাকি ৳${b.dueAmount}` : "পরিশোধিত"}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>সাম্প্রতিক কার্যক্রম</h3>
          <div className="space-y-2">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-start gap-3 text-xs">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: "#0F6E56" }} />
                <div className="flex-1">
                  <p style={{ color: S.text }}><span className="font-semibold">{a.action}</span>{a.detail ? ` — ${a.detail}` : ""}</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>{new Date(a.createdAt).toLocaleString("bn-BD")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
