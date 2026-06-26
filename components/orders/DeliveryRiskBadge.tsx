"use client";

import { useEffect, useState } from "react";
import { Truck, ShieldCheck, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";

interface PhoneRisk {
  level: "green" | "amber" | "red" | "unknown";
  score: number;
  deliveredCount: number;
  returnedCount: number;
  totalCount: number;
  label: string;
}

const CONFIG: Record<PhoneRisk["level"], { bg: string; text: string; border: string; Icon: React.ElementType }> = {
  green:   { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7", Icon: ShieldCheck },
  amber:   { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", Icon: AlertTriangle },
  red:     { bg: "#FEE2E2", text: "#7F1D1D", border: "#F87171", Icon: ShieldAlert },
  unknown: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", Icon: Truck },
};

export default function DeliveryRiskBadge({ phone, onLoaded }: { phone: string | null | undefined; onLoaded?: (r: PhoneRisk) => void }) {
  const [risk, setRisk] = useState<PhoneRisk | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) return;
    let active = true;
    setLoading(true);
    fetch(`/api/courier/risk?phone=${encodeURIComponent(phone)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        setRisk(d);
        onLoaded?.(d);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  if (!phone) return null;
  if (loading && !risk) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>
        <Loader2 size={12} className="animate-spin" /> ঝুঁকি যাচাই...
      </span>
    );
  }
  if (!risk) return null;

  const cfg = CONFIG[risk.level] ?? CONFIG.unknown;
  const { Icon } = cfg;

  return (
    <span
      title={`ডেলিভারি: ${risk.deliveredCount} · রিটার্ন: ${risk.returnedCount} · মোট: ${risk.totalCount}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold select-none"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      <Icon size={13} />
      <span>{risk.label}</span>
    </span>
  );
}
