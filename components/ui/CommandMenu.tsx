"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  open: boolean;
  query: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  items: { id: string; label: string; description?: string; icon?: React.ReactNode; group?: string }[];
  className?: string;
}

export function CommandMenu({ open, query, onSelect, onClose, items, className }: CommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { setActiveIndex(0); }, [query, items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && items[activeIndex]) { e.preventDefault(); onSelect(items[activeIndex].id); }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, items, activeIndex, onSelect, onClose]);

  if (!open || items.length === 0) return null;

  return (
    <div
      ref={listRef}
      className={cn(
        "absolute z-50 w-72 max-h-80 overflow-y-auto rounded-xl border shadow-xl py-1",
        className
      )}
      style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
      role="listbox"
      aria-label="Block inserter"
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          role="option"
          aria-selected={i === activeIndex}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
            i === activeIndex && "bg-[var(--nav-active-bg)]"
          )}
          onMouseEnter={() => setActiveIndex(i)}
          onClick={() => onSelect(item.id)}
        >
          {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
          <span>
            <span className="block text-sm font-medium" style={{ color: "var(--c-text)" }}>{item.label}</span>
            {item.description && (
              <span className="block text-xs" style={{ color: "var(--c-text-muted)" }}>{item.description}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
