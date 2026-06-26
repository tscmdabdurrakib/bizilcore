"use client";

import { FileText, Check, Clock, BadgeDollarSign } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { InvoiceStats } from "@/lib/invoices/types";

export default function InvoiceStatsCards({
  stats,
  loading,
}: {
  stats: InvoiceStats | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
          ))}
      </div>
    );
  }

  const cards = [
    {
      label: "মোট ইনভয়েস",
      value: `${stats?.totalCount ?? 0}টি`,
      icon: FileText,
      bg: "#ECFDF5",
      fg: "#059669",
    },
    {
      label: "পরিশোধিত",
      value: formatBDT(stats?.totalPaid ?? 0),
      icon: Check,
      bg: "#ECFDF5",
      fg: "#059669",
    },
    {
      label: "পাওনা",
      value: formatBDT(stats?.totalPending ?? 0),
      icon: Clock,
      bg: "#EFF6FF",
      fg: "#2563EB",
    },
    {
      label: "বকেয়া",
      value: formatBDT(stats?.totalOverdue ?? 0),
      icon: BadgeDollarSign,
      bg: (stats?.totalOverdue ?? 0) > 0 ? "#FEF2F2" : "#F3F4F6",
      fg: (stats?.totalOverdue ?? 0) > 0 ? "#DC2626" : "#9CA3AF",
    },
  ];

  return (
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
          <p className="text-2xl font-black text-gray-900 truncate">{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
