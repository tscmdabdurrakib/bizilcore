"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Users, DollarSign, AlertTriangle, Wrench, Calendar, Phone, CheckCircle, Clock } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#DC2626",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: "🚗 কার", microbus: "🚐 মাইক্রোবাস", bus: "🚌 বাস",
  motorcycle: "🏍️ মোটরসাইকেল", cng: "🛺 সিএনজি", pickup: "🛻 পিকআপ",
};

type Vehicle = {
  id: string;
  regNumber: string;
  type: string;
  brand: string;
  model: string;
  status: string;
  seats: number;
  nextService?: string | null;
  defaultDriver?: { id: string; name: string; phone: string } | null;
  bookings?: { id: string; endDateTime: string; clientName: string; clientPhone: string; bookingNumber: string }[];
};

type OverdueBooking = {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  endDateTime: string;
  vehicle: { regNumber: string; brand: string; model: string };
};

type DashStats = {
  vehicles: Vehicle[];
  totalVehicles: number;
  available: number;
  onTrip: number;
  maintenance: number;
  todayBookings: number;
  overdueBookings: OverdueBooking[];
  monthRevenue: number;
  recentBookings: { id: string; bookingNumber: string; clientName: string; status: string; totalAmount: number; startDateTime: string; vehicle: { regNumber: string; brand: string; model: string } }[];
};

