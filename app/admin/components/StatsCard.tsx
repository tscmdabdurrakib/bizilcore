import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorTheme = "blue" | "purple" | "amber" | "emerald";

const THEMES: Record<ColorTheme, { iconBg: string; iconText: string }> = {
  blue: { iconBg: "bg-blue-50", iconText: "text-blue-600" },
  purple: { iconBg: "bg-purple-50", iconText: "text-purple-600" },
  amber: { iconBg: "bg-amber-50", iconText: "text-amber-600" },
  emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: ColorTheme;
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, icon: Icon, color = "emerald", trend }: StatsCardProps) {
  const theme = THEMES[color];
  const trendUp = trend && trend.value >= 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", theme.iconBg)}>
        <Icon size={18} className={theme.iconText} />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{title}</p>
      {trend && (
        <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendUp ? "text-emerald-600" : "text-red-500")}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendUp ? "+" : ""}{trend.value} {trend.label}
        </p>
      )}
    </div>
  );
}
