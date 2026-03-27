"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Wand2, Plus, Trash2, Layers, Sparkles, Loader2, Lightbulb, X } from "lucide-react";
import ProductImageManager, { ProductImage } from "@/components/ProductImageManager";

const SIZES = ["S", "M", "L", "XL", "XXL", "2XL", "3XL", "Free Size"];
const COLORS = ["লাল", "নীল", "সবুজ", "হলুদ", "কালো", "সাদা", "গোলাপী", "কমলা", "বেগুনী", "ধূসর", "বাদামী"];

interface Category {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

const inp = (focused: boolean) => ({
  height: "40px",
  border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px",
  color: "var(--c-text)",
  backgroundColor: "var(--c-surface)",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
});

interface Variant {
  id: string; size: string; color: string; sku: string;
  buyPrice: string; price: string; stockQty: string;
}

function newVariant(): Variant {
  return { id: Math.random().toString(36).slice(2), size: "", color: "", sku: "", buyPrice: "", price: "", stockQty: "" };
}

export default function NewInventoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    name: "", category: "", sku: "", buyPrice: "", sellPrice: "",
    stockQty: "", lowStockAt: "5", description: "",
  });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([newVariant()]);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<{ suggestedMin: number; suggestedMax: number; reasoning: string; profitMargin: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const S = {
    surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
    secondary: "var(--c-text-sub)", primary: "var(--c-primary)", muted: "var(--c-text-muted)", bg: "var(--c-bg)",
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/user/plan")
      .then(r => r.json())
      .then(d => { if (d.plan) setPlan(d.plan as "free" | "pro" | "business"); })
      .catch(() => {});
    
    // Fetch categories
    fetch("/api/categories")
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});
  }, [session?.user?.id]);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      showToast("error", "ক্যাটাগরির নাম আবশ্যক");
      return;
    }

    setCreatingCategory(true);
    try {
      const r = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: null,
        }),
      });

      const data = await r.json();
      if (r.ok) {
        showToast("success", "নতুন ক্যাটাগরি তৈরি হয়েছে ✓");
        setCategories(prev => [...prev, data]);
        set("category", data.name);
        setShowCategoryModal(false);
        setNewCategoryName("");
      } else {
        console.error("Category API error:", data);
        showToast("error", data.error || "সমস্যা হয়েছে");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      showToast("error", "সংযোগ সমস্যা - আবার চেষ্টা করুন");
    } finally {
      setCreatingCategory(false);
    }
  }

  function setVariantField(id: string, field: keyof Variant, value: string) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function addVariant() { setVariants(prev => [...prev, newVariant()]); }
  function removeVariant(id: string) { setVariants(prev => prev.filter(v => v.id !== id)); }

  function autoFillVariantName(v: Variant) {
    const parts = [v.size, v.color].filter(Boolean);
    return parts.join(" / ") || "নতুন ভেরিয়েন্ট";
  }

  async function autoGenerateSKU() {
    const r = await fetch("/api/products");
    const products = await r.json();
    const num = String(products.length + 1).padStart(3, "0");
    set("sku", `PRD-${num}`);
  }

  async function askAIDescription() {
    if (!form.name.trim()) { showToast("error", "আগে পণ্যের নাম লিখুন।"); return; }
    setAiDescLoading(true);
    const r = await fetch("/api/ai/product-description", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: form.name, category: form.category, price: form.sellPrice }),
    });
    const d = await r.json();
    setAiDescLoading(false);
    if (r.ok) set("description", d.description);
    else showToast("error", d.error ?? "AI সমস্যা হয়েছে।");
  }

  async function askAIPricing() {
    if (!form.name.trim() || !form.buyPrice) { showToast("error", "পণ্যের নাম ও ক্রয় মূল্য দিন।"); return; }
    setAiPriceLoading(true);
    const r = await fetch("/api/ai/pricing-suggestion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: form.name, category: form.category, costPrice: form.buyPrice }),
    });
    const d = await r.json();
    setAiPriceLoading(false);
    if (r.ok) setAiPriceSuggestion(d);
    else showToast("error", d.error ?? "AI সমস্যা হয়েছে।");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (hasVariants && variants.length === 0) {
      showToast("error", "কমপক্ষে একটি Variant যোগ করুন।");
      return;
    }
    setLoading(true);

    const totalStock = hasVariants
      ? variants.reduce((s, v) => s + (parseInt(v.stockQty) || 0), 0)
      : (parseInt(form.stockQty) || 0);

    const primaryImage = images[0];

    const r = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        imageUrl: primaryImage?.src ?? null,
        images: images.length > 0 ? images : null,
        hasVariants,
        stockQty: totalStock,
        variants: hasVariants ? variants.map(v => ({
          name: autoFillVariantName(v),
          size: v.size || null,
          color: v.color || null,
          sku: v.sku || null,
          price: v.price ? parseFloat(v.price) : null,
          buyPrice: v.buyPrice ? parseFloat(v.buyPrice) : null,
          stockQty: parseInt(v.stockQty) || 0,
        })) : [],
      }),
    });
    setLoading(false);
    if (r.ok) {
      showToast("success", "পণ্য সফলভাবে সেভ হয়েছে ✓");
      setTimeout(() => router.push("/inventory"), 1000);
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventory" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={20} style={{ color: S.secondary }} />
        </Link>
        <h2 className="font-semibold text-lg" style={{ color: S.text }}>নতুন পণ্য</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="text-sm font-semibold" style={{ color: S.text }}>মূল তথ্য</h3>

          {/* Image Manager */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: S.text }}>পণ্যের ছবি</label>
            <ProductImageManager
              plan={plan}
              images={images}
              onChange={setImages}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>পণ্যের নাম *</label>
            <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
              required placeholder="পণ্যের নাম লিখুন"
              style={inp(focused === "name")}
              onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>SKU / কোড</label>
            <div className="flex gap-2">
              <input type="text" value={form.sku} onChange={e => set("sku", e.target.value)}
                placeholder="PRD-001"
                style={{ ...inp(focused === "sku"), flex: 1 }}
                onFocus={() => setFocused("sku")} onBlur={() => setFocused(null)} />
              <button type="button" onClick={autoGenerateSKU}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors"
                style={{ borderColor: S.border, color: S.primary }}>
                <Wand2 size={14} /> Auto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ক্যাটাগরি</label>
            <div className="flex gap-2">
              <select value={form.category} onChange={e => set("category", e.target.value)}
                style={{ ...inp(false), appearance: "auto", flex: 1 }}>
                <option value="">বেছে নিন</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center justify-center px-3 rounded-xl border text-sm font-medium flex-shrink-0 hover:bg-gray-50 transition-colors"
                style={{ borderColor: S.border, color: S.primary }}
                title="নতুন ক্যাটাগরি তৈরি করুন"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: S.text }}>পণ্যের বিবরণ</label>
              <button type="button" onClick={askAIDescription} disabled={aiDescLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{ background: "rgba(15,110,86,0.08)", color: S.primary }}>
                {aiDescLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI দিয়ে লিখুন
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="পণ্যের বিস্তারিত বিবরণ লিখুন অথবা AI দিয়ে স্বয়ংক্রিয়ভাবে তৈরি করুন..."
              rows={3}
              onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)}
              style={{
                width: "100%", padding: "10px 12px", fontSize: "14px", borderRadius: "8px",
                border: `1px solid ${focused === "desc" ? "var(--c-primary)" : S.border}`,
                backgroundColor: S.surface, color: S.text, outline: "none", resize: "vertical",
                lineHeight: "1.5",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ক্রয় মূল্য (৳)</label>
              <input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)}
                placeholder="০" min="0"
                style={inp(focused === "buy")}
                onFocus={() => setFocused("buy")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>বিক্রয় মূল্য (৳) *</label>
              <input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)}
                placeholder="০" min="0" required
                style={inp(focused === "sell")}
                onFocus={() => setFocused("sell")} onBlur={() => setFocused(null)} />
            </div>
          </div>

          {/* AI Pricing */}
          <div>
            <button type="button" onClick={askAIPricing} disabled={aiPriceLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 hover:bg-gray-50"
              style={{ borderColor: S.border, color: S.primary }}>
              {aiPriceLoading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
              AI মূল্য সাজেশন
            </button>
            {aiPriceSuggestion && (
              <div className="mt-2 p-3 rounded-xl" style={{ background: "rgba(15,110,86,0.06)", border: `1px solid rgba(15,110,86,0.2)` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold" style={{ color: S.primary }}>
                    সাজেস্টেড মূল্য: ৳{aiPriceSuggestion.suggestedMin} – ৳{aiPriceSuggestion.suggestedMax}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(15,110,86,0.12)", color: S.primary }}>
                    {aiPriceSuggestion.profitMargin} মুনাফা
                  </span>
                </div>
                <p className="text-xs" style={{ color: S.secondary }}>{aiPriceSuggestion.reasoning}</p>
                <button type="button" onClick={() => set("sellPrice", String(aiPriceSuggestion.suggestedMax))}
                  className="mt-1.5 text-xs font-medium underline" style={{ color: S.primary }}>
                  এই মূল্য ব্যবহার করুন →
                </button>
              </div>
            )}
          </div>

          {!hasVariants && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>স্টক পরিমাণ</label>
                <input type="number" value={form.stockQty} onChange={e => set("stockQty", e.target.value)}
                  placeholder="০" min="0"
                  style={inp(focused === "stock")}
                  onFocus={() => setFocused("stock")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>Low stock alert</label>
                <input type="number" value={form.lowStockAt} onChange={e => set("lowStockAt", e.target.value)}
                  placeholder="৫" min="0"
                  style={inp(focused === "low")}
                  onFocus={() => setFocused("low")} onBlur={() => setFocused(null)} />
              </div>
            </div>
          )}
        </div>

        {/* Variants Toggle */}
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--c-primary-light)" }}>
                <Layers size={16} style={{ color: S.primary }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: S.text }}>পণ্যের Variants আছে?</p>
                <p className="text-xs" style={{ color: S.muted }}>Size, Color ভেদে আলাদা stock ও price</p>
              </div>
            </div>
            <button type="button" onClick={() => setHasVariants(v => !v)}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ backgroundColor: hasVariants ? S.primary : S.border }}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hasVariants ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Variants Table */}
        {hasVariants && (
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: S.text }}>Variants ({variants.length}টি)</h3>
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                <Plus size={12} /> নতুন যোগ করুন
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={v.id} className="border rounded-xl p-3 space-y-3" style={{ borderColor: S.border }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: S.muted }}>Variant {idx + 1}</span>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(v.id)}
                        className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>Size</label>
                      <div className="flex gap-1 flex-wrap mb-1">
                        {SIZES.map(s => (
                          <button key={s} type="button"
                            onClick={() => setVariantField(v.id, "size", v.size === s ? "" : s)}
                            className="px-2 py-0.5 rounded text-xs transition-colors"
                            style={{
                              backgroundColor: v.size === s ? S.primary : "var(--c-bg)",
                              color: v.size === s ? "white" : S.secondary,
                              border: `1px solid ${v.size === s ? S.primary : S.border}`,
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={v.size} onChange={e => setVariantField(v.id, "size", e.target.value)}
                        placeholder="অথবা লিখুন..."
                        style={{ ...inp(false), height: "34px", fontSize: "12px" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>রঙ</label>
                      <div className="flex gap-1 flex-wrap mb-1">
                        {COLORS.map(c => (
                          <button key={c} type="button"
                            onClick={() => setVariantField(v.id, "color", v.color === c ? "" : c)}
                            className="px-2 py-0.5 rounded text-xs transition-colors"
                            style={{
                              backgroundColor: v.color === c ? S.primary : "var(--c-bg)",
                              color: v.color === c ? "white" : S.secondary,
                              border: `1px solid ${v.color === c ? S.primary : S.border}`,
                            }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={v.color} onChange={e => setVariantField(v.id, "color", e.target.value)}
                        placeholder="অথবা লিখুন..."
                        style={{ ...inp(false), height: "34px", fontSize: "12px" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>SKU</label>
                      <input type="text" value={v.sku} onChange={e => setVariantField(v.id, "sku", e.target.value)}
                        placeholder="ঐচ্ছিক" style={{ ...inp(false), height: "34px", fontSize: "12px" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>ক্রয় মূল্য (৳)</label>
                      <input type="number" value={v.buyPrice} onChange={e => setVariantField(v.id, "buyPrice", e.target.value)}
                        placeholder="ঐচ্ছিক" min="0" style={{ ...inp(false), height: "34px", fontSize: "12px" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>বিক্রয় মূল্য (৳)</label>
                      <input type="number" value={v.price} onChange={e => setVariantField(v.id, "price", e.target.value)}
                        placeholder="ঐচ্ছিক" min="0" style={{ ...inp(false), height: "34px", fontSize: "12px" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>স্টক পরিমাণ</label>
                    <input type="number" value={v.stockQty} onChange={e => setVariantField(v.id, "stockQty", e.target.value)}
                      placeholder="০" min="0" style={{ ...inp(false), height: "34px", fontSize: "12px" }} />
                  </div>
                </div>
              ))}
            </div>

            {variants.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "var(--c-bg)", color: S.muted }}>
                <Layers size={12} />
                মোট স্টক: {variants.reduce((s, v) => s + (parseInt(v.stockQty) || 0), 0)} টি
              </div>
            )}
          </div>
        )}

        {/* Category Creation Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg" style={{ color: S.text }}>নতুন ক্যাটাগরি তৈরি করুন</h3>
                <button onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }}>
                  <X size={18} style={{ color: S.muted }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>
                    ক্যাটাগরির নাম *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="যেমন: পোশাক, জুয়েলারি, খাবার..."
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ 
                      backgroundColor: S.surface, 
                      borderColor: S.border, 
                      color: S.text,
                      height: "40px",
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: S.border, color: S.text }}
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                    style={{ backgroundColor: S.primary }}
                  >
                    {creatingCategory ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ backgroundColor: S.primary }}>
            {loading ? "সেভ হচ্ছে..." : "পণ্য সেভ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}
