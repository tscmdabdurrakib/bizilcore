"use client";

import { X, ArrowLeftRight } from "lucide-react";
import type { Branch } from "@/lib/shops/types";
import BranchStockTable from "./BranchStockTable";
import TransferLog from "./TransferLog";
import BranchSalesPanel from "./BranchSalesPanel";
import ReorderSuggestions from "./ReorderSuggestions";

interface Props {
  branch: Branch;
  onClose: () => void;
  onTransfer: () => void;
}

export default function BranchDetailDrawer({ branch, onClose, onTransfer }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full overflow-y-auto shadow-2xl"
        style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black overflow-hidden"
              style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
              {branch.logoUrl ? <img src={branch.logoUrl} alt="" className="w-full h-full object-cover" /> : branch.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-black text-sm" style={{ color: "var(--c-text)" }}>{branch.name}</h2>
              {branch.address && <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{branch.address}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onTransfer} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }}>
              <ArrowLeftRight size={12} /> Transfer
            </button>
            <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <BranchSalesPanel branchId={branch.id} branchName={branch.name} />
          <ReorderSuggestions branchId={branch.id} onTransfer={() => onTransfer()} />
          <BranchStockTable branchId={branch.id} branchName={branch.name} />
          <div>
            <h3 className="text-sm font-black mb-3" style={{ color: "var(--c-text)" }}>Transfer ইতিহাস</h3>
            <TransferLog branchId={branch.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
