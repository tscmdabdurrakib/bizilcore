"use client";

import dynamic from "next/dynamic";

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="rounded-xl animate-pulse w-full"
      style={{ height, backgroundColor: "var(--c-surface-raised)" }}
    />
  );
}

export const SalesBarChartLazy = dynamic(
  () => import("@/components/SalesBarChart"),
  { ssr: false, loading: () => <ChartSkeleton height={210} /> },
);

export const SalesTargetWaveLazy = dynamic(
  () => import("@/components/SalesTargetWave"),
  { ssr: false, loading: () => <ChartSkeleton height={130} /> },
);

export const AccountingSummaryWidgetLazy = dynamic(
  () => import("@/components/dashboard/AccountingSummaryWidget"),
  { ssr: false, loading: () => <ChartSkeleton height={280} /> },
);

export { ChartSkeleton };
