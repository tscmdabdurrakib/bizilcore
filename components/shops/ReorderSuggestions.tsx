"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, ArrowLeftRight } from "lucide-react";
import type { ReorderSuggestion } from "@/lib/shops/advanced";

interface Props {
  branchId?: string;
  onTransfer?: (branchId: string) => void;
  compact?: boolean;
}

export default function ReorderSuggestions({ branchId, onTransfer, compact }: Props) {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = branchId ? `?branchId=${branchId}` : "";
    setLoading(true);
    fetch(`/api/shops/reorder-suggestions${q}`)
      .then(r => r.ok ? r.json() : { suggestions: [] })
      .then(d => setSuggestions(d.suggestions ?? []))
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-xs py-2" style={{ color: "var(--c-text-muted)" }}>
        <Loader2 size={14} className="animate-spin" /> reorder পরামর্শ লোড...
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "#FDE68A", backgroundColor: "#FFFBEB" }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Package size={compact ? 14 : 16} style={{ color: "#D97706" }} />
          <h3 className={`font-black ${compact ? "text-xs" : "text-sm"}`} style={{ color: "#92400E" }}>
            Auto Reorder ({suggestions.length})
          </h3>
        </div>
        {onTransfer && (
          <button onClick={() => onTransfer(suggestions[0].branchId)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
            <ArrowLeftRight size={10} /> Transfer
          </button>
        )}
      </div>
      <div className={`space-y-2 overflow-y-auto ${compact ? "max-h-52" : "max-h-48"}`}>
        {suggestions.slice(0, compact ? 5 : 8).map(s => (
          <div key={`${s.branchId}-${s.productId}`}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ backgroundColor: "rgba(255,255,255,0.8)", color: "#78350F" }}>
            <div className="min-w-0">
              <p className="font-bold truncate">{s.productName}</p>
              <p className="opacity-70 truncate">{s.branchName} · branch {s.branchQty}/{s.threshold}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-black">+{s.suggestedQty}</p>
              <p className="opacity-60">main: {s.mainQty}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
