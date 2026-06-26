"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import type { LowStockAlert } from "@/lib/shops/advanced";

interface Props {
  alerts?: LowStockAlert[];
  loading?: boolean;
  onBranchClick?: (branchId: string) => void;
  compact?: boolean;
}

export default function LowStockAlerts({ alerts: alertsProp, loading: loadingProp, onBranchClick, compact }: Props) {
  const [alerts, setAlerts] = useState<LowStockAlert[]>(alertsProp ?? []);
  const [loading, setLoading] = useState(loadingProp ?? alertsProp === undefined);

  useEffect(() => {
    if (alertsProp !== undefined) {
      setAlerts(alertsProp);
      setLoading(loadingProp ?? false);
      return;
    }
    fetch("/api/shops/overview")
      .then(r => r.ok ? r.json() : { lowStockAlerts: [] })
      .then(d => setAlerts(d.lowStockAlerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [alertsProp, loadingProp]);

  if (loading) return null;
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={compact ? 14 : 16} style={{ color: "#DC2626" }} />
        <h3 className={`font-black ${compact ? "text-xs" : "text-sm"}`} style={{ color: "#991B1B" }}>
          কম স্টক ({alerts.length})
        </h3>
      </div>
      <div className={`space-y-2 overflow-y-auto ${compact ? "max-h-52" : "max-h-40"}`}>
        {alerts.map((a) => (
          <button
            key={`${a.branchId ?? "main"}-${a.productName}`}
            onClick={() => a.branchId && onBranchClick?.(a.branchId)}
            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,0.7)", color: "#7F1D1D" }}
          >
            <span>
              <strong>{a.productName}</strong>
              <span className="opacity-70"> — {a.branchName}</span>
            </span>
            <span className="font-black">{a.quantity}/{a.threshold}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
