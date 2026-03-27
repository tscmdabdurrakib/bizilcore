"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, TrendingUp, TrendingDown, RotateCcw, Package, Plus, Minus, X, Printer } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";

interface Product {
  id: string; name: string; sku: string | null; category: string | null;
  buyPrice: number; sellPrice: number; stockQty: number; lowStockAt: number; imageUrl: string | null;
}

interface StockMovement {
  id: string; type: string; quantity: number; reason: string | null; orderId: string | null;
  createdAt: string; user: { name: string };
}

const TYPE_META: Record<string, { label: string; color: string; icon: "up" | "down" }> = {
  in:          { label: "স্টক প্রবেশ",   color: "var(--c-primary)", icon: "up" },
  out:         { label: "স্টক বের",      color: "#E24B4A", icon: "down" },
  adjustment:  { label: "Adjustment",    color: "#EF9F27", icon: "up" },
  return:      { label: "Return",        color: "#7C3AED", icon: "up" },
  order:       { label: "বিক্রি (অর্ডার)", color: "#E24B4A", icon: "down" },
};

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)", primary: "var(--c-primary)" };

const inp = (focused: boolean) => ({
  height: "40px", border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", color: "var(--c-text)", backgroundColor: "var(--c-surface)",
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showAdj, setShowAdj] = useState(false);
  const [adjType, setAdjType] = useState<"in" | "out" | "adjustment">("in");
  const [adjQty, setAdjQty] = useState("1");
  const [adjReason, setAdjReason] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadData() {
    const [pr, mv] = await Promise.all([
      fetch(`/api/products/${id}`).then(r => r.json()),
      fetch(`/api/stock-movements?productId=${id}`).then(r => r.json()),
    ]);
    setProduct(pr);
    setMovements(Array.isArray(mv) ? mv : []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [id]);

  async function handleAdjustment() {
    if (!adjQty || parseInt(adjQty) <= 0) return;
    setAdjSaving(true);
    const r = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, type: adjType, quantity: parseInt(adjQty), reason: adjReason }),
    });
    if (r.ok) {
      showToast("success", "স্টক আপডেট হয়েছে ✓");
      setShowAdj(false);
      setAdjQty("1");
      setAdjReason("");
      await loadData();
    } else {
      showToast("error", "সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
    setAdjSaving(false);
  }

  if (loading) return <div className="animate-pulse space-y-4 max-w-2xl">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;
  if (!product) return <div className="text-center py-20"><p style={{ color: S.muted }}>পণ্য পাওয়া যায়নি।</p><button onClick={() => router.back()} className="mt-3 text-sm" style={{ color: S.primary }}>← ফিরে যান</button></div>;

  const stockOk = product.stockQty > product.lowStockAt;
  const stockLow = product.stockQty > 0 && product.stockQty <= product.lowStockAt;
  const stockBg = product.stockQty === 0 ? "#FFE8E8" : stockLow ? "#FFF3DC" : "var(--c-primary-light)";
  const stockColor = product.stockQty === 0 ? "#E24B4A" : stockLow ? "#EF9F27" : "var(--c-primary)";
  const stockLabel = product.stockQty === 0 ? "শেষ" : stockLow ? "কম" : "ভালো";

  return (
    <div className="max-w-2xl">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {/* Adjustment Modal */}
      {showAdj && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: S.text }}>স্টক Adjustment</h3>
              <button onClick={() => setShowAdj(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-xs mb-4" style={{ color: S.muted }}>বর্তমান স্টক: <strong style={{ color: S.text }}>{product.stockQty} টি</strong></p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: S.muted }}>ধরন</label>
                <div className="flex gap-2">
                  {([
                    { key: "in",         label: "স্টক যোগ",    icon: <Plus size={13}/> },
                    { key: "out",        label: "স্টক বাদ",    icon: <Minus size={13}/> },
                    { key: "adjustment", label: "Adjustment",   icon: <RotateCcw size={13}/> },
                  ] as const).map((t) => (
                    <button key={t.key} type="button" onClick={() => setAdjType(t.key)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: adjType === t.key ? S.primary : "transparent",
                        color: adjType === t.key ? "#FFF" : S.secondary,
                        borderColor: adjType === t.key ? S.primary : S.border,
                      }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: S.muted }}>পরিমাণ</label>
                <input type="number" value={adjQty} min="1" onChange={e => setAdjQty(e.target.value)}
                  style={inp(focused === "qty")} onFocus={() => setFocused("qty")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: S.muted }}>কারণ (ঐচ্ছিক)</label>
                <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)}
                  placeholder="যেমন: নষ্ট হয়েছে, নতুন মাল এসেছে..."
                  style={inp(focused === "reason")} onFocus={() => setFocused("reason")} onBlur={() => setFocused(null)} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdj(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleAdjustment} disabled={adjSaving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: S.primary }}>
                {adjSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventory" className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft size={20} style={{ color: S.secondary }} /></Link>
        <h2 className="font-semibold text-lg flex-1" style={{ color: S.text }}>{product.name}</h2>
        <button onClick={() => window.open(`/inventory/${id}/label`, "_blank")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium"
          style={{ borderColor: S.border, color: S.secondary }}>
          <Printer size={14} /> Label
        </button>
        <button onClick={() => setShowAdj(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium"
          style={{ borderColor: S.border, color: S.primary }}>
          <RotateCcw size={14} /> Stock Adjust
        </button>
        <Link href={`/inventory/${id}/edit`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: S.primary }}>
          <Pencil size={14} /> সম্পাদনা
        </Link>
      </div>

      {/* Product info */}
      <div className="rounded-2xl border p-5 mb-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex gap-4">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--c-bg)" }}>
              <Package size={28} style={{ color: S.muted }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate" style={{ color: S.text }}>{product.name}</p>
            {product.sku && <p className="text-xs mt-0.5" style={{ color: S.muted }}>SKU: {product.sku}</p>}
            {product.category && <p className="text-xs" style={{ color: S.muted }}>{product.category}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: stockBg, color: stockColor }}>{stockLabel}</span>
              <span className="text-sm font-bold" style={{ color: S.text }}>{product.stockQty} টি</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${S.border}` }}>
          {[
            { label: "ক্রয়মূল্য", value: formatBDT(product.buyPrice) },
            { label: "বিক্রয়মূল্য", value: formatBDT(product.sellPrice) },
            { label: "মুনাফা", value: formatBDT(product.sellPrice - product.buyPrice) },
          ].map((item) => (
            <div key={item.label} className="text-center p-2 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
              <p className="text-xs mb-1" style={{ color: S.muted }}>{item.label}</p>
              <p className="text-sm font-semibold" style={{ color: S.text }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stock History */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: "var(--c-surface)", borderBottom: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>স্টক ইতিহাস</h3>
          <span className="text-xs" style={{ color: S.muted }}>{movements.length} টি রেকর্ড</span>
        </div>
        {movements.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm" style={{ color: S.muted }}>এখনো কোনো স্টক movement নেই।</p>
            <p className="text-xs mt-1" style={{ color: S.muted }}>Adjustment করলে এখানে দেখাবে।</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: S.border }}>
            {movements.map((mv) => {
              const meta = TYPE_META[mv.type] ?? { label: mv.type, color: S.muted, icon: "up" as const };
              const isPositive = mv.quantity > 0;
              return (
                <div key={mv.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}>
                    {isPositive
                      ? <TrendingUp size={15} style={{ color: meta.color }} />
                      : <TrendingDown size={15} style={{ color: meta.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{meta.label}</span>
                      {mv.orderId && <span className="text-xs" style={{ color: S.muted }}>Order #{mv.orderId.slice(-6).toUpperCase()}</span>}
                    </div>
                    {mv.reason && <p className="text-xs mt-0.5 truncate" style={{ color: S.secondary }}>{mv.reason}</p>}
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{mv.user.name} · {formatBanglaDate(mv.createdAt)}</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: isPositive ? "var(--c-primary)" : "#E24B4A" }}>
                    {isPositive ? "+" : ""}{mv.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
