"use client";

import { useEffect, useState } from "react";
import { ShoppingBasket, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const G = "#16A34A";

interface BuyerStat { buyerName: string; totalKg: number; totalRevenue: number; saleCount: number; lastSale: string }

export default function BuyersBoard() {
  const [sales, setSales] = useState<BuyerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/farm/harvest").then((r) => r.json()).then((harvests: Array<{ sellRecords: Array<{ buyerName?: string | null; quantityKg: number; totalAmount: number; saleDate: string }> }>) => {
      const allSales = harvests.flatMap((h) => h.sellRecords);
      const map: Record<string, BuyerStat> = {};
      for (const s of allSales) {
        const name = s.buyerName ?? "অজ্ঞাত ক্রেতা";
        if (!map[name]) map[name] = { buyerName: name, totalKg: 0, totalRevenue: 0, saleCount: 0, lastSale: s.saleDate };
        map[name].totalKg += s.quantityKg;
        map[name].totalRevenue += s.totalAmount;
        map[name].saleCount += 1;
        if (new Date(s.saleDate) > new Date(map[name].lastSale)) map[name].lastSale = s.saleDate;
      }
      setSales(Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: G }} /></div>;

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: S.text }}><ShoppingBasket size={20} style={{ color: G }} /> ক্রেতা তালিকা</h1>
      <p className="text-xs" style={{ color: S.muted }}>ফসল কিনেছেন এমন ক্রেতাদের ইতিহাস</p>

      {sales.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <ShoppingBasket size={36} className="mx-auto mb-2" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>এখনো কোনো বিক্রির রেকর্ড নেই</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {sales.map((b, i) => (
            <div key={b.buyerName} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: G }}>
                {b.buyerName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: S.text }}>{b.buyerName}</p>
                <p className="text-xs" style={{ color: S.muted }}>{b.saleCount}টি বিক্রি · {b.totalKg.toFixed(1)} কেজি · শেষ: {new Date(b.lastSale).toLocaleDateString("bn-BD")}</p>
              </div>
              <p className="text-sm font-bold" style={{ color: G }}>{formatBDT(b.totalRevenue)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
