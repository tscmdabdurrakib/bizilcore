"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, TrendingUp, Clock, ChefHat, AlertTriangle, Loader2, RefreshCw, Plus, CalendarCheck } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todaySales?: number;
  todayOrderCount?: number;
  todayProfit?: number;
  pendingCount?: number;
}

interface DashStats {
  todaySales: number;
  todayOrderCount: number;
  activeTables: number;
  pendingOrders: number;
  lowStockCount: number;
  autoDeduct: boolean;
  hourlyChart: { hour: number; count: number }[];
  recentOrders: {
    id: string; type: string; status: string; totalAmount: number;
    createdAt: string;
    items: { quantity: number; menuItem: { name: string } }[];
    table: { number: number } | null;
  }[];
  lowStockMaterials: { id: string; name: string; currentStock: number; unit: string; reorderLevel: number }[];
}

const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "অপেক্ষমাণ",  bg: "#FEF3C7", color: "#92400E" },
  preparing: { label: "তৈরি হচ্ছে", bg: "#FEF3C7", color: "#D97706" },
  ready:     { label: "প্রস্তুত",   bg: "#D1FAE5", color: "#065F46" },
  served:    { label: "পরিবেশিত",  bg: "#DBEAFE", color: "#1E40AF" },
  paid:      { label: "পরিশোধিত",  bg: "#D1FAE5", color: "#065F46" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#EA580C",
};

