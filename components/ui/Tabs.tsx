import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export default function Tabs({ tabs, active, onChange, variant = "pill", className }: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={cn("flex gap-0 border-b", className)} style={{ borderColor: "var(--c-border)" }}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px",
                isActive ? "border-[var(--c-primary)]" : "border-transparent hover:opacity-80",
              )}
              style={{ color: isActive ? "var(--c-primary)" : "var(--c-text-sub)" }}
            >
              {tab.icon && <tab.icon size={15} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1 flex-wrap p-1 rounded-xl", className)} style={{ backgroundColor: "var(--shell-surface)" }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
              isActive && "shadow-sm",
            )}
            style={{
              backgroundColor: isActive ? "var(--c-surface)" : "transparent",
              color: isActive ? "var(--c-primary)" : "var(--c-text-sub)",
            }}
          >
            {tab.icon && <tab.icon size={15} />}
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
