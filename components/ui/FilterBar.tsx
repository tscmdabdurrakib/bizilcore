import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function FilterBar({
  tabs,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  searchPlaceholder = "খুঁজুন...",
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 items-stretch sm:items-center", className)}>
      {tabs && tabs.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                  active ? "shadow-sm" : "hover:opacity-80",
                )}
                style={{
                  backgroundColor: active ? "var(--c-primary)" : "var(--c-surface)",
                  color: active ? "#fff" : "var(--c-text-sub)",
                  border: active ? "none" : "1px solid var(--c-border)",
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 opacity-70">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 flex-1 sm:justify-end flex-wrap">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 sm:max-w-xs min-w-[160px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
            <input
              type="text"
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-[var(--c-primary)]/20"
              style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", color: "var(--c-text)" }}
            />
          </div>
        )}
        {filters}
        {actions}
      </div>
    </div>
  );
}
