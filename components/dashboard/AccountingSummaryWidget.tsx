"use client";

import { useDashboardFetch } from "@/hooks/useDashboardFetch";
import Link from "next/link";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import { formatBDT } from "@/lib/utils";
import { T } from "@/lib/theme";
import { TrendingUp, Landmark, BookOpen } from "lucide-react";

const BarChartInner = dynamic(
  () => import("@/components/dashboard/AccountingSummaryChart"),
  { ssr: false, loading: () => <div className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: "var(--c-surface-raised)" }} /> },
);

type SummaryData = {
  todayRevenue: number;
  monthRevenue: number;
  monthProfit: number;
  cashBalance: number;
  chart: Array<{ day: string; revenue: number }>;
};

export default function AccountingSummaryWidget() {
  const { data: metrics } = useDashboardFetch<SummaryData>(
    "/api/accounting/dashboard-summary",
  );

  const m = metrics ?? {
    todayRevenue: 0,
    monthRevenue: 0,
    monthProfit: 0,
    cashBalance: 0,
    chart: [],
  };

  const cards = [
    { label: "আজকের আয়", value: m.todayRevenue, icon: TrendingUp, color: T.success.text },
    { label: "মাসের আয়", value: m.monthRevenue, icon: BookOpen, color: T.purple.text },
    { label: "মাসের লাভ", value: m.monthProfit, icon: TrendingUp, color: m.monthProfit >= 0 ? T.success.text : T.danger.text },
    { label: "নগদ ও ব্যাংক", value: m.cashBalance, icon: Landmark, color: T.info.text },
  ];

  return (
    <Card className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm font-display">হিসাব</p>
        <Link href="/accounting" className="text-xs font-semibold" style={{ color: "var(--c-primary)" }}>বিস্তারিত →</Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl p-3 card-stat">
            <c.icon size={14} style={{ color: c.color }} />
            <p className="text-base font-black mt-1 font-display" style={{ color: c.color }}>{formatBDT(c.value)}</p>
            <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{c.label}</p>
          </div>
        ))}
      </div>
      <BarChartInner data={m.chart} />
    </Card>
  );
}
