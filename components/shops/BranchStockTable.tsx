"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, AlertTriangle, Package } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useShops";
import type { BranchStockRow } from "@/lib/shops/types";

interface Props {
  branchId: string;
  branchName: string;
}

export default function BranchStockTable({ branchId, branchName }: Props) {
  const [stock, setStock] = useState<BranchStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    fetch(`/api/shops/${branchId}/stock?${params}`)
      .then(r => r.ok ? r.json() : { stock: [] })
      .then(d => setStock(d.stock ?? []))
      .finally(() => setLoading(false));
  }, [branchId, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black" style={{ color: "var(--c-text)" }}>{branchName} — স্টক তালিকা</p>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য খুঁজুন…"
            className="w-full h-8 pl-8 pr-3 rounded-xl border text-xs outline-none"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
          />
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
        ) : stock.length === 0 ? (
          <div className="py-10 text-center">
            <Package size={24} className="mx-auto mb-2" style={{ color: "var(--c-text-muted)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
              {search ? "কোনো পণ্য পাওয়া যায়নি" : "এই branch-এ এখনো স্টক নেই — Transfer করুন"}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-muted)" }}>
                <th className="text-left px-4 py-2 font-bold">পণ্য</th>
                <th className="text-left px-2 py-2 font-bold hidden sm:table-cell">SKU</th>
                <th className="text-right px-2 py-2 font-bold">পরিমাণ</th>
                <th className="text-right px-4 py-2 font-bold hidden sm:table-cell">মূল্য</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((row, i) => {
                const low = row.quantity <= row.lowStockAt;
                return (
                  <tr key={row.id} style={{ borderTop: "1px solid var(--c-border)", backgroundColor: i % 2 ? "var(--c-bg)" : "transparent" }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {low && <AlertTriangle size={11} style={{ color: "#EF4444" }} />}
                        <span className="font-semibold" style={{ color: "var(--c-text)" }}>{row.productName}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 hidden sm:table-cell font-mono" style={{ color: "var(--c-text-muted)" }}>{row.sku ?? "—"}</td>
                    <td className="px-2 py-2.5 text-right">
                      <span className="font-black" style={{ color: low ? "#DC2626" : "#0F6E56" }}>{row.quantity}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell" style={{ color: "var(--c-text-muted)" }}>
                      ৳{(row.quantity * row.sellPrice).toLocaleString("bn-BD")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
