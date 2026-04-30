"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  Wrench, Car, ClipboardList, Package, Clock,
  CheckCircle, AlertCircle, TrendingUp, RefreshCw, Loader2, Plus,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
}

interface DashStats {
  todayJobCards: number;
  readyCount: number;
  activeCount: number;
  todayRevenue: number;
  readyVehicles: Array<{
    id: string;
    jobNumber: string;
    vehicle: {
      regNumber: string;
      brand: string;
      model: string;
      customer?: { name: string; phone: string } | null;
    };
  }>;
  recentJobs: Array<{
    id: string;
    jobNumber: string;
    status: string;
    priority: string;
    complaint: string;
    vehicle: { regNumber: string; type: string; brand: string; model: string };
  }>;
  lowStockParts: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  received:       { label: "গাড়ি এসেছে",   color: "#0C447C", bg: "#E6F1FB" },
  diagnosing:     { label: "Diagnosis",     color: "#B45309", bg: "#FEF3C7" },
  waiting_parts:  { label: "Parts অপেক্ষা", color: "#7C3AED", bg: "#EDE9FE" },
  repairing:      { label: "মেরামত",        color: "#0F6E56", bg: "#E1F5EE" },
  quality_check:  { label: "Quality Check", color: "#0369A1", bg: "#E0F2FE" },
  ready:          { label: "Ready",         color: "#166534", bg: "#DCFCE7" },
  delivered:      { label: "Delivered",     color: "#6B7280", bg: "#F3F4F6" },
};

const VEHICLE_ICONS: Record<string, string> = {
  car: "🚗", motorcycle: "🏍️", cng: "🛺", microbus: "🚐", truck: "🚛", bus: "🚌",
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardGarage({ shopName, userName, userGender }: Props) {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = userGender === "female" ? "আপু" : "ভাইয়া";

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/garage/dashboard", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-600" size={32} />
      </div>
    );
  }

  const statCards = [
    {
      label: "আজ আসা গাড়ি",
      value: stats?.todayJobCards ?? 0,
      icon: Car,
      color: "#0C447C",
      bg: "#E6F1FB",
      href: "/jobcards?filter=today",
    },
    {
      label: "Ready গাড়ি",
      value: stats?.readyCount ?? 0,
      icon: CheckCircle,
      color: "#166534",
      bg: "#DCFCE7",
      href: "/jobcards?status=ready",
    },
    {
      label: "চলমান কাজ",
      value: stats?.activeCount ?? 0,
      icon: Wrench,
      color: "#B45309",
      bg: "#FEF3C7",
      href: "/jobcards?status=repairing",
    },
    {
      label: "আজকের আয়",
      value: formatBDT(stats?.todayRevenue ?? 0),
      icon: TrendingUp,
      color: "#0F6E56",
      bg: "#E1F5EE",
      isAmount: true,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>
            স্বাগতম, {greeting} {userName.split(" ")[0]}!
          </h1>
          <p className="text-sm" style={{ color: S.muted }}>{shopName} — গ্যারেজ ড্যাশবোর্ড</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border text-sm flex items-center gap-1"
            style={{ borderColor: S.border, color: S.muted }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <Link
            href="/jobcards?new=1"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: "#B45309" }}
          >
            <Plus size={14} />
            নতুন Job Card
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: S.surface, border: `1px solid ${S.border}` }}
            >
              <div className="rounded-lg p-2.5" style={{ background: card.bg }}>
                <Icon size={20} style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: S.muted }}>{card.label}</p>
                <p className="text-lg font-bold" style={{ color: S.text }}>
                  {card.value}
                </p>
              </div>
            </div>
          );
          return card.href ? (
            <Link key={card.label} href={card.href}>{content}</Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      {/* Low stock alert */}
      {(stats?.lowStockParts ?? 0) > 0 && (
        <Link href="/inventory?lowStock=1">
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}
          >
            <Package size={18} style={{ color: "#B45309" }} />
            <span className="text-sm font-medium" style={{ color: "#92400E" }}>
              {stats!.lowStockParts} টি পার্টস কম আছে — স্টক চেক করুন
            </span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ready vehicles alert */}
        {(stats?.readyVehicles?.length ?? 0) > 0 && (
          <div
            className="rounded-xl p-4"
            style={{ background: S.surface, border: `1px solid #86EFAC` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} style={{ color: "#166534" }} />
              <h3 className="font-semibold text-sm" style={{ color: "#166534" }}>
                আজকের Ready গাড়ি ({stats!.readyVehicles.length})
              </h3>
            </div>
            <div className="space-y-2">
              {stats!.readyVehicles.slice(0, 5).map((job) => (
                <Link key={job.id} href={`/jobcards/${job.id}`}>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:opacity-80"
                    style={{ background: "#DCFCE7" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: S.text }}>
                        {job.vehicle.regNumber}
                      </p>
                      <p className="text-xs" style={{ color: S.muted }}>
                        {job.vehicle.customer?.name} · {job.vehicle.customer?.phone}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                      {job.jobNumber}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent jobs */}
        <div
          className="rounded-xl p-4"
          style={{ background: S.surface, border: `1px solid ${S.border}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={16} style={{ color: "#B45309" }} />
            <h3 className="font-semibold text-sm" style={{ color: S.text }}>সাম্প্রতিক কাজ</h3>
          </div>
          {(stats?.recentJobs?.length ?? 0) === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: S.muted }}>কোনো কাজ নেই</p>
          ) : (
            <div className="space-y-2">
              {stats!.recentJobs.map((job) => {
                const st = STATUS_LABEL[job.status] ?? STATUS_LABEL.received;
                const icon = VEHICLE_ICONS[job.vehicle.type] ?? "🚗";
                return (
                  <Link key={job.id} href={`/jobcards/${job.id}`}>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:opacity-80"
                      style={{ background: "var(--c-surface-hover, #F9FAFB)" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: S.text }}>
                            {job.vehicle.regNumber}
                          </p>
                          <p className="text-xs truncate" style={{ color: S.muted }}>
                            {job.complaint.slice(0, 40)}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full ml-2 shrink-0"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          <Link href="/jobcards" className="flex items-center gap-1 mt-3 text-xs" style={{ color: "#B45309" }}>
            সব জব কার্ড দেখুন →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "জব কার্ড", href: "/jobcards", icon: ClipboardList, color: "#B45309" },
          { label: "গাড়ির তালিকা", href: "/vehicles", icon: Car, color: "#0C447C" },
          { label: "পার্টস স্টক", href: "/inventory", icon: Package, color: "#0F6E56" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <div
                className="rounded-xl p-4 text-center hover:opacity-80 transition"
                style={{ background: S.surface, border: `1px solid ${S.border}` }}
              >
                <Icon size={20} className="mx-auto mb-1" style={{ color: action.color }} />
                <p className="text-xs font-medium" style={{ color: S.text }}>{action.label}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
