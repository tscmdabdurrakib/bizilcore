"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; total: number }[];
}

export default function SalesTargetWave({ data }: Props) {
  const chartData = data.length
    ? data.map((d) => ({ v: Math.round(d.total) }))
    : Array.from({ length: 10 }, (_, i) => ({ v: i * 10 }));

  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="targetWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1BAA78" stopOpacity={0.45} />
              <stop offset="60%" stopColor="#A8DFD0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#E0F5EE" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#13A67E"
            strokeWidth={2.5}
            fill="url(#targetWaveGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
