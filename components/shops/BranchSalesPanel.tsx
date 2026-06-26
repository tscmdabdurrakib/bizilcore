"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Props {
  branchId: string;
  branchName: string;
}

interface SalesData {
  summary: { validOrders: number; totalOrders: number; revenue: number; collected: number };
  recentOrders: { id: string; shortId: string; totalAmount: number; status: string; customerName: string; createdAt: string }[];
}

export default function BranchSalesPanel({ branchId }: Props) {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/shops/branches/${branchId}/sales?days=30`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs py-4" style={{ color: "var(--c-text-muted)" }}>
        <Loader2 size={14} className="animate-spin" /> বিক্রি লোড হচ্ছে...
      </div>
    );
  }

  if (!data) return null;

  const { summary, recentOrders } = data;

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface-alt, var(--c-surface))" }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} style={{ color: "#059669" }} />
        <h3 className="text-sm font-black" style={{ color: "var(--c-text)" }}>৩০ দিনের বিক্রি</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="Valid অর্ডার" value={String(summary.validOrders)} />
        <Stat label="রাজস্ব" value={formatBDT(summary.revenue)} />
        <Stat label="সংগ্রহ" value={formatBDT(summary.collected)} />
        <Stat label="মোট অর্ডার" value={String(summary.totalOrders)} />
      </div>
      {recentOrders.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--c-text-muted)" }}>সাম্প্রতিক</p>
          <div className="space-y-1.5">
            {recentOrders.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg"
                style={{ backgroundColor: "var(--c-surface)" }}>
                <span style={{ color: "var(--c-text)" }}>
                  #{o.shortId} · {o.customerName}
                </span>
                <span className="font-bold" style={{ color: "#059669" }}>{formatBDT(o.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {recentOrders.length === 0 && (
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>এই branch-এ এখনো valid বিক্রি নেই।</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--c-surface)" }}>
      <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{label}</p>
      <p className="text-sm font-black" style={{ color: "var(--c-text)" }}>{value}</p>
    </div>
  );
}
