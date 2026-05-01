"use client";

import { useEffect, useState } from "react";
import { BarChart2, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const G = "#16A34A";

interface LandProfit { landName: string; areaBigha: number; totalCost: number; totalRevenue: number; profit: number }
interface CropProfit { cropName: string; status: string; totalCost: number; totalRevenue: number; profit: number; totalKg: number; margin: number }
interface MonthRevenue { month: string; revenue: number }
interface LivestockVal { type: string; quantity: number; purchaseCost: number; currentValue: number; appreciation: number }

interface ReportData {
  landProfitability: LandProfit[];
  cropProfitability: CropProfit[];
  monthlyRevenue: MonthRevenue[];
  livestockValuation: LivestockVal[];
}

export default function FarmReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/farm/reports").then((r) => r.json()).then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;
  if (!data) return null;

  const maxRevenue = Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1);
  const totalLivestockValue = data.livestockValuation.reduce((s, l) => s + l.currentValue * l.quantity, 0);
  const totalCropRevenue = data.cropProfitability.reduce((s, c) => s + c.totalRevenue, 0);
  const totalCropCost = data.cropProfitability.reduce((s, c) => s + c.totalCost, 0);

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-6">
      <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: S.text }}><BarChart2 size={20} style={{ color: G }} /> ফার্ম রিপোর্ট</h1>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "মোট আয়", value: formatBDT(totalCropRevenue), color: G },
          { label: "মোট বিনিয়োগ", value: formatBDT(totalCropCost), color: "#EF4444" },
          { label: "পশু সম্পদ মূল্য", value: formatBDT(totalLivestockValue), color: "#0369A1" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      {data.monthlyRevenue.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: S.text }}>📊 মাসিক আয়</h3>
          <div className="flex items-end gap-2 h-32">
            {data.monthlyRevenue.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[9px] font-bold" style={{ color: G }}>{formatBDT(m.revenue)}</p>
                <div className="w-full rounded-t-lg" style={{ height: `${Math.max(4, (m.revenue / maxRevenue) * 100)}%`, backgroundColor: G, opacity: 0.8 }} />
                <p className="text-[8px]" style={{ color: S.muted }}>{m.month.slice(5)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Land Profitability */}
      {data.landProfitability.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: S.border }}>
            <h3 className="text-sm font-bold" style={{ color: S.text }}>🌾 জমিভিত্তিক লাভ-লোকসান</h3>
          </div>
          {data.landProfitability.map((l, i) => (
            <div key={l.landName} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: S.text }}>{l.landName}</p>
                <p className="text-[10px]" style={{ color: S.muted }}>{l.areaBigha} বিঘা · খরচ: {formatBDT(l.totalCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: l.profit >= 0 ? G : "#EF4444" }}>{l.profit >= 0 ? "+" : ""}{formatBDT(l.profit)}</p>
                <p className="text-[10px]" style={{ color: S.muted }}>আয়: {formatBDT(l.totalRevenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crop Profitability */}
      {data.cropProfitability.filter((c) => c.totalCost > 0 || c.totalRevenue > 0).length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: S.border }}>
            <h3 className="text-sm font-bold" style={{ color: S.text }}>🌱 ফসলভিত্তিক লাভ মার্জিন</h3>
          </div>
          {data.cropProfitability.filter((c) => c.totalCost > 0 || c.totalRevenue > 0).map((c, i) => (
            <div key={`${c.cropName}-${i}`} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: S.text }}>{c.cropName}</p>
                <p className="text-[10px]" style={{ color: S.muted }}>{c.totalKg.toFixed(1)} কেজি · বিনিয়োগ: {formatBDT(c.totalCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: c.profit >= 0 ? G : "#EF4444" }}>{c.profit >= 0 ? "+" : ""}{formatBDT(c.profit)}</p>
                <p className="text-[10px]" style={{ color: S.muted }}>মার্জিন: {c.margin}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Livestock Valuation */}
      {data.livestockValuation.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: S.border }}>
            <h3 className="text-sm font-bold" style={{ color: S.text }}>🐄 পশু সম্পদের মূল্যায়ন</h3>
          </div>
          {data.livestockValuation.map((l, i) => (
            <div key={l.type} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: S.text }}>{l.type} ({l.quantity} টি)</p>
                <p className="text-[10px]" style={{ color: S.muted }}>ক্রয়মূল্য: {formatBDT(l.purchaseCost)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold" style={{ color: G }}>{formatBDT(l.currentValue * l.quantity)}</p>
                {l.appreciation !== 0 && <p className="text-[10px]" style={{ color: l.appreciation > 0 ? G : "#EF4444" }}>{l.appreciation > 0 ? "+" : ""}{formatBDT(l.appreciation * l.quantity)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
