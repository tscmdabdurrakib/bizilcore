"use client";

import { ShoppingCart, Package, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { POStats } from "@/lib/purchase-orders/types";

export default function POStatsCards({ stats, loading }: { stats: POStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "মোট অর্ডার",
      value: `${stats?.totalCount ?? 0}টি`,
      icon: ShoppingCart,
      bg: "#ECFDF5",
      fg: "#059669",
    },
    {
      label: "মোট ব্যয় (received)",
      value: formatBDT(stats?.totalReceivedValue ?? 0),
      icon: Package,
      bg: "#ECFDF5",
      fg: "#059669",
    },
    {
      label: "অপেক্ষমাণ",
      value: `${(stats?.sentCount ?? 0) + (stats?.partiallyReceivedCount ?? 0)}টি — ${formatBDT(stats?.totalPendingValue ?? 0)}`,
      icon: Clock,
      bg: "#EFF6FF",
      fg: "#2563EB",
    },
    {
      label: "পণ্য পাওয়া গেছে",
      value: `${stats?.receivedCount ?? 0}টি`,
      icon: CheckCircle2,
      bg: "#ECFDF5",
      fg: "#059669",
    },
  ];

  return (
    <div className="space-y-3">
      {(stats?.overdueCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-100">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <span className="text-sm font-bold text-red-700">
            {stats!.overdueCount}টি PO ডেলিভারি বিলম্বিত
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
              style={{ backgroundColor: s.bg }}
            >
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <p className="text-xl font-black text-gray-900 truncate">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
