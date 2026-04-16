"use client";

import { useEffect, useState, useRef } from "react";
import { X, Plus, Trash2, Tag, Truck, Loader2, ShoppingCart, ChevronDown, ChevronUp, ShoppingBag, ShieldX, ShieldAlert } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Customer { id: string; name: string; phone: string | null; }
interface ProductVariant { id: string; name: string; size: string | null; color: string | null; sku: string | null; price: number | null; stockQty: number; }
interface Product { id: string; name: string; sellPrice: number; stockQty: number; hasVariants: boolean; variants: ProductVariant[]; }
interface ComboProduct { id: string; name: string; sellPrice: number; availableStock: number; isActive: boolean; }
interface OrderItem {
  productId: string; productName: string;
  variantId?: string; variantName?: string;
  comboId?: string; comboName?: string;
  quantity: number; unitPrice: number; subtotal: number;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
  prefillCustomerName?: string;
  prefillSuggestId?: string;
}

const CUSTOMER_GROUPS = [
  { key: "regular", label: "Regular", emoji: "👤", desc: "সাধারণ" },
  { key: "vip", label: "VIP", emoji: "⭐", desc: "বিশেষ" },
  { key: "wholesale", label: "Wholesale", emoji: "🏪", desc: "পাইকারি" },
];
const MANUAL_COURIERS = ["sundarban","paperfly","carrybee","delivery_tiger","karatoa","janani","sheba","sa_paribahan","other"];
const ALL_COURIERS = [
  { key: "pathao", label: "Pathao" }, { key: "steadfast", label: "Steadfast" },
  { key: "redx", label: "RedX" }, { key: "ecourier", label: "eCourier" },
  { key: "sundarban", label: "Sundarban" }, { key: "paperfly", label: "Paperfly" },
  { key: "carrybee", label: "CarryBee" }, { key: "delivery_tiger", label: "Delivery Tiger" },
  { key: "karatoa", label: "Karatoa" }, { key: "janani", label: "Janani" },
  { key: "sheba", label: "Sheba" }, { key: "sa_paribahan", label: "SA Paribahan" },
  { key: "other", label: "অন্য" },
];

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

