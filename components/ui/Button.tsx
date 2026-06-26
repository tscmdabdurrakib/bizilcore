import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ElementType;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: "var(--c-primary)", color: "#fff" },
  secondary: { backgroundColor: "var(--c-primary-light)", color: "var(--c-primary-text)" },
  ghost: { backgroundColor: "transparent", color: "var(--c-text-sub)" },
  danger: { backgroundColor: "var(--bg-danger-soft)", color: "var(--bg-danger-text)" },
  outline: { backgroundColor: "var(--c-surface)", color: "var(--c-text)", border: "1px solid var(--c-border)" },
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  icon: Icon,
  children,
  className,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-xl transition-all cursor-pointer",
        "hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]/30",
        sizeClasses[size],
        className,
      )}
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}
