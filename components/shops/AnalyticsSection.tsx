"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowLeftRight, History, GitBranch, Package } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";

interface AnalyticsData {
  summary: {
    totalTransferred: number;
    transferCount: number;
    activeBranches: number;
    uniqueProducts: number;
    mainStockQty: number;
    branchStockQty: number;
  };
  daily: { label: string; total: number }[];
  byBranch: { name: string; count: number; stockQty: number }[];
  topProducts: { name: string; qty: number }[];
}

export default function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shops/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>;
  if (!data) return <p className="text-sm text-center py-8" style={{ color: "var(--c-text-muted)" }}>বিশ্লেষণ লোড করা যায়নি</p>;

  const { summary, daily, byBranch, topProducts } = data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট Transfer", value: `${summary.totalTransferred} pcs`, color: "#3B82F6", icon: ArrowLeftRight },
          { label: "Transfer সংখ্যা", value: `${summary.transferCount}টি`, color: "#0F6E56", icon: History },
          { label: "Branch স্টক", value: `${summary.branchStockQty} pcs`, color: "#7C3AED", icon: GitBranch },
          { label: "মূল শপ স্টক", value: `${summary.mainStockQty} pcs`, color: "#F59E0B", icon: Package },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${color}18` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="text-lg font-black" style={{ color }}>{value}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--c-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <h3 className="text-sm font-black mb-4" style={{ color: "var(--c-text)" }}>দৈনিক Transfer (গত ১৪ দিন)</h3>
        <div className="min-h-[180px] min-w-0">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }} />
            <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: "#3B82F6" }} name="পরিমাণ" />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <h3 className="text-sm font-black mb-4" style={{ color: "var(--c-text)" }}>Branch-ভিত্তিক Transfer</h3>
          {byBranch.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--c-text-muted)" }}>কোনো Branch নেই</p>
          ) : (
            <div className="min-h-[160px] min-w-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byBranch}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }} />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Transfer pcs" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-5" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <h3 className="text-sm font-black mb-4" style={{ color: "var(--c-text)" }}>সর্বাধিক Transfer পণ্য</h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--c-text-muted)" }}>কোনো Transfer নেই</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0].qty;
                const pct = maxQty > 0 ? (p.qty / maxQty) * 100 : 0;
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-4" style={{ color: "var(--c-text-muted)" }}>#{i + 1}</span>
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>{p.name}</span>
                      </div>
                      <span className="text-xs font-black" style={{ color: "#0F6E56" }}>{p.qty} pcs</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-bg)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#0F6E56" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
