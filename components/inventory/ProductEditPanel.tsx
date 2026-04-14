"use client";

import { useEffect, useState, useRef } from "react";
import { X, Plus, Trash2, Layers, Sparkles, Loader2, Lightbulb, Package, DollarSign, BarChart3, Save, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import ProductImageManager, { ProductImage } from "@/components/ProductImageManager";

const SIZES = ["S", "M", "L", "XL", "XXL", "2XL", "3XL", "Free Size"];
const COLORS = ["লাল", "নীল", "সবুজ", "হলুদ", "কালো", "সাদা", "গোলাপী", "কমলা", "বেগুনী", "ধূসর", "বাদামী"];

interface Category {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  sku: string;
  buyPrice: string;
  price: string;
  stockQty: string;
  isNew?: boolean;
}

function variantFromDb(v: Record<string, unknown>): Variant {
  return {
    id: String(v.id), size: String(v.size ?? ""), color: String(v.color ?? ""),
    sku: String(v.sku ?? ""), buyPrice: v.buyPrice != null ? String(v.buyPrice) : "",
    price: v.price != null ? String(v.price) : "", stockQty: String(v.stockQty ?? 0),
  };
}

function newVariant(): Variant {
  return { id: Math.random().toString(36).slice(2), size: "", color: "", sku: "", buyPrice: "", price: "", stockQty: "", isNew: true };
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

interface Props {
  productId: string | null;
  onClose: () => void;
  onSaved: (productId: string) => void;
}

export default function ProductEditPanel({ productId, onClose, onSaved }: Props) {
  const [visible, setVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", sku: "", buyPrice: "", sellPrice: "", stockQty: "", lowStockAt: "5", description: "" });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<{ suggestedMin: number; suggestedMax: number; reasoning: string; profitMargin: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function setVariantField(vid: string, field: keyof Variant, value: string) {
    setVariants(prev => prev.map(v => v.id === vid ? { ...v, [field]: value } : v));
  }

  function addVariant() { setVariants(prev => [...prev, newVariant()]); }
  function removeVariant(vid: string) { setVariants(prev => prev.filter(v => v.id !== vid)); }

  function autoFillVariantName(v: Variant) {
    const parts = [v.size, v.color].filter(Boolean);
    return parts.join(" / ") || "নতুন ভেরিয়েন্ট";
  }

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!productId) {
      setVisible(false);
      return;
    }
    // Open panel instantly, show skeleton while data loads
    setLoading(true);
    setAiPriceSuggestion(null);
    setImages([]);
    setVariants([]);
    setForm({ name: "", category: "", sku: "", buyPrice: "", sellPrice: "", stockQty: "", lowStockAt: "5", description: "" });
    setVisible(true);

    Promise.all([
      fetch("/api/user/plan").then(r => r.json()).catch(() => ({})),
      fetch("/api/categories").then(r => r.json()).catch(() => []),
      fetch(`/api/products/${productId}`).then(r => r.json()),
    ]).then(([planData, cats, p]) => {
      if (planData.plan) setPlan(planData.plan);
      if (Array.isArray(cats)) setCategories(cats);
      setForm({
        name: p.name ?? "", category: p.category ?? "", sku: p.sku ?? "",
        buyPrice: String(p.buyPrice ?? ""), sellPrice: String(p.sellPrice ?? ""),
        stockQty: String(p.stockQty ?? "0"), lowStockAt: String(p.lowStockAt ?? "5"),
        description: p.description ?? "",
      });
      setHasVariants(!!p.hasVariants);
      if (Array.isArray(p.images) && p.images.length > 0) {
        setImages(p.images as unknown as ProductImage[]);
      } else if (p.imageUrl) {
        setImages([{ id: "legacy", type: "url", src: p.imageUrl, isPrimary: true, order: 0 }]);
      }
      if (p.variants?.length > 0) setVariants(p.variants.map(variantFromDb));
      else setVariants([newVariant()]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [productId]);

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) { showToast("error", "ক্যাটাগরির নাম আবশ্যক"); return; }
    setCreatingCategory(true);
    try {
      const r = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), description: null }),
      });
      const data = await r.json();
      if (r.ok) {
        showToast("success", "নতুন ক্যাটাগরি তৈরি হয়েছে ✓");
        setCategories(prev => [...prev, data]);
        set("category", data.name);
        setShowCategoryModal(false);
        setNewCategoryName("");
      } else {
        showToast("error", data.error || "সমস্যা হয়েছে");
      }
    } catch { showToast("error", "সংযোগ সমস্যা"); }
    finally { setCreatingCategory(false); }
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
    if (!productId || !form.name.trim()) return;
    if (hasVariants && variants.length === 0) { showToast("error", "কমপক্ষে একটি Variant থাকতে হবে।"); return; }
    setSaving(true);

    const variantData = hasVariants ? variants.map(v => ({
      name: autoFillVariantName(v), size: v.size || null, color: v.color || null, sku: v.sku || null,
      price: v.price ? parseFloat(v.price) : null, buyPrice: v.buyPrice ? parseFloat(v.buyPrice) : null,
      stockQty: parseInt(v.stockQty) || 0,
    })) : [];

    const totalStock = hasVariants
      ? variants.reduce((s, v) => s + (parseInt(v.stockQty) || 0), 0)
      : (parseInt(form.stockQty) || 0);

    const primaryImage = images[0];

    const [patchRes, variantRes] = await Promise.all([
      fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, category: form.category || null, sku: form.sku || null,
          buyPrice: parseFloat(form.buyPrice) || 0, sellPrice: parseFloat(form.sellPrice) || 0,
          stockQty: totalStock, lowStockAt: parseInt(form.lowStockAt) || 5,
          description: form.description?.trim() || null,
          imageUrl: primaryImage?.src ?? null,
          images: images.length > 0 ? images : null,
          hasVariants,
        }),
      }),
      fetch(`/api/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replaceAll: true, variants: variantData }),
      }),
    ]);

    setSaving(false);
    if (patchRes.ok && variantRes.ok) {
      showToast("success", "পণ্য আপডেট হয়েছে ✓");
      setTimeout(() => { onSaved(productId); handleClose(); }, 700);
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  }

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  if (!productId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Toast inside panel area */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">নতুন ক্যাটাগরি</h3>
              <button onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <label className={labelCls}>ক্যাটাগরির নাম *</label>
            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
              placeholder="যেমন: পোশাক, জুয়েলারি..." className={`${fieldCls} mb-4`} autoFocus
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">বাতিল</button>
              <button type="button" onClick={handleCreateCategory} disabled={creatingCategory}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
                style={{ backgroundColor: "var(--c-primary)" }}>
                {creatingCategory ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PANEL ── */}
      <div
        className="fixed z-50 bg-white flex flex-col"
        style={isDesktop ? {
          /* Desktop: right-side drawer */
          top: 0,
          right: 0,
          bottom: 0,
          width: "560px",
          borderLeft: "1px solid #F3F4F6",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        } : {
          /* Mobile/Tablet: bottom sheet */
          left: 0,
          right: 0,
          bottom: 0,
          height: "88svh",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          {/* Mobile drag indicator */}
          {!isDesktop && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
              <Package size={16} color="#fff" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm leading-tight">পণ্য সম্পাদনা</h2>
              {form.name && <p className="text-xs text-gray-400 truncate max-w-[200px]">{form.name}</p>}
            </div>
          </div>
          <button onClick={handleClose}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="edit-panel-form" className="p-5 space-y-4">

              {/* ── Basic Info ── */}
              <div className="bg-gray-50/60 rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
                    <Package size={13} color="#fff" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">মূল তথ্য</span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className={labelCls}>পণ্যের ছবি</label>
                    <ProductImageManager plan={plan} productId={productId!} images={images} onChange={setImages} />
                  </div>
                  <div>
                    <label className={labelCls}>পণ্যের নাম *</label>
                    <input type="text" value={form.name} onChange={e => set("name", e.target.value)}
                      required placeholder="পণ্যের নাম লিখুন" className={fieldCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>SKU / কোড</label>
                      <input type="text" value={form.sku} onChange={e => set("sku", e.target.value)}
                        placeholder="PRD-001" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>ক্যাটাগরি</label>
                      <div className="flex gap-2">
                        <select value={form.category} onChange={e => set("category", e.target.value)}
                          className={`${fieldCls} flex-1`} style={{ appearance: "auto" }}>
                          <option value="">বেছে নিন</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setShowCategoryModal(true)}
                          className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0">
                          <Plus size={15} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-gray-700">পণ্যের বিবরণ</label>
                      <button type="button" onClick={askAIDescription} disabled={aiDescLoading}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50">
                        {aiDescLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                        AI লিখুন
                      </button>
                    </div>
                    <textarea value={form.description} onChange={e => set("description", e.target.value)}
                      placeholder="পণ্যের বিবরণ লিখুন..." rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 resize-none" />
                  </div>
                </div>
              </div>

              {/* ── Pricing ── */}
              <div className="bg-gray-50/60 rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                    <DollarSign size={13} color="#fff" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">মূল্য নির্ধারণ</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>ক্রয় মূল্য (৳)</label>
                      <input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)}
                        placeholder="০" min="0" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>বিক্রয় মূল্য (৳) *</label>
                      <input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)}
                        placeholder="০" min="0" required className={fieldCls} />
                    </div>
                  </div>

                  {form.buyPrice && form.sellPrice && parseFloat(form.buyPrice) > 0 && parseFloat(form.sellPrice) > 0 && (
                    <div className="flex items-center gap-3 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <BarChart3 size={13} className="text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-bold text-emerald-700">
                        মুনাফা ৳{(parseFloat(form.sellPrice) - parseFloat(form.buyPrice)).toFixed(0)} · {(((parseFloat(form.sellPrice) - parseFloat(form.buyPrice)) / parseFloat(form.sellPrice)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <div>
                    <button type="button" onClick={askAIPricing} disabled={aiPriceLoading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                      {aiPriceLoading ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} className="text-amber-500" />}
                      AI মূল্য সাজেশন
                    </button>
                    {aiPriceSuggestion && (
                      <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-800">৳{aiPriceSuggestion.suggestedMin} – ৳{aiPriceSuggestion.suggestedMax}</span>
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">{aiPriceSuggestion.profitMargin}</span>
                        </div>
                        <p className="text-xs text-amber-700 mb-1.5">{aiPriceSuggestion.reasoning}</p>
                        <button type="button" onClick={() => set("sellPrice", String(aiPriceSuggestion.suggestedMax))}
                          className="text-xs font-bold text-amber-700 hover:underline">এই মূল্য ব্যবহার করুন →</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Stock (only if no variants) ── */}
              {!hasVariants && (
                <div className="bg-gray-50/60 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                      <BarChart3 size={13} color="#fff" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">স্টক</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>স্টক পরিমাণ</label>
                        <input type="number" value={form.stockQty} onChange={e => set("stockQty", e.target.value)}
                          placeholder="০" min="0" className={fieldCls} />
                      </div>
                      <div>
                        <label className={labelCls}>কম স্টক সতর্কতা</label>
                        <input type="number" value={form.lowStockAt} onChange={e => set("lowStockAt", e.target.value)}
                          placeholder="৫" min="0" className={fieldCls} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Variants Toggle ── */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Layers size={16} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Variants আছে?</p>
                      <p className="text-xs text-gray-500">Size, Color ভেদে আলাদা stock ও price</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setHasVariants(v => !v); if (!hasVariants && variants.length === 0) setVariants([newVariant()]); }}
                    style={{
                      position: "relative",
                      flexShrink: 0,
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: hasVariants ? "var(--c-primary)" : "#D1D5DB",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <span style={{
                      position: "absolute",
                      top: 3,
                      left: hasVariants ? 25 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
                      transition: "left 0.2s ease",
                      display: "block",
                    }} />
                  </button>
                </div>
              </div>

              {/* ── Variants ── */}
              {hasVariants && (
                <div className="bg-gray-50/60 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Layers size={13} className="text-violet-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-700">Variants ({variants.length}টি)</span>
                    </div>
                    <button type="button" onClick={addVariant}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                      <Plus size={12} /> নতুন
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {variants.map((v, idx) => (
                      <div key={v.id} className="bg-white border border-gray-100 rounded-xl p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                            #{idx + 1}{autoFillVariantName(v) !== "নতুন ভেরিয়েন্ট" ? ` · ${autoFillVariantName(v)}` : ""}
                          </span>
                          {variants.length > 1 && (
                            <button type="button" onClick={() => removeVariant(v.id)} className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 size={13} className="text-red-400" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Size</label>
                            <div className="flex gap-1 flex-wrap mb-1.5">
                              {SIZES.map(s => (
                                <button key={s} type="button"
                                  onClick={() => setVariantField(v.id, "size", v.size === s ? "" : s)}
                                  className="px-1.5 py-0.5 rounded-md text-xs font-semibold border transition-colors"
                                  style={{ backgroundColor: v.size === s ? "var(--c-primary)" : "#fff", color: v.size === s ? "#fff" : "#6B7280", borderColor: v.size === s ? "var(--c-primary)" : "#E5E7EB" }}>
                                  {s}
                                </button>
                              ))}
                            </div>
                            <input type="text" value={v.size} onChange={e => setVariantField(v.id, "size", e.target.value)}
                              placeholder="লিখুন..." className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 bg-white outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">রঙ</label>
                            <div className="flex gap-1 flex-wrap mb-1.5">
                              {COLORS.map(c => (
                                <button key={c} type="button"
                                  onClick={() => setVariantField(v.id, "color", v.color === c ? "" : c)}
                                  className="px-1.5 py-0.5 rounded-md text-xs font-semibold border transition-colors"
                                  style={{ backgroundColor: v.color === c ? "var(--c-primary)" : "#fff", color: v.color === c ? "#fff" : "#6B7280", borderColor: v.color === c ? "var(--c-primary)" : "#E5E7EB" }}>
                                  {c}
                                </button>
                              ))}
                            </div>
                            <input type="text" value={v.color} onChange={e => setVariantField(v.id, "color", e.target.value)}
                              placeholder="লিখুন..." className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 bg-white outline-none" />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "SKU", field: "sku" as keyof Variant, type: "text", ph: "ঐচ্ছিক" },
                            { label: "ক্রয় (৳)", field: "buyPrice" as keyof Variant, type: "number", ph: "০" },
                            { label: "বিক্রয় (৳)", field: "price" as keyof Variant, type: "number", ph: "০" },
                            { label: "স্টক", field: "stockQty" as keyof Variant, type: "number", ph: "০" },
                          ].map(({ label, field, type, ph }) => (
                            <div key={field}>
                              <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                              <input type={type} value={String(v[field])} onChange={e => setVariantField(v.id, field, e.target.value)}
                                placeholder={ph} min={type === "number" ? "0" : undefined}
                                className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-800 bg-white outline-none" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {variants.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-xl border border-violet-100">
                        <Layers size={12} className="text-violet-600" />
                        <span className="text-xs font-bold text-violet-700">
                          মোট স্টক: {variants.reduce((s, v) => s + (parseInt(v.stockQty) || 0), 0)} টি
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="h-4" />
            </form>
          )}
        </div>

        {/* Sticky Footer */}
        {!loading && (
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button type="button" onClick={handleClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button type="submit" form="edit-panel-form" disabled={saving}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--c-primary), #0A5442)" }}>
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> আপডেট হচ্ছে...</>
                : <><Save size={15} /> আপডেট করুন</>
              }
            </button>
          </div>
        )}
      </div>
    </>
  );
}
