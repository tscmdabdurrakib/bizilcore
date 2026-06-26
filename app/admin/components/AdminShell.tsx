"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";

interface AdminShellProps {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string;
}

export default function AdminShell({ children, adminName, adminEmail }: AdminShellProps) {
  const pathname = usePathname();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [newFeedback, setNewFeedback] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/badges")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.pendingPayments !== undefined) setPendingPayments(d.pendingPayments);
        if (d?.newFeedback !== undefined) setNewFeedback(d.newFeedback);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleResize() {
      setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1024);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isBlogEditor = pathname.includes("/admin/blog/") && pathname.endsWith("/edit");

  if (isBlogEditor) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--c-bg)" }}>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--shell-outer-bg)" }}>
      <AdminSidebar
        adminName={adminName}
        adminEmail={adminEmail}
        pendingPayments={pendingPayments}
        newFeedback={newFeedback}
        collapsed={collapsed}
      />
      <div className={cn("transition-all duration-200", collapsed ? "ml-[68px]" : "ml-60")}>
        <AdminTopBar pathname={pathname} adminName={adminName} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
