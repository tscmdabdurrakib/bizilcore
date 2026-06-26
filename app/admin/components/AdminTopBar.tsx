"use client";

import { Bell } from "lucide-react";
import { resolvePageTitle } from "./nav-config";
import ThemeToggle from "@/components/ThemeToggle";

interface AdminTopBarProps {
  pathname: string;
  adminName: string;
}

export default function AdminTopBar({ pathname, adminName }: AdminTopBarProps) {
  const title = resolvePageTitle(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between px-6 backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, var(--shell-bg) 88%, transparent)",
        borderBottom: "1px solid var(--shell-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h1 className="text-lg font-semibold" style={{ color: "var(--shell-text)" }}>{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          className="relative rounded-xl p-2 transition-colors"
          style={{ color: "var(--shell-text-muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--c-bg)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: "var(--c-primary)" }}
        >
          {adminName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
