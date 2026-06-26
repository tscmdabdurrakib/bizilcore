import { cn } from "@/lib/utils";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; href?: string };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center card-premium", className)}
    >
      {Icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}
        >
          <Icon size={24} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-base font-semibold font-display mb-1" style={{ color: "var(--c-text)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm mb-5" style={{ color: "var(--c-text-muted)" }}>
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <a href={action.href}>
            <Button onClick={action.onClick}>{action.label}</Button>
          </a>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}
