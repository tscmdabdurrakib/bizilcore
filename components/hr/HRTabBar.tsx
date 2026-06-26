"use client";

import type { HRTab } from "@/lib/hr/types";
import { Tabs } from "@/components/ui";

interface Props {
  activeTab: HRTab;
  onTabChange: (tab: HRTab) => void;
  isSalon: boolean;
}

const TABS: { key: HRTab; label: string; show?: (isSalon: boolean) => boolean }[] = [
  { key: "team", label: "টিম" },
  { key: "attendance", label: "উপস্থিতি" },
  { key: "shifts", label: "শিফট" },
  { key: "leave", label: "ছুটি" },
  { key: "payroll", label: "বেতন" },
  { key: "reports", label: "রিপোর্ট" },
  { key: "commission", label: "কমিশন", show: (s) => s },
];

export default function HRTabBar({ activeTab, onTabChange, isSalon }: Props) {
  const visible = TABS.filter((t) => !t.show || t.show(isSalon));

  return (
    <Tabs
      tabs={visible.map((t) => ({ key: t.key, label: t.label }))}
      active={activeTab}
      onChange={(key) => onTabChange(key as HRTab)}
    />
  );
}
