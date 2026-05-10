"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  Calendar, BedDouble, Users, TrendingUp, Loader2, RefreshCw,
  Plus, Clock, CheckCircle2, AlertCircle, Sparkle,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface RoomStatus {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: "available" | "in_session" | "cleaning" | "maintenance";
  currentClient: string | null;
}

interface TimelineItem {
  id: string;
  startTime: string;
  endTime: string | null;
  customerName: string;
  customerPhone: string | null;
  status: string;
  totalAmount: number;
  therapist: string | null;
  room: string | null;
  services: string[];
}

interface Stats {
  todayAppts: number;
  availableTherapists: number;
  roomOccupancy: { occupied: number; total: number };
  monthRevenue: number;
  roomStatus: RoomStatus[];
  timeline: TimelineItem[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const SPA_COLOR = "#9333EA";
const SPA_BG = "#FAF5FF";

const ROOM_STATUS_CONFIG = {
  available:   { label: "উপলব্ধ",    color: "#10B981", bg: "#ECFDF5", dot: "bg-green-500" },
  in_session:  { label: "সেশনে",     color: "#3B82F6", bg: "#EFF6FF", dot: "bg-blue-500" },
  cleaning:    { label: "পরিষ্কার",   color: "#F59E0B", bg: "#FFFBEB", dot: "bg-amber-500" },
  maintenance: { label: "মেইনটেন্স", color: "#EF4444", bg: "#FEF2F2", dot: "bg-red-500" },
};

const APPT_STATUS = {
  scheduled:   { label: "নির্ধারিত", color: "#3B82F6" },
  confirmed:   { label: "নিশ্চিত",   color: "#10B981" },
  in_progress: { label: "চলছে",      color: "#F59E0B" },
  completed:   { label: "সম্পন্ন",   color: "#6B7280" },
  cancelled:   { label: "বাতিল",     color: "#EF4444" },
};

export default function DashboardSpa({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const salutation = userGender === "আপু" ? "আপু" : userGender === "ভাই" ? "ভাই" : "";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/spa/dashboard", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: SPA_COLOR }} />
      </div>
    );
  }

  const statCards = [
    { label: "আজকের অ্যাপয়েন্টমেন্ট", value: `${stats?.todayAppts ?? 0}টি`,                                                                          icon: Calendar,  color: SPA_COLOR, bg: SPA_BG,       href: "/appointments" },
    { label: "উপলব্ধ থেরাপিস্ট",        value: `${stats?.availableTherapists ?? 0}জন`,                                                                   icon: Users,     color: "#0891B2", bg: "#ECFEFF",   href: "/spa/therapists" },
    { label: "রুম অকুপেন্সি",            value: `${stats?.roomOccupancy.occupied ?? 0}/${stats?.roomOccupancy.total ?? 0}`,                              icon: BedDouble,  color: "#D97706", bg: "#FEF3C7",   href: "/spa/rooms" },
    { label: "এই মাসের আয়",             value: formatBDT(stats?.monthRevenue ?? 0),                                                                      icon: TrendingUp, color: "#10B981", bg: "#ECFDF5",   href: "/spa/reports" },
  ];

  const quickActions = [
    { href: "/appointments",   icon: Plus,         label: "নতুন বুকিং",     color: SPA_COLOR, bg: SPA_BG },
    { href: "/spa/rooms",      icon: BedDouble,    label: "রুম স্ট্যাটাস",  color: "#D97706", bg: "#FEF3C7" },
    { href: "/spa/therapists", icon: Users,        label: "থেরাপিস্ট",      color: "#0891B2", bg: "#ECFEFF" },
    { href: "/spa/reports",    icon: TrendingUp,   label: "রিপোর্ট",        color: "#10B981", bg: "#ECFDF5" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7E22CE 0%, #9333EA 55%, #A855F7 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkle size={16} className="text-white/80" />
              <p className="text-white/80 text-xs font-medium">স্পা / ওয়েলনেস সেন্টার</p>
            </div>
            <h2 className="text-white text-xl font-bold">স্বাগতম{salutation ? `, ${userName} ${salutation}` : `, ${userName}`}!</h2>
            <p className="text-white/70 text-sm mt-0.5">{shopName}</p>
          </div>
          <button onClick={load} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <RefreshCw size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <Link key={card.label} href={card.href}
            className="rounded-2xl border p-4 block hover:shadow-md transition-shadow"
            style={{ backgroundColor: S.surface, borderColor: S.border }}>
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

      <div className="grid grid-cols-4 gap-2">
        {quickActions.map(a => (
          <Link key={a.label} href={a.href}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl border text-center"
            style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.bg }}>
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-semibold leading-tight" style={{ color: S.text }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {(stats?.roomStatus ?? []).length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: S.text }}>রুম স্ট্যাটাস</h2>
            <Link href="/spa/rooms" className="text-xs font-medium" style={{ color: SPA_COLOR }}>সব দেখুন</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {stats!.roomStatus.map(room => {
              const cfg = ROOM_STATUS_CONFIG[room.status] ?? ROOM_STATUS_CONFIG.available;
              return (
                <div key={room.id} className="rounded-xl border p-3" style={{ backgroundColor: cfg.bg, borderColor: cfg.color + "30" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <p className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>{room.name}</p>
                  {room.currentClient && (
                    <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{room.currentClient}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(stats?.timeline ?? []).length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm" style={{ color: S.text }}>আজকের সূচি</h2>
            <Link href="/appointments" className="text-xs font-medium" style={{ color: SPA_COLOR }}>সব দেখুন</Link>
          </div>
          <div className="space-y-2">
            {stats!.timeline.slice(0, 8).map(appt => {
              const statusCfg = APPT_STATUS[appt.status as keyof typeof APPT_STATUS] ?? APPT_STATUS.scheduled;
              return (
                <div key={appt.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: S.border }}>
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: SPA_COLOR }}>{appt.startTime}</p>
                    {appt.endTime && <p className="text-[10px]" style={{ color: S.muted }}>{appt.endTime}</p>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{appt.customerName}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {appt.services.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px]" style={{ color: S.muted }}>{s}</span>
                      ))}
                      {appt.services.length > 2 && (
                        <span className="text-[10px]" style={{ color: S.muted }}>+{appt.services.length - 2} আরো</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: statusCfg.color + "18", color: statusCfg.color }}>
                      {statusCfg.label}
                    </span>
                    {appt.room && <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{appt.room}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(stats?.timeline ?? []).length === 0 && (
        <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: SPA_BG }}>
            <Calendar size={24} style={{ color: SPA_COLOR }} />
          </div>
          <p className="font-semibold text-sm mb-1" style={{ color: S.text }}>আজকে কোনো অ্যাপয়েন্টমেন্ট নেই</p>
          <p className="text-xs mb-4" style={{ color: S.muted }}>নতুন বুকিং শুরু করুন</p>
          <Link href="/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
            <Plus size={14} /> বুকিং করুন
          </Link>
        </div>
      )}
    </div>
  );
}
