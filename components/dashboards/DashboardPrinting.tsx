"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, Package, Clock, CheckCircle, AlertTriangle, Plus, Phone, TrendingUp, ChevronRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface UrgentOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  deliveryDate: string;
  status: string;
  dueAmount: number;
}

interface Stats {
  todayOrders: number;
  pendingApproval: number;
  printing: number;
  ready: number;
  todayRevenue: number;
  pipeline: Record<string, number>;
  urgentOrders: UrgentOrder[];
}

const PRINT_COLOR = "#7C3AED";
const PRINT_LIGHT = "#F5F3FF";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received:        { label: "Received",        color: "#6B7280" },
  design_approval: { label: "Design Approval", color: "#F59E0B" },
  printing:        { label: "Printing",         color: "#3B82F6" },
  finishing:       { label: "Finishing",        color: "#8B5CF6" },
  ready:           { label: "প্রস্তুত",            color: "#10B981" },
  delivered:       { label: "Delivered",        color: "#0F6E56" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPrinting({ shopName, userName, userGender }: {
  shopName: string; userName: string; userGender?: string | null;
}) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/printing/dashboard")
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const greeting =
    userGender === "আপু" ? "আপু, স্বাগতম!" :
    userGender === "ভাই" ? "ভাইয়া, স্বাগতম!" : "স্বাগতম!";

  const statCards = [
    { label: "আজ আসা অর্ডার", value: stats?.todayOrders ?? 0, icon: Package, color: "#6366F1", bg: "#EEF2FF" },
    { label: "Design Approval অপেক্ষায়", value: stats?.pendingApproval ?? 0, icon: AlertTriangle, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Printing চলছে", value: stats?.printing ?? 0, icon: Printer, color: PRINT_COLOR, bg: PRINT_LIGHT },
    { label: "প্রস্তুত অর্ডার", value: stats?.ready ?? 0, icon: CheckCircle, color: "#10B981", bg: "#ECFDF5" },
  ];

  const pipeline = [
    { key: "received",        label: "Received",        color: "#6B7280" },
    { key: "design_approval", label: "Design ✓",        color: "#F59E0B" },
    { key: "printing",        label: "Printing",         color: "#3B82F6" },
    { key: "finishing",       label: "Finishing",        color: "#8B5CF6" },
    { key: "ready",           label: "প্রস্তুত",            color: "#10B981" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${PRINT_COLOR} 0%, #6D28D9 55%, #5B21B6 100%)` }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">প্রিন্টিং / প্রেস ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/printing/orders?new=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}>
              <Plus size={15} /> নতুন অর্ডার
            </Link>
            <div className="rounded-xl px-4 py-2.5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.13)" }}>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">আজকের আয়</p>
              <p className="text-white text-lg font-black">{formatBDT(stats?.todayRevenue ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border shadow-sm"
              style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pipeline */}
      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: S.text }}>অর্ডার পাইপলাইন</h3>
          <Link href="/printing/orders" className="text-xs font-semibold" style={{ color: PRINT_COLOR }}>
            সব দেখুন →
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {pipeline.map((p) => (
            <Link key={p.key} href={`/printing/orders?status=${p.key}`}
              className="text-center p-3 rounded-xl transition-all hover:opacity-80"
              style={{ backgroundColor: `${p.color}15` }}>
              <p className="text-2xl font-black" style={{ color: p.color }}>
                {stats?.pipeline[p.key] ?? 0}
              </p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: p.color }}>{p.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Design Approval Alert */}
      {(stats?.pendingApproval ?? 0) > 0 && (
        <div className="rounded-2xl border-2 p-4" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FEF3C7" }}>
              <AlertTriangle size={20} style={{ color: "#F59E0B" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#92400E" }}>
                {stats?.pendingApproval}টি অর্ডার Design Approval এর অপেক্ষায়!
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
                Design approve না হলে printing শুরু হবে না।
              </p>
            </div>
            <Link href="/printing/orders?status=design_approval"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold"
              style={{ backgroundColor: "#F59E0B", color: "#fff" }}>
              দেখুন <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Urgent Orders */}
      {(stats?.urgentOrders?.length ?? 0) > 0 && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-bold text-sm" style={{ color: S.text }}>Urgent অর্ডার</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
                {stats?.urgentOrders.length}টি
              </span>
            </div>
            <Link href="/printing/orders?urgent=1" className="text-xs font-semibold" style={{ color: PRINT_COLOR }}>
              সব দেখুন →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: S.border }}>
            {stats?.urgentOrders.slice(0, 5).map((o) => {
              const days = daysUntil(o.deliveryDate);
              const st = STATUS_LABELS[o.status] ?? { label: o.status, color: "#6B7280" };
              return (
                <Link key={o.id} href={`/printing/orders/${o.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: PRINT_LIGHT, color: PRINT_COLOR }}>
                        {o.orderNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${st.color}15`, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold mt-0.5" style={{ color: S.text }}>{o.clientName}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: days <= 0 ? "#EF4444" : days <= 1 ? "#F59E0B" : "#10B981" }}>
                        {days <= 0 ? "আজকেই!" : days === 1 ? "আগামীকাল" : `${days} দিন বাকি`}
                      </p>
                      {o.dueAmount > 0 && (
                        <p className="text-xs" style={{ color: "#EF4444" }}>বাকি {formatBDT(o.dueAmount)}</p>
                      )}
                    </div>
                    <a href={`tel:${o.clientPhone}`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: PRINT_LIGHT }}>
                      <Phone size={13} style={{ color: PRINT_COLOR }} />
                    </a>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/printing/orders",   label: "সব অর্ডার",         color: PRINT_COLOR, bg: PRINT_LIGHT },
          { href: "/printing/services", label: "সার্ভিস প্রাইসিং",  color: "#3B82F6",   bg: "#EFF6FF" },
          { href: "/customers",         label: "কাস্টমার",           color: "#10B981",   bg: "#ECFDF5" },
          { href: "/printing/reports",  label: "রিপোর্ট",            color: "#F59E0B",   bg: "#FFFBEB" },
        ].map((q) => (
          <Link key={q.href} href={q.href}
            className="rounded-2xl p-4 text-center font-semibold text-sm border transition-all hover:shadow-md"
            style={{ backgroundColor: q.bg, borderColor: q.color + "40", color: q.color }}>
            {q.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
