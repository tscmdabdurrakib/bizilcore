"use client";

import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { getExpenseCategory } from "@/lib/expenses/categories";
import type { ExpenseStats } from "@/lib/expenses/types";

export default function ExpenseCategoryChart({
  stats,
  showBreakdown,
  onToggle,
}: {
  stats: ExpenseStats | null;
  showBreakdown: boolean;
  onToggle: () => void;
}) {
  const breakdown = (stats?.categoryBreakdown ?? [])
    .map(c => ({ ...getExpenseCategory(c.category), total: c.total }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxBreakdown = Math.max(...breakdown.map(c => c.total), 1);

  return (
    <div className="px-4 py-3 border-b border-gray-50">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
      >
        <BarChart3 size={13} /> ক্যাটাগরি বিশ্লেষণ
        {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {showBreakdown && breakdown.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {breakdown.map(cat => {
            const pct = Math.round((cat.total / maxBreakdown) * 100);
            const Icon = cat.icon;
            return (
              <div key={cat.value} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg }}>
                  <Icon size={13} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate">{cat.label}</span>
                    <span className="text-xs font-black ml-2 flex-shrink-0" style={{ color: cat.color }}>
                      {formatBDT(cat.total)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-semibold flex-shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
