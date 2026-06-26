import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "stat" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  onClick,
  style,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border",
        variant === "default" && "card-premium",
        variant === "stat" && "card-stat",
        variant === "bordered" && "bg-[var(--c-surface)] border-[var(--c-border)]",
        variant === "elevated" && "card-premium",
        variant === "elevated" && "shadow-[var(--shadow-elevated)]",
        paddingMap[padding],
        onClick && "cursor-pointer",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
