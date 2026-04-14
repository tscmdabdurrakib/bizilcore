"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Layers, Sparkles, Loader2, Lightbulb, X, Package, Tag, DollarSign, BarChart3, Save } from "lucide-react";
import ProductImageManager, { ProductImage } from "@/components/ProductImageManager";

const SIZES = ["S", "M", "L", "XL", "XXL", "2XL", "3XL", "Free Size"];
const COLORS = ["লাল", "নীল", "সবুজ", "হলুদ", "কালো", "সাদা", "গোলাপী", "কমলা", "বেগুনী", "ধূসর", "বাদামী"];

interface Category {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
}

interface Variant { id: string; size: string; color: string; sku: string; buyPrice: string; price: string; stockQty: string; isNew?: boolean; }

function variantFromDb(v: Record<string, unknown>): Variant {
  return {
    id: String(v.id), size: String(v.size ?? ""), color: String(v.color ?? ""), sku: String(v.sku ?? ""),
    buyPrice: v.buyPrice != null ? String(v.buyPrice) : "", price: v.price != null ? String(v.price) : "",
    stockQty: String(v.stockQty ?? 0),
  };
}

function newVariant(): Variant {
  return { id: Math.random().toString(36).slice(2), size: "", color: "", sku: "", buyPrice: "", price: "", stockQty: "", isNew: true };
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function EditInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: "", category: "", sku: "", buyPrice: "", sellPrice: "", stockQty: "", lowStockAt: "5", description: "" });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetch("/api/user/plan")
      .then(r => r.json())
      .then(d => { if (d.plan) setPlan(d.plan as "free" | "pro" | "business"); })
      .catch(() => {});

    fetch("/api/categories")
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {});

    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(p => {
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
      })
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

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
    } catch {
      showToast("error", "সংযোগ সমস্যা");
    } finally {
      setCreatingCategory(false);
    }
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
      fetch(`/api/products/${id}`, {
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
      fetch(`/api/products/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replaceAll: true, variants: variantData }),
      }),
    ]);

    setSaving(false);
    if (patchRes.ok && variantRes.ok) {
      showToast("success", "পণ্য আপডেট হয়েছে ✓");
      setTimeout(() => router.push("/inventory"), 1000);
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  }

  if (loading) return (
    <div className="max-w-3xl animate-pulse space-y-4 pb-6">
      <div className="h-12 bg-gray-100 rounded-2xl" />
      {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="max-w-3xl pb-10">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">নতুন ক্যাটাগরি</h3>
                <p className="text-xs text-gray-500 mt-0.5">একটি নতুন পণ্য ক্যাটাগরি তৈরি করুন</p>
              </div>
              <button onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>ক্যাটাগরির নাম *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="যেমন: পোশাক, জুয়েলারি, খাবার..."
                  className={fieldCls}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCategoryModal(false); setNewCategoryName(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  বাতিল
                </button>
                <button type="button" onClick={handleCreateCategory} disabled={creatingCategory}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-colors"
                  style={{ backgroundColor: "var(--c-primary)" }}>
                  {creatingCategory ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventory"
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">পণ্য সম্পাদনা</h1>
            <p className="text-xs text-gray-500">পণ্যের তথ্য আপডেট করুন</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Basic Info Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>
              <Package size={15} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">মূল তথ্য</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Image Manager */}
            <div>
              <label className={labelCls}>পণ্যের ছবি</label>
              <ProductImageManager plan={plan} productId={id} images={images} onChange={setImages} />
            </div>

            <div>
              <label className={labelCls}>পণ্যের নাম *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required placeholder="পণ্যের নাম লিখুন" className={fieldCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>SKU / কোড</label>
                <input type="text" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                  placeholder="PRD-001" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>ক্যাটাগরি</label>
                <div className="flex gap-2">
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className={`${fieldCls} flex-1`} style={{ appearance: "auto" }}>
                    <option value="">বেছে নিন</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowCategoryModal(true)}
                    className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
                    title="নতুন ক্যাটাগরি">
                    <Plus size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">পণ্যের বিবরণ</label>
                <button type="button" onClick={askAIDescription} disabled={aiDescLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 bg-purple-50 text-purple-700 hover:bg-purple-100">
                  {aiDescLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI দিয়ে লিখুন
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="পণ্যের বিস্তারিত বিবরণ লিখুন অথবা AI দিয়ে স্বয়ংক্রিয়ভাবে তৈরি করুন..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Pricing Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
              <DollarSign size={15} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">মূল্য নির্ধারণ</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>ক্রয় মূল্য (৳)</label>
                <input type="number" value={form.buyPrice} onChange={e => setForm(p => ({ ...p, buyPrice: e.target.value }))}
                  placeholder="০" min="0" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>বিক্রয় মূল্য (৳) *</label>
                <input type="number" value={form.sellPrice} onChange={e => setForm(p => ({ ...p, sellPrice: e.target.value }))}
                  placeholder="০" min="0" required className={fieldCls} />
              </div>
            </div>

            {form.buyPrice && form.sellPrice && parseFloat(form.buyPrice) > 0 && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <BarChart3 size={15} className="text-emerald-600 flex-shrink-0" />
                <div className="flex gap-4 text-xs">
                  <span className="text-emerald-700 font-semibold">
                    মুনাফা: ৳{(parseFloat(form.sellPrice) - parseFloat(form.buyPrice)).toFixed(0)}
                  </span>
                  <span className="text-emerald-600">
                    মার্জিন: {(((parseFloat(form.sellPrice) - parseFloat(form.buyPrice)) / parseFloat(form.sellPrice)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            <div>
              <button type="button" onClick={askAIPricing} disabled={aiPriceLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                {aiPriceLoading ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} className="text-amber-500" />}
                AI মূল্য সাজেশন
              </button>
              {aiPriceSuggestion && (
                <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-amber-800">
                      সাজেস্টেড: ৳{aiPriceSuggestion.suggestedMin} – ৳{aiPriceSuggestion.suggestedMax}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-700">
                      {aiPriceSuggestion.profitMargin} মুনাফা
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">{aiPriceSuggestion.reasoning}</p>
                  <button type="button" onClick={() => set("sellPrice", String(aiPriceSuggestion.suggestedMax))}
                    className="mt-2 text-xs font-bold text-amber-700 hover:underline">
                    এই মূল্য ব্যবহার করুন →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stock Card ── */}
        {!hasVariants && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}>
                <BarChart3 size={15} color="#fff" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">স্টক ব্যবস্থাপনা</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>স্টক পরিমাণ</label>
                  <input type="number" value={form.stockQty} onChange={e => setForm(p => ({ ...p, stockQty: e.target.value }))}
                    placeholder="০" min="0" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>কম স্টক সতর্কতা</label>
                  <input type="number" value={form.lowStockAt} onChange={e => setForm(p => ({ ...p, lowStockAt: e.target.value }))}
                    placeholder="৫" min="0" className={fieldCls} />
                  <p className="text-xs text-gray-400 mt-1">এর নিচে গেলে সতর্কতা দেখাবে</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Variants Toggle ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50">
                <Layers size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">পণ্যের Variants আছে?</p>
                <p className="text-xs text-gray-500">Size, Color ভেদে আলাদা stock ও price</p>
              </div>
            </div>
            <button type="button"
              onClick={() => { setHasVariants(v => !v); if (!hasVariants && variants.length === 0) setVariants([newVariant()]); }}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
              style={{ backgroundColor: hasVariants ? "var(--c-primary)" : "#D1D5DB" }}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${hasVariants ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* ── Variants Section ── */}
        {hasVariants && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-100">
                  <Layers size={15} className="text-violet-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Variants ({variants.length}টি)</h3>
              </div>
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                <Plus size={13} /> নতুন যোগ
              </button>
            </div>

            <div className="p-5 space-y-4">
              {variants.map((v, idx) => (
                <div key={v.id} className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                      Variant {idx + 1}{autoFillVariantName(v) !== "নতুন ভেরিয়েন্ট" ? ` — ${autoFillVariantName(v)}` : ""}
                    </span>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(v.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Size</label>
                      <div className="flex gap-1 flex-wrap mb-2">
                        {SIZES.map(s => (
                          <button key={s} type="button"
                            onClick={() => setVariantField(v.id, "size", v.size === s ? "" : s)}
                            className="px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors border"
                            style={{
                              backgroundColor: v.size === s ? "var(--c-primary)" : "#fff",
                              color: v.size === s ? "white" : "#6B7280",
                              borderColor: v.size === s ? "var(--c-primary)" : "#E5E7EB",
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={v.size} onChange={e => setVariantField(v.id, "size", e.target.value)}
                        placeholder="অথবা লিখুন..." className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs text-gray-800 bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">রঙ</label>
                      <div className="flex gap-1 flex-wrap mb-2">
                        {COLORS.map(c => (
                          <button key={c} type="button"
                            onClick={() => setVariantField(v.id, "color", v.color === c ? "" : c)}
                            className="px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors border"
                            style={{
                              backgroundColor: v.color === c ? "var(--c-primary)" : "#fff",
                              color: v.color === c ? "white" : "#6B7280",
                              borderColor: v.color === c ? "var(--c-primary)" : "#E5E7EB",
                            }}>
                            {c}
                          </button>
                        ))}
                      </div>
                      <input type="text" value={v.color} onChange={e => setVariantField(v.id, "color", e.target.value)}
                        placeholder="অথবা লিখুন..." className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs text-gray-800 bg-white outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">SKU</label>
                      <input type="text" value={v.sku} onChange={e => setVariantField(v.id, "sku", e.target.value)}
                        placeholder="ঐচ্ছিক" className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs text-gray-800 bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">ক্রয় মূল্য (৳)</label>
                      <input type="number" value={v.buyPrice} onChange={e => setVariantField(v.id, "buyPrice", e.target.value)}
                        placeholder="ঐচ্ছিক" min="0" className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs text-gray-800 bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">বিক্রয় মূল্য (৳)</label>
                      <input type="number" value={v.price} onChange={e => setVariantField(v.id, "price", e.target.value)}
                        placeholder="ঐচ্ছিক" min="0" className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs text-gray-800 bg-white outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">স্টক পরিমাণ</label>
                    <input type="number" value={v.stockQty} onChange={e => setVariantField(v.id, "stockQty", e.target.value)}
                      placeholder="০" min="0" className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs text-gray-800 bg-white outline-none" />
                  </div>
                </div>
              ))}

              {variants.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-violet-50 rounded-xl border border-violet-100">
                  <Layers size={14} className="text-violet-600" />
                  <span className="text-xs font-bold text-violet-700">
                    মোট স্টক: {variants.reduce((s, v) => s + (parseInt(v.stockQty) || 0), 0)} টি
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Save / Cancel ── */}
        <div className="flex gap-3 pt-2">
          <Link href="/inventory"
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-center text-gray-700 hover:bg-gray-50 transition-colors">
            বাতিল
          </Link>
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, var(--c-primary), #0A5442)" }}>
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> আপডেট হচ্ছে...</>
            ) : (
              <><Save size={15} /> পণ্য আপডেট করুন</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
