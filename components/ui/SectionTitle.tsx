import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export default function SectionTitle({ title, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--c-text-muted)" }}
      >
        {title}
      </h2>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="text-xs font-semibold hover:underline"
            style={{ color: "var(--c-primary)" }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="text-xs font-semibold hover:underline"
            style={{ color: "var(--c-primary)" }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
