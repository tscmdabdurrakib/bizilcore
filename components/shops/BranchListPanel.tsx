"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, GitBranch, Plus, AlertTriangle } from "lucide-react";
import BranchCard from "./BranchCard";
import type { Branch, MainShop, ShopData } from "@/lib/shops/types";
import { S } from "@/lib/theme";

type StatusFilter = "all" | "active" | "inactive";

interface Props {
  data: ShopData;
  canAdd: boolean;
  hasBranches: boolean;
  onCreate: () => void;
  onEdit: (branch: Branch) => void;
  onDelete: (branchId: string) => void;
  onTransfer: (branchId: string) => void;
  onViewStock: (branch: Branch) => void;
  onToggleActive: (branch: Branch) => void;
  togglingActive: string | null;
  deleting: string | null;
}

export default function BranchListPanel({
  data,
  canAdd,
  hasBranches,
  onCreate,
  onEdit,
  onDelete,
  onTransfer,
  onViewStock,
  onToggleActive,
  togglingActive,
  deleting,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.branches.filter(b => {
      if (statusFilter === "active" && b.isActive === false) return false;
      if (statusFilter === "inactive" && b.isActive !== false) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.phone ?? "").includes(q) ||
        (b.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [data.branches, search, statusFilter]);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "সব" },
    { key: "active", label: "সক্রিয়" },
    { key: "inactive", label: "নিষ্ক্রিয়" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Branch নাম, ফোন বা ঠিকানা খুঁজুন…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border text-sm outline-none transition-colors"
            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
            onFocus={e => (e.currentTarget.style.borderColor = S.primary)}
            onBlur={e => (e.currentTarget.style.borderColor = S.border)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="px-3 h-10 rounded-xl text-xs font-semibold border transition-all"
              style={{
                borderColor: statusFilter === f.key ? S.primary : S.border,
                backgroundColor: statusFilter === f.key ? "var(--c-primary-light)" : S.surface,
                color: statusFilter === f.key ? S.primary : S.secondary,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {data.mainShop && (
        <BranchCard shop={data.mainShop as MainShop} isMain />
      )}

      {!hasBranches ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: S.border, backgroundColor: S.surface }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" }}
          >
            <GitBranch size={28} style={{ color: "#7C3AED" }} />
          </div>
          <p className="font-black text-base mb-1" style={{ color: S.text }}>কোনো Branch নেই</p>
          <p className="text-sm mb-5 max-w-sm mx-auto" style={{ color: S.muted }}>
            প্রথম Branch তৈরি করে মূল শপ থেকে স্টক পাঠান
          </p>
          {canAdd && (
            <button
              onClick={onCreate}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
            >
              <Plus size={16} /> প্রথম Branch তৈরি করুন
            </button>
          )}
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <p className="text-sm font-semibold" style={{ color: S.text }}>কোনো Branch পাওয়া যায়নি</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>অন্য সার্চ বা ফিল্টার চেষ্টা করুন</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredBranches.map(branch => (
            <BranchCard
              key={branch.id}
              shop={branch}
              isMain={false}
              onEdit={() => onEdit(branch)}
              onDelete={() => onDelete(branch.id)}
              onTransfer={() => onTransfer(branch.id)}
              onViewStock={() => onViewStock(branch)}
              onToggleActive={() => onToggleActive(branch)}
              togglingActive={togglingActive === branch.id}
              deleting={deleting === branch.id}
            />
          ))}
        </div>
      )}

      {!canAdd && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <AlertTriangle size={15} style={{ color: "#D97706", flexShrink: 0 }} />
          <p className="text-xs" style={{ color: "#92400E" }}>
            Limit পূর্ণ — <Link href="/settings?tab=subscription" className="underline font-bold">Upgrade করুন</Link>
          </p>
        </div>
      )}
    </div>
  );
}
