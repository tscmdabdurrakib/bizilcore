"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wheat, Tractor, AlertCircle, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const G = "#16A34A";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

interface VacDue { description: string; nextDueDate: string; livestock: { type: string } }
interface HarvestDue { cropName: string; expectedHarvestDate: string; land: { name: string } }
interface UnsoldHarvest { id: string; remaining: number }
interface ActiveCycle { id: string; cropName: string; cropType: string; landName: string; status: string; daysGrowing: number; daysToHarvest: number | null; totalCost: number }

interface DashStats {
  activeCropCycles: number; totalLandBigha: number; totalLandCount: number;
  totalAnimals: number; monthRevenue: number;
  vaccinationDue: VacDue[]; harvestDue: HarvestDue[];
  unsoldHarvests: UnsoldHarvest[];
  activeCycles: ActiveCycle[];
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  planned:    { bg: "#EFF6FF", color: "#1D4ED8", label: "পরিকল্পিত" },
  sowing:     { bg: "#F0FDF4", color: "#16A34A", label: "বপন"       },
  growing:    { bg: "#ECFDF5", color: "#059669", label: "বাড়ছে"    },
  harvesting: { bg: "#FFF3DC", color: "#92400E", label: "ফসল তোলা" },
  completed:  { bg: "#F3F4F6", color: "#6B7280", label: "সম্পন্ন"  },
};

const QUICK_ACTIONS = [
  { href: "/farm/lands",     emoji: "🌾", label: "জমি যোগ",        bg: "#F0FDF4", color: G },
  { href: "/farm/crops",     emoji: "🌱", label: "নতুন ফসল",       bg: "#F0FDF4", color: G },
  { href: "/farm/livestock", emoji: "🐄", label: "পশু যোগ",        bg: "#F0FDF4", color: G },
  { href: "/farm/harvest",   emoji: "🧺", label: "ফসল তোলা",       bg: "#FFF3DC", color: "#92400E" },
  { href: "/farm/reports",   emoji: "📊", label: "রিপোর্ট",         bg: "#EFF6FF", color: "#1D4ED8" },
  { href: "/hisab",          emoji: "📒", label: "হিসাব",           bg: "#F5F3FF", color: "#7C3AED" },
];

export default function DashboardFarm() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/farm/dashboard-stats").then((r) => r.json()).then(setStats).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-6">
      {/* Hero */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #14532D 0%, #166534 50%, #15803D 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10 bg-white" />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="relative">
          <p className="text-white/70 text-xs font-medium">আস-সালামু আলাইকুম!</p>
          <h2 className="text-2xl font-bold mt-1">🌾 আমার ফার্ম</h2>
          <p className="text-white/80 text-sm mt-1">সকল তথ্য এক জায়গায়</p>
          <div className="flex gap-3 mt-4 flex-wrap">
            <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-2xl font-bold">{stats.activeCropCycles}</p>
              <p className="text-[11px] text-white/80">সক্রিয় ফসল</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-2xl font-bold">{stats.totalLandBigha.toFixed(1)}</p>
              <p className="text-[11px] text-white/80">বিঘা জমি</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-2xl font-bold">{formatBDT(stats.monthRevenue)}</p>
              <p className="text-[11px] text-white/80">এ মাসে আয়</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.vaccinationDue.length > 0 || stats.harvestDue.length > 0 || stats.unsoldHarvests.length > 0) && (
        <div className="space-y-2">
          {stats.vaccinationDue.map((v, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}>
              <AlertCircle size={16} style={{ color: "#F59E0B" }} />
              <p className="text-xs font-semibold flex-1" style={{ color: "#92400E" }}>⚠️ টিকার সময় আসছে: {v.livestock.type} — {new Date(v.nextDueDate).toLocaleDateString("bn-BD")}</p>
              <Link href="/farm/livestock" className="text-xs font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>দেখুন</Link>
            </div>
          ))}
          {stats.harvestDue.map((h, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}>
              <Wheat size={16} style={{ color: G }} />
              <p className="text-xs font-semibold flex-1" style={{ color: "#14532D" }}>🌾 ফসল তোলার সময়: {h.cropName} ({h.land.name}) — {new Date(h.expectedHarvestDate).toLocaleDateString("bn-BD")}</p>
              <Link href="/farm/crops" className="text-xs font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: "#DCFCE7", color: G }}>দেখুন</Link>
            </div>
          ))}
          {stats.unsoldHarvests.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ backgroundColor: "#EFF6FF", borderColor: "#93C5FD" }}>
              <Tractor size={16} style={{ color: "#1D4ED8" }} />
              <p className="text-xs font-semibold flex-1" style={{ color: "#1E3A8A" }}>📦 {stats.unsoldHarvests.length}টি ব্যাচে অবিক্রীত ফসল মজুদ আছে</p>
              <Link href="/farm/harvest" className="text-xs font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}>দেখুন</Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all hover:shadow-md active:scale-95" style={{ backgroundColor: a.bg }}>
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-[11px] font-bold" style={{ color: a.color }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "সক্রিয় ফসল", value: `${stats.activeCropCycles}টি`, color: G, bg: "#F0FDF4" },
          { label: "মোট জমি", value: `${stats.totalLandBigha.toFixed(1)} বিঘা`, color: "#0369A1", bg: "#E0F2FE" },
          { label: "পশু/মৎস্য", value: `${stats.totalAnimals}টি`, color: "#7C3AED", bg: "#F5F3FF" },
          { label: "এ মাসে আয়", value: formatBDT(stats.monthRevenue), color: G, bg: "#DCFCE7" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Active Crop Cycles */}
      {stats.activeCycles.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: S.border }}>
            <h3 className="text-sm font-bold" style={{ color: S.text }}>🌱 চলমান ফসল</h3>
            <Link href="/farm/crops" className="text-xs font-semibold" style={{ color: G }}>সব দেখুন →</Link>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-3 p-3" style={{ minWidth: "max-content" }}>
              {stats.activeCycles.map((c) => {
                const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.planned;
                return (
                  <Link key={c.id} href={`/farm/crops/${c.id}`} className="flex-shrink-0 w-44 rounded-2xl p-3 border" style={{ backgroundColor: "var(--c-bg)", borderColor: S.border }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-lg">🌾</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    <p className="text-xs font-bold" style={{ color: S.text }}>{c.cropName}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{c.landName}</p>
                    {c.daysGrowing > 0 && <p className="text-[10px] mt-1" style={{ color: S.muted }}>🌱 {c.daysGrowing} দিন</p>}
                    {c.daysToHarvest !== null && c.daysToHarvest > 0 && (
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#F59E0B" }}>⏳ {c.daysToHarvest} দিন বাকি</p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: "#EF4444" }}>খরচ: {formatBDT(c.totalCost)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty state if no crops */}
      {stats.activeCropCycles === 0 && stats.totalLandCount === 0 && (
        <div className="text-center py-8 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <p className="text-4xl mb-2">🌱</p>
          <p className="text-sm font-semibold" style={{ color: S.muted }}>ফার্ম শুরু করুন</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>প্রথমে একটি জমি যোগ করুন</p>
          <Link href="/farm/lands" className="inline-block mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: G }}>জমি যোগ করুন</Link>
        </div>
      )}
    </div>
  );
}