const STATUS_CONFIG = {
  available:   { label: "পাওয়া যাচ্ছে",  bg: "#DCFCE7", color: "#166534", border: "#86EFAC" },
  on_trip:     { label: "ট্রিপে আছে",   bg: "#DBEAFE", color: "#1E40AF", border: "#93C5FD" },
  maintenance: { label: "সার্ভিসিং",     bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  retired:     { label: "অবসর",          bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  confirmed:  { label: "নিশ্চিত",   color: "#1D4ED8" },
  on_trip:    { label: "ট্রিপে",    color: "#7C3AED" },
  completed:  { label: "সম্পন্ন",   color: "#166534" },
  cancelled:  { label: "বাতিল",    color: "#991B1B" },
};

export default function DashboardCarRental() {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    fetch("/api/carrental/dashboard").then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  if (!stats) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: "পাওয়া যাচ্ছে", value: `${stats.available}/${stats.totalVehicles}`, sub: "গাড়ি", icon: Car, color: "#10B981", bg: "#ECFDF5" },
    { label: "আজকের ট্রিপ", value: String(stats.todayBookings), sub: "সক্রিয় বুকিং", icon: Calendar, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "এই মাসের আয়", value: formatBDT(stats.monthRevenue), sub: "মোট আয়", icon: DollarSign, color: "#8B5CF6", bg: "#F5F3FF" },
    { label: "Overdue", value: String(stats.overdueBookings.length), sub: "মেয়াদ পেরিয়েছে", icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
  ];

  const serviceAlerts = stats.vehicles.filter(v => {
    if (!v.nextService) return false;
    const diff = (new Date(v.nextService).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-6">
      {/* Hero */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 55%, #991B1B 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Car size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium">কার রেন্টাল ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold">ফ্লিট ওভারভিউ</h2>
            <p className="text-white/80 text-sm mt-0.5">
              {stats.available} available · {stats.onTrip} ট্রিপে · {stats.maintenance} সার্ভিসিং
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {stats.overdueBookings.length > 0 && (
        <div className="rounded-xl p-4 border-2" style={{ background: "#FEF2F2", borderColor: "#EF4444" }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              <p className="font-bold text-sm mb-2" style={{ color: "#DC2626" }}>⚠️ Overdue ট্রিপ — মেয়াদ পেরিয়ে গেছে!</p>
              {stats.overdueBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between mb-1 gap-3">
                  <p className="text-sm" style={{ color: "#7F1D1D" }}>
                    <span className="font-semibold">{b.clientName}</span> · {b.vehicle.brand} {b.vehicle.model} [{b.vehicle.regNumber}] · {new Date(b.endDateTime).toLocaleString("bn-BD")}
                  </p>
                  <a href={`tel:${b.clientPhone}`} className="text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap" style={{ background: "#DC2626", color: "#fff" }}>
                    Call করুন
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl p-4 space-y-2" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: S.muted }}>{card.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: S.text }}>{card.value}</p>
            <p className="text-xs" style={{ color: S.muted }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Fleet Grid */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm" style={{ color: S.text }}>ফ্লিট অবস্থান</p>
          <Link href="/carrental/fleet" className="text-xs font-medium" style={{ color: S.primary }}>সব গাড়ি →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {stats.vehicles.map(v => {
            const cfg = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available;
            const activeTrip = v.bookings?.[0];
            return (
              <div key={v.id} className="rounded-xl p-3 border-2" style={{ background: cfg.bg, borderColor: cfg.border }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold" style={{ color: cfg.color }}>{v.regNumber}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: "rgba(255,255,255,0.7)", color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs font-medium mb-1" style={{ color: S.text }}>{v.brand} {v.model}</p>
                <p className="text-xs" style={{ color: S.muted }}>{VEHICLE_TYPE_LABELS[v.type] ?? v.type} · {v.seats} আসন</p>
                {v.status === "on_trip" && activeTrip && (
                  <p className="text-xs mt-1 font-medium" style={{ color: "#1E40AF" }}>
                    <Clock size={10} className="inline mr-1" />
                    ফিরবে: {new Date(activeTrip.endDateTime).toLocaleDateString("bn-BD")}
                  </p>
                )}
                {v.status === "available" && v.defaultDriver && (
                  <p className="text-xs mt-1" style={{ color: "#166534" }}>
                    {v.defaultDriver.name}
                  </p>
                )}
              </div>
            );
          })}
          {stats.vehicles.length === 0 && (
            <div className="col-span-3 text-center py-6" style={{ color: S.muted }}>
              <Car size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">গাড়ি যোগ করুন</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Alerts */}
      {serviceAlerts.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: "#FFFBEB", border: "1px solid #FCD34D" }}>
          <p className="font-semibold text-sm mb-2" style={{ color: "#92400E" }}>
            <Wrench size={14} className="inline mr-1" />
            সার্ভিস রিমাইন্ডার ({serviceAlerts.length}টি গাড়ি)
          </p>
          {serviceAlerts.map(v => (
            <p key={v.id} className="text-xs" style={{ color: "#78350F" }}>
              • {v.brand} {v.model} [{v.regNumber}] — {v.nextService ? new Date(v.nextService).toLocaleDateString("bn-BD") : ""}
            </p>
          ))}
        </div>
      )}

      {/* Recent Bookings */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm" style={{ color: S.text }}>সাম্প্রতিক বুকিং</p>
          <Link href="/carrental/bookings" className="text-xs font-medium" style={{ color: S.primary }}>সব বুকিং →</Link>
        </div>
        {stats.recentBookings.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: S.muted }}>কোনো বুকিং নেই</p>
        ) : (
          <div className="space-y-2">
            {stats.recentBookings.slice(0, 5).map(b => {
              const st = BOOKING_STATUS[b.status] ?? { label: b.status, color: S.muted };
              return (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--c-bg)" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold" style={{ color: S.text }}>{b.bookingNumber}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: st.color }}>{st.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{b.clientName} · {b.vehicle.brand} [{b.vehicle.regNumber}]</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(b.totalAmount)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/carrental/bookings?new=1", label: "নতুন বুকিং", icon: Calendar, color: "#DC2626", bg: "#FEF2F2" },
          { href: "/carrental/fleet?new=1",    label: "গাড়ি যোগ",   icon: Car,      color: "#3B82F6", bg: "#EFF6FF" },
          { href: "/carrental/drivers?new=1",  label: "ড্রাইভার",   icon: Users,    color: "#10B981", bg: "#ECFDF5" },
          { href: "/carrental/fuel?new=1",     label: "জ্বালানি",   icon: DollarSign, color: "#8B5CF6", bg: "#F5F3FF" },
          { href: "/customers",               label: "কাস্টমার",   icon: Users,    color: "#F59E0B", bg: "#FFFBEB" },
          { href: "/carrental/reports",       label: "রিপোর্ট",    icon: CheckCircle, color: "#0891B2", bg: "#ECFEFF" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-[1.03] active:scale-95"
            style={{ background: a.bg }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60">
              <a.icon size={18} style={{ color: a.color }} />
            </div>
            <p className="text-xs font-medium text-center" style={{ color: a.color }}>{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