export default function DashboardRestaurant({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/restaurant/dashboard", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {}
    if (silent) setRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const greeting =
    userGender === "আপু" ? "আপু, স্বাগতম!" :
    userGender === "ভাই" ? "ভাইয়া, স্বাগতম!" :
    "স্বাগতম!";

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col justify-center items-center py-20 gap-3">
      <AlertTriangle size={28} style={{ color: S.primary }} />
      <p style={{ color: S.muted }} className="text-sm">ড্যাশবোর্ড লোড হয়নি। রিফ্রেশ করুন।</p>
    </div>
  );

  const s = stats;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EA580C 0%, #C2410C 55%, #9A3412 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed size={18} className="text-white/80" />
              <p className="text-white/70 text-xs font-medium">রেস্তোরাঁ ড্যাশবোর্ড</p>
            </div>
            <h2 className="text-white text-xl font-bold">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের বিক্রি</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(s.todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{s.todayOrderCount}টি অর্ডার</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">ব্যস্ত টেবিল</p>
              <p className="text-white text-2xl font-bold leading-none">{s.activeTables}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">এখন চালু</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">অপেক্ষমান</p>
              <p className="text-white text-2xl font-bold leading-none">{s.pendingOrders}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">কিচেনে বাকি</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {s.autoDeduct && s.lowStockCount > 0 && (
        <Link href="/restaurant/recipes"
          className="rounded-2xl border border-red-200 p-4 flex items-start gap-3 hover:border-red-400 transition-colors"
          style={{ backgroundColor: "#FEF2F2" }}>
          <AlertTriangle size={18} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
          <p className="text-sm" style={{ color: "#991B1B" }}>
            <strong>{s.lowStockCount}টি কাঁচামাল</strong> reorder level-এর নিচে নেমে গেছে — এখনই রিঅর্ডার করুন।{" "}
            <span className="underline font-semibold">স্টক দেখুন →</span>
          </p>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/restaurant/pos",                  icon: Plus,            label: "নতুন অর্ডার",   color: S.primary,  bg: "#FFF7ED" },
          { href: "/restaurant/tables",              icon: UtensilsCrossed, label: "টেবিল ম্যাপ",  color: "#D97706",  bg: "#FFFBEB" },
          { href: "/restaurant/kitchen",             icon: ChefHat,         label: "কিচেন ভিউ",    color: "#059669",  bg: "#ECFDF5" },
          { href: "/restaurant/menu",                icon: ShoppingBag,     label: "মেনু",          color: "#3B82F6",  bg: "#EFF6FF" },
          { href: "/restaurant/recipes",             icon: TrendingUp,      label: "রেসিপি/স্টক",  color: "#7C3AED",  bg: "#F5F3FF" },
          { href: "/restaurant/reports?tab=closing", icon: CalendarCheck,   label: "দিন বন্ধ",     color: "#DC2626",  bg: "#FEF2F2" },
          { href: "/restaurant/reports",             icon: TrendingUp,      label: "রিপোর্ট",      color: "#10B981",  bg: "#ECFDF5" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border flex-shrink-0 transition-all hover:scale-[1.04] hover:shadow-md active:scale-95"
            style={{ backgroundColor: S.surface, borderColor: S.border, minWidth: "80px" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: a.bg }}>
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <span className="text-[10px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: S.muted }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "আজকের বিক্রি",   value: formatBDT(s.todaySales),   sub: `${s.todayOrderCount}টি অর্ডার`, color: S.primary, bg: "#FFF7ED" },
          { label: "ব্যস্ত টেবিল",  value: `${s.activeTables}টি`,     sub: "এখন চলছে",                      color: "#D97706",  bg: "#FFFBEB" },
          { label: "অপেক্ষমান অর্ডার", value: `${s.pendingOrders}টি`,    sub: "কিচেনে বাকি",                  color: "#3B82F6",  bg: "#EFF6FF" },
          s.autoDeduct
            ? { label: "কম স্টক", value: `${s.lowStockCount}টি`, sub: "উপাদান শেষ হচ্ছে", color: "#EF4444", bg: "#FEF2F2" }
            : { label: "কম স্টক", value: "—", sub: "ডিডাকশন বন্ধ", color: "#9CA3AF", bg: "#F3F4F6" },
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

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Active Orders */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>চলমান অর্ডার</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchStats(true)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: "#FFF7ED" }}
                title="রিফ্রেশ">
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} style={{ color: S.primary }} />
              </button>
              <Link href="/restaurant/orders" className="text-xs font-medium" style={{ color: S.primary }}>সব দেখুন →</Link>
            </div>
          </div>
          {s.recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm mb-2" style={{ color: S.muted }}>এখন কোনো সক্রিয় অর্ডার নেই</p>
              <Link href="/orders"
                className="text-xs font-semibold px-4 py-2 rounded-lg inline-block text-white"
                style={{ backgroundColor: S.primary }}>
                + নতুন অর্ডার
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {s.recentOrders.slice(0, 6).map(order => {
                const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
                const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                return (
                  <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl border"
                    style={{ borderColor: S.border, backgroundColor: "var(--c-bg, var(--c-surface))" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: order.table ? S.primary : "#3B82F6" }}>
                      {order.table ? `T${order.table.number}` : order.type === "takeaway" ? "TA" : "D"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: S.text }}>
                        {order.items.map(i => `${i.menuItem.name}×${i.quantity}`).join(", ")}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        <span className="text-[10px]" style={{ color: S.muted }}><Clock size={9} className="inline mr-0.5" />{elapsed}মি</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: S.text }}>{formatBDT(order.totalAmount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Materials */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>কম স্টক সতর্কতা</h3>
            <Link href="/restaurant/recipes" className="text-xs font-medium" style={{ color: S.primary }}>স্টক ম্যানেজ →</Link>
          </div>
          {!s.autoDeduct ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: S.muted }}>অটো স্টক ডিডাকশন বন্ধ আছে।</p>
              <Link href="/restaurant/settings" className="text-xs underline mt-1 inline-block" style={{ color: S.primary }}>সেটিংস থেকে চালু করুন →</Link>
            </div>
          ) : s.lowStockMaterials.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: S.muted }}>সব কাঁচামালের স্টক ঠিক আছে ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {s.lowStockMaterials.map(m => (
                <Link key={m.id} href="/restaurant/recipes"
                  className="flex items-center justify-between p-3 rounded-xl border hover:border-red-400 transition-colors"
                  style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{m.name}</p>
                    <p className="text-xs" style={{ color: "#EF4444" }}>
                      বাকি: {m.currentStock} {m.unit} · ন্যূনতম: {m.reorderLevel} {m.unit}
                    </p>
                  </div>
                  <AlertTriangle size={16} style={{ color: "#EF4444" }} />
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
            <h4 className="text-xs font-semibold mb-3" style={{ color: S.muted }}>দ্রুত লিংক</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/customers", label: "কাস্টমার" },
                { href: "/hr", label: "স্টাফ" },
                { href: "/hisab", label: "হিসাব" },
                { href: "/restaurant/settings", label: "সেটিংস" },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-center text-xs font-medium py-2 rounded-xl border"
                  style={{ borderColor: S.border, color: S.muted, backgroundColor: "var(--c-bg, var(--c-surface))" }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
