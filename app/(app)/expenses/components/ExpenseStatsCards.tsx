"use client";

import { TrendingDown, CalendarRange, BarChart3, Tag, ArrowUp, ArrowDown } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { getExpenseCategory } from "@/lib/expenses/categories";
import type { ExpenseStats } from "@/lib/expenses/types";

export default function ExpenseStatsCards({
  stats,
  loading,
}: {
  stats: ExpenseStats | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const topCat = stats?.topCategory ? getExpenseCategory(stats.topCategory) : null;
  const change = stats?.monthChangePct ?? null;
  const changeLabel = change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`;

  const cards = [
    {
      label: "এই মাসে খরচ",
      value: formatBDT(stats?.thisMonthTotal ?? 0),
      sub: change !== null ? `গত মাস: ${changeLabel}` : undefined,
      icon: CalendarRange,
      bg: "#FFF7ED",
      fg: "#C2410C",
    },
    {
      label: "ফিল্টার মোট",
      value: formatBDT(stats?.filteredTotal ?? 0),
      sub: `${stats?.filteredCount ?? 0}টি এন্ট্রি`,
      icon: TrendingDown,
      bg: "#FEF2F2",
      fg: "#DC2626",
    },
    {
      label: "সর্বোচ্চ ক্যাটাগরি",
      value: topCat ? formatBDT(stats?.topCategoryAmount ?? 0) : "—",
      sub: topCat?.label,
      icon: BarChart3,
      bg: topCat?.bg ?? "#F9FAFB",
      fg: topCat?.color ?? "#6B7280",
    },
    {
      label: "মাসিক লাভ (আয় − খরচ)",
      value: formatBDT(stats?.monthProfit ?? 0),
      sub: `আয়: ${formatBDT(stats?.monthIncome ?? 0)}`,
      icon: Tag,
      bg: (stats?.monthProfit ?? 0) >= 0 ? "#F0FDF4" : "#FEF2F2",
      fg: (stats?.monthProfit ?? 0) >= 0 ? "#15803D" : "#DC2626",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(s => (
        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            {s.label === "এই মাসে খরচ" && change !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-bold ${change > 0 ? "text-red-500" : "text-green-600"}`}>
                {change > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {changeLabel}
              </span>
            )}
          </div>
          <p className="text-xl font-black text-gray-900 truncate">{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.sub ?? s.label}</p>
        </div>
      ))}
    </div>
  );
}
