"use client";

import { PO_STATUS_CONFIG } from "@/lib/purchase-orders/types";

export default function POStatusBadge({ status }: { status: string }) {
  const cfg = PO_STATUS_CONFIG[status] ?? PO_STATUS_CONFIG.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: cfg.dot,
          display: "inline-block",
        }}
      />
      {cfg.label}
    </span>
  );
}
