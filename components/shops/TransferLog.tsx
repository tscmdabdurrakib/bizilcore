"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Download, History, ArrowLeftRight, Loader2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useShops";
import type { TransferRecord } from "@/lib/shops/types";

interface Props {
  branchId?: string | null;
}

export default function TransferLog({ branchId }: Props) {
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [days, setDays] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (days > 0) params.set("days", String(days));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (branchId) params.set("branchId", branchId);
    fetch(`/api/shops/transfers?${params}`)
      .then(r => r.ok ? r.json() : { transfers: [] })
      .then(d => setHistory(d.transfers ?? []))
      .finally(() => setLoading(false));
  }, [days, debouncedSearch, branchId]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const header = "তারিখ,পণ্য,Branch,পরিমাণ,দিক,নোট\n";
    const rows = history.map(r =>
      `"${new Date(r.createdAt).toLocaleDateString("bn-BD")}","${r.productName}","${r.branchName}",${r.quantity},"${r.direction ?? ""}","${r.note ?? ""}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = branchId ? `transfer-${branchId}.csv` : "transfer-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য বা Branch খুঁজুন…"
            className="w-full h-9 pl-9 pr-3 rounded-xl border text-xs outline-none"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ label: "সব", v: 0 }, { label: "আজ", v: 1 }, { label: "৭ দিন", v: 7 }, { label: "৩০ দিন", v: 30 }].map(({ label, v }) => (
            <button key={v} onClick={() => setDays(v)}
              className="px-3 h-9 rounded-xl text-xs font-semibold border transition-all"
              style={{
                borderColor: days === v ? "#3B82F6" : "var(--c-border)",
                backgroundColor: days === v ? "#3B82F6" : "var(--c-surface)",
                color: days === v ? "white" : "var(--c-text-sub)",
              }}
            >{label}</button>
          ))}
          <button onClick={exportCSV} title="CSV Export"
            className="h-9 w-9 rounded-xl border flex items-center justify-center"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text-muted)" }}>
            <Download size={14} />
          </button>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
        {loading ? "লোড হচ্ছে…" : `${history.length}টি Transfer রেকর্ড`}
      </p>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <History size={28} className="mx-auto mb-2" style={{ color: "var(--c-text-muted)", opacity: 0.3 }} />
            <p className="text-sm font-medium" style={{ color: "var(--c-text-muted)" }}>
              {search ? `"${search}" — কোনো ফলাফল নেই` : "কোনো Transfer ইতিহাস নেই"}
            </p>
          </div>
        ) : history.map((rec, i) => (
          <div key={rec.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0"
            style={{ borderColor: "var(--c-border)", backgroundColor: i % 2 === 0 ? "transparent" : "var(--c-bg)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#EFF6FF" }}>
              <ArrowLeftRight size={13} style={{ color: "#3B82F6" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{rec.productName}</p>
                {rec.productSku && <span className="text-[10px] px-1.5 rounded font-mono" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-muted)" }}>{rec.productSku}</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                  {rec.direction === "branch_to_main" ? "← " : "→ "}{rec.branchName}
                </span>
                {rec.note && <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>— {rec.note}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-sm font-black" style={{ color: "#3B82F6" }}>{rec.quantity} pcs</span>
              <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                {new Date(rec.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
                {" "}{new Date(rec.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
