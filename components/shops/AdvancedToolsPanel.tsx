"use client";

import { useState } from "react";
import { Rocket, RefreshCw, Loader2, Sparkles } from "lucide-react";
import type { Branch, ToastType } from "@/lib/shops/types";

interface Props {
  branches: Branch[];
  onRefresh: () => void;
  onCreateChild: () => void;
  showToast: (type: ToastType, msg: string) => void;
}

export default function AdvancedToolsPanel({ branches, onRefresh, onCreateChild, showToast }: Props) {
  const [migrating, setMigrating] = useState<string | "all" | null>(null);

  const unmigrated = branches.filter(b => !b.linkedShopId);

  async function migrate(branchId?: string) {
    setMigrating(branchId ?? "all");
    const res = await fetch("/api/shops/migrate-branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branchId ? { branchId } : {}),
    });
    const d = await res.json();
    setMigrating(null);
    if (!res.ok) { showToast("error", d.error ?? "Migration ব্যর্থ"); return; }
    showToast("success", `${d.migrated}টি branch full shop-এ রূপান্তর ✓`);
    onRefresh();
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
      <div className="flex items-center gap-2">
        <Sparkles size={15} style={{ color: "#F59E0B" }} />
        <h3 className="text-sm font-black" style={{ color: "var(--c-text)" }}>Advanced Tools</h3>
      </div>
      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
        Branch-কে full shop-এ upgrade করলে আলাদা inventory, Facebook ও settings পাবেন। ShopSwitcher দিয়ে switch করুন।
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={onCreateChild}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
          <Rocket size={13} /> নতুন Full Shop
        </button>
        {unmigrated.length > 0 && (
          <button onClick={() => migrate()} disabled={!!migrating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border disabled:opacity-50"
            style={{ borderColor: "#7C3AED", color: "#7C3AED", backgroundColor: "#EDE9FE" }}>
            {migrating === "all" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            সব Branch Migrate ({unmigrated.length})
          </button>
        )}
      </div>
      {unmigrated.length > 0 && (
        <div className="space-y-1.5">
          {unmigrated.map(b => (
            <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
              style={{ backgroundColor: "var(--c-bg)" }}>
              <span className="font-semibold" style={{ color: "var(--c-text)" }}>{b.name}</span>
              <button onClick={() => migrate(b.id)} disabled={!!migrating}
                className="text-[10px] font-bold px-2 py-1 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                {migrating === b.id ? "..." : "→ Full Shop"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
