"use client";

import { useEffect, useState } from "react";
import { Wheat, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const G = "#16A34A";

interface SaleRecord { quantityKg: number; totalAmount: number; saleDate: string; buyerName?: string | null }
interface Harvest {
  id: string; harvestDate: string; quantityKg: number; qualityGrade?: string | null;
  cycle: { cropName: string; cropType: string; land: { name: string } };
  sellRecords: SaleRecord[];
  soldKg: number; remainingKg: number; revenue: number;
}

export default function HarvestBoard() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/farm/harvest").then((r) => r.json()).then(setHarvests).finally(() => setLoading(false)); }, []);

  const totalKg = harvests.reduce((s, h) => s + h.quantityKg, 0);
  const totalRevenue = harvests.reduce((s, h) => s + h.revenue, 0);
  const totalRemaining = harvests.reduce((s, h) => s + h.remainingKg, 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: S.text }}><Wheat size={20} style={{ color: G }} /> ফসল তোলা ও বিক্রির ইতিহাস</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট ফসল", value: `${totalKg.toFixed(1)} কেজি`, color: G },
          { label: "মোট আয়", value: formatBDT(totalRevenue), color: "#0369A1" },
          { label: "মজুদ বাকি", value: `${totalRemaining.toFixed(1)} কেজি`, color: totalRemaining > 0 ? "#F59E0B" : G },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border p-3 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {harvests.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <Wheat size={36} className="mx-auto mb-2" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>এখনো কোনো ফসল তোলা হয়নি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {harvests.map((h) => (
            <div key={h.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>{h.cycle.cropName}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{h.cycle.land.name} · {new Date(h.harvestDate).toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: G }}>{h.quantityKg} কেজি</p>
                  {h.qualityGrade && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#F0FDF4", color: G }}>গ্রেড-{h.qualityGrade}</span>}
                </div>
              </div>
              <div className="flex gap-3 mt-2 flex-wrap text-xs">
                <span style={{ color: G }}>বিক্রি: {h.soldKg.toFixed(1)} কেজি ({formatBDT(h.revenue)})</span>
                {h.remainingKg > 0 && <span style={{ color: "#F59E0B" }}>বাকি: {h.remainingKg.toFixed(1)} কেজি</span>}
              </div>
              {h.sellRecords.length > 0 && (
                <div className="mt-2 space-y-1">
                  {h.sellRecords.map((r, i) => (
                    <div key={i} className="flex justify-between text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--c-bg)" }}>
                      <span style={{ color: S.muted }}>{r.buyerName ?? "অজ্ঞাত"} · {new Date(r.saleDate).toLocaleDateString("bn-BD")}</span>
                      <span style={{ color: G, fontWeight: 600 }}>{formatBDT(r.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
