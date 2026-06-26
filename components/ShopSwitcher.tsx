"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronDown, Store, Check, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import type { AccessibleShop } from "@/lib/shops/types";

interface Props {
  currentShopName: string;
  currentShopId: string;
  logoUrl?: string | null;
}

export default function ShopSwitcher({ currentShopName, currentShopId, logoUrl }: Props) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<AccessibleShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/shops/list")
      .then(r => r.ok ? r.json() : { shops: [] })
      .then(d => setShops(d.shops ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/shops/list")
      .then(r => r.ok ? r.json() : { shops: [] })
      .then(d => setShops(d.shops ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function switchShop(shopId: string) {
    if (shopId === currentShopId) { setOpen(false); return; }
    setSwitching(shopId);
    const res = await fetch("/api/shops/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId }),
    });
    if (res.ok) {
      await update({ activeShopId: shopId });
      setOpen(false);
      router.refresh();
    }
    setSwitching(null);
  }

  const activeShopId = (session?.user as { activeShopId?: string })?.activeShopId ?? currentShopId;
  const showSwitcher = shops.length > 1 || open;

  if (!showSwitcher && shops.length <= 1) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black"
          style={{ backgroundColor: logoUrl ? "transparent" : "#0F6E56" }}>
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : currentShopName.slice(0, 1)}
        </div>
        <span className="text-sm font-bold truncate hidden sm:block" style={{ color: "var(--c-text)" }}>{currentShopName}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors max-w-[200px] sm:max-w-[240px] card-premium"
        style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black"
          style={{ backgroundColor: logoUrl ? "transparent" : "#0F6E56" }}>
          {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : currentShopName.slice(0, 1)}
        </div>
        <span className="text-xs font-bold truncate flex-1 text-left" style={{ color: "var(--c-text)" }}>{currentShopName}</span>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--c-text-muted)" }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 rounded-2xl z-50 overflow-hidden card-premium"
          style={{ boxShadow: "var(--shadow-elevated)" }}>
          <div className="p-2 border-b" style={{ borderColor: "var(--c-border)" }}>
            <p className="text-[10px] font-bold px-2" style={{ color: "var(--c-text-muted)" }}>শপ পরিবর্তন</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {loading ? (
              <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
            ) : shops.map(shop => (
              <button key={shop.id} onClick={() => switchShop(shop.id)} disabled={!!switching}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors disabled:opacity-60"
                style={{ backgroundColor: shop.id === activeShopId ? "#E1F5EE" : "transparent" }}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black"
                  style={{ background: shop.isPrimary ? "linear-gradient(135deg,#0F6E56,#10B981)" : "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                  {shop.logoUrl ? <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" /> : shop.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--c-text)" }}>{shop.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                    {shop.isPrimary ? "মূল শপ" : shop.isBranch ? "Branch" : "শপ"}
                  </p>
                </div>
                {shop.id === activeShopId && <Check size={14} style={{ color: "#0F6E56" }} />}
                {switching === shop.id && <Loader2 size={14} className="animate-spin" style={{ color: "#0F6E56" }} />}
              </button>
            ))}
          </div>
          <div className="p-2 border-t" style={{ borderColor: "var(--c-border)" }}>
            <Link href="/shops" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold w-full"
              style={{ color: "#0F6E56", backgroundColor: "#E1F5EE" }}>
              <Store size={13} /> শাখা ব্যবস্থাপনা
            </Link>
            <Link href="/shops?action=create-child" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold w-full mt-1"
              style={{ color: "var(--c-text-sub)" }}>
              <Plus size={13} /> নতুন শপ/Branch
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
