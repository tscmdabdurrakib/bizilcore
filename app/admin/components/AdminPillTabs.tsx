"use client";

import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  badge?: number;
}

interface AdminPillTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function AdminPillTabs({ tabs, active, onChange, className }: AdminPillTabsProps) {
  return (
    <div className={cn("inline-flex gap-1 rounded-xl bg-gray-100 p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all active:scale-95",
            active === tab.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
