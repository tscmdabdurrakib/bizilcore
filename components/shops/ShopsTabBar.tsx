"use client";

import { Store, History, BarChart2, Sparkles } from "lucide-react";
import type { ShopsTab } from "@/lib/shops/types";
import { Tabs } from "@/components/ui";

interface Props {
  activeTab: ShopsTab;
  onTabChange: (tab: ShopsTab) => void;
  branchCount: number;
  transferCount: number;
}

export default function ShopsTabBar({ activeTab, onTabChange, branchCount, transferCount }: Props) {
  const tabs = [
    { key: "shops", label: "শাখা তালিকা", icon: Store, count: branchCount },
    { key: "log", label: "Transfer লগ", icon: History, count: transferCount > 0 ? transferCount : undefined },
    { key: "analytics", label: "বিশ্লেষণ", icon: BarChart2 },
    { key: "advanced", label: "Advanced", icon: Sparkles },
  ];

  return (
    <Tabs
      tabs={tabs}
      active={activeTab}
      onChange={(key) => onTabChange(key as ShopsTab)}
      variant="underline"
    />
  );
}
