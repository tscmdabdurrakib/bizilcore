"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, X, Tag, Truck, Loader2, ShoppingCart } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Customer { id: string; name: string; phone: string | null; }
interface ProductVariant { id: string; name: string; size: string | null; color: string | null; sku: string | null; price: number | null; stockQty: number; }
interface Product { id: string; name: string; sellPrice: number; stockQty: number; hasVariants: boolean; variants: ProductVariant[]; }
interface ComboProduct { id: string; name: string; sellPrice: number; availableStock: number; isActive: boolean; }
interface OrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  comboId?: string;
  comboName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

const CUSTOMER_GROUPS = [
  { key: "regular", label: "Regular", emoji: "👤", desc: "সাধারণ" },
  { key: "vip", label: "VIP", emoji: "⭐", desc: "বিশেষ" },
  { key: "wholesale", label: "Wholesale", emoji: "🏪", desc: "পাইকারি" },
];

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCustomerId = searchParams.get("customerId");
  const prefillCustomerName = searchParams.get("customerName");
  const prefillSuggestId = searchParams.get("suggestId");
  const hasPrefillName = !prefillCustomerId && !!prefillCustomerName;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [customerMode, setCustomerMode] = useState<"existing" | "new">(hasPrefillName ? "new" : "existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState(prefillCustomerId ?? "");
  const [newCustomerName, setNewCustomerName] = useState(prefillCustomerName ?? "");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerFacebook, setNewCustomerFacebook] = useState("");
  const [newCustomerGroup, setNewCustomerGroup] = useState("regular");

  const [items, setItems] = useState<OrderItem[]>([{ productId: "", productName: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
  const [paidAmount, setPaidAmount] = useState("0");
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [source, setSource] = useState("facebook");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [wantCourier, setWantCourier] = useState(false);
  const [newOrderCourier, setNewOrderCourier] = useState("steadfast");
  const [newOrderTrackId, setNewOrderTrackId] = useState("");
  const [bookingCourier, setBookingCourier] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/customers?all=1").then(r => r.json()),
      fetch("/api/products?withVariants=1").then(r => r.json()),
      fetch("/api/combos?active=1").then(r => r.json()),
    ]).then(([c, p, combo]) => {
      setCustomers(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
      setCombos(Array.isArray(combo) ? combo : []);
      setLoading(false);
    });
  }, []);

  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const delivery = parseFloat(deliveryCharge || "0") || 0;
  const totalAmount = itemsTotal + delivery;
  const due = Math.max(0, totalAmount - parseFloat(paidAmount || "0"));

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }
  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)); }

  function handleProductSelect(idx: number, value: string) {
    if (value.startsWith("combo:")) {
      const comboId = value.replace("combo:", "");
      const combo = combos.find(c => c.id === comboId);
      setItems(prev => prev.map((it, i) => {
        if (i !== idx) return it;
        const up = combo?.sellPrice ?? 0;
        return { ...it, productId: "", productName: "", comboId, comboName: combo?.name ?? "", unitPrice: up, subtotal: up * it.quantity, variantId: "", variantName: "" };
      }));
    } else {
      const product = products.find(p => p.id === value);
      setItems(prev => prev.map((it, i) => {
        if (i !== idx) return it;
        const up = product?.sellPrice ?? 0;
        return { ...it, productId: value, productName: product?.name ?? "", comboId: "", comboName: "", unitPrice: up, subtotal: up * it.quantity, variantId: "", variantName: "" };
      }));
    }
  }

  function handleVariantSelect(idx: number, variantId: string) {
    const item = items[idx];
    const product = products.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === variantId);
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const up = variant?.price ?? product?.sellPrice ?? 0;
      return { ...it, variantId, variantName: variant?.name ?? "", unitPrice: up, subtotal: up * it.quantity };
    }));
  }

  function handleQtyChange(idx: number, qty: number) {
    setItems(prev => prev.map((it, i) => i !== idx ? it : { ...it, quantity: qty, subtotal: it.unitPrice * qty }));
  }

  function addItem() {
    setItems(prev => [...prev, { productId: "", productName: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const MANUAL_COURIERS_NEW = ["sundarban", "paperfly", "carrybee", "delivery_tiger", "karatoa", "janani", "sheba", "sa_paribahan", "other"];
  const isManualCourierSelected = MANUAL_COURIERS_NEW.includes(newOrderCourier);

  const NEW_ORDER_COURIERS = [
    { key: "pathao", label: "Pathao" }, { key: "steadfast", label: "Steadfast" },
    { key: "redx", label: "RedX" }, { key: "ecourier", label: "eCourier" },
    { key: "sundarban", label: "Sundarban" }, { key: "paperfly", label: "Paperfly" },
    { key: "carrybee", label: "CarryBee" }, { key: "delivery_tiger", label: "Delivery Tiger" },
    { key: "karatoa", label: "Karatoa" }, { key: "janani", label: "Janani" },
    { key: "sheba", label: "Sheba" }, { key: "sa_paribahan", label: "SA Paribahan" },
    { key: "other", label: "অন্য" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter(it => it.productId || it.comboId);
    if (validItems.length === 0) { showToast("error", "অন্তত একটি পণ্য যোগ করুন।"); return; }
    if (wantCourier && isManualCourierSelected && !newOrderTrackId.trim()) {
      showToast("error", "Tracking ID দিন অথবা কুরিয়ার বন্ধ রাখুন।"); return;
    }
    setSubmitting(true);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerMode === "existing" && selectedCustomerId ? selectedCustomerId : null,
        newCustomerName: customerMode === "new" ? newCustomerName : null,
        newCustomerPhone: customerMode === "new" ? newCustomerPhone : null,
        newCustomerAddress: customerMode === "new" ? newCustomerAddress : null,
        newCustomerFacebook: customerMode === "new" ? newCustomerFacebook : null,
        newCustomerGroup: customerMode === "new" ? newCustomerGroup : null,
        items: validItems.map(it => ({
          productId: it.comboId ? null : it.productId,
          comboId: it.comboId || null,
          variantId: it.variantId || null,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
        paidAmount, deliveryCharge, source, note, tags,
      }),
    });
    if (r.ok) {
      const newOrder = await r.json();
      if (prefillSuggestId) {
        await fetch(`/api/suggested-orders`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: prefillSuggestId, status: "converted" }),
        }).catch(() => {});
      }
      if (wantCourier && newOrder?.id) {
        setBookingCourier(true);
        const courierBody: Record<string, string> = { orderId: newOrder.id, courierName: newOrderCourier };
        if (isManualCourierSelected) courierBody.manualTrackId = newOrderTrackId.trim();
        const cr = await fetch("/api/courier", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courierBody),
        }).catch(() => null);
        const cd = cr ? await cr.json() : null;
        setBookingCourier(false);
        if (cr?.ok) {
          showToast("success", `অর্ডার সেভ ও কুরিয়ার বুক হয়েছে ✓ ${cd?.trackingId ?? ""}`);
        } else {
          showToast("success", `অর্ডার সেভ হয়েছে, কুরিয়ার বুক হয়নি: ${cd?.error ?? "retry"}`);
        }
      } else {
        showToast("success", "অর্ডার সফলভাবে সেভ হয়েছে ✓");
      }
      setTimeout(() => router.push("/orders"), 1200);
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
    setSubmitting(false);
  }

  const S = {
    surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
    secondary: "var(--c-text-sub)", primary: "var(--c-primary)", muted: "var(--c-text-muted)",
  };

  const inputCls = (key: string) => ({
    borderColor: focused === key ? "var(--c-primary)" : "var(--c-border)",
    color: S.text,
    backgroundColor: S.surface,
  });

  if (loading) return (
    <div className="max-w-[760px] mx-auto animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: "var(--c-bg)" }} />)}
    </div>
  );

  return (
    <div className="max-w-[760px] mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders"
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-colors hover:bg-gray-50"
          style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <ChevronLeft size={20} style={{ color: S.secondary }} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-xl" style={{ color: S.text }}>নতুন অর্ডার</h2>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>সব তথ্য পূরণ করুন ও অর্ডার সেভ করুন</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)", border: "1px solid #A3D9C9" }}>
          <ShoppingCart size={16} style={{ color: "#0F6E56" }} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "#0F6E56" }}>মোট</p>
            <p className="text-sm font-extrabold leading-none" style={{ color: "#0F6E56" }}>{formatBDT(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {[
          { num: "১", label: "কাস্টমার" },
          { num: "২", label: "পণ্য" },
          { num: "৩", label: "পেমেন্ট" },
          { num: "৪", label: "ট্যাগ" },
          { num: "৫", label: "কুরিয়ার" },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "var(--c-primary-light)", border: "1.5px solid var(--c-primary)" }}>
              <span className="text-[11px] font-black" style={{ color: "var(--c-primary)" }}>{step.num}</span>
              <span className="text-[11px] font-bold" style={{ color: "var(--c-primary)" }}>{step.label}</span>
            </div>
            {i < 4 && <div className="w-4 h-px flex-shrink-0" style={{ backgroundColor: "var(--c-border)" }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── 1. Customer Card ────────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>১</div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>কাস্টমার</h3>
            <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#E8F5F0", color: "#0F6E56" }}>ধাপ ১/৫</span>
          </div>
          <div className="p-5">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-5">
              {[
                { key: "existing", label: "বিদ্যমান কাস্টমার", emoji: "👤" },
                { key: "new", label: "নতুন কাস্টমার", emoji: "✨" },
              ].map((m) => (
                <button key={m.key} type="button" onClick={() => setCustomerMode(m.key as "existing" | "new")}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border"
                  style={{
                    backgroundColor: customerMode === m.key ? "#0F6E56" : S.surface,
                    color: customerMode === m.key ? "#fff" : S.secondary,
                    borderColor: customerMode === m.key ? "#0F6E56" : S.border,
                    boxShadow: customerMode === m.key ? "0 4px 12px #0F6E5640" : "none",
                  }}>
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {customerMode === "existing" ? (
              <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                style={{ ...inputCls("customer"), appearance: "auto" } as React.CSSProperties}
                onFocus={() => setFocused("customer")} onBlur={() => setFocused(null)}>
                <option value="">কাস্টমার বেছে নিন...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>)}
              </select>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>নাম *</label>
                    <input type="text" placeholder="কাস্টমারের নাম" value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                      style={inputCls("newname") as React.CSSProperties}
                      onFocus={() => setFocused("newname")} onBlur={() => setFocused(null)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ফোন নম্বর</label>
                    <input type="tel" placeholder="01XXXXXXXXX" value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                      style={inputCls("newphone") as React.CSSProperties}
                      onFocus={() => setFocused("newphone")} onBlur={() => setFocused(null)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ঠিকানা</label>
                  <input type="text" placeholder="বিস্তারিত ঠিকানা" value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                    style={inputCls("address") as React.CSSProperties}
                    onFocus={() => setFocused("address")} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>Facebook Profile URL</label>
                  <input type="url" placeholder="https://facebook.com/..." value={newCustomerFacebook}
                    onChange={(e) => setNewCustomerFacebook(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                    style={inputCls("fb") as React.CSSProperties}
                    onFocus={() => setFocused("fb")} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: S.muted }}>Customer Group</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CUSTOMER_GROUPS.map(g => (
                      <button key={g.key} type="button" onClick={() => setNewCustomerGroup(g.key)}
                        className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-center transition-all"
                        style={{
                          borderColor: newCustomerGroup === g.key ? "var(--c-primary)" : S.border,
                          backgroundColor: newCustomerGroup === g.key ? "var(--c-primary-light)" : "transparent",
                          color: newCustomerGroup === g.key ? S.primary : S.secondary,
                        }}>
                        <span className="text-xl">{g.emoji}</span>
                        <span className="text-xs font-bold">{g.label}</span>
                        <span className="text-xs" style={{ color: newCustomerGroup === g.key ? S.primary : S.muted }}>{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Products Card ───────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}>২</div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>পণ্য</h3>
            <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
              {items.filter(i => i.productId || i.comboId).length} টি পণ্য যোগ
            </span>
          </div>
          <div className="p-5 space-y-3">
            {items.map((it, idx) => {
              const selectedProduct = products.find(p => p.id === it.productId);
              const selectedCombo = combos.find(c => c.id === it.comboId);
              const isCombo = !!it.comboId;
              return (
                <div key={idx} className="rounded-xl border p-3.5 space-y-3"
                  style={{ borderColor: isCombo ? "#F59E0B" : S.border, backgroundColor: isCombo ? "#FFFBEB" : "var(--c-bg)" }}>
                  <div className="flex items-center gap-2">
                    <select
                      value={it.comboId ? `combo:${it.comboId}` : it.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, backgroundColor: isCombo ? "#FFFBEB" : S.surface, appearance: "auto" } as React.CSSProperties}>
                      <option value="">পণ্য বা কমবো বেছে নিন</option>
                      {products.length > 0 && (
                        <optgroup label="━━ পণ্য ━━">
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatBDT(p.sellPrice)} (স্টক: {p.stockQty})</option>)}
                        </optgroup>
                      )}
                      {combos.length > 0 && (
                        <optgroup label="━━ কমবো প্যাক 📦 ━━">
                          {combos.map(c => <option key={c.id} value={`combo:${c.id}`}>📦 {c.name} — {formatBDT(c.sellPrice)} (স্টক: {c.availableStock})</option>)}
                        </optgroup>
                      )}
                    </select>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-red-50 flex-shrink-0 transition-colors">
                        <Trash2 size={15} style={{ color: "#E24B4A" }} />
                      </button>
                    )}
                  </div>
                  {isCombo && selectedCombo && (
                    <div className="text-xs px-2.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                      📦 কমবো প্যাক · স্টক: {selectedCombo.availableStock} সেট
                    </div>
                  )}
                  {!isCombo && selectedProduct?.hasVariants && selectedProduct.variants.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: S.muted }}>Variant বেছে নিন *</p>
                      <select value={it.variantId ?? ""} onChange={e => handleVariantSelect(idx, e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, appearance: "auto" } as React.CSSProperties}>
                        <option value="">-- Variant বেছে নিন --</option>
                        {selectedProduct.variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name}{v.price != null ? ` — ${formatBDT(v.price)}` : ""} (স্টক: {v.stockQty})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: S.muted }}>পরিমাণ</p>
                      <input type="number" value={it.quantity} min="1" onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                        className="w-full h-9 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: S.muted }}>একক মূল্য</p>
                      <div className="h-9 flex items-center px-3 rounded-xl text-sm" style={{ backgroundColor: "var(--c-surface)", color: S.secondary, border: `1px solid ${S.border}` }}>
                        {formatBDT(it.unitPrice)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: S.muted }}>মোট</p>
                      <div className="h-9 flex items-center px-3 rounded-xl text-sm font-bold" style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                        {formatBDT(it.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={addItem}
              className="flex items-center gap-2 text-sm font-semibold px-3 py-2.5 rounded-xl border w-full justify-center transition-colors hover:bg-gray-50"
              style={{ borderColor: S.border, color: S.secondary, borderStyle: "dashed" }}>
              <Plus size={15} /> পণ্য বা কমবো যোগ করুন
            </button>
          </div>
        </div>

        {/* ── 3. Payment Card ───────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>৩</div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>পেমেন্ট</h3>
            <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: due > 0 ? "#FEE2E2" : "#D1FAE5", color: due > 0 ? "#DC2626" : "#059669" }}>
              {due > 0 ? `বাকি ${formatBDT(due)}` : "সম্পূর্ণ পরিশোধিত"}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ডেলিভারি চার্জ (৳)</label>
              <input type="number" value={deliveryCharge} min="0" onChange={(e) => setDeliveryCharge(e.target.value)}
                placeholder="০"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                style={inputCls("delivery") as React.CSSProperties}
                onFocus={() => setFocused("delivery")} onBlur={() => setFocused(null)} />
            </div>

            {/* Payment Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-3.5" style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#0F6E56" }}>মোট</p>
                <p className="text-lg font-extrabold" style={{ color: "#0F6E56" }}>{formatBDT(totalAmount)}</p>
              </div>
              <div className="rounded-2xl p-3.5" style={{ border: `2px solid ${focused === "paid" ? "#0F6E56" : S.border}`, backgroundColor: S.surface }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: S.muted }}>পরিশোধিত</p>
                <input type="number" value={paidAmount} min="0" onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="০"
                  className="w-full text-lg font-extrabold outline-none bg-transparent border-none p-0"
                  style={{ color: S.text }}
                  onFocus={() => setFocused("paid")} onBlur={() => setFocused(null)} />
              </div>
              <div className="rounded-2xl p-3.5" style={{ background: due > 0 ? "linear-gradient(135deg, #FEE2E2, #FECACA)" : "linear-gradient(135deg, #D1FAE5, #A7F3D0)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: due > 0 ? "#DC2626" : "#059669" }}>বাকি</p>
                <p className="text-lg font-extrabold" style={{ color: due > 0 ? "#DC2626" : "#059669" }}>{formatBDT(due)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>অর্ডার সোর্স</label>
                <select value={source} onChange={(e) => setSource(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, appearance: "auto" } as React.CSSProperties}>
                  {["facebook", "whatsapp", "direct", "referral"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>নোট (ঐচ্ছিক)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="অতিরিক্ত তথ্য..."
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={inputCls("note") as React.CSSProperties}
                  onFocus={() => setFocused("note")} onBlur={() => setFocused(null)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Tags Card ──────────────────────── */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #EF9F27, #D97706)" }}>৪</div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>ট্যাগ</h3>
            <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#FFF3DC", color: "#EF9F27" }}>ঐচ্ছিক</span>
          </div>
          <div className="p-5">
            <div className="flex gap-2 mb-3">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="ট্যাগ লিখুন ও Enter চাপুন"
                className="flex-1 h-9 px-3 rounded-xl border text-sm outline-none"
                style={inputCls("tag") as React.CSSProperties}
                onFocus={() => setFocused("tag")} onBlur={() => setFocused(null)} />
              <button type="button" onClick={addTag}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>যোগ</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {["urgent", "vip", "gift-wrap", "prepaid", "cod"].map(pt => (
                <button key={pt} type="button" onClick={() => { if (!tags.includes(pt)) setTags(prev => [...prev, pt]); }}
                  className="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors"
                  style={{
                    borderColor: tags.includes(pt) ? S.primary : S.border,
                    color: tags.includes(pt) ? S.primary : S.muted,
                    backgroundColor: tags.includes(pt) ? "var(--c-primary-light)" : "transparent",
                  }}>
                  {pt}
                </button>
              ))}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                    {t}
                    <button type="button" onClick={() => removeTag(t)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 5. Courier Card (optional) ─────────── */}
        <div className="rounded-2xl border overflow-hidden transition-all"
          style={{ borderColor: wantCourier ? "#3B82F6" : S.border, borderWidth: wantCourier ? 2 : 1 }}>
          <button type="button" onClick={() => setWantCourier(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors"
            style={{ backgroundColor: wantCourier ? "#EFF6FF" : "var(--c-bg)" }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                style={{ background: wantCourier ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "linear-gradient(135deg, #9CA3AF, #6B7280)" }}>৫</div>
              <span className="text-sm font-bold" style={{ color: wantCourier ? "#3B82F6" : S.secondary }}>
                কুরিয়ার বুক করুন
              </span>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: wantCourier ? "#DBEAFE" : S.border, color: wantCourier ? "#3B82F6" : S.muted }}>ঐচ্ছিক</span>
            </div>
            <div className={`w-11 h-6 rounded-full flex-shrink-0 flex items-center px-0.5 transition-all ${wantCourier ? "justify-end" : "justify-start"}`}
              style={{ backgroundColor: wantCourier ? "#3B82F6" : S.border }}>
              <div className="w-5 h-5 bg-white rounded-full shadow-md transition-transform" />
            </div>
          </button>
          {wantCourier && (
            <div className="px-5 pb-5 pt-4 space-y-3 border-t" style={{ borderColor: S.border }}>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>কুরিয়ার বেছে নিন</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {NEW_ORDER_COURIERS.map(c => (
                    <button key={c.key} type="button"
                      onClick={() => { setNewOrderCourier(c.key); setNewOrderTrackId(""); }}
                      className="px-2 py-2 rounded-xl text-xs font-semibold border text-center transition-all"
                      style={{
                        backgroundColor: newOrderCourier === c.key ? "var(--c-primary-light)" : "transparent",
                        borderColor: newOrderCourier === c.key ? S.primary : S.border,
                        color: newOrderCourier === c.key ? S.primary : S.secondary,
                      }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {isManualCourierSelected && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>Tracking ID</label>
                  <input type="text" value={newOrderTrackId} onChange={e => setNewOrderTrackId(e.target.value)}
                    placeholder="Courier ওয়েবসাইট থেকে বুক করে ID দিন"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  <p className="text-xs mt-1" style={{ color: S.muted }}>
                    প্রথমে courier এর website থেকে বুক করুন, তারপর Tracking ID এখানে লিখুন।
                  </p>
                </div>
              )}
              {!isManualCourierSelected && (
                <p className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                  অর্ডার সেভ হওয়ার সাথে সাথে {NEW_ORDER_COURIERS.find(c => c.key === newOrderCourier)?.label} এ স্বয়ংক্রিয়ভাবে বুক হবে।
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Order Summary Bar ─────────────────── */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: "var(--c-bg)", borderColor: S.border }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: S.muted }}>অর্ডার সারাংশ</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px]" style={{ color: S.muted }}>পণ্য</p>
                <p className="text-sm font-bold" style={{ color: S.text }}>{items.filter(i => i.productId || i.comboId).length}টি</p>
              </div>
              <div className="w-px h-8" style={{ backgroundColor: S.border }} />
              <div>
                <p className="text-[10px]" style={{ color: S.muted }}>ডেলিভারি</p>
                <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(delivery)}</p>
              </div>
              <div className="w-px h-8" style={{ backgroundColor: S.border }} />
              <div>
                <p className="text-[10px]" style={{ color: S.muted }}>মোট</p>
                <p className="text-sm font-extrabold" style={{ color: "#0F6E56" }}>{formatBDT(totalAmount)}</p>
              </div>
            </div>
            {due > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ backgroundColor: "#FEE2E2" }}>
                <span className="text-xs font-bold" style={{ color: "#DC2626" }}>বাকি: {formatBDT(due)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Submit ────────────────────────────── */}
        <button type="submit" disabled={submitting || bookingCourier}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-60 transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-xl"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
          {(submitting || bookingCourier) && <Loader2 size={18} className="animate-spin" />}
          {bookingCourier ? "কুরিয়ার বুক হচ্ছে..." : submitting ? "সেভ হচ্ছে..." : wantCourier ? "অর্ডার সেভ ও কুরিয়ার বুক করুন" : "অর্ডার সেভ করুন"}
        </button>
        <div className="h-4" />

      </form>
    </div>
  );
}
