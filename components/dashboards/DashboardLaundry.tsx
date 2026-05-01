"use client";

import Link from "next/link";
import { Droplets, Package, Clock, CheckCircle, Truck, Plus, Phone } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ReadyOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  dueAmount: number;
  totalAmount: number;
}

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todayOrders: number;
  inProcessCount: number;
  readyCount: number;
  todayRevenue: number;
  receivedCount: number;
  outForDeliveryCount: number;
  readyOrders: ReadyOrder[];
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

const LAUNDRY_COLOR = "#0284C7";
const LAUNDRY_LIGHT = "#E0F2FE";

export default function DashboardLaundry({
  shopName, userName, userGender,
  todayOrders, inProcessCount, readyCount, todayRevenue,
  receivedCount, outForDeliveryCount, readyOrders,
}: Props) {
  const greeting =
    userGender === "আপু" ? `আপু, স্বাগতম!` :
    userGender === "ভাই" ? `ভাইয়া, স্বাগতম!` : `স্বাগতম!`;

  const stats = [
    { label: "আজ আসা অর্ডার", value: todayOrders, icon: Package, color: "#6366F1", bg: "#EEF2FF" },
    { label: "প্রক্রিয়াধীন", value: inProcessCount, icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
    { label: "Ready (সংগ্রহের অপেক্ষা)", value: readyCount, icon: CheckCircle, color: "#10B981", bg: "#ECFDF5" },
    { label: "আজকের আয়", value: formatBDT(todayRevenue), icon: Droplets, color: LAUNDRY_COLOR, bg: LAUNDRY_LIGHT },
  ];

  const pipeline = [
    { label: "Received", count: receivedCount, color: "#6B7280" },
    { label: "In Process", count: inProcessCount, color: "#F59E0B" },
    { label: "Ready", count: readyCount, color: "#10B981" },
    { label: "Out for Delivery", count: outForDeliveryCount, color: "#3B82F6" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${LAUNDRY_COLOR} 0%, #0369A1 55%, #075985 100%)` }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">লন্ড্রি / ড্রাইক্লিনিং ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/orders?new=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <Plus size={16} /> নতুন অর্ডার
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border shadow-sm"
              style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-xl font-black" style={{ color: S.text }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Status Pipeline */}
      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: S.text }}>স্ট্যাটাস পাইপলাইন</h3>
        <div className="grid grid-cols-4 gap-2">
          {pipeline.map((p) => (
            <div key={p.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: `${p.color}15` }}>
              <p className="text-2xl font-black" style={{ color: p.color }}>{p.count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: p.color }}>{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Ready List */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} style={{ color: "#10B981" }} />
            <h3 className="font-bold text-sm" style={{ color: S.text }}>Ready — সংগ্রহের অপেক্ষায়</h3>
            {readyCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}>
                {readyCount}টি
              </span>
            )}
          </div>
          <Link href="/orders?status=ready" className="text-xs font-semibold" style={{ color: LAUNDRY_COLOR }}>
            সব দেখুন →
          </Link>
        </div>

        {readyOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: LAUNDRY_LIGHT }}>
              <Truck size={22} style={{ color: LAUNDRY_COLOR }} />
            </div>
            <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো Ready অর্ডার নেই</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: S.border }}>
            {readyOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: LAUNDRY_LIGHT, color: LAUNDRY_COLOR }}>
                      {o.orderNumber}
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-0.5" style={{ color: S.text }}>{o.clientName}</p>
                  <p className="text-xs" style={{ color: S.muted }}>📞 {o.clientPhone}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    {o.dueAmount > 0 && (
                      <p className="text-xs font-bold" style={{ color: "#EF4444" }}>বাকি {formatBDT(o.dueAmount)}</p>
                    )}
                    <p className="text-xs" style={{ color: S.muted }}>মোট {formatBDT(o.totalAmount)}</p>
                  </div>
                  <a href={`tel:${o.clientPhone}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: LAUNDRY_LIGHT }}>
                    <Phone size={14} style={{ color: LAUNDRY_COLOR }} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/orders", label: "সব অর্ডার", color: LAUNDRY_COLOR, bg: LAUNDRY_LIGHT },
          { href: "/services", label: "সার্ভিস প্রাইসিং", color: "#7C3AED", bg: "#F5F3FF" },
          { href: "/customers", label: "কাস্টমার", color: "#10B981", bg: "#ECFDF5" },
          { href: "/delivery", label: "ডেলিভারি", color: "#F59E0B", bg: "#FFFBEB" },
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
