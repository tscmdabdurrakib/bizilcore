"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  Camera, Calendar, Clock, Image, AlertTriangle,
  Loader2, RefreshCw, Plus, ArrowRight, CheckCircle,
  Link2, CalendarRange,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface UpcomingBooking {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  dueAmount: number;
  team: Array<{ staffName: string; role: string }>;
  package?: { name: string } | null;
}

interface EditingBooking {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  deliveryDate?: string;
  package?: { editingDays: number } | null;
}

interface Stats {
  monthBookings: number;
  upcomingShoots: number;
  editingBookings: number;
  monthRevenue: number;
  upcomingList: UpcomingBooking[];
  editingList: EditingBooking[];
}

const PHOTO_COLOR = "#DB2777";
const PHOTO_BG = "#FDF2F8";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "বিবাহ", birthday: "জন্মদিন", corporate: "কর্পোরেট",
  portrait: "পোর্ট্রেট", product: "প্রোডাক্ট", other: "অন্যান্য",
};

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", weekday: "short" });
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPhotography({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const salutation = userGender === "মহিলা" ? "আপু" : "ভাই";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photography/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: PHOTO_COLOR }} />
      </div>
    );
  }

  const statCards = [
    { label: "এই মাসের বুকিং",  value: `${stats?.monthBookings ?? 0}টি`,     icon: CalendarRange, color: PHOTO_COLOR, bg: PHOTO_BG,     href: "/photography/bookings" },
    { label: "আসন্ন শুট",       value: `${stats?.upcomingShoots ?? 0}টি`,     icon: Camera,        color: "#7C3AED",   bg: "#F5F3FF",    href: "/photography/bookings?status=confirmed" },
    { label: "Editing বাকি",    value: `${stats?.editingBookings ?? 0}টি`,    icon: Clock,         color: "#D97706",   bg: "#FEF3C7",    href: "/photography/bookings?status=editing" },
    { label: "এই মাসের আয়",    value: formatBDT(stats?.monthRevenue ?? 0),   icon: Camera,        color: "#0F6E56",   bg: "#E1F5EE",    href: "/photography/reports" },
  ];

  const quickActions = [
    { href: "/photography/bookings",  icon: Plus,          label: "নতুন বুকিং",     color: PHOTO_COLOR, bg: PHOTO_BG },
    { href: "/photography/packages",  icon: Image,         label: "প্যাকেজ",         color: "#7C3AED",   bg: "#F5F3FF" },
    { href: "/photography/equipment", icon: Camera,        label: "সরঞ্জাম",         color: "#0891B2",   bg: "#ECFEFF" },
    { href: "/photography/reports",   icon: CalendarRange, label: "রিপোর্ট",         color: "#0F6E56",   bg: "#E1F5EE" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>
            স্বাগতম, {userName} {salutation}! 📷
          </h1>
          <p className="text-sm" style={{ color: S.muted }}>{shopName}</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
          <RefreshCw size={16} style={{ color: S.muted }} />
        </button>
      </div>

      {/* Editing alert */}
      {stats && stats.editingBookings > 0 && (
        <div className="rounded-2xl border p-3 flex items-center gap-3" style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}>
          <AlertTriangle size={18} style={{ color: "#D97706" }} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#B45309" }}>{stats.editingBookings}টি বুকিং এডিটিং পেন্ডিং</p>
            <p className="text-xs" style={{ color: "#D97706" }}>দ্রুত ডেলিভারি দিন!</p>
          </div>
          <Link href="/photography/bookings?status=editing" className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ backgroundColor: "#D97706", color: "#fff" }}>
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
            </div>
            <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(a => (
          <Link key={a.label} href={a.href} className="rounded-2xl border p-3 flex items-center gap-3 transition-shadow hover:shadow-md" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.bg }}>
              <a.icon size={17} style={{ color: a.color }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: S.text }}>{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming shoots */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: S.text }}>আসন্ন শুট (১৪ দিন)</h2>
            <Link href="/photography/bookings" className="text-xs font-semibold" style={{ color: PHOTO_COLOR }}>সব দেখুন</Link>
          </div>
          {!stats?.upcomingList?.length ? (
            <p className="text-sm text-center py-6" style={{ color: S.muted }}>কোনো আসন্ন শুট নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingList.slice(0, 5).map(b => (
                <Link key={b.id} href={`/photography/bookings/${b.id}`} className="block rounded-xl border p-3 hover:border-pink-200 transition-colors" style={{ borderColor: S.border }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: S.text }}>{b.clientName}</p>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                        {EVENT_TYPE_LABELS[b.eventType] ?? b.eventType}
                        {b.venue ? ` · ${b.venue}` : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold" style={{ color: PHOTO_COLOR }}>{formatEventDate(b.eventDate)}</p>
                      {b.eventTime && <p className="text-xs" style={{ color: S.muted }}>{b.eventTime}</p>}
                    </div>
                  </div>
                  {b.team.length > 0 && (
                    <p className="text-xs mt-1.5" style={{ color: S.muted }}>
                      Team: {b.team.map(t => t.staffName).join(", ")}
                    </p>
                  )}
                  {b.dueAmount > 0 && (
                    <p className="text-xs mt-1 font-semibold" style={{ color: "#DC2626" }}>বাকি: {formatBDT(b.dueAmount)}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Editing pipeline */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: S.text }}>Editing এ আছে</h2>
            <Link href="/photography/bookings?status=editing" className="text-xs font-semibold" style={{ color: "#D97706" }}>সব দেখুন</Link>
          </div>
          {!stats?.editingList?.length ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <CheckCircle size={28} style={{ color: "#10B981" }} />
              <p className="text-sm" style={{ color: S.muted }}>সব ডেলিভারি সম্পন্ন!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.editingList.slice(0, 5).map(b => {
                const shootDays = daysSince(b.eventDate);
                const editDays = b.package?.editingDays ?? 7;
                const isLate = shootDays > editDays;
                return (
                  <Link key={b.id} href={`/photography/bookings/${b.id}`} className="block rounded-xl border p-3 hover:border-amber-200 transition-colors" style={{ borderColor: S.border }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: S.text }}>{b.clientName}</p>
                        <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                          {EVENT_TYPE_LABELS[b.eventType] ?? b.eventType} · শুট: {formatEventDate(b.eventDate)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isLate ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}`}>
                          {shootDays}দিন
                          {isLate ? " ⚠️" : ""}
                        </span>
                      </div>
                    </div>
                    {b.deliveryDate && (
                      <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: S.muted }}>
                        <Calendar size={11} />
                        ডেলিভারি: {formatEventDate(b.deliveryDate)}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold" style={{ color: "#D97706" }}>
                      <Link2 size={11} />
                      ডেলিভারি দিন <ArrowRight size={11} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
