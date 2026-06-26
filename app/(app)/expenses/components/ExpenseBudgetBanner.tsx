"use client";

import { AlertTriangle } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { getExpenseCategory } from "@/lib/expenses/categories";
import type { ExpenseStats } from "@/lib/expenses/types";

export default function ExpenseBudgetBanner({ stats }: { stats: ExpenseStats | null }) {
  const alerts = stats?.budgetAlerts ?? [];
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(a => {
        const cat = getExpenseCategory(a.category);
        const over = a.pct >= 100;
        return (
          <div
            key={a.category}
            className="flex items-start gap-3 p-3 rounded-2xl border"
            style={{
              backgroundColor: over ? "#FEF2F2" : "#FFFBEB",
              borderColor: over ? "#FECACA" : "#FDE68A",
            }}
          >
            <AlertTriangle size={16} className={over ? "text-red-500" : "text-amber-500"} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">
                {cat.label} — বাজেটের {a.pct}% ব্যবহার
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatBDT(a.spent)} / {formatBDT(a.budget)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
