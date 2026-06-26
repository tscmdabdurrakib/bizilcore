"use client";

import { useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function ImpersonationBanner() {
  const { data: session, update } = useSession();
  const user = session?.user as {
    realAdminId?: string;
    impersonatingUserName?: string;
    name?: string;
  } | undefined;

  if (!user?.realAdminId) return null;

  async function endImpersonation() {
    await fetch("/api/admin/impersonate/end", { method: "POST" });
    await update({ endImpersonation: true });
    window.location.href = "/admin";
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg md:left-60">
      <span>
        Viewing as <strong>{user.impersonatingUserName ?? user.name}</strong>
      </span>
      <button
        onClick={endImpersonation}
        className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30 active:scale-95"
      >
        <LogOut size={12} />
        Exit
      </button>
    </div>
  );
}