export default function OrderCreatePanel({ onClose, onCreated, prefillCustomerName, prefillSuggestId }: Props) {
  const hasPrefill = !!prefillCustomerName;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingCourier, setBookingCourier] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [visible, setVisible] = useState(false);

  const [customerMode, setCustomerMode] = useState<"existing" | "new">(hasPrefill ? "new" : "existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
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
  const [courierName, setCourierName] = useState("steadfast");
  const [trackId, setTrackId] = useState("");

  const [expandedSection, setExpandedSection] = useState<"customer" | "products" | "payment" | "tags" | "courier">("customer");
  const [phoneRisk, setPhoneRisk] = useState<{ riskLevel: string; flags: string[]; action?: string } | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [confirmRisky, setConfirmRisky] = useState(false);

  useEffect(() => {
    if (customerMode !== "new" || newCustomerPhone.replace(/\D/g, "").length < 11) {
      setPhoneRisk(null);
      setConfirmRisky(false);
      return;
    }
    const timer = setTimeout(() => {
      setCheckingPhone(true);
      fetch("/api/fake-order/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: newCustomerPhone, customerName: newCustomerName }),
      })
        .then(r => r.json())
        .then(d => { setPhoneRisk(d); setConfirmRisky(false); })
        .catch(() => setPhoneRisk(null))
        .finally(() => setCheckingPhone(false));
    }, 700);
    return () => clearTimeout(timer);
  }, [newCustomerPhone, customerMode, newCustomerName]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    Promise.all([
      fetch("/api/customers?all=1").then(r => r.json()),
      fetch("/api/products?withVariants=1").then(r => r.json()),
      fetch("/api/combos?active=1").then(r => r.json()),
    ]).then(([c, p, combo]) => {
      setCustomers(Array.isArray(c) ? c : []);
      setProducts(Array.isArray(p) ? p : []);
      setCombos(Array.isArray(combo) ? combo : []);
      setDataLoading(false);
    }).catch(() => setDataLoading(false));
  }, []);

  const closeWithAnim = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const itemsTotal = items.reduce((s, it) => s + it.subtotal, 0);
  const delivery = parseFloat(deliveryCharge || "0") || 0;
  const totalAmount = itemsTotal + delivery;
  const paid = parseFloat(paidAmount || "0") || 0;
  const due = Math.max(0, totalAmount - paid);

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

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  const isPhoneBlocked = phoneRisk?.riskLevel === "blocked" || phoneRisk?.action === "block";
  const isPhoneRisky = phoneRisk && phoneRisk.riskLevel !== "safe" && !isPhoneBlocked;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter(it => it.productId || it.comboId);
    if (validItems.length === 0) { showToast("error", "অন্তত একটি পণ্য যোগ করুন।"); return; }
    const isManual = MANUAL_COURIERS.includes(courierName);
    if (wantCourier && isManual && !trackId.trim()) {
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
          quantity: it.quantity, unitPrice: it.unitPrice, subtotal: it.subtotal,
        })),
        paidAmount, deliveryCharge, source, note, tags,
        forceCreate: confirmRisky,
      }),
    });

    if (r.status === 422) {
      const data = await r.json();
      if (data.riskWarning) {
        setPhoneRisk({ riskLevel: data.riskLevel, flags: data.flags, action: "block" });
        setConfirmRisky(false);
        showToast("error", `সতর্কতা: ${data.message}`);
        setSubmitting(false);
        return;
      }
    }

    if (r.ok) {
      const newOrder = await r.json();
      if (prefillSuggestId) {
        await fetch(`/api/suggested-orders`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: prefillSuggestId, status: "converted" }),
        }).catch(() => {});
      }
      if (wantCourier && newOrder?.id) {
        setBookingCourier(true);
        const courierBody: Record<string, string> = { orderId: newOrder.id, courierName };
        if (isManual) courierBody.manualTrackId = trackId.trim();
        await fetch("/api/courier", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courierBody),
        }).catch(() => null);
        setBookingCourier(false);
      }
      showToast("success", "অর্ডার সফলভাবে সেভ হয়েছে ✓");
      setTimeout(() => { onCreated(); closeWithAnim(); }, 900);
    } else {
      showToast("error", "কিছু একটা সমস্যা হয়েছে।");
    }
    setSubmitting(false);
  }

  const sections: { key: typeof expandedSection; num: string; label: string; color: string; gradient: string }[] = [
    { key: "customer", num: "১", label: "কাস্টমার", color: "#0F6E56", gradient: "linear-gradient(135deg, #0F6E56, #0A5442)" },
    { key: "products", num: "২", label: "পণ্য", color: "#3B82F6", gradient: "linear-gradient(135deg, #3B82F6, #1D4ED8)" },
    { key: "payment", num: "৩", label: "পেমেন্ট", color: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6, #6D28D9)" },
    { key: "tags", num: "৪", label: "ট্যাগ", color: "#EF9F27", gradient: "linear-gradient(135deg, #EF9F27, #D97706)" },
    { key: "courier", num: "৫", label: "কুরিয়ার", color: wantCourier ? "#3B82F6" : "#9CA3AF", gradient: wantCourier ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "linear-gradient(135deg, #9CA3AF, #6B7280)" },
  ];

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
          width: "min(580px, 100vw)",
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
            <ShoppingBag size={16} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-extrabold" style={{ color: S.text }}>নতুন অর্ডার</h2>
            <p className="text-[11px]" style={{ color: S.muted }}>তথ্য পূরণ করে সেভ করুন</p>
          </div>
          {/* Summary pill */}
          {totalAmount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)", border: "1px solid #A3D9C9" }}>
              <ShoppingCart size={13} style={{ color: "#0F6E56" }} />
              <span className="text-sm font-extrabold" style={{ color: "#0F6E56" }}>{formatBDT(totalAmount)}</span>
            </div>
          )}
          <button onClick={closeWithAnim}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ backgroundColor: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
            <X size={16} style={{ color: S.muted }} />
          </button>
        </div>

        {/* Section pills */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b overflow-x-auto flex-shrink-0"
          style={{ borderColor: S.border, backgroundColor: S.bg }}>
          {sections.map(sec => (
            <button key={sec.key} onClick={() => setExpandedSection(sec.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 transition-all"
              style={{
                background: expandedSection === sec.key ? sec.gradient : "transparent",
                color: expandedSection === sec.key ? "#fff" : S.muted,
                border: `1.5px solid ${expandedSection === sec.key ? "transparent" : S.border}`,
              }}>
              {sec.num} {sec.label}
              {sec.key === "products" && items.filter(i => i.productId || i.comboId).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[9px] font-black flex items-center justify-center"
                  style={{ color: sec.color }}>
                  {items.filter(i => i.productId || i.comboId).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <form id="order-create-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4 pb-28">
            {dataLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl" style={{ backgroundColor: S.surface }} />)}
              </div>
            ) : (
              <>
                {/* ── 1. Customer ── */}
                <SectionCard
                  title="কাস্টমার" num="১" color="#0F6E56"
                  expanded={expandedSection === "customer"}
                  onToggle={() => setExpandedSection(s => s === "customer" ? "products" : "customer")}
                  badge={selectedCustomerId || newCustomerName ? "✓ সেট" : undefined}
                  badgeColor="#0F6E56" badgeBg="#E8F5F0"
                >
                  {/* Mode toggle */}
                  <div className="flex gap-2 mb-4">
                    {[{ key: "existing", label: "বিদ্যমান", emoji: "👤" }, { key: "new", label: "নতুন", emoji: "✨" }].map(m => (
                      <button key={m.key} type="button" onClick={() => setCustomerMode(m.key as "existing" | "new")}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1"
                        style={{
                          backgroundColor: customerMode === m.key ? "#0F6E56" : "transparent",
                          color: customerMode === m.key ? "#fff" : S.muted,
                          borderColor: customerMode === m.key ? "#0F6E56" : S.border,
                        }}>
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                  {customerMode === "existing" ? (
                    <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, color: selectedCustomerId ? S.text : S.muted, backgroundColor: S.surface, appearance: "auto" } as React.CSSProperties}>
                      <option value="">👤 কাস্টমার বেছে নিন...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>)}
                    </select>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="নাম *" value={newCustomerName}
                          onChange={e => setNewCustomerName(e.target.value)}
                          className="h-10 px-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: focused === "name" ? "#0F6E56" : S.border, backgroundColor: S.surface, color: S.text }}
                          onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
                        <div className="relative">
                          <input type="tel" placeholder="ফোন" value={newCustomerPhone}
                            onChange={e => { setNewCustomerPhone(e.target.value); setPhoneRisk(null); }}
                            className="h-10 px-3 rounded-xl border text-sm outline-none w-full"
                            style={{
                              borderColor: phoneRisk?.riskLevel === "blocked" ? "#DC2626"
                                : phoneRisk?.riskLevel === "high" ? "#F87171"
                                : phoneRisk?.riskLevel === "medium" ? "#FCA5A5"
                                : focused === "phone" ? "#0F6E56" : S.border,
                              backgroundColor: S.surface, color: S.text,
                            }}
                            onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)} />
                          {checkingPhone && (
                            <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" style={{ color: S.muted }} />
                          )}
                        </div>
                      </div>
                      {phoneRisk && phoneRisk.riskLevel !== "safe" && (
                        <div className="rounded-xl px-3 py-2.5 space-y-2"
                          style={{ backgroundColor: isPhoneBlocked ? "#FEE2E2" : "#FFF7ED", border: `1px solid ${isPhoneBlocked ? "#FCA5A5" : "#FDBA74"}` }}>
                          <div className="flex items-start gap-2">
                            {isPhoneBlocked
                              ? <ShieldX size={14} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
                              : <ShieldAlert size={14} style={{ color: "#EA580C", flexShrink: 0, marginTop: 1 }} />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold" style={{ color: isPhoneBlocked ? "#DC2626" : "#EA580C" }}>
                                {isPhoneBlocked ? "উচ্চ-ঝুঁকির নম্বর শনাক্ত হয়েছে!" : "সতর্কতা: সন্দেহজনক নম্বর"}
                              </p>
                              {phoneRisk.flags?.length > 0 && (
                                <p className="text-[10px] mt-0.5" style={{ color: isPhoneBlocked ? "#991B1B" : "#92400E" }}>{phoneRisk.flags.join(" • ")}</p>
                              )}
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={confirmRisky} onChange={e => setConfirmRisky(e.target.checked)}
                              className="rounded" style={{ accentColor: isPhoneBlocked ? "#DC2626" : "#EA580C" }} />
                            <span className="text-[11px] font-semibold" style={{ color: isPhoneBlocked ? "#DC2626" : "#EA580C" }}>
                              ঝুঁকি জেনেও অর্ডার তৈরি করতে চাই
                            </span>
                          </label>
                        </div>
                      )}
                      <input type="text" placeholder="📍 ঠিকানা" value={newCustomerAddress}
                        onChange={e => setNewCustomerAddress(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: focused === "addr" ? "#0F6E56" : S.border, backgroundColor: S.surface, color: S.text }}
                        onFocus={() => setFocused("addr")} onBlur={() => setFocused(null)} />
                      <input type="url" placeholder="🔵 Facebook URL" value={newCustomerFacebook}
                        onChange={e => setNewCustomerFacebook(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: focused === "fb" ? "#1877F2" : S.border, backgroundColor: S.surface, color: S.text }}
                        onFocus={() => setFocused("fb")} onBlur={() => setFocused(null)} />
                      <div className="grid grid-cols-3 gap-2">
                        {CUSTOMER_GROUPS.map(g => (
                          <button key={g.key} type="button" onClick={() => setNewCustomerGroup(g.key)}
                            className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-center transition-all"
                            style={{
                              borderColor: newCustomerGroup === g.key ? "#0F6E56" : S.border,
                              backgroundColor: newCustomerGroup === g.key ? "#E8F5F0" : "transparent",
                            }}>
                            <span className="text-lg">{g.emoji}</span>
                            <span className="text-[10px] font-black" style={{ color: newCustomerGroup === g.key ? "#0F6E56" : S.muted }}>{g.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* ── 2. Products ── */}
                <SectionCard
                  title="পণ্য" num="২" color="#3B82F6"
                  expanded={expandedSection === "products"}
                  onToggle={() => setExpandedSection(s => s === "products" ? "customer" : "products")}
                  badge={`${items.filter(i=>i.productId||i.comboId).length} টি`}
                  badgeColor="#3B82F6" badgeBg="#EFF6FF"
                >
                  <div className="space-y-3">
                    {items.map((it, idx) => {
                      const selProduct = products.find(p => p.id === it.productId);
                      const isCombo = !!it.comboId;
                      return (
                        <div key={idx} className="rounded-xl border overflow-hidden"
                          style={{ borderColor: isCombo ? "#F59E0B" : S.border }}>
                          <div className="flex items-center justify-between px-3 py-2"
                            style={{ backgroundColor: isCombo ? "#FFFBEB" : S.bg }}>
                            <span className="text-xs font-bold" style={{ color: isCombo ? "#92400E" : "#3B82F6" }}>
                              {isCombo ? "📦 কমবো" : "🛍 পণ্য"} #{idx + 1}
                              {it.unitPrice > 0 && <span className="ml-2 text-[10px]">({formatBDT(it.unitPrice)})</span>}
                            </span>
                            {items.length > 1 && (
                              <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 rounded-lg hover:bg-red-100 transition-colors">
                                <Trash2 size={12} className="text-red-500" />
                              </button>
                            )}
                          </div>
                          <div className="p-3 space-y-2" style={{ backgroundColor: isCombo ? "#FFFBEB" : S.surface }}>
                            <select value={it.comboId ? `combo:${it.comboId}` : it.productId}
                              onChange={e => handleProductSelect(idx, e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                              style={{ borderColor: S.border, color: it.productId || it.comboId ? S.text : S.muted, backgroundColor: S.surface, appearance: "auto" } as React.CSSProperties}>
                              <option value="">🔍 পণ্য বেছে নিন...</option>
                              {products.length > 0 && (
                                <optgroup label="━━ পণ্য ━━">
                                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatBDT(p.sellPrice)} (স্টক: {p.stockQty})</option>)}
                                </optgroup>
                              )}
                              {combos.length > 0 && (
                                <optgroup label="━━ কমবো 📦 ━━">
                                  {combos.map(c => <option key={c.id} value={`combo:${c.id}`}>📦 {c.name} — {formatBDT(c.sellPrice)} (স্টক: {c.availableStock})</option>)}
                                </optgroup>
                              )}
                            </select>
                            {!isCombo && selProduct?.hasVariants && selProduct.variants.length > 0 && (
                              <select value={it.variantId ?? ""} onChange={e => handleVariantSelect(idx, e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                                style={{ borderColor: "#8B5CF6", backgroundColor: "#F5F3FF", color: S.text, appearance: "auto" } as React.CSSProperties}>
                                <option value="">🎨 Variant বেছে নিন...</option>
                                {selProduct.variants.map(v => (
                                  <option key={v.id} value={v.id}>{v.name}{v.price != null ? ` — ${formatBDT(v.price)}` : ""} (স্টক: {v.stockQty})</option>
                                ))}
                              </select>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-xl border overflow-hidden flex-shrink-0" style={{ borderColor: S.border }}>
                                <button type="button" onClick={() => handleQtyChange(idx, Math.max(1, it.quantity - 1))}
                                  className="w-9 h-9 flex items-center justify-center text-base font-bold" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>−</button>
                                <span className="w-10 h-9 flex items-center justify-center text-sm font-extrabold" style={{ color: S.text }}>{it.quantity}</span>
                                <button type="button" onClick={() => handleQtyChange(idx, it.quantity + 1)}
                                  className="w-9 h-9 flex items-center justify-center text-base font-bold" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>+</button>
                              </div>
                              <div className="flex-1 h-9 flex items-center px-3 rounded-xl text-sm font-semibold border" style={{ backgroundColor: S.bg, borderColor: S.border, color: S.muted }}>
                                {formatBDT(it.unitPrice)}
                              </div>
                              <div className="h-9 px-3 flex items-center rounded-xl text-sm font-extrabold flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)", color: "#0F6E56" }}>
                                {formatBDT(it.subtotal)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={() => setItems(prev => [...prev, { productId: "", productName: "", quantity: 1, unitPrice: 0, subtotal: 0 }])}
                      className="flex items-center gap-2 text-sm font-bold px-4 py-3 rounded-xl border-2 w-full justify-center transition-all hover:bg-blue-50"
                      style={{ borderColor: "#3B82F6", color: "#3B82F6", borderStyle: "dashed", backgroundColor: "#F8FBFF" }}>
                      <Plus size={15} /> পণ্য বা কমবো যোগ করুন
                    </button>
                  </div>
                </SectionCard>

                {/* ── 3. Payment ── */}
                <SectionCard
                  title="পেমেন্ট" num="৩" color="#8B5CF6"
                  expanded={expandedSection === "payment"}
                  onToggle={() => setExpandedSection(s => s === "payment" ? "customer" : "payment")}
                  badge={due > 0 ? `বাকি ${formatBDT(due)}` : totalAmount > 0 ? "পরিশোধিত" : undefined}
                  badgeColor={due > 0 ? "#DC2626" : "#059669"} badgeBg={due > 0 ? "#FEE2E2" : "#D1FAE5"}
                >
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)" }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: "#0F6E56" }}>মোট</p>
                        <p className="text-base font-extrabold" style={{ color: "#0F6E56" }}>{formatBDT(totalAmount)}</p>
                      </div>
                      <div className="rounded-xl p-3 text-center border-2" style={{ borderColor: focused === "paid" ? "#0F6E56" : S.border, backgroundColor: S.surface }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: S.muted }}>পরিশোধিত</p>
                        <input type="number" value={paidAmount} min="0" onChange={e => setPaidAmount(e.target.value)}
                          className="w-full text-base font-extrabold outline-none bg-transparent text-center border-none p-0"
                          style={{ color: S.text }}
                          onFocus={() => setFocused("paid")} onBlur={() => setFocused(null)} />
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: due > 0 ? "linear-gradient(135deg, #FEE2E2, #FECACA)" : "linear-gradient(135deg, #D1FAE5, #A7F3D0)" }}>
                        <p className="text-[9px] font-bold uppercase mb-1" style={{ color: due > 0 ? "#DC2626" : "#059669" }}>বাকি</p>
                        <p className="text-base font-extrabold" style={{ color: due > 0 ? "#DC2626" : "#059669" }}>{formatBDT(due)}</p>
                      </div>
                    </div>
                    {/* Delivery */}
                    <div>
                      <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>ডেলিভারি চার্জ</label>
                      <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: focused === "delivery" ? "#8B5CF6" : S.border }}>
                        <span className="px-3 h-10 flex items-center text-sm font-bold" style={{ backgroundColor: "#F5F3FF", color: "#8B5CF6", borderRight: `1px solid ${S.border}` }}>৳</span>
                        <input type="number" value={deliveryCharge} min="0" onChange={e => setDeliveryCharge(e.target.value)}
                          placeholder="০" className="flex-1 h-10 px-3 text-sm outline-none bg-transparent" style={{ color: S.text }}
                          onFocus={() => setFocused("delivery")} onBlur={() => setFocused(null)} />
                      </div>
                    </div>
                    {/* Source + Note */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>সোর্স</label>
                        <select value={source} onChange={e => setSource(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface, appearance: "auto" } as React.CSSProperties}>
                          <option value="facebook">📘 Facebook</option>
                          <option value="whatsapp">💬 WhatsApp</option>
                          <option value="direct">🏪 Direct</option>
                          <option value="referral">🔗 Referral</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1 uppercase tracking-wide" style={{ color: S.muted }}>নোট</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)}
                          placeholder="📝 অতিরিক্ত তথ্য..."
                          className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: focused === "note" ? "#0F6E56" : S.border, backgroundColor: S.surface, color: S.text }}
                          onFocus={() => setFocused("note")} onBlur={() => setFocused(null)} />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* ── 4. Tags ── */}
                <SectionCard
                  title="ট্যাগ" num="৪" color="#EF9F27"
                  expanded={expandedSection === "tags"}
                  onToggle={() => setExpandedSection(s => s === "tags" ? "customer" : "tags")}
                  badge={tags.length > 0 ? `${tags.length}টি` : "ঐচ্ছিক"}
                  badgeColor="#EF9F27" badgeBg="#FFF3DC"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "urgent", emoji: "🔥", color: "#EF4444", bg: "#FEE2E2" },
                        { label: "vip", emoji: "⭐", color: "#D97706", bg: "#FEF3C7" },
                        { label: "gift-wrap", emoji: "🎁", color: "#8B5CF6", bg: "#F5F3FF" },
                        { label: "prepaid", emoji: "✅", color: "#059669", bg: "#D1FAE5" },
                        { label: "cod", emoji: "💰", color: "#0F6E56", bg: "#E8F5F0" },
                      ].map(pt => {
                        const isActive = tags.includes(pt.label);
                        return (
                          <button key={pt.label} type="button"
                            onClick={() => isActive ? setTags(t => t.filter(x => x !== pt.label)) : setTags(t => [...t, pt.label])}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all"
                            style={{ borderColor: isActive ? pt.color : S.border, backgroundColor: isActive ? pt.bg : "transparent", color: isActive ? pt.color : S.muted }}>
                            {pt.emoji} {pt.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                        placeholder="# কাস্টম ট্যাগ..."
                        className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                      <button type="button" onClick={addTag}
                        className="px-4 h-10 rounded-xl text-sm font-bold"
                        style={{ backgroundColor: "#FFF3DC", color: "#EF9F27", border: "2px solid #EF9F27" }}>
                        যোগ
                      </button>
                    </div>
                    {tags.filter(t => !["urgent","vip","gift-wrap","prepaid","cod"].includes(t)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.filter(t => !["urgent","vip","gift-wrap","prepaid","cod"].includes(t)).map(t => (
                          <span key={t} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                            style={{ backgroundColor: "#E8F5F0", color: "#0F6E56", border: "1.5px solid #A3D9C9" }}>
                            #{t}
                            <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* ── 5. Courier ── */}
                <SectionCard
                  title="কুরিয়ার" num="৫" color={wantCourier ? "#3B82F6" : "#9CA3AF"}
                  expanded={expandedSection === "courier"}
                  onToggle={() => { setExpandedSection(s => s === "courier" ? "customer" : "courier"); }}
                  badge="ঐচ্ছিক" badgeColor={wantCourier ? "#3B82F6" : S.muted} badgeBg={wantCourier ? "#DBEAFE" : S.bg}
                  headerRight={
                    <button type="button" onClick={e => { e.stopPropagation(); setWantCourier(v => !v); }}
                      className={`relative w-10 h-5 rounded-full flex-shrink-0 flex items-center px-0.5 transition-colors ${wantCourier ? "justify-end" : "justify-start"}`}
                      style={{ backgroundColor: wantCourier ? "#3B82F6" : S.border }}>
                      <span className="w-4 h-4 bg-white rounded-full shadow transition-transform" />
                    </button>
                  }
                >
                  {wantCourier && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-1.5">
                        {ALL_COURIERS.map(c => (
                          <button key={c.key} type="button" onClick={() => { setCourierName(c.key); setTrackId(""); }}
                            className="px-2 py-2 rounded-xl text-[11px] font-semibold border text-center transition-all"
                            style={{
                              backgroundColor: courierName === c.key ? "#EFF6FF" : "transparent",
                              borderColor: courierName === c.key ? "#3B82F6" : S.border,
                              color: courierName === c.key ? "#3B82F6" : S.muted,
                            }}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                      {MANUAL_COURIERS.includes(courierName) ? (
                        <input type="text" value={trackId} onChange={e => setTrackId(e.target.value)}
                          placeholder="Tracking ID"
                          className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                      ) : (
                        <p className="text-xs px-3 py-2.5 rounded-xl font-medium" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                          সেভ হলে স্বয়ংক্রিয়ভাবে {ALL_COURIERS.find(c => c.key === courierName)?.label}-এ বুক হবে।
                        </p>
                      )}
                    </div>
                  )}
                </SectionCard>
              </>
            )}
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 border-t p-4" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="flex items-center gap-3 mb-3 text-xs font-semibold" style={{ color: S.muted }}>
            <span>পণ্য: {items.filter(i=>i.productId||i.comboId).length}টি</span>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: S.muted }} />
            <span>মোট: <strong style={{ color: "#0F6E56" }}>{formatBDT(totalAmount)}</strong></span>
            {due > 0 && (
              <>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: S.muted }} />
                <span style={{ color: "#DC2626" }}>বাকি: {formatBDT(due)}</span>
              </>
            )}
          </div>
          {(isPhoneBlocked || isPhoneRisky) && !confirmRisky && (
            <p className="text-[11px] text-center mb-2 font-semibold" style={{ color: isPhoneBlocked ? "#DC2626" : "#EA580C" }}>
              {isPhoneBlocked ? "অর্ডার দিতে নিচের চেকবক্সে টিক দিন" : "ঝুঁকির বিষয়ে নিশ্চিত হয়ে চেকবক্সে টিক দিন"}
            </p>
          )}
          <button type="submit" form="order-create-form"
            disabled={submitting || bookingCourier || dataLoading || ((isPhoneBlocked || isPhoneRisky) && !confirmRisky)}
            className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: confirmRisky && isPhoneBlocked ? "linear-gradient(135deg, #DC2626, #991B1B)" : "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
            {(submitting || bookingCourier) && <Loader2 size={16} className="animate-spin" />}
            {bookingCourier ? "কুরিয়ার বুক হচ্ছে..." : submitting ? "সেভ হচ্ছে..." : confirmRisky && isPhoneBlocked ? "⚠️ ঝুঁকি নিয়ে অর্ডার সেভ" : wantCourier ? "অর্ডার সেভ ও কুরিয়ার বুক" : "✓ অর্ডার সেভ করুন"}
          </button>
        </div>
      </div>
    </>
  );
}

function SectionCard({
  title, num, color, expanded, onToggle, badge, badgeColor, badgeBg, children, headerRight
}: {
  title: string; num: string; color: string; expanded: boolean; onToggle: () => void;
  badge?: string; badgeColor?: string; badgeBg?: string; children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden transition-all" style={{ borderColor: expanded ? color + "60" : "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        style={{ backgroundColor: expanded ? color + "08" : "transparent" }}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>{num}</div>
        <span className="font-bold text-sm flex-1" style={{ color: "var(--c-text)" }}>{title}</span>
        {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: badgeColor, backgroundColor: badgeBg }}>{badge}</span>}
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
