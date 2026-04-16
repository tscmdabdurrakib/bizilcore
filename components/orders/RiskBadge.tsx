"use client";

import { ShieldAlert, ShieldCheck, ShieldX, AlertTriangle } from "lucide-react";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "blocked";

interface Props {
  riskScore?: number | null;
  riskLevel?: RiskLevel | null;
  riskFlags?: string | null;
  size?: "sm" | "md";
}

const CONFIG: Record<RiskLevel, { label: string; bg: string; text: string; border: string; Icon: React.ElementType }> = {
  safe:    { label: "নিরাপদ",   bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7", Icon: ShieldCheck },
  low:     { label: "কম ঝুঁকি",  bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", Icon: AlertTriangle },
  medium:  { label: "মাঝারি",   bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5", Icon: ShieldAlert },
  high:    { label: "বেশি ঝুঁকি", bg: "#FEE2E2", text: "#7F1D1D", border: "#F87171", Icon: ShieldAlert },
  blocked: { label: "ব্লক",     bg: "#1F2937", text: "#F9FAFB", border: "#374151", Icon: ShieldX },
};

export default function RiskBadge({ riskScore, riskLevel, riskFlags, size = "sm" }: Props) {
  if (!riskLevel || riskLevel === "safe") return null;

  const cfg = CONFIG[riskLevel] ?? CONFIG.medium;
  const { Icon } = cfg;
  const flags: string[] = riskFlags ? JSON.parse(riskFlags).filter(Boolean) : [];

  const iconSize = size === "md" ? 14 : 12;
  const fontSize = size === "md" ? "12px" : "10px";

  return (
    <span
      title={flags.length > 0 ? flags.join(" | ") : cfg.label}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold select-none"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        fontSize,
        maxWidth: 110,
      }}
    >
      <Icon size={iconSize} />
      <span className="truncate">{cfg.label}</span>
      {riskScore != null && riskScore > 0 && (
        <span className="opacity-70 text-[9px]">{riskScore}</span>
      )}
    </span>
  );
}
