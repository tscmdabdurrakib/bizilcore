"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Layers, Sparkles, Loader2, Lightbulb, Wand2, Package, ChevronDown, ChevronUp } from "lucide-react";

const SIZES = ["S","M","L","XL","XXL","2XL","3XL","Free Size"];
const COLORS = ["লাল","নীল","সবুজ","হলুদ","কালো","সাদা","গোলাপী","কমলা","বেগুনী","ধূসর","বাদামী"];

interface Category { id: string; name: string; }
interface Variant { id: string; size: string; color: string; sku: string; buyPrice: string; price: string; stockQty: string; }
function newVariant(): Variant {
  return { id: Math.random().toString(36).slice(2), size: "", color: "", sku: "", buyPrice: "", price: "", stockQty: "" };
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

export default function ProductCreatePanel({ onClose, onCreated }: Props) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<{ suggestedMin: number; suggestedMax: number; reasoning: string; profitMargin: string } | null>(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([newVariant()]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"basic" | "pricing" | "variants">("basic");

  const [form, setForm] = useState({
    name: "", category: "", sku: "", buyPrice: "", sellPrice: "",
    stockQty: "", lowStockAt: "5", description: "",
  });

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetch("/api/user/plan").then(r => r.json()).then(d => { if (d.plan) setPlan(d.plan); }).catch(() => {});
    fetch("/api/categories").then(r => r.json()).then(data => setCategories(data)).catch(() => {});
  }, []);

  const closeWithAnim = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function setVariantField(id: string, field: keyof Variant, value: string) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function autoFillVariantName(v: Variant) {
    return [v.size, v.color].filter(Boolean).join(" / ") || "নতুন ভেরিয়েন্ট";
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

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    const r = await fetch("/api/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), description: null }),
    });
    const data = await r.json();
    setCreatingCat(false);
    if (r.ok) {
      showToast("success", "ক্যাটাগরি তৈরি হয়েছে ✓");
      setCategories(prev => [...prev, data]);
      set("category", data.name);
      setShowCategoryModal(false);
      setNewCatName("");
    } else {
      showToast("error", data.error || "সমস্যা হয়েছে");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { showToast("error", "পণ্যের নাম দিন।"); return; }
    if (!form.sellPrice) { showToast("error", "বিক্রয় মূল্য দিন।"); return; }
    if (hasVariants && variants.length === 0) { showToast("error", "কমপক্ষে একটি Variant যোগ করুন।"); return; }
    setSubmitting(true);
    const totalStock = hasVariants
      ? variants.reduce((s, v) => s + (parseInt(v.stockQty) || 0), 0)
      : (parseInt(form.stockQty) || 0);
    const r = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, imageUrl: null, images: null, hasVariants, stockQty: totalStock,
        variants: hasVariants ? variants.map(v => ({
          name: autoFillVariantName(v),
          size: v.size || null, color: v.color || null, sku: v.sku || null,
          price: v.price ? parseFloat(v.price) : null,
          buyPrice: v.buyPrice ? parseFloat(v.buyPrice) : null,
          stockQty: parseInt(v.stockQty) || 0,
        })) : [],
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      showToast("success", "পণ্য সফলভাবে সেভ হয়েছে ✓");
      setTimeout(() => { onCreated(); closeWithAnim(); }, 900);
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে।");
    }
  }

  const inp = (f: string) => ({
    borderColor: focused === f ? "var(--c-primary)" : S.border,
    color: S.text, backgroundColor: S.surface,
  });

  const margin = form.buyPrice && form.sellPrice
    ? Math.round(((parseFloat(form.sellPrice) - parseFloat(form.buyPrice)) / parseFloat(form.buyPrice)) * 100)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ backgroundColor: visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)", backdropFilter: visible ? "blur(2px)" : "none" }}
        onClick={closeWithAnim}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{
          width: "min(560px, 100vw)",
          backgroundColor: "var(--c-bg)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.32,0,0,1)",
          borderLeft: "1px solid var(--c-border)",
        }}
      >
        {/* Toast */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl"
            style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>
            <Package size={16} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold" style={{ color: S.text }}>নতুন পণ্য যোগ</h2>
            <p className="text-[11px]" style={{ color: S.muted }}>ইনভেন্টরিতে নতুন পণ্য যোগ করুন</p>
          </div>
          {margin !== null && (
            <div className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold"
              style={{ background: margin >= 20 ? "linear-gradient(135deg, #E8F5F0, #C8EDE3)" : "linear-gradient(135deg, #FEF3C7, #FDE68A)", color: margin >= 20 ? "#0F6E56" : "#92400E" }}>
              মুনাফা {margin}%
            </div>
          )}
          <button onClick={closeWithAnim}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
            <X size={16} style={{ color: S.muted }} />
          </button>
        </div>

        {/* Section pills */}
        <div className="flex items-center gap-2 px-5 py-3 border-b overflow-x-auto flex-shrink-0"
          style={{ borderColor: S.border, backgroundColor: S.bg }}>
          {[
            { key: "basic" as const, label: "মূল তথ্য", color: "#0F6E56", gradient: "linear-gradient(135deg,#0F6E56,#0A5442)" },
            { key: "pricing" as const, label: "মূল্য ও স্টক", color: "#8B5CF6", gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)" },
            { key: "variants" as const, label: "Variants", color: "#3B82F6", gradient: "linear-gradient(135deg,#3B82F6,#1D4ED8)" },
          ].map(sec => (
            <button key={sec.key} onClick={() => setExpandedSection(sec.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 transition-all"
              style={{
                background: expandedSection === sec.key ? sec.gradient : "transparent",
                color: expandedSection === sec.key ? "#fff" : S.muted,
                border: `1.5px solid ${expandedSection === sec.key ? "transparent" : S.border}`,
              }}>
              {sec.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} id="product-create-form" className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4 pb-28">

            {/* ── Basic Info ── */}
            <PanelSection
              title="মূল তথ্য" icon="📦" color="#0F6E56"
              expanded={expandedSection === "basic"}
              onToggle={() => setExpandedSection(s => s === "basic" ? "pricing" : "basic")}
            >
              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>পণ্যের নাম *</label>
                  <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required
                    placeholder="পণ্যের নাম লিখুন"
                    className="w-full h-11 px-3 rounded-xl border text-sm outline-none transition-all"
                    style={{ ...inp("name"), borderWidth: focused === "name" ? 2 : 1 }}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
                </div>
                {/* SKU */}
                <div>
                  <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>SKU / কোড</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.sku} onChange={e => set("sku", e.target.value)}
                      placeholder="PRD-001"
                      className="flex-1 h-11 px-3 rounded-xl border text-sm outline-none"
                      style={{ ...inp("sku"), borderWidth: focused === "sku" ? 2 : 1 }}
                      onFocus={() => setFocused("sku")} onBlur={() => setFocused(null)} />
                    <button type="button" onClick={autoGenerateSKU}
                      className="flex items-center gap-1.5 px-3 rounded-xl border text-sm font-medium flex-shrink-0 hover:opacity-80 transition-opacity"
                      style={{ borderColor: S.border, color: S.primary, backgroundColor: S.surface }}>
                      <Wand2 size={13} /> Auto
                    </button>
                  </div>
                </div>
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>ক্যাটাগরি</label>
                  <div className="flex gap-2">
                    <select value={form.category} onChange={e => set("category", e.target.value)}
                      className="flex-1 h-11 px-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, color: form.category ? S.text : S.muted, backgroundColor: S.surface, appearance: "auto" } as React.CSSProperties}>
                      <option value="">বেছে নিন</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCategoryModal(true)}
                      className="w-11 h-11 rounded-xl border flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
                      style={{ borderColor: S.border, color: S.primary, backgroundColor: S.surface }}
                      title="নতুন ক্যাটাগরি">
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: S.muted }}>বিবরণ</label>
                    <button type="button" onClick={askAIDescription} disabled={aiDescLoading}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      style={{ background: "rgba(15,110,86,0.08)", color: S.primary }}>
                      {aiDescLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI লিখুন
                    </button>
                  </div>
                  <textarea value={form.description} onChange={e => set("description", e.target.value)}
                    placeholder="পণ্যের বিবরণ..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: focused === "desc" ? "var(--c-primary)" : S.border, backgroundColor: S.surface, color: S.text }}
                    onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)} />
                </div>
              </div>
            </PanelSection>

            {/* ── Pricing & Stock ── */}
            <PanelSection
              title="মূল্য ও স্টক" icon="💰" color="#8B5CF6"
              expanded={expandedSection === "pricing"}
              onToggle={() => setExpandedSection(s => s === "pricing" ? "basic" : "pricing")}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>ক্রয় মূল্য (৳)</label>
                    <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: focused === "buy" ? "#8B5CF6" : S.border }}>
                      <span className="px-2.5 h-10 flex items-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: "#F5F3FF", color: "#8B5CF6", borderRight: `1px solid ${S.border}` }}>৳</span>
                      <input type="number" value={form.buyPrice} onChange={e => set("buyPrice", e.target.value)} min="0" placeholder="০"
                        className="flex-1 h-10 px-2 text-sm outline-none bg-transparent" style={{ color: S.text }}
                        onFocus={() => setFocused("buy")} onBlur={() => setFocused(null)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>বিক্রয় মূল্য (৳) *</label>
                    <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: focused === "sell" ? "#0F6E56" : S.border }}>
                      <span className="px-2.5 h-10 flex items-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: "#E8F5F0", color: "#0F6E56", borderRight: `1px solid ${S.border}` }}>৳</span>
                      <input type="number" value={form.sellPrice} onChange={e => set("sellPrice", e.target.value)} min="0" placeholder="০" required
                        className="flex-1 h-10 px-2 text-sm outline-none bg-transparent" style={{ color: S.text }}
                        onFocus={() => setFocused("sell")} onBlur={() => setFocused(null)} />
                    </div>
                  </div>
                </div>

                {/* Margin Indicator */}
                {margin !== null && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: margin >= 20 ? "#E8F5F0" : margin >= 10 ? "#FEF3C7" : "#FEE2E2" }}>
                    <span className="text-sm">{margin >= 20 ? "✅" : margin >= 10 ? "⚠️" : "❌"}</span>
                    <span className="text-xs font-bold" style={{ color: margin >= 20 ? "#0F6E56" : margin >= 10 ? "#92400E" : "#DC2626" }}>
                      মুনাফা: {margin}% {margin >= 20 ? "— ভালো!" : margin >= 10 ? "— ঠিক আছে" : "— কম মুনাফা"}
                    </span>
                    <button type="button" onClick={askAIPricing} disabled={aiPriceLoading}
                      className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      style={{ background: "rgba(15,110,86,0.1)", color: "#0F6E56" }}>
                      {aiPriceLoading ? <Loader2 size={10} className="animate-spin" /> : <Lightbulb size={10} />}
                      AI Suggestion
                    </button>
                  </div>
                )}
                {!margin && form.buyPrice && (
                  <button type="button" onClick={askAIPricing} disabled={aiPriceLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 hover:opacity-80"
                    style={{ borderColor: S.border, color: S.primary, backgroundColor: S.surface }}>
                    {aiPriceLoading ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                    AI মূল্য সাজেশন
                  </button>
                )}
                {aiPriceSuggestion && (
                  <div className="p-3 rounded-xl border" style={{ borderColor: "#A3D9C9", backgroundColor: "#E8F5F0" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: "#0F6E56" }}>
                      সাজেস্টেড: ৳{aiPriceSuggestion.suggestedMin} – ৳{aiPriceSuggestion.suggestedMax}
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: "#C8EDE3" }}>{aiPriceSuggestion.profitMargin}</span>
                    </p>
                    <p className="text-[11px] mb-2" style={{ color: "#0A5442" }}>{aiPriceSuggestion.reasoning}</p>
                    <button type="button" onClick={() => set("sellPrice", String(aiPriceSuggestion.suggestedMax))}
                      className="text-xs font-bold underline" style={{ color: "#0F6E56" }}>
                      এই মূল্য ব্যবহার করুন →
                    </button>
                  </div>
                )}

                {!hasVariants && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>স্টক পরিমাণ</label>
                      <input type="number" value={form.stockQty} onChange={e => set("stockQty", e.target.value)} min="0" placeholder="০"
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: focused === "stock" ? "#0F6E56" : S.border, backgroundColor: S.surface, color: S.text }}
                        onFocus={() => setFocused("stock")} onBlur={() => setFocused(null)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>Low Stock Alert</label>
                      <input type="number" value={form.lowStockAt} onChange={e => set("lowStockAt", e.target.value)} min="0" placeholder="৫"
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: focused === "low" ? "#0F6E56" : S.border, backgroundColor: S.surface, color: S.text }}
                        onFocus={() => setFocused("low")} onBlur={() => setFocused(null)} />
                    </div>
                  </div>
                )}
              </div>
            </PanelSection>

            {/* ── Variants ── */}
            <PanelSection
              title={`Variants ${hasVariants ? `(${variants.length}টি)` : ""}`} icon="🎨" color="#3B82F6"
              expanded={expandedSection === "variants"}
              onToggle={() => setExpandedSection(s => s === "variants" ? "basic" : "variants")}
              headerRight={
                <button type="button" onClick={e => { e.stopPropagation(); setHasVariants(v => !v); }}
                  className="relative w-10 h-5 rounded-full flex-shrink-0 flex items-center px-0.5 transition-colors"
                  style={{ backgroundColor: hasVariants ? "#3B82F6" : S.border }}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${hasVariants ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              }
            >
              {hasVariants ? (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={v.id} className="border rounded-xl p-3 space-y-2" style={{ borderColor: S.border }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold" style={{ color: S.muted }}>Variant {idx + 1}</span>
                        {variants.length > 1 && (
                          <button type="button" onClick={() => setVariants(prev => prev.filter(x => x.id !== v.id))}
                            className="p-1 rounded-lg hover:bg-red-50 transition-colors">
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold mb-1" style={{ color: S.muted }}>Size</p>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {SIZES.map(s => (
                              <button key={s} type="button"
                                onClick={() => setVariantField(v.id, "size", v.size === s ? "" : s)}
                                className="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                                style={{
                                  backgroundColor: v.size === s ? S.primary : S.bg,
                                  color: v.size === s ? "white" : S.muted,
                                  border: `1px solid ${v.size === s ? S.primary : S.border}`,
                                }}>{s}</button>
                            ))}
                          </div>
                          <input type="text" value={v.size} onChange={e => setVariantField(v.id, "size", e.target.value)}
                            placeholder="অথবা লিখুন..." className="w-full h-8 px-2 rounded-lg border text-xs outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold mb-1" style={{ color: S.muted }}>রঙ</p>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {COLORS.map(c => (
                              <button key={c} type="button"
                                onClick={() => setVariantField(v.id, "color", v.color === c ? "" : c)}
                                className="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                                style={{
                                  backgroundColor: v.color === c ? S.primary : S.bg,
                                  color: v.color === c ? "white" : S.muted,
                                  border: `1px solid ${v.color === c ? S.primary : S.border}`,
                                }}>{c}</button>
                            ))}
                          </div>
                          <input type="text" value={v.color} onChange={e => setVariantField(v.id, "color", e.target.value)}
                            placeholder="অথবা লিখুন..." className="w-full h-8 px-2 rounded-lg border text-xs outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { field: "sku", label: "SKU", placeholder: "ঐচ্ছিক" },
                          { field: "buyPrice", label: "ক্রয় মূল্য", placeholder: "০" },
                          { field: "price", label: "বিক্রয় মূল্য", placeholder: "০" },
                        ].map(col => (
                          <div key={col.field}>
                            <label className="block text-[10px] font-bold mb-1" style={{ color: S.muted }}>{col.label}</label>
                            <input type={col.field === "sku" ? "text" : "number"}
                              value={v[col.field as keyof Variant]}
                              onChange={e => setVariantField(v.id, col.field as keyof Variant, e.target.value)}
                              placeholder={col.placeholder} min="0"
                              className="w-full h-8 px-2 rounded-lg border text-xs outline-none"
                              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                          </div>
                        ))}
                        <div>
                          <label className="block text-[10px] font-bold mb-1" style={{ color: S.muted }}>স্টক</label>
                          <input type="number" value={v.stockQty}
                            onChange={e => setVariantField(v.id, "stockQty", e.target.value)}
                            placeholder="০" min="0"
                            className="w-full h-8 px-2 rounded-lg border text-xs outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setVariants(prev => [...prev, newVariant()])}
                    className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border-2 w-full justify-center transition-all hover:bg-blue-50"
                    style={{ borderColor: "#3B82F6", color: "#3B82F6", borderStyle: "dashed" }}>
                    <Plus size={13} /> নতুন Variant যোগ করুন
                  </button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs" style={{ color: S.muted }}>Variants চালু করুন Size, Color ভেদে আলাদা stock ও price রাখতে</p>
                </div>
              )}
            </PanelSection>

          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 border-t p-4" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          {form.name && (
            <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: S.muted }}>
              <span className="font-semibold truncate" style={{ color: S.text }}>{form.name}</span>
              {form.sellPrice && <span className="flex-shrink-0 font-extrabold" style={{ color: "#0F6E56" }}>৳{form.sellPrice}</span>}
              {hasVariants && <span className="flex-shrink-0">{variants.length}টি Variant</span>}
            </div>
          )}
          <button type="submit" form="product-create-form"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "সেভ হচ্ছে..." : "✓ পণ্য সেভ করুন"}
          </button>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCategoryModal(false)} />
          <div className="relative rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ backgroundColor: S.surface }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>নতুন ক্যাটাগরি</h3>
            <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
              placeholder="ক্যাটাগরির নাম"
              className="w-full h-11 px-3 rounded-xl border text-sm outline-none mb-3"
              style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }} autoFocus />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCategoryModal(false)}
                className="flex-1 h-10 rounded-xl border text-sm font-bold" style={{ borderColor: S.border, color: S.muted }}>
                বাতিল
              </button>
              <button type="button" onClick={handleCreateCategory} disabled={creatingCat}
                className="flex-1 h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>
                {creatingCat ? <Loader2 size={14} className="animate-spin" /> : null}
                তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PanelSection({
  title, icon, color, expanded, onToggle, children, headerRight
}: {
  title: string; icon: string; color: string; expanded: boolean; onToggle: () => void;
  children: React.ReactNode; headerRight?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: expanded ? color + "60" : "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
        style={{ backgroundColor: expanded ? color + "08" : "transparent" }}>
        <span className="text-base flex-shrink-0">{icon}</span>
        <span className="font-bold text-sm flex-1" style={{ color: "var(--c-text)" }}>{title}</span>
        {headerRight}
        {expanded ? <ChevronUp size={14} style={{ color: "var(--c-text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--c-text-muted)" }} />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: "var(--c-border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
