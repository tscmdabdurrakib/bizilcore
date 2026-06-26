"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav-config";

interface AdminSidebarProps {
  adminName: string;
  adminEmail: string;
  pendingPayments?: number;
  newFeedback?: number;
  collapsed?: boolean;
}

export default function AdminSidebar({ adminName, adminEmail, pendingPayments = 0, newFeedback = 0, collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-200",
        collapsed ? "w-[68px]" : "w-60",
      )}
      style={{
        backgroundColor: "var(--shell-bg)",
        borderColor: "var(--shell-border)",
        boxShadow: "var(--shadow-sidebar)",
      }}
    >
      {/* Logo */}
      <div
        className={cn("flex items-center gap-2 border-b px-4 py-5", collapsed && "justify-center px-2")}
        style={{ borderColor: "var(--shell-border)" }}
      >
        {!collapsed && (
          <>
            <span className="text-lg font-bold font-display" style={{ color: "var(--shell-text)" }}>BizilCore</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: "var(--c-primary)" }}
            >
              Super Admin
            </span>
          </>
        )}
        {collapsed && (
          <span className="text-lg font-bold font-display" style={{ color: "var(--c-primary)" }}>B</span>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed && (
              <p
                className="mb-2 px-3 text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--shell-text-muted)" }}
              >
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const badge = item.badgeKey === "pendingPayments"
                  ? pendingPayments
                  : item.badgeKey === "newFeedback"
                    ? newFeedback
                    : undefined;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: active ? "var(--shell-nav-active-bg)" : "transparent",
                        color: active ? "var(--shell-nav-active-color)" : "var(--shell-nav-inactive)",
                        borderLeft: active && !collapsed ? "3px solid var(--shell-nav-active-border)" : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "var(--surface-hover)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <item.icon
                        size={18}
                        className="shrink-0"
                        style={{ color: "currentColor" }}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge !== undefined && badge > 0 && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: "var(--bg-warning-soft)", color: "var(--bg-warning-text)" }}
                            >
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom admin info */}
      <div className={cn("border-t p-4", collapsed && "px-2")} style={{ borderColor: "var(--shell-border)" }}>
        {!collapsed && (
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: "var(--c-primary)" }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" style={{ color: "var(--shell-text)" }}>{adminName}</p>
              <p className="truncate text-xs" style={{ color: "var(--shell-text-muted)" }}>{adminEmail}</p>
            </div>
          </div>
        )}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
            collapsed && "px-2",
          )}
          style={{
            borderColor: "var(--shell-border)",
            color: "var(--shell-text-sub)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-hover)";
            e.currentTarget.style.color = "var(--shell-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--shell-text-sub)";
          }}
        >
          <ArrowLeft size={14} />
          {!collapsed && "ফিরে যান"}
        </Link>
      </div>
    </aside>
  );
}
