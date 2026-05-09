"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, Calendar, AlertCircle, TrendingUp, Phone, Plus, Clock } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ApptItem { id: string; type: string; date: string; status: string; fee: number; paidAmount: number; petName: string; petType: string; ownerName: string; ownerPhone: string; }
interface VacItem { id: string; logType: string; description: string; nextDueDate: string | null; petId: string; petName: string; petType: string; ownerName: string; ownerPhone: string; }

interface Stats {
  totalPets: number; todayAppts: number; vaccinationDue: number; todayRevenue: number;
  todayApptList: ApptItem[];
  vaccineDueList: VacItem[];
}

const PET_COLOR = "#EA580C";
const PET_LIGHT = "#FFF7ED";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const PET_ICONS: Record<string, string> = { dog: "🐕", cat: "🐈", bird: "🐦", fish: "🐟", rabbit: "🐇", turtle: "🐢", other: "🐾" };

const TYPE_LABELS: Record<string, string> = {
  checkup: "Checkup", grooming: "Grooming", vaccination: "টিকা", surgery: "অপারেশন", boarding: "Boarding",
};
const STATUS_COLORS: Record<string, string> = { scheduled: "#6B7280", confirmed: "#3B82F6", done: "#10B981", cancelled: "#EF4444" };

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export default function DashboardPetShop({ shopName, userName, userGender }: {
  shopName: string; userName: string; userGender?: string | null;
}) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/petshop/dashboard").then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  const greeting = userGender === "আপু" ? "আপু, স্বাগতম!" : userGender === "ভাই" ? "ভাইয়া, স্বাগতম!" : "স্বাগতম!";

  const statCards = [
    { label: "রেজিস্টার্ড পশু-পাখি",      value: stats?.totalPets ?? 0,                  icon: PawPrint,   color: PET_COLOR, bg: PET_LIGHT },
    { label: "আজকের অ্যাপয়েন্টমেন্ট",    value: stats?.todayAppts ?? 0,                 icon: Calendar,   color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Vaccination Due (৭ দিন)", value: stats?.vaccinationDue ?? 0,             icon: AlertCircle,color: "#F59E0B", bg: "#FFFBEB" },
    { label: "আজকের আয়",                   value: formatBDT(stats?.todayRevenue ?? 0),    icon: TrendingUp, color: "#10B981", bg: "#ECFDF5" },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* Hero Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${PET_COLOR} 0%, #C2410C 55%, #9A3412 100%)` }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">পেট শপ / ভেটেরিনারি ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/petshop/pets?new=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}>
              <Plus size={15} /> নতুন পশু-পাখি
            </Link>
            <Link href="/appointments?new=1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.13)", color: "#fff" }}>
              <Plus size={15} /> অ্যাপয়েন্টমেন্ট
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black" style={{ color: S.text }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Vaccination Due Alert */}
      {(stats?.vaccineDueList?.length ?? 0) > 0 && (
        <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: S.border, backgroundColor: "#FFFBEB" }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} style={{ color: "#F59E0B" }} />
              <h3 className="font-bold text-sm" style={{ color: "#92400E" }}>Vaccination / Treatment Due (৭ দিনের মধ্যে)</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#FEF3C7", color: "#F59E0B" }}>
                {stats?.vaccineDueList.length}টি
              </span>
            </div>
            <Link href="/petshop/pets" className="text-xs font-semibold" style={{ color: PET_COLOR }}>সব দেখুন →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: S.border }}>
            {stats?.vaccineDueList.slice(0, 5).map(item => {
              const days = daysUntil(item.nextDueDate);
              const overdue = days !== null && days < 0;
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">{PET_ICONS[item.petType] ?? "🐾"}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: S.text }}>{item.petName}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: PET_LIGHT, color: PET_COLOR }}>{item.logType}</span>
                      </div>
                      <p className="text-xs" style={{ color: S.muted }}>
                        {item.ownerName} · {item.description}
                      </p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: overdue ? "#EF4444" : "#F59E0B" }}>
                        {overdue ? `${Math.abs(days!)}d overdue!` : days === 0 ? "আজকে!" : `${days}d বাকি`}
                      </p>
                    </div>
                  </div>
                  <a href={`tel:${item.ownerPhone}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: PET_LIGHT }}>
                    <Phone size={13} style={{ color: PET_COLOR }} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Appointments */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: "#3B82F6" }} />
            <h3 className="font-bold text-sm" style={{ color: S.text }}>আজকের অ্যাপয়েন্টমেন্ট</h3>
            {(stats?.todayAppts ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                {stats?.todayAppts}টি
              </span>
            )}
          </div>
          <Link href="/appointments" className="text-xs font-semibold" style={{ color: PET_COLOR }}>সব দেখুন →</Link>
        </div>

        {!stats?.todayApptList?.length ? (
          <div className="py-10 text-center">
            <span className="text-4xl">🐾</span>
            <p className="text-sm mt-2" style={{ color: S.muted }}>আজকে কোনো অ্যাপয়েন্টমেন্ট নেই</p>
            <Link href="/appointments?new=1" className="text-sm font-bold mt-1 block" style={{ color: PET_COLOR }}>
              + নতুন অ্যাপয়েন্টমেন্ট যোগ করুন
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: S.border }}>
            {stats?.todayApptList.map(a => {
              const t = new Date(a.date).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
              const sc = STATUS_COLORS[a.status] ?? "#6B7280";
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="text-center flex-shrink-0 w-10">
                      <p className="text-xs font-black" style={{ color: PET_COLOR }}>{t}</p>
                      <span className="text-lg">{PET_ICONS[a.petType] ?? "🐾"}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: S.text }}>{a.petName}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${sc}15`, color: sc }}>
                          {TYPE_LABELS[a.type] ?? a.type}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: S.muted }}>{a.ownerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: S.text }}>{formatBDT(a.fee)}</p>
                      {a.fee > a.paidAmount && (
                        <p className="text-[10px]" style={{ color: "#EF4444" }}>বাকি {formatBDT(a.fee - a.paidAmount)}</p>
                      )}
                    </div>
                    <a href={`tel:${a.ownerPhone}`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: PET_LIGHT }}>
                      <Phone size={13} style={{ color: PET_COLOR }} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/petshop/pets",  label: "পশু-পাখি তালিকা", color: PET_COLOR,  bg: PET_LIGHT },
          { href: "/appointments",  label: "অ্যাপয়েন্টমেন্ট", color: "#3B82F6",  bg: "#EFF6FF" },
          { href: "/customers",     label: "কাস্টমার",          color: "#10B981",  bg: "#ECFDF5" },
          { href: "/petshop/reports", label: "রিপোর্ট",         color: "#F59E0B",  bg: "#FFFBEB" },
        ].map(q => (
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
