"use client";

import { Printer } from "lucide-react";

export function POPrintToolbar({ poNumber }: { poNumber: string }) {
  return (
    <div className="no-print sticky top-0 z-10 px-6 py-3 bg-gray-900 flex items-center gap-3">
      <span className="text-gray-400 text-sm flex-1">PO Preview — {poNumber}</span>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold"
      >
        <Printer size={14} /> Print / PDF
      </button>
    </div>
  );
}
