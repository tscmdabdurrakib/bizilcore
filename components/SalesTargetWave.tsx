"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; total: number }[];
}

export default function SalesTargetWave({ data }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = data.length
    ? data.map((d) => ({ v: Math.round(d.total) }))
    : Array.from({ length: 10 }, (_, i) => ({ v: i * 10 }));

  if (!mounted) return null;

  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="targetWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity={0.35} />
              <stop offset="60%" stopColor="var(--chart-primary)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--chart-primary)"
            strokeWidth={2}
            strokeOpacity={0.5}
            fill="url(#targetWaveGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
