"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const BANGLA_DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

interface Props {
  data: { date: string; total: number }[];
}

export default function SalesBarChart({ data }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];

  const chartData = data.map((d) => ({
    day: BANGLA_DAYS[new Date(d.date + "T12:00:00").getDay()],
    total: Math.round(d.total),
    isToday: d.date === todayStr,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
          tickFormatter={(v) => `৳${v}`}
        />
        <Tooltip
          formatter={(v) => [`৳${(Number(v) || 0).toLocaleString()}`, "বিক্রি"]}
          contentStyle={{
            border: "1px solid #E8E6DF",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isToday ? "#0F6E56" : "#E1F5EE"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
