"use client";

import dynamic from "next/dynamic";

function ChartPlaceholder({ height = 280 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-xl animate-pulse"
      style={{ height, backgroundColor: "var(--c-surface-raised)" }}
    />
  );
}

export const LazyLineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

export const LazyAreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false, loading: () => <ChartPlaceholder /> },
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((m) => m.PieChart),
  { ssr: false, loading: () => <ChartPlaceholder height={240} /> },
);

export {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Pie, Cell, Legend, Bar, Area,
} from "recharts";
