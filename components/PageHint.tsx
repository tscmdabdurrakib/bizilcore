"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface PageHintProps {
  page: string;
  text: string;
  targetId?: string;
}

export default function PageHint({ page, text, targetId }: PageHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = JSON.parse(localStorage.getItem("bizil_hints_seen") || "[]") as string[];
      if (!seen.includes(page)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [page]);

  function dismiss() {
    setVisible(false);
    try {
      const seen = JSON.parse(localStorage.getItem("bizil_hints_seen") || "[]") as string[];
      if (!seen.includes(page)) {
        localStorage.setItem("bizil_hints_seen", JSON.stringify([...seen, page]));
      }
    } catch {}
  }

  useEffect(() => {
    if (!visible || !targetId) return;
    const el = document.getElementById(targetId);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visible, targetId]);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl card-premium animate-in slide-in-from-top-2 fade-in duration-300"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: "var(--c-primary)",
        backgroundColor: "var(--c-primary-light)",
      }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg, var(--c-primary), #0A5442)" }}>
        <span className="text-white text-sm">💡</span>
      </div>
      <p className="flex-1 text-sm font-medium leading-relaxed" style={{ color: "var(--c-primary-text)" }}>
        {text}
      </p>
      <button onClick={dismiss}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
        style={{ backgroundColor: "var(--c-primary)", color: "#fff" }}>
        বুঝেছি
      </button>
      <button onClick={dismiss}
        className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-colors hover:bg-green-100 cursor-pointer">
        <X size={13} style={{ color: "#0F6E56" }} />
      </button>
    </div>
  );
}
