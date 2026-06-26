"use client";

import { GitBranch, Loader2, TrendingUp, AlertTriangle, Store, ShoppingBag, Calendar, ArrowUpRight, Trophy, MapPin } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import { T } from "@/lib/theme";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { useDashboardFetch } from "@/hooks/useDashboardFetch";

interface BranchKpiRow {
  id: string;
  name: string;
  weekRevenue: number;
  weekOrders: number;
}

interface KpiData {
  locked?: boolean;
  branchCount: number;
  todayBranchRevenue: number;
  todayBranchOrders: number;
  weekBranchRevenue: number;
  lowStockBranchCount: number;
  branches: BranchKpiRow[];
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  bg: "var(--c-bg)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
};

const RANK_STYLES = [
  { bg: "linear-gradient(135deg, var(--accent-warm), var(--bg-warning-text))", color: "#fff", ring: "var(--accent-warm)" },
  { bg: "var(--c-surface-raised)", color: "var(--c-text-muted)", ring: "var(--c-border)" },
  { bg: "linear-gradient(135deg, var(--icon-orange-bg), var(--bg-warning-text))", color: "#fff", ring: "var(--bg-warning-border)" },
];

export default function BranchKpisPanel() {
  const { data, isLoading: loading } = useDashboardFetch<KpiData>(
    "/api/shops/dashboard-kpis",
  );

  if (!loading && (!data || data.locked || data.branchCount === 0)) {
    return null;
  }

  if (loading || !data) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="h-[72px] animate-pulse" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }} />
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-2xl animate-pulse card-stat" />
          ))}
        </div>
        <div className="px-4 pb-4">
          <div className="h-28 rounded-2xl animate-pulse card-stat" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const ranked = data.branches.filter(b => b.weekRevenue > 0 || b.weekOrders > 0).slice(0, 4);
  const maxRevenue = ranked[0]?.weekRevenue ?? 1;
  const top = data.branches[0];

  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className="relative px-5 py-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 55%, #083D31 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="absolute top-2 right-24 w-14 h-14 rounded-full opacity-10 bg-white" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
            >
              <GitBranch size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-tight">মাল্টি-শাখা ওভারভিউ</h3>
              <p className="text-white/70 text-[11px] mt-0.5 flex items-center gap-1">
                <MapPin size={10} />
                {data.branchCount}টি সক্রিয় শাখা · আজ ও ৭ দিনের পারফরম্যান্স
              </p>
            </div>
          </div>

          <Link
            href="/shops"
            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            শাখা ব্যবস্থাপনা
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Store} label="সক্রিয় শাখা" value={String(data.branchCount)} trend={{ value: "লোকেশন" }} accent="green" />
        <StatCard icon={ShoppingBag} label="আজকের বিক্রি" value={formatBDT(data.todayBranchRevenue)} trend={{ value: `${data.todayBranchOrders}টি branch অর্ডার` }} accent="blue" />
        <StatCard icon={Calendar} label="৭ দিনের রাজস্ব" value={formatBDT(data.weekBranchRevenue)} trend={{ value: "সব শাখা মিলিয়ে" }} accent="purple" />
        {data.lowStockBranchCount > 0 ? (
          <Link href="/shops" className="block">
            <StatCard icon={AlertTriangle} label="কম স্টক শাখা" value={String(data.lowStockBranchCount)} trend={{ value: "অ্যাকশন দরকার" }} accent="red" className="h-full" />
          </Link>
        ) : (
          <StatCard icon={AlertTriangle} label="কম স্টক শাখা" value={String(data.lowStockBranchCount)} trend={{ value: "সব ঠিক আছে ✓" }} accent="green" />
        )}
      </div>

      {top && top.weekRevenue > 0 && (
        <div className="px-4 pb-3">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{ borderColor: T.warning.border, backgroundColor: T.warning.bg }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--accent-warm), var(--bg-warning-text))" }}
            >
              <TrendingUp size={16} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: T.warning.text }}>
                সেরা শাখা · ৭ দিন
              </p>
              <p className="text-sm font-black truncate" style={{ color: "var(--c-text)" }}>
                {top.name}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black" style={{ color: T.warning.text }}>{formatBDT(top.weekRevenue)}</p>
              <p className="text-[10px] font-semibold" style={{ color: T.warning.text, opacity: 0.85 }}>{top.weekOrders} অর্ডার</p>
            </div>
          </div>
        </div>
      )}

      {ranked.length > 1 && (
        <div className="px-4 pb-4">
          <Card padding="md" variant="bordered" className="!bg-[var(--c-bg)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: T.warning.iconBg }}>
                  <Trophy size={13} style={{ color: T.warning.iconText }} />
                </div>
                <p className="text-xs font-bold" style={{ color: S.text }}>শাখা র‍্যাঙ্কিং</p>
              </div>
              <span className="text-[10px] font-semibold" style={{ color: S.muted }}>৭ দিন</span>
            </div>
            <div className="space-y-3">
              {ranked.map((b, i) => {
                const rankStyle = RANK_STYLES[i] ?? RANK_STYLES[2];
                const pct = Math.max(8, Math.round((b.weekRevenue / maxRevenue) * 100));
                return (
                  <div key={b.id}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: rankStyle.bg, color: rankStyle.color, boxShadow: `0 0 0 1px ${rankStyle.ring}` }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-bold truncate flex-1" style={{ color: S.text }}>{b.name}</span>
                      <span className="text-[11px] font-black flex-shrink-0" style={{ color: "var(--c-primary)" }}>
                        {formatBDT(b.weekRevenue)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden ml-7" style={{ backgroundColor: S.border }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: i === 0
                            ? "linear-gradient(90deg, var(--c-primary), var(--c-primary-text))"
                            : "linear-gradient(90deg, var(--c-primary-light), var(--c-primary))",
                          opacity: i === 0 ? 1 : 0.7 - i * 0.12,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {data.lowStockBranchCount > 0 && (
        <div className="mx-4 mb-4">
          <Link
            href="/shops"
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-opacity hover:opacity-90"
            style={{ borderColor: T.danger.border, backgroundColor: T.danger.bg }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: T.danger.iconBg }}>
              <AlertTriangle size={14} style={{ color: T.danger.iconText }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: T.danger.text }}>
                {data.lowStockBranchCount}টি শাখায় স্টক কম
              </p>
              <p className="text-[10px]" style={{ color: T.danger.text, opacity: 0.85 }}>Transfer বা reorder করুন →</p>
            </div>
            <ArrowUpRight size={14} style={{ color: T.danger.text }} />
          </Link>
        </div>
      )}
    </Card>
  );
}
