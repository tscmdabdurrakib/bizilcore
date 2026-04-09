"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; total: number }[];
}

export default function SalesTargetWave({ data }: Props) {
  const chartData = data.map((d) => ({ v: Math.round(d.total) }));

  return (
    <div className="absolute bottom-0 left-0 right-0" style={{ height: 80, opacity: 0.35 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="targetWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F6E56" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#0F6E56" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotoneX"
            dataKey="v"
            stroke="#0F6E56"
            strokeWidth={2}
            fill="url(#targetWaveGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
