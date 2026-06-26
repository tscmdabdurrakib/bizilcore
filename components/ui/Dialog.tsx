"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Dialog({ open, onClose, title, children, className, size = "md" }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200",
          sizes[size],
          className
        )}
        style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--c-border)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--c-text)" }}>{title}</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" aria-label="Close">
              <X className="w-4 h-4" style={{ color: "var(--c-text-muted)" }} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
