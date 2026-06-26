"use client";

import Link from "next/link";
import { Store, Plus, ArrowLeftRight, RefreshCw, GitBranch, Package, TrendingUp } from "lucide-react";
import { ProgressBar } from "./ui";
import type { ShopData } from "@/lib/shops/types";
import type { OrgOverview } from "@/lib/shops/advanced";

interface Props {
  data: ShopData;
  overview: OrgOverview | null;
  canAdd: boolean;
  hasBranches: boolean;
  activeBranchCount: number;
  onRefresh: () => void;
  onCreate: () => void;
  onTransfer: () => void;
}

export default function ShopsHeader({
  data,
  overview,
  canAdd,
  hasBranches,
  activeBranchCount,
  onRefresh,
  onCreate,
  onTransfer,
}: Props) {
  const miniStats = [
    {
      label: "মোট স্টক মূল্য",
      value: overview ? `৳${overview.inventory.combinedValue.toLocaleString("bn-BD")}` : "—",
      icon: TrendingUp,
    },
    {
      label: "সক্রিয় Branch",
      value: `${activeBranchCount}/${data.branches.length}`,
      icon: GitBranch,
    },
    {
      label: "মোট পণ্য",
      value: String(data.productCount),
      icon: Package,
    },
    {
      label: "Transfer",
      value: String(data.transferCount),
      icon: ArrowLeftRight,
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: "linear-gradient(135deg,#0F6E56 0%,#10B981 50%,#3B82F6 100%)" }}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <Store size={22} color="white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">শাখা ব্যবস্থাপনা</h1>
              <p className="text-sm text-white/80">
                {data.mainShop.name} · {data.totalShops}/{data.maxShops} লোকেশন
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasBranches && (
              <button
                onClick={onTransfer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
              >
                <ArrowLeftRight size={14} />
                <span>Transfer</span>
              </button>
            )}
            {canAdd && (
              <button
                onClick={onCreate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#0F6E56" }}
              >
                <Plus size={14} /> নতুন Branch
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {miniStats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Icon size={14} color="white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{value}</p>
                <p className="text-[10px] text-white/70 truncate">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <ProgressBar value={data.totalShops} max={data.maxShops} />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-white/70">
              {data.totalShops}টি ব্যবহৃত · {data.maxShops - data.totalShops}টি বাকি
            </p>
            {!canAdd && (
              <Link href="/settings?tab=subscription" className="text-xs font-bold text-white underline">
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
