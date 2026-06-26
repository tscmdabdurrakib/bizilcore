"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative w-[52px] h-7 rounded-full flex items-center p-0.5 flex-shrink-0",
        "transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary)]/30",
        className,
      )}
      style={{
        backgroundColor: "var(--c-bg)",
        border: "1px solid var(--shell-border)",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-sm transition-transform duration-200 ease-out"
        style={{
          transform: isDark ? "translateX(24px)" : "translateX(0)",
          backgroundColor: "var(--c-surface-raised)",
          border: "1px solid var(--c-border)",
        }}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-1.5">
        <Sun
          size={13}
          className="transition-colors"
          style={{ color: isDark ? "var(--shell-text-muted)" : "var(--c-primary)" }}
        />
        <Moon
          size={13}
          className="transition-colors"
          style={{ color: isDark ? "var(--c-primary)" : "var(--shell-text-muted)" }}
        />
      </span>
    </button>
  );
}
