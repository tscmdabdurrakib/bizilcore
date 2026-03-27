"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Variant { id: string; name: string; stockQty: number; }
interface Product { id: string; name: string; sellPrice: number; stockQty: number; variants: Variant[]; }
interface ComboItemForm { productId: string; variantId: string; quantity: number; }

const inp = (focused: boolean) => ({
  height: "40px", border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", color: "var(--c-text)", backgroundColor: "var(--c-surface)",
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

export default function NewComboPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [items, setItems] = useState<ComboItemForm[]>([{ productId: "", variantId: "", quantity: 1 }, { productId: "", variantId: "", quantity: 1 }]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/products?all=1&withVariants=1").then(r => r.json()).then(data => {
      setProducts(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  function updateItem(idx: number, field: keyof ComboItemForm, value: string | number) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (field === "productId") return { ...it, productId: String(value), variantId: "" };
      return { ...it, [field]: value };
    }));
  }

  function addItem() {
    setItems(prev => [...prev, { productId: "", variantId: "", quantity: 1 }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { showToast("error", "কমবোর নাম দিন।"); return; }
    if (!sellPrice || parseFloat(sellPrice) <= 0) { showToast("error", "বিক্রয় মূল্য দিন।"); return; }
    const validItems = items.filter(it => it.productId);
    if (validItems.length < 2) { showToast("error", "কমবোতে অন্তত ২টি ভিন্ন পণ্য থাকতে হবে।"); return; }

    setSubmitting(true);
    const r = await fetch("/api/combos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim(), sellPrice: parseFloat(sellPrice), imageUrl: imageUrl.trim(), items: validItems }),
    });
    setSubmitting(false);
    if (r.ok) {
      showToast("success", "কমবো তৈরি হয়েছে ✓");
      setTimeout(() => router.push("/inventory?tab=combos"), 800);
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "সমস্যা হয়েছে।");
    }
  }

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", muted: "var(--c-text-muted)" };

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventory?tab=combos" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} style={{ color: S.secondary }} />
        </Link>
        <h2 className="font-semibold text-lg" style={{ color: S.text }}>নতুন কমবো প্যাক</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic info */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>কমবো তথ্য</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: S.muted }}>কমবোর নাম *</label>
              <input type="text" placeholder="যেমন: Dress + Bag কমবো" value={name} onChange={e => setName(e.target.value)}
                style={inp(focused === "name")} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: S.muted }}>বিক্রয় মূল্য (৳) *</label>
              <input type="number" placeholder="০" value={sellPrice} onChange={e => setSellPrice(e.target.value)} min="0"
                style={inp(focused === "price")} onFocus={() => setFocused("price")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: S.muted }}>বিবরণ (ঐচ্ছিক)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="কমবো সম্পর্কে সংক্ষিপ্ত বিবরণ..."
                className="w-full px-3 py-2 text-sm rounded-xl border resize-none outline-none"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: S.muted }}>ছবির লিঙ্ক (ঐচ্ছিক)</label>
              <input type="url" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                style={inp(focused === "image")} onFocus={() => setFocused("image")} onBlur={() => setFocused(null)} />
            </div>
          </div>
        </div>

        {/* Components */}
        <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>কমবোর পণ্যসমূহ</h3>
          <p className="text-xs mb-4" style={{ color: S.muted }}>অর্ডার হলে প্রতিটি পণ্যের স্টক স্বয়ংক্রিয়ভাবে কমে যাবে।</p>
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-xl border p-3" style={{ borderColor: S.border }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold" style={{ color: S.muted }}>উপাদান {idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="ml-auto p-1 rounded hover:bg-red-50">
                      <Trash2 size={14} style={{ color: "#E24B4A" }} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select value={it.productId} onChange={e => updateItem(idx, "productId", e.target.value)}
                      style={{ ...inp(false), appearance: "auto" }}>
                      <option value="">পণ্য বেছে নিন</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatBDT(p.sellPrice)} (স্টক: {p.stockQty})</option>)}
                    </select>
                  </div>
                  <div>
                    <input type="number" value={it.quantity} min="1" onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      placeholder="পরিমাণ" style={{ ...inp(false), textAlign: "center" }} />
                  </div>
                </div>
                {it.productId && (() => {
                  const prod = products.find(p => p.id === it.productId);
                  return prod?.variants && prod.variants.length > 0 ? (
                    <div className="mt-2">
                      <label className="block text-xs mb-1" style={{ color: S.muted }}>ভেরিয়েন্ট (ঐচ্ছিক)</label>
                      <select value={it.variantId} onChange={e => updateItem(idx, "variantId", e.target.value)}
                        style={{ ...inp(false), appearance: "auto" }}>
                        <option value="">— কোনো ভেরিয়েন্ট নেই (পণ্যের স্টক ব্যবহার করুন)</option>
                        {prod.variants.map(v => <option key={v.id} value={v.id}>{v.name} (স্টক: {v.stockQty})</option>)}
                      </select>
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem}
            className="mt-3 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border w-full justify-center hover:bg-gray-50 transition-colors"
            style={{ borderColor: S.border, color: S.secondary }}>
            <Plus size={15} /> পণ্য যোগ করুন
          </button>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ backgroundColor: S.primary }}>
          {submitting ? "তৈরি হচ্ছে..." : "কমবো তৈরি করুন"}
        </button>
      </form>
    </div>
  );
}
