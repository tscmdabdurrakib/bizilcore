"use client";

import { Users, ShieldCheck, Check, TrendingUp } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { MONTH_NAMES } from "@/lib/hr/types";
import { StatCard } from "@/components/ui";

interface Props {
  staffCount: number;
  activeCount: number;
  pendingCount: number;
  presentCount: number;
  totalSalary: number;
  month: number;
}

export default function HRHeader({ staffCount, activeCount, pendingCount, presentCount, totalSalary, month }: Props) {
  return (
    <>
      <StatCard label="মোট কর্মী" value={staffCount} icon={Users} accent="green" />
      <StatCard
        label="সক্রিয় কর্মী"
        value={activeCount}
        icon={ShieldCheck}
        accent="green"
        trend={pendingCount > 0 ? { value: `${pendingCount} pending`, up: true } : undefined}
      />
      <StatCard
        label={`উপস্থিত (${MONTH_NAMES[month - 1]})`}
        value={presentCount}
        icon={Check}
        accent="blue"
        iconBg="var(--icon-blue-bg)"
        iconColor="var(--bg-info-text)"
      />
      <StatCard
        label="মোট বেতন বিল"
        value={formatBDT(totalSalary)}
        icon={TrendingUp}
        accent="gold"
        iconBg="var(--icon-amber-bg)"
        iconColor="var(--accent-warm)"
      />
    </>
  );
}
