"use client";

import { useEffect, useState } from "react";
import { Loader2, GitBranch, CheckCircle2, XCircle } from "lucide-react";
import type { BranchOverviewRow } from "@/lib/shops/advanced";

interface Props {
  branches?: BranchOverviewRow[];
  loading?: boolean;
}

export default function BranchComparisonTable({ branches: branchesProp, loading: loadingProp }: Props) {
  const [rows, setRows] = useState<BranchOverviewRow[]>(branchesProp ?? []);
  const [loading, setLoading] = useState(loadingProp ?? !branchesProp);

  useEffect(() => {
    if (branchesProp !== undefined) {
      setRows(branchesProp);
      setLoading(loadingProp ?? false);
      return;
    }
    fetch("/api/shops/overview")
      .then(r => r.ok ? r.json() : { branches: [] })
      .then(d => setRows(d.branches ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [branchesProp, loadingProp]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>;
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>শাখা তুলনার জন্য পর্যাপ্ত ডেটা নেই</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--c-border)" }}>
        <GitBranch size={15} style={{ color: "#7C3AED" }} />
        <h3 className="text-sm font-black" style={{ color: "var(--c-text)" }}>শাখা তুলনা</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-muted)" }}>
              <th className="text-left px-4 py-2 font-bold">শাখা</th>
              <th className="text-right px-2 py-2 font-bold">স্টক pcs</th>
              <th className="text-right px-2 py-2 font-bold">মূল্য</th>
              <th className="text-right px-2 py-2 font-bold">পণ্য</th>
              <th className="text-right px-2 py-2 font-bold">৭ দিন Transfer</th>
              <th className="text-right px-2 py-2 font-bold">৭ দিন বিক্রি</th>
              <th className="text-right px-2 py-2 font-bold">রাজস্ব</th>
              <th className="text-center px-2 py-2 font-bold">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                <td className="px-4 py-2.5 font-bold" style={{ color: "var(--c-text)" }}>{b.name}</td>
                <td className="text-right px-2 py-2.5">{b.totalQty}</td>
                <td className="text-right px-2 py-2.5">৳{b.totalValue.toLocaleString("bn-BD")}</td>
                <td className="text-right px-2 py-2.5">{b.productCount}</td>
                <td className="text-right px-2 py-2.5">{b.transfers7d}</td>
                <td className="text-right px-2 py-2.5">{b.sales7d}</td>
                <td className="text-right px-2 py-2.5 font-bold" style={{ color: "var(--c-primary)" }}>৳{b.revenue7d.toLocaleString("bn-BD")}</td>
                <td className="text-center px-2 py-2.5">
                  {b.isActive
                    ? <CheckCircle2 size={14} className="inline" style={{ color: "#059669" }} />
                    : <XCircle size={14} className="inline" style={{ color: "#9CA3AF" }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
