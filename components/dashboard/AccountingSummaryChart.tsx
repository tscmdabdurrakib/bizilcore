"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatBDT } from "@/lib/utils";

type Props = {
  data: Array<{ day: string; revenue: number }>;
};

export default function AccountingSummaryChart({ data }: Props) {
  return (
    <div className="h-20 min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data}>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--c-text-muted)" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => formatBDT(Number(v))}
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Bar dataKey="revenue" fill="var(--chart-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
