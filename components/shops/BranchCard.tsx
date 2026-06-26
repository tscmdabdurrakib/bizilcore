"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone, MapPin, ArrowLeftRight, Edit3, Trash2, Loader2, Package,
  Settings, ShoppingBag, UserCheck, BarChart2, ChevronDown, ChevronUp,
  ChevronRight, Clock, StickyNote, Eye, Boxes, AlertTriangle,
} from "lucide-react";
import { StatPill } from "./ui";
import type { Branch, MainShop } from "@/lib/shops/types";
import { CATEGORY_COLORS, timeAgo } from "@/lib/shops/types";

interface Props {
  shop: MainShop | Branch;
  isMain: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onTransfer?: () => void;
  onViewStock?: () => void;
  onToggleActive?: () => void;
  togglingActive?: boolean;
  deleting?: boolean;
}

export default function BranchCard({ shop, isMain, onDelete, onEdit, onTransfer, onViewStock, onToggleActive, togglingActive, deleting }: Props) {
  const [expanded, setExpanded] = useState(false);
  const branch = shop as Branch;
  const initials = shop.name.slice(0, 2).toUpperCase();
  const catColor = CATEGORY_COLORS[shop.category ?? ""] ?? "#6B7280";

  return (
    <div className="rounded-2xl border overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 min-h-[140px] flex flex-col"
      style={{
        borderColor: isMain ? "#A7F3D0" : "var(--c-border)",
        backgroundColor: "var(--c-surface)",
        opacity: !isMain && branch.isActive === false ? 0.65 : 1,
      }}>
      <div className="h-1 w-full" style={{ background: isMain ? "linear-gradient(90deg,#0F6E56,#10B981,#3B82F6)" : "linear-gradient(90deg,#7C3AED,#A855F7,#EC4899)" }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 overflow-hidden"
            style={{ background: isMain ? "linear-gradient(135deg,#0F6E56,#10B981)" : "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
            {shop.logoUrl ? <img src={shop.logoUrl} alt="" className="w-full h-full object-cover" /> : initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-black text-base" style={{ color: "var(--c-text)" }}>{shop.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={isMain ? { backgroundColor: "#DCFCE7", color: "#16A34A" } : { backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                {isMain ? "মূল শপ" : "Branch"}
              </span>
              {!isMain && branch.isActive === false && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>নিষ্ক্রিয়</span>
              )}
              {!isMain && branch.linkedShopId && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>Full Shop</span>
              )}
              {shop.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${catColor}18`, color: catColor }}>{shop.category}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-2" style={{ color: "var(--c-text-muted)" }}>
              {shop.phone && <span className="flex items-center gap-1"><Phone size={10} /> {shop.phone}</span>}
              {shop.address && <span className="flex items-center gap-1"><MapPin size={10} /> {shop.address}</span>}
              {!isMain && branch.createdAt && (
                <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(branch.createdAt)}</span>
              )}
            </div>

            {isMain ? (
              <div className="flex gap-2 flex-wrap">
                <StatPill label="পণ্য" value={(shop as MainShop).productCount ?? 0} color="#0F6E56" />
                <StatPill label="কাস্টমার" value={(shop as MainShop).customerCount ?? 0} color="#3B82F6" />
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <StatPill label="স্টক আইটেম" value={branch.productCount ?? 0} color="#7C3AED" />
                <StatPill label="মোট pcs" value={branch.totalStockQty ?? 0} color="#3B82F6" />
                {(branch.lowStockCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ring-1 ring-red-200" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                    <AlertTriangle size={10} /> {branch.lowStockCount} কম স্টক
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isMain ? (
              <div className="flex flex-row sm:flex-col gap-1">
                <Link href="/settings?tab=shop" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                  style={{ backgroundColor: "#D1FAE5", color: "#0F6E56" }}>
                  <Settings size={11} /> <span className="hidden sm:inline">সেটিংস</span>
                </Link>
                <Link href="/inventory" className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                  style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                  <Package size={11} /> <span className="hidden sm:inline">পণ্য</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-row flex-wrap gap-1 items-center justify-end max-w-[140px] sm:max-w-none">
                {onTransfer && branch.isActive !== false && (
                  <button onClick={onTransfer} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                    style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                    <ArrowLeftRight size={11} /> <span className="hidden xl:inline">Transfer</span>
                  </button>
                )}
                {onViewStock && (
                  <button onClick={onViewStock} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                    style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}>
                    <Boxes size={11} /> <span className="hidden xl:inline">স্টক</span>
                  </button>
                )}
                {onToggleActive && (
                  <button onClick={onToggleActive} disabled={togglingActive} title={branch.isActive === false ? "সক্রিয় করুন" : "নিষ্ক্রিয় করুন"}
                    className="p-1.5 rounded-xl text-[10px] font-bold disabled:opacity-50"
                    style={{ color: branch.isActive === false ? "#16A34A" : "#6B7280" }}>
                    {togglingActive ? <Loader2 size={14} className="animate-spin" /> : (branch.isActive === false ? "ON" : "OFF")}
                  </button>
                )}
                {onEdit && (
                  <button onClick={onEdit} className="p-1.5 rounded-xl" title="সম্পাদনা" style={{ color: "#7C3AED" }}>
                    <Edit3 size={14} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-xl disabled:opacity-50" title="মুছুন" style={{ color: "#EF4444" }}>
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {!isMain && branch.note && (
          <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
            <StickyNote size={11} style={{ color: "var(--c-text-muted)", flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{branch.note}</p>
          </div>
        )}

        <button onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1 mt-3 pt-2 border-t text-xs font-medium"
          style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
          {expanded ? <><ChevronUp size={12} /> কম দেখুন</> : <><ChevronDown size={12} /> আরো বিবরণ</>}
        </button>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {isMain ? (
              <>
                {[
                  { href: "/orders", icon: ShoppingBag, label: "অর্ডার", color: "#3B82F6" },
                  { href: "/customers", icon: UserCheck, label: "কাস্টমার", color: "#0F6E56" },
                  { href: "/reports", icon: BarChart2, label: "রিপোর্ট", color: "#F59E0B" },
                  { href: "/inventory", icon: Package, label: "ইনভেন্টরি", color: "#8B5CF6" },
                ].map(({ href, icon: Icon, label, color }) => (
                  <Link key={href} href={href} className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}>
                    <Icon size={13} style={{ color }} />
                    <span className="text-xs font-medium">{label}</span>
                    <ChevronRight size={11} className="ml-auto" />
                  </Link>
                ))}
              </>
            ) : (
              <div className="p-2.5 rounded-xl col-span-2" style={{ backgroundColor: "var(--c-bg)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--c-text-muted)" }}>Branch তথ্য</p>
                <div className="space-y-1">
                  {branch.phone && <p className="text-xs"><span style={{ color: "var(--c-text-muted)" }}>ফোন: </span>{branch.phone}</p>}
                  {branch.address && <p className="text-xs"><span style={{ color: "var(--c-text-muted)" }}>ঠিকানা: </span>{branch.address}</p>}
                  <p className="text-xs"><span style={{ color: "var(--c-text-muted)" }}>তৈরি: </span>
                    {new Date(branch.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                {onViewStock && (
                  <button onClick={onViewStock} className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#7C3AED" }}>
                    <Eye size={12} /> স্টক তালিকা দেখুন
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
