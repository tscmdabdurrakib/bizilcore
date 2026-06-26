"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatBDT } from "@/lib/utils";
import type { ExpenseStats } from "@/lib/expenses/types";

export default function ExpenseTrendChart({ stats }: { stats: ExpenseStats | null }) {
  const data = stats?.monthlyTrend ?? [];
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h3 className="text-sm font-bold text-gray-700 mb-3">মাসিক খরচের ট্রেন্ড</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
          <Tooltip
            formatter={((v: number) => [formatBDT(v), "খরচ"]) as never}
            contentStyle={{ borderRadius: 12, border: "1px solid #F3F4F6", fontSize: 12 }}
          />
          <Bar dataKey="total" name="খরচ" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
