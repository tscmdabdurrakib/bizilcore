"use client";

import { Plus, ArrowLeftRight, Building2, GitBranch, Package, TrendingUp, Store } from "lucide-react";
import type { OrgOverview } from "@/lib/shops/advanced";
import LowStockAlerts from "./LowStockAlerts";
import ReorderSuggestions from "./ReorderSuggestions";
import { Card, Button, Badge, SectionTitle } from "@/components/ui";

interface Props {
  overview: OrgOverview | null;
  overviewLoading: boolean;
  canAdd: boolean;
  hasBranches: boolean;
  onCreate: () => void;
  onTransfer: () => void;
  onBranchClick: (branchId: string) => void;
  onReorderTransfer: (branchId: string) => void;
}

function OrgOverviewMini({ overview }: { overview: OrgOverview }) {
  const { org, inventory } = overview;
  const stats = [
    { label: "মোট স্টক মূল্য", value: `৳${inventory.combinedValue.toLocaleString("bn-BD")}`, icon: TrendingUp, accent: "green" as const },
    { label: "মূল শপ স্টক", value: `${inventory.mainStockQty} pcs`, icon: Store, accent: "blue" as const },
    { label: "Branch স্টক", value: `${inventory.branchStockQty} pcs`, icon: GitBranch, accent: "purple" as const },
    { label: "Child Shops", value: `${org.childShopCount}টি`, icon: Package, accent: "gold" as const },
  ];

  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--c-border)" }}>
        <Building2 size={15} style={{ color: "var(--c-primary)" }} />
        <SectionTitle title="Organization" className="mb-0 flex-1" />
        <Badge variant="purple" className="ml-auto">{org.totalLocations} লোকেশন</Badge>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="p-2.5 rounded-xl card-premium border">
            <Icon size={13} style={{ color: "var(--c-primary)" }} className="mb-1" />
            <p className="text-xs font-bold truncate" style={{ color: "var(--c-text)" }}>{value}</p>
            <p className="text-[10px] font-medium truncate" style={{ color: "var(--c-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ShopsSidebar({
  overview,
  overviewLoading,
  canAdd,
  hasBranches,
  onCreate,
  onTransfer,
  onBranchClick,
  onReorderTransfer,
}: Props) {
  return (
    <aside className="space-y-4">
      <Card>
        <SectionTitle title="Quick Actions" className="mb-0" />
        <div className="flex flex-col gap-2 mt-3">
          {canAdd && (
            <Button icon={Plus} onClick={onCreate} className="w-full">
              নতুন Branch
            </Button>
          )}
          {hasBranches && (
            <Button variant="outline" icon={ArrowLeftRight} onClick={onTransfer} className="w-full">
              Stock Transfer
            </Button>
          )}
        </div>
      </Card>

      <LowStockAlerts compact alerts={overview?.lowStockAlerts} loading={overviewLoading} onBranchClick={onBranchClick} />
      <ReorderSuggestions compact onTransfer={onReorderTransfer} />

      {!overviewLoading && overview && <OrgOverviewMini overview={overview} />}
    </aside>
  );
}
