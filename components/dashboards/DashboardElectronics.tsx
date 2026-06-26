"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Smartphone, ClipboardList, Wrench, CheckCircle,
  DollarSign, Plus, RefreshCw, Loader2, MessageSquare,
  Package, Users,
} from "lucide-react";

const PRIMARY = "#3B82F6";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

const DEVICE_ICONS: Record<string, string> = {
  smartphone: "📱",
  laptop: "💻",
  tablet: "📱",
  tv: "📺",
  ac: "❄️",
  fridge: "🧊",
  washing_machine: "🫧",
  microwave: "📦",
  router: "📡",
  other: "🔧",
};

type ReadyDevice = {
  id: string;
  jobNumber: string;
  dueAmount: number;
  totalAmount: number;
  device?: {
    type: string;
    brand: string;
    model: string;
    customer?: { name: string; phone: string } | null;
  } | null;
};

type RecentJob = {
  id: string;
  jobNumber: string;
  status: string;
  createdAt: string;
  complaint: string;
  device?: { type: string; brand: string; model: string } | null;
};

type DashStats = {
  todayJobCards: number;
  readyCount: number;
  activeCount: number;
  todayRevenue: number;
  readyDevices: ReadyDevice[];
  recentJobs: RecentJob[];
};

export default function DashboardElectronics({
  shopName,
  userName,
}: {
  shopName: string;
  userName: string;
}) {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/electronics/dashboard", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" style={{ color: PRIMARY }} size={32} />
      </div>
    );
  }

  const st = stats!;

  const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    received:      { label: "ডিভাইস এসেছে", color: "#0C447C", bg: "#E6F1FB" },
    diagnosing:    { label: "Diagnosis",     color: "#B45309", bg: "#FEF3C7" },
    waiting_parts: { label: "Parts অপেক্ষা", color: "#7C3AED", bg: "#EDE9FE" },
    repairing:     { label: "মেরামত",        color: "#0F6E56", bg: "#E1F5EE" },
    quality_check: { label: "Quality Check", color: "#0369A1", bg: "#E0F2FE" },
    ready:         { label: "প্রস্তুত",         color: "#166534", bg: "#DCFCE7" },
    delivered:     { label: "Delivered",     color: "#6B7280", bg: "#F3F4F6" },
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6 p-4 md:p-6">
      {/* Header */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 55%, #1E3A8A 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">ইলেকট্রনিক্স রিপেয়ার সেন্টার</p>
            <h2 className="text-white text-xl font-bold mt-0.5">স্বাগতম, {userName}!</h2>
            <p className="text-white/80 text-sm mt-0.5">{shopName}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজ আসা</p>
              <p className="text-white text-2xl font-bold leading-none">{st.todayJobCards}</p>
              <p className="text-white/80 text-[11px] mt-1.5">ডিভাইস</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">Ready</p>
              <p className="text-white text-2xl font-bold leading-none">{st.readyCount}</p>
              <p className="text-white/80 text-[11px] mt-1.5">ডিভাইস</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের আয়</p>
              <p className="text-white text-2xl font-bold leading-none">৳{st.todayRevenue.toLocaleString("bn-BD")}</p>
              <p className="text-white/80 text-[11px] mt-1.5">টাকা</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "আজ আসা ডিভাইস", value: st.todayJobCards, icon: Smartphone, color: PRIMARY, bg: "#EFF6FF" },
          { label: "প্রস্তুত ডিভাইস", value: st.readyCount, icon: CheckCircle, color: "#16A34A", bg: "#DCFCE7" },
          { label: "চলমান মেরামত", value: st.activeCount, icon: Wrench, color: "#B45309", bg: "#FEF3C7" },
          { label: "আজকের আয়", value: `৳${st.todayRevenue.toLocaleString("bn-BD")}`, icon: DollarSign, color: "#7C3AED", bg: "#F5F3FF" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: S.surface, border: `1px solid ${S.border}` }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
              <card.icon size={18} style={{ color: card.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: S.text }}>{card.value}</p>
            <p className="text-xs" style={{ color: S.muted }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        {[
          { href: "/jobcards?new=1", icon: Plus, label: "নতুন Job Card", color: PRIMARY, bg: "#EFF6FF" },
          { href: "/jobcards", icon: ClipboardList, label: "সব Job Card", color: "#B45309", bg: "#FEF3C7" },
          { href: "/devices", icon: Smartphone, label: "ডিভাইস তালিকা", color: "#7C3AED", bg: "#F5F3FF" },
          { href: "/inventory", icon: Package, label: "পার্টস স্টক", color: "#16A34A", bg: "#DCFCE7" },
          { href: "/customers", icon: Users, label: "কাস্টমার", color: "#0891B2", bg: "#ECFEFF" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
            style={{ background: a.bg, color: a.color }}
          >
            <a.icon size={16} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* Ready for Pickup */}
      {st.readyDevices.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: S.border, background: "#DCFCE7" }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} style={{ color: "#16A34A" }} />
              <span className="font-semibold text-sm" style={{ color: "#166534" }}>Ready for Pickup</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white">{st.readyDevices.length}</span>
            </div>
            <button onClick={() => load(true)} className="text-xs" style={{ color: "#16A34A" }}>
              {refreshing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: S.border }}>
            {st.readyDevices.map((jc) => {
              const devIcon = DEVICE_ICONS[jc.device?.type || "other"] || "🔧";
              return (
                <Link
                  key={jc.id}
                  href={`/jobcards/${jc.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition"
                >
                  <span className="text-xl">{devIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: S.text }}>
                        {jc.device?.brand} {jc.device?.model}
                      </span>
                      <span className="text-xs" style={{ color: S.muted }}>{jc.jobNumber}</span>
                    </div>
                    <p className="text-xs" style={{ color: S.muted }}>
                      {jc.device?.customer?.name} · {jc.device?.customer?.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: jc.dueAmount > 0 ? "#DC2626" : "#16A34A" }}>
                      {jc.dueAmount > 0 ? `বাকি ৳${jc.dueAmount.toLocaleString("bn-BD")}` : "পরিশোধিত"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      {st.recentJobs.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-2">
              <ClipboardList size={16} style={{ color: PRIMARY }} />
              <span className="font-semibold text-sm" style={{ color: S.text }}>সাম্প্রতিক Job Cards</span>
            </div>
            <Link href="/jobcards" className="text-xs font-medium" style={{ color: PRIMARY }}>সব দেখুন →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: S.border }}>
            {st.recentJobs.map((job) => {
              const sl = STATUS_LABEL[job.status] || { label: job.status, color: "#6B7280", bg: "#F3F4F6" };
              const devIcon = DEVICE_ICONS[job.device?.type || "other"] || "🔧";
              return (
                <Link
                  key={job.id}
                  href={`/jobcards/${job.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition"
                >
                  <span className="text-xl">{devIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: S.text }}>
                        {job.device?.brand} {job.device?.model}
                      </span>
                      <span className="text-xs" style={{ color: S.muted }}>{job.jobNumber}</span>
                    </div>
                    <p className="text-xs line-clamp-1" style={{ color: S.muted }}>{job.complaint}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: sl.bg, color: sl.color }}>
                    {sl.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
