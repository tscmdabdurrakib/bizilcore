"use client";

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
  const chartData = data.map((d) => ({
    day: BANGLA_DAYS[new Date(d.date + "T12:00:00").getDay()],
    total: Math.round(d.total),
  }));

  const maxVal = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F6E56" stopOpacity={1} />
            <stop offset="100%" stopColor="#A8DFD0" stopOpacity={0.65} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#A8A69E" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#A8A69E" }}
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
            border: "1px solid #E8E6DF",
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          cursor={{ fill: "rgba(15,110,86,0.05)" }}
        />
        <Bar dataKey="total" radius={[7, 7, 0, 0]} fill="url(#barGrad)" maxBarSize={42} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#0F6E56"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#fff", stroke: "#0F6E56", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#0F6E56" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
