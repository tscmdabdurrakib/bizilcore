"use client";

import { useEffect, useState, useCallback } from "react";
import { Receipt, TrendingUp, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Bill {
  id: string; type: "OPD" | "IPD"; number: string;
  patientName: string; patientPhone?: string | null; doctorName: string;
  totalAmount: number; paidAmount: number; dueAmount: number; date: string;
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const ACC = "#378ADD";

export default function BillingBoard() {
  const [data, setData] = useState<{ bills: Bill[]; opdRevenue: number; ipdRevenue: number; totalRevenue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hospital/billing?filter=${filter}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={20} style={{ color: ACC }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>বিলিং</h1>
        </div>
        <div className="flex gap-1.5">
          {[["today", "আজকের"], ["month", "এই মাস"], ["all", "সব"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ backgroundColor: filter === val ? ACC : S.surface, color: filter === val ? "#fff" : S.text, borderColor: filter === val ? ACC : S.border }}>{label}</button>
          ))}
        </div>
      </div>

      {!loading && data && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "OPD আয়", value: data.opdRevenue, color: ACC, bg: "#EFF6FF" },
            { label: "IPD আয়", value: data.ipdRevenue, color: "#7C3AED", bg: "#F5F3FF" },
            { label: "মোট আয়", value: data.totalRevenue, color: "#0F6E56", bg: "#E1F5EE" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={12} style={{ color: c.color }} />
                <p className="text-[11px]" style={{ color: S.muted }}>{c.label}</p>
              </div>
              <p className="text-base font-bold" style={{ color: c.color }}>{formatBDT(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: ACC }} /></div>
      ) : !data || data.bills.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Receipt size={28} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm" style={{ color: S.muted }}>কোনো বিল নেই</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-semibold border-b" style={{ borderColor: S.border, color: S.muted, backgroundColor: S.bg }}>
            <span className="col-span-1">ধরন</span>
            <span className="col-span-3">রোগী</span>
            <span className="col-span-3">ডাক্তার</span>
            <span className="col-span-2">মোট</span>
            <span className="col-span-2">পরিশোধ</span>
            <span className="col-span-1">বাকি</span>
          </div>
          {data.bills.map((b) => (
            <div key={b.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-0 items-center text-xs" style={{ borderColor: S.border }}>
              <span className="col-span-1">
                <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: b.type === "OPD" ? "#EFF6FF" : "#F5F3FF", color: b.type === "OPD" ? ACC : "#7C3AED" }}>{b.type}</span>
              </span>
              <div className="col-span-3">
                <p className="font-medium" style={{ color: S.text }}>{b.patientName}</p>
                <p style={{ color: S.muted }}>{b.number}</p>
              </div>
              <div className="col-span-3">
                <p style={{ color: S.text }}>{b.doctorName}</p>
                <p style={{ color: S.muted }}>{new Date(b.date).toLocaleDateString("bn-BD")}</p>
              </div>
              <span className="col-span-2 font-semibold" style={{ color: S.text }}>৳{b.totalAmount.toLocaleString("bn-BD")}</span>
              <span className="col-span-2" style={{ color: "#0F6E56" }}>৳{b.paidAmount.toLocaleString("bn-BD")}</span>
              <span className="col-span-1" style={{ color: b.dueAmount > 0 ? "#DC2626" : S.muted }}>
                {b.dueAmount > 0 ? `৳${b.dueAmount.toLocaleString("bn-BD")}` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
