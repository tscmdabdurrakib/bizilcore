"use client";

import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import { useState, useCallback } from "react";
import { Scissors, Calendar, Users, TrendingUp, Clock, Loader2 } from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todaySales: number;
  todayOrderCount: number;
  todayProfit: number;
  pendingCount: number;
}

const mockAppointments = [
  { time: "১০:০০", client: "রাহেলা বেগম",   service: "হেয়ার কাট + কালার",   staff: "নাসরিন",  status: "সম্পন্ন",      color: "#10B981" },
  { time: "১১:৩০", client: "সুমাইয়া আক্তার", service: "ফেসিয়াল + মেকআপ",     staff: "তানজিলা", status: "চলছে",         color: "#3B82F6" },
  { time: "১৩:০০", client: "মারিয়া খানম",   service: "ব্রাইডাল মেকআপ",       staff: "তানজিলা", status: "অপেক্ষায় আছে", color: "#F59E0B" },
  { time: "১৪:৩০", client: "ফারহানা ইসলাম", service: "হেয়ার স্পা",            staff: "নাসরিন",  status: "অপেক্ষায় আছে", color: "#F59E0B" },
  { time: "১৬:০০", client: "রুমানা হাসান",   service: "ম্যানিকিউর + পেডিকিউর", staff: "শান্তা",  status: "বুকিং",         color: "#EC4899" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardSalon({ shopName, userName, userGender, todaySales, todayOrderCount, todayProfit, pendingCount }: Props) {
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [walkInMsg, setWalkInMsg] = useState<string | null>(null);

  const handleWalkIn = useCallback(async () => {
    setWalkInLoading(true);
    try {
      const svcsRes = await fetch("/api/services");
      const svcs: { id: string; name: string; price: number; isActive: boolean }[] = await svcsRes.json();
      const firstSvc = Array.isArray(svcs) ? svcs.find(s => s.isActive) : null;
      if (!firstSvc) {
        setWalkInMsg("আগে সার্ভিস যোগ করুন।");
        setWalkInLoading(false);
        setTimeout(() => setWalkInMsg(null), 3000);
        return;
      }
      const now = new Date();
      const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "Walk-in কাস্টমার",
          date: now.toISOString().slice(0, 10),
          startTime,
          isWalkIn: true,
          items: [{ serviceId: firstSvc.id, serviceName: firstSvc.name, price: firstSvc.price }],
        }),
      });
      setWalkInMsg("Walk-in অ্যাপয়েন্টমেন্ট তৈরি হয়েছে!");
    } catch {
      setWalkInMsg("সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
    setWalkInLoading(false);
    setTimeout(() => setWalkInMsg(null), 3500);
  }, []);

  const greeting =
    userGender === "আপু" ? `আপু, স্বাগতম!` :
    userGender === "ভাই" ? `ভাইয়া, স্বাগতম!` :
    `স্বাগতম!`;

  const todayAppointments = mockAppointments.length;
  const completedAppts    = mockAppointments.filter(a => a.status === "সম্পন্ন").length;
  const ongoingAppts      = mockAppointments.filter(a => a.status === "চলছে").length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 55%, #9D174D 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">সেলুন / পার্লার ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের আয়</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি সার্ভিস</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">অ্যাপয়েন্টমেন্ট</p>
              <p className="text-white text-2xl font-bold leading-none">{todayAppointments}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">আজ মোট</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">চলছে</p>
              <p className="text-white text-2xl font-bold leading-none">{ongoingAppts}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">এখন সার্ভিস চলছে</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {walkInMsg && (
        <div className="p-3 rounded-xl text-sm text-center font-medium"
          style={{ backgroundColor: walkInMsg.includes("তৈরি") ? "#ECFDF5" : "#FEF2F2", color: walkInMsg.includes("তৈরি") ? "#10B981" : "#EF4444" }}>
          {walkInMsg}
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={handleWalkIn}
          disabled={walkInLoading}
          className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border flex-shrink-0 transition-all hover:scale-[1.04] hover:shadow-md active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: S.surface, borderColor: S.border, minWidth: "90px" }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
            {walkInLoading ? <Loader2 size={19} className="animate-spin" style={{ color: "#10B981" }} /> : <Users size={19} style={{ color: "#10B981" }} />}
          </div>
          <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: S.muted }}>Walk-in নিন</span>
        </button>
        {[
          { href: "/appointments", icon: Calendar,  label: "অ্যাপয়েন্টমেন্ট", color: "#EC4899", bg: "#FDF2F8" },
          { href: "/services",     icon: Scissors,  label: "সার্ভিস লিস্ট",   color: "#8B5CF6", bg: "#F5F3FF" },
          { href: "/hr",           icon: Clock,     label: "স্টাফ ম্যানেজ",   color: "#3B82F6", bg: "#EFF6FF" },
        ].map((a) => (
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
          { label: "আজকের আয়",         value: formatBDT(todaySales),             sub: `${todayOrderCount}টি সার্ভিস`,          color: "#EC4899", bg: "#FDF2F8" },
          { label: "অ্যাপয়েন্টমেন্ট",  value: `${todayAppointments}টি`,          sub: `${completedAppts}টি সম্পন্ন`,           color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Walk-in",           value: `${pendingCount}জন`,               sub: "সরাসরি এসেছেন",                         color: "#F59E0B", bg: "#FFFBEB" },
          { label: "আজকের লাভ",         value: formatBDT(todayProfit),            sub: todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান", color: "#10B981", bg: "#ECFDF5" },
        ].map((stat) => (
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

      {/* Appointment Timeline */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FDF2F8" }}>
              <Calendar size={16} style={{ color: "#EC4899" }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>আজকের অ্যাপয়েন্টমেন্ট Timeline</h3>
          </div>
          <Link href="/appointments" className="text-xs font-medium" style={{ color: "#EC4899" }}>সব দেখুন →</Link>
        </div>

        <div className="space-y-2.5">
          {mockAppointments.map((appt, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Time */}
              <div className="w-12 flex-shrink-0 text-right">
                <span className="text-xs font-bold" style={{ color: S.muted }}>{appt.time}</span>
              </div>
              {/* Line + dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: appt.color, borderColor: appt.color }} />
                {i < mockAppointments.length - 1 && (
                  <div className="w-0.5 h-6 mt-1" style={{ backgroundColor: S.border }} />
                )}
              </div>
              {/* Appointment card */}
              <div
                className="flex-1 flex items-center justify-between p-3 rounded-xl border"
                style={{
                  backgroundColor: appt.status === "চলছে" ? appt.color + "10" : "var(--c-bg-alt, var(--c-surface))",
                  borderColor:     appt.status === "চলছে" ? appt.color + "40" : S.border,
                }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{appt.client}</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>{appt.service} • {appt.staff}</p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: appt.color + "20", color: appt.color }}
                >
                  {appt.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] mt-3 pt-3 border-t" style={{ color: S.muted, borderColor: S.border }}>
          * Mock data — real appointment data শীঘ্রই যুক্ত হবে
        </p>
      </div>
    </div>
  );
}
