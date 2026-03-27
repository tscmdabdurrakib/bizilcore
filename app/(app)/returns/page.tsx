"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, Package, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import { S } from "@/lib/theme";

interface ReturnItem {
  id: string;
  quantity: number;
  product: { id: string; name: string };
}

interface OrderReturn {
  id: string;
  reason: string | null;
  restock: boolean;
  createdAt: string;
  order: {
    id: string;
    totalAmount: number;
    customer: { id: string; name: string; phone: string | null } | null;
  };
  items: ReturnItem[];
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    fetch(`/api/returns?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setReturns(d.returns ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);

  const restockCount = returns.filter(r => r.restock).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E24B4A 0%, #C0392B 100%)" }}>
            <RotateCcw size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>রিটার্ন ম্যানেজমেন্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>সব পণ্য রিটার্নের তথ্য এখানে</p>
          </div>
        </div>
        <Link
          href="/orders"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-colors"
          style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}
        >
          <ArrowLeft size={13} /> অর্ডারে ফিরুন
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট রিটার্ন", value: total, color: "#E24B4A", bg: "#FFE8E8", icon: RotateCcw },
          { label: "স্টকে ফেরত", value: restockCount, color: "#0F6E56", bg: "#E8F5F0", icon: Package },
          { label: "এই পেজে", value: returns.length, color: "#EF9F27", bg: "#FFF3DC", icon: Package },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <Icon size={15} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="কাস্টমারের নাম বা কারণ দিয়ে খুঁজুন..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ backgroundColor: S.surface }} />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#FFE8E8" }}>
            <RotateCcw size={28} color="#E24B4A" />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.secondary }}>কোনো রিটার্ন নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>অর্ডারের বিস্তারিত থেকে রিটার্ন দেওয়া যায়</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <div
              key={ret.id}
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: S.surface, borderColor: S.border }}
            >
              {/* Top accent bar */}
              <div className="h-1" style={{ backgroundColor: ret.restock ? "#0F6E56" : "#EF9F27" }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Customer + Order */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <Link
                        href={`/orders/${ret.order.id}`}
                        className="text-sm font-bold hover:underline"
                        style={{ color: S.primary }}
                      >
                        অর্ডার #{ret.order.id.slice(-6).toUpperCase()}
                      </Link>
                      {ret.order.customer && (
                        <Link
                          href={`/customers/${ret.order.customer.id}`}
                          className="text-sm hover:underline"
                          style={{ color: S.text }}
                        >
                          · {ret.order.customer.name}
                        </Link>
                      )}
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={ret.restock
                          ? { backgroundColor: "#E8F5F0", color: "#0F6E56" }
                          : { backgroundColor: "#FFF3DC", color: "#EF9F27" }}
                      >
                        {ret.restock ? "✓ স্টকে ফেরত" : "স্টকে আসেনি"}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ret.items.map((item) => (
                        <span
                          key={item.id}
                          className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium"
                          style={{ backgroundColor: S.bg, color: S.secondary, border: `1px solid ${S.border}` }}
                        >
                          <Package size={11} />
                          {item.product.name} × {item.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Reason */}
                    {ret.reason && (
                      <p className="text-xs italic" style={{ color: S.muted }}>
                        কারণ: {ret.reason}
                      </p>
                    )}
                  </div>

                  {/* Date + amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold" style={{ color: "#E24B4A" }}>
                      {formatBDT(ret.order.totalAmount)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: S.muted }}>{formatBanglaDate(ret.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: S.muted }}>পৃষ্ঠা {page}/{pages} · মোট {total}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium disabled:opacity-40"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
            >
              <ChevronLeft size={14} /> পূর্ববর্তী
            </button>
            <span className="text-xs px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: "#FFE8E8", color: "#E24B4A" }}>
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium disabled:opacity-40"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
            >
              পরবর্তী <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
