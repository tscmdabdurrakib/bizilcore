"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";

const BANGLA_DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

interface Props {
  data: { date: string; total: number }[];
  height?: number;
}

export default function SalesBarChart({ data, height = 200 }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = data.map((d) => ({
    day: BANGLA_DAYS[new Date(d.date + "T12:00:00").getDay()],
    total: Math.round(d.total),
  }));

  const maxVal = Math.max(...chartData.map((d) => d.total), 1);

  if (!mounted) return <div style={{ height }} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--c-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--c-text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            v === 0 ? "0" : v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`
          }
          domain={[0, Math.ceil(maxVal * 1.25)]}
        />
        <Tooltip
          formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "বিক্রি"]}
          contentStyle={{
            backgroundColor: "var(--chart-tooltip-bg)",
            border: "1px solid var(--chart-tooltip-border)",
            borderRadius: 10,
            fontSize: 12,
            color: "var(--c-text)",
          }}
          cursor={{ fill: "var(--c-primary-light)" }}
        />
        <Bar dataKey="total" radius={[7, 7, 0, 0]} fill="url(#barGrad)" maxBarSize={42} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="var(--chart-primary)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--c-surface)", stroke: "var(--chart-primary)", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "var(--chart-primary)" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
