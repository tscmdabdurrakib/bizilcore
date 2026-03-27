"use client";

import { useEffect, useState } from "react";
import { Package, Loader2, Eye, EyeOff, Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  sellPrice: number;
  stockQty: number;
  storeVisible: boolean;
  storeFeatured: boolean;
}

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch] = useState("");

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchProducts() {
    const r = await fetch("/api/products");
    if (r.ok) {
      const data = await r.json();
      setProducts(data.map((p: Product) => ({
        ...p,
        storeVisible: p.storeVisible ?? true,
        storeFeatured: p.storeFeatured ?? false,
      })));
    }
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  async function toggleField(id: string, field: "storeVisible" | "storeFeatured", current: boolean) {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, [field]: !current } : p));
    const r = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !current }),
    });
    if (!r.ok) {
      setProducts(ps => ps.map(p => p.id === id ? { ...p, [field]: current } : p));
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  async function bulkToggle(visible: boolean) {
    setBulkLoading(true);
    const promises = products.map(p =>
      fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeVisible: visible }),
      })
    );
    await Promise.all(promises);
    setProducts(ps => ps.map(p => ({ ...p, storeVisible: visible })));
    setBulkLoading(false);
    showToast("success", visible ? "সব পণ্য দেখানো হবে ✓" : "সব পণ্য লুকানো হয়েছে ✓");
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const visibleCount = products.filter(p => p.storeVisible).length;
  const featuredCount = products.filter(p => p.storeFeatured).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>স্টোরে পণ্য</h1>
            <p className="text-xs" style={{ color: S.muted }}>
              {visibleCount}টি দেখাচ্ছে · {featuredCount}টি featured
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => bulkToggle(true)}
            disabled={bulkLoading}
            className="px-3 h-9 rounded-xl border text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            style={{ borderColor: S.border, color: S.primary }}>
            <Eye size={14} /> সব দেখাও
          </button>
          <button
            onClick={() => bulkToggle(false)}
            disabled={bulkLoading}
            className="px-3 h-9 rounded-xl border text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            style={{ borderColor: S.border, color: S.muted }}>
            <EyeOff size={14} /> সব লুকাও
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="পণ্য খুঁজুন..."
        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
        style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Package size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">কোনো পণ্য পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--c-surface-raised)", borderBottom: `1px solid ${S.border}` }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>পণ্য</th>
                <th className="text-right px-4 py-3 text-xs font-semibold hidden sm:table-cell" style={{ color: S.muted }}>দাম</th>
                <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>স্টোরে দেখাবে</th>
                <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>Featured</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="border-b last:border-0" style={{ borderColor: S.border, backgroundColor: i % 2 === 1 ? "var(--c-surface-raised)" : S.surface }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} style={{ color: S.muted }} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: S.text }}>{p.name}</p>
                        {p.category && <p className="text-xs" style={{ color: S.muted }}>{p.category}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-sm font-medium" style={{ color: S.text }}>৳{p.sellPrice.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleField(p.id, "storeVisible", p.storeVisible)}
                      className="w-10 h-5 rounded-full relative transition-colors mx-auto block"
                      style={{ backgroundColor: p.storeVisible ? S.primary : S.border }}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.storeVisible ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleField(p.id, "storeFeatured", p.storeFeatured)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-colors"
                      style={{ backgroundColor: p.storeFeatured ? "#FFF3DC" : "var(--c-surface-raised)" }}>
                      <Star size={16} style={{ color: p.storeFeatured ? "#F59E0B" : S.muted }} fill={p.storeFeatured ? "#F59E0B" : "none"} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
