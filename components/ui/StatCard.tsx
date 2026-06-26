import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import Card from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; up?: boolean };
  accent?: "green" | "gold" | "blue" | "red" | "purple" | "none";
  className?: string;
}

const accentBorder: Record<string, string> = {
  green: "border-l-[3px] border-l-[var(--c-primary)]",
  gold: "border-l-[3px] border-l-[var(--accent-warm)]",
  blue: "border-l-[3px] border-l-[var(--bg-info-text)]",
  red: "border-l-[3px] border-l-[var(--bg-danger-text)]",
  purple: "border-l-[3px] border-l-[var(--bg-purple-text)]",
  none: "",
};

const accentIcon: Record<string, { bg: string; color: string }> = {
  green: { bg: "var(--icon-green-bg)", color: "var(--icon-green-text)" },
  gold:  { bg: "var(--icon-amber-bg)",  color: "var(--icon-amber-text)" },
  blue:  { bg: "var(--icon-blue-bg)",   color: "var(--icon-blue-text)" },
  red:   { bg: "var(--icon-red-bg)",    color: "var(--icon-red-text)" },
  purple:{ bg: "var(--icon-purple-bg)", color: "var(--icon-purple-text)" },
  none:  { bg: "var(--icon-green-bg)",  color: "var(--icon-green-text)" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  accent = "none",
  className,
}: StatCardProps) {
  const resolvedIcon = accentIcon[accent] ?? accentIcon.none;
  const resolvedIconBg = iconBg ?? resolvedIcon.bg;
  const resolvedIconColor = iconColor ?? resolvedIcon.color;

  return (
    <Card variant="stat" padding="md" className={cn(accentBorder[accent], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--c-text-muted)" }}>
            {label}
          </p>
          <p className="text-2xl font-bold truncate font-display" style={{ color: "var(--c-text)" }}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend.up !== undefined && (
                trend.up
                  ? <TrendingUp size={12} style={{ color: "var(--c-primary)" }} />
                  : <TrendingDown size={12} style={{ color: "var(--bg-danger-text)" }} />
              )}
              <span className="text-xs font-medium" style={{ color: trend.up ? "var(--c-primary)" : "var(--bg-danger-text)" }}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: resolvedIconBg, color: resolvedIconColor }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
}
