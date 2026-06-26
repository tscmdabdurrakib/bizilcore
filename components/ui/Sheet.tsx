"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function Sheet({ open, onClose, title, children, side = "right", className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "absolute top-0 bottom-0 w-full max-w-sm flex flex-col shadow-2xl transition-transform duration-300",
          side === "left" ? "left-0" : "right-0",
          className
        )}
        style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--c-border)" }}>
            <h2 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{title}</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg" aria-label="Close panel">
              <X className="w-4 h-4" style={{ color: "var(--c-text-muted)" }} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
