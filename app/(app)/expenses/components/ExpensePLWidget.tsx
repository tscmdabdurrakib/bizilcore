"use client";

import Link from "next/link";
import { Scale, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { ExpenseStats } from "@/lib/expenses/types";

export default function ExpensePLWidget({ stats }: { stats: ExpenseStats | null }) {
  if (!stats) return null;
  const { monthIncome, thisMonthTotal, monthProfit } = stats;
  if (monthIncome === 0 && thisMonthTotal === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-50">
            <Scale size={15} className="text-green-700" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">মাসিক আয় vs খরচ</h3>
        </div>
        <Link href="/reports" className="text-xs font-semibold text-green-700">রিপোর্ট →</Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-2.5 bg-green-50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase text-green-700">আয়</p>
            <ArrowUpRight size={12} className="text-green-600" />
          </div>
          <p className="text-sm font-bold text-green-700 mt-1">{formatBDT(monthIncome)}</p>
        </div>
        <div className="rounded-xl p-2.5 bg-red-50">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase text-red-700">খরচ</p>
            <ArrowDownRight size={12} className="text-red-500" />
          </div>
          <p className="text-sm font-bold text-red-600 mt-1">{formatBDT(thisMonthTotal)}</p>
        </div>
        <div className="rounded-xl p-2.5 bg-gray-50">
          <p className="text-[10px] font-semibold uppercase text-gray-500">লাভ</p>
          <p className={`text-sm font-bold mt-1 ${monthProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
            {formatBDT(monthProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
