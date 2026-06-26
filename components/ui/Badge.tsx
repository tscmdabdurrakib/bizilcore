import { cn } from "@/lib/utils";
import { getStatusStyle } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  status?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<string, { bg: string; text: string }> = {
  default: { bg: "var(--status-cancelled-bg)", text: "var(--status-cancelled-text)" },
  success: { bg: "var(--status-delivered-bg)", text: "var(--status-delivered-text)" },
  warning: { bg: "var(--status-pending-bg)", text: "var(--status-pending-text)" },
  danger: { bg: "var(--status-returned-bg)", text: "var(--status-returned-text)" },
  info: { bg: "var(--status-confirmed-bg)", text: "var(--status-confirmed-text)" },
  purple: { bg: "var(--status-shipped-bg)", text: "var(--status-shipped-text)" },
};

export default function Badge({ children, status, variant = "default", className, dot }: BadgeProps) {
  const style = status ? getStatusStyle(status) : variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
        className,
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.text }} />
      )}
      {children}
    </span>
  );
}
