"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import AdminCard from "./AdminCard";

const COLORS: Record<string, string> = {
  free: "#9CA3AF",
  pro: "#10B981",
  business: "#F59E0B",
};

interface Props {
  planCounts: { plan: string; _count: { _all: number } }[];
}

export default function SubscriptionDonut({ planCounts }: Props) {
  const data = planCounts.map((p) => ({
    name: p.plan.toUpperCase(),
    value: p._count._all,
    key: p.plan,
  }));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <AdminCard title="Subscription Breakdown" subtitle="Plan-wise user distribution">
      <div className="flex flex-col items-center gap-4 md:flex-row">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={COLORS[entry.key] ?? "#6B7280"} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, "Users"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[d.key] ?? "#6B7280" }} />
              <span className="text-sm font-medium text-gray-700">{d.name}</span>
              <span className="text-sm font-bold text-gray-900">{d.value}</span>
              <span className="text-xs text-gray-400">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </AdminCard>
  );
}
