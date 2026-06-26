"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Clock, Loader2, Plus, ChevronRight } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#EA580C",
};

const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

interface HappyHourCoupon {
  id: string;
  code: string;
  name?: string | null;
  value: number;
  isActive: boolean;
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  happyHourDays?: number[] | null;
}

export default function HappyHourSettings() {
  const [items, setItems] = useState<HappyHourCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/restaurant/coupons");
      if (r.ok) {
        const all = await r.json();
        setItems(all.filter((c: { type: string }) => c.type === "happyhour"));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: S.border }}>
        <div className="flex items-center gap-2">
          <Clock size={16} style={{ color: "#D97706" }} />
          <h3 className="text-sm font-bold" style={{ color: S.text }}>হ্যাপি আওয়ার</h3>
        </div>
        <Link href="/restaurant/menu?tab=coupons"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
          <Plus size={12} /> নতুন সেটআপ
        </Link>
      </div>

      <p className="text-xs mb-4" style={{ color: S.muted }}>
        নির্দিষ্ট সময় ও দিনে POS-এ স্বয়ংক্রিয় ছাড় প্রয়োগ হয়। কুপন ট্যাবে ধরন &quot;হ্যাপি আওয়ার&quot; বেছে তৈরি করুন।
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin" style={{ color: S.primary }} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 rounded-xl border border-dashed" style={{ borderColor: S.border }}>
          <Clock size={28} className="mx-auto mb-2 opacity-30" style={{ color: S.muted }} />
          <p className="text-xs font-medium" style={{ color: S.muted }}>কোনো হ্যাপি আওয়ার সেটআপ নেই</p>
          <Link href="/restaurant/menu?tab=coupons" className="inline-flex items-center gap-1 text-xs font-semibold mt-2" style={{ color: S.primary }}>
            কুপন ম্যানেজমেন্টে যান <ChevronRight size={12} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(h => (
            <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border"
              style={{ borderColor: "#FDE68A", backgroundColor: "#FFFBEB" }}>
              <div>
                <p className="text-sm font-bold font-mono" style={{ color: S.text }}>{h.code}</p>
                {h.name && <p className="text-[10px]" style={{ color: S.muted }}>{h.name}</p>}
                <p className="text-xs mt-1" style={{ color: "#D97706" }}>
                  {h.happyHourStart ?? "—"} – {h.happyHourEnd ?? "—"} · {h.value}% ছাড়
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>
                  {(h.happyHourDays ?? []).map(d => DAYS[d]).join(", ")}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${h.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {h.isActive ? "সক্রিয়" : "বন্ধ"}
              </span>
            </div>
          ))}
          <Link href="/restaurant/menu?tab=coupons" className="flex items-center justify-center gap-1 text-xs font-semibold py-2" style={{ color: S.primary }}>
            সব কুপন পরিচালনা <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
