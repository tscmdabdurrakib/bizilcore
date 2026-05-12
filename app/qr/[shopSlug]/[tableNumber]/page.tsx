"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart, Plus, Minus, X, Loader2, CheckCircle, UtensilsCrossed, Leaf } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  price: number;
  isVeg: boolean;
  imageUrl?: string;
  prepMinutes: number;
  menuCategory?: { id: string; name: string } | null;
}

interface ShopInfo {
  name: string;
  logoUrl?: string;
  vatPct?: number;
  servicePct?: number;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
  note: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "সব",
  starter: "স্টার্টার",
  main: "মেইন",
  drinks: "পানীয়",
  dessert: "ডেজার্ট",
  other: "অন্যান্য",
};

const ORANGE = "#EA580C";

export default function QRMenuPage() {
  const params = useParams();
  const shopSlug = params.shopSlug as string;
  const tableNumber = parseInt(params.tableNumber as string, 10);

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [showCart, setShowCart] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ orderNumber: string; total: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/qr/${shopSlug}/menu`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "মেনু লোড হয়নি");
        return;
      }
      const data = await res.json();
      setShop(data.shop);
      setItems(data.items);
    } catch {
      setError("ইন্টারনেট সংযোগ চেক করুন");
    } finally {
      setLoading(false);
    }
  }, [shopSlug]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id);
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1, note: "" }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === itemId);
      if (!ex) return prev;
      if (ex.quantity <= 1) return prev.filter(c => c.item.id !== itemId);
      return prev.map(c => c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  function getQty(itemId: string) {
    return cart.find(c => c.item.id === itemId)?.quantity ?? 0;
  }

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);
  const vatPct = shop?.vatPct ?? 0;
  const svcPct = shop?.servicePct ?? 0;
  const vatAmount = Math.round(subtotal * (vatPct / 100) * 100) / 100;
  const serviceAmount = Math.round(subtotal * (svcPct / 100) * 100) / 100;
  const total = subtotal + vatAmount + serviceAmount;

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category)))];
  const displayItems = activeCat === "all" ? items : items.filter(i => i.category === activeCat);

  function formatBDT(n: number) {
    return `৳${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  async function placeOrder() {
    if (!cart.length) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/restaurant/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          tableNumber,
          type: "dine_in",
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          note: orderNote.trim() || undefined,
          items: cart.map(c => ({ menuItemId: c.item.id, quantity: c.quantity, note: c.note || undefined })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "অর্ডার দেওয়া যায়নি");
        return;
      }
      setSubmitted({ orderNumber: data.orderNumber, total: data.totalAmount });
      setCart([]);
      setShowCart(false);
    } catch {
      setSubmitError("ইন্টারনেট সংযোগ চেক করুন");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF7ED" }}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: ORANGE }} />
          <p className="text-sm font-medium" style={{ color: "#92400E" }}>মেনু লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#FFF7ED" }}>
        <div className="text-center max-w-xs">
          <UtensilsCrossed size={40} className="mx-auto mb-4" style={{ color: "#D97706" }} />
          <p className="font-bold text-lg mb-2" style={{ color: "#92400E" }}>সমস্যা হয়েছে</p>
          <p className="text-sm mb-4" style={{ color: "#B45309" }}>{error}</p>
          <button onClick={loadMenu}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: ORANGE }}>
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F0FDF4" }}>
        <div className="text-center max-w-xs">
          <CheckCircle size={56} className="mx-auto mb-4" style={{ color: "#16A34A" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#15803D" }}>অর্ডার পাঠানো হয়েছে!</h2>
          <p className="text-sm mb-1" style={{ color: "#166534" }}>
            অর্ডার নম্বর: <span className="font-mono font-bold">{submitted.orderNumber}</span>
          </p>
          <p className="text-sm mb-4" style={{ color: "#166534" }}>
            মোট: <span className="font-bold">{formatBDT(submitted.total)}</span>
          </p>
          <p className="text-xs mb-6" style={{ color: "#4ADE80" }}>
            আমাদের রান্নাঘরে অর্ডারটি চলে গেছে। একটু অপেক্ষা করুন।
          </p>
          <button
            onClick={() => setSubmitted(null)}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ backgroundColor: ORANGE }}>
            আরও অর্ডার করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FAFAFA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 shadow-sm" style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt="logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed size={16} color="#fff" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{shop?.name}</p>
              <p className="text-orange-200 text-xs">টেবিল {tableNumber}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: "#fff", color: ORANGE }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-medium border flex-shrink-0 transition-colors"
              style={{
                backgroundColor: activeCat === cat ? ORANGE : "#fff",
                color: activeCat === cat ? "#fff" : "#6B7280",
                borderColor: activeCat === cat ? ORANGE : "#E5E7EB",
              }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Menu items */}
        {displayItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed size={32} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>এই ক্যাটাগরিতে কিছু নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map(item => {
              const qty = getQty(item.id);
              return (
                <div key={item.id}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border"
                  style={{ borderColor: "#F3F4F6" }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: "#FFF7ED" }}>
                      <UtensilsCrossed size={20} style={{ color: "#FED7AA" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.isVeg && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>
                          <Leaf size={9} /> নিরামিষ
                        </span>
                      )}
                      <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{item.name}</p>
                    </div>
                    {item.nameEn && <p className="text-xs truncate mb-1" style={{ color: "#9CA3AF" }}>{item.nameEn}</p>}
                    <p className="text-base font-bold font-mono" style={{ color: ORANGE }}>{formatBDT(item.price)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {qty === 0 ? (
                      <button onClick={() => addToCart(item)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: ORANGE }}>
                        <Plus size={18} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center border"
                          style={{ borderColor: "#E5E7EB" }}>
                          <Minus size={14} style={{ color: "#6B7280" }} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold" style={{ color: "#111827" }}>{qty}</span>
                        <button onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: ORANGE }}>
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4">
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl text-white shadow-lg w-full max-w-lg"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {cartCount}
              </span>
              <span className="font-semibold text-sm">কার্ট দেখুন</span>
            </div>
            <span className="font-bold text-sm font-mono">{formatBDT(subtotal)}</span>
          </button>
        </div>
      )}

      {/* Cart / Order Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-t-3xl bg-white flex flex-col"
            style={{ maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#F3F4F6" }}>
              <h2 className="font-bold text-base" style={{ color: "#111827" }}>
                আপনার অর্ডার — টেবিল {tableNumber}
              </h2>
              <button onClick={() => setShowCart(false)} className="p-1.5 rounded-lg">
                <X size={20} style={{ color: "#9CA3AF" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.map(c => (
                <div key={c.item.id} className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: "#F3F4F6" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>{c.item.name}</p>
                    <p className="text-xs font-mono" style={{ color: ORANGE }}>{formatBDT(c.item.price)} × {c.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => removeFromCart(c.item.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border"
                      style={{ borderColor: "#E5E7EB" }}>
                      <Minus size={12} style={{ color: "#6B7280" }} />
                    </button>
                    <span className="w-5 text-center text-sm font-bold" style={{ color: "#111827" }}>{c.quantity}</span>
                    <button onClick={() => addToCart(c.item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: ORANGE }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold font-mono flex-shrink-0 w-14 text-right" style={{ color: "#111827" }}>
                    {formatBDT(c.item.price * c.quantity)}
                  </p>
                </div>
              ))}

              {/* Bill summary */}
              <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "#FFF7ED" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#92400E" }}>সাবটোটাল</span>
                  <span className="font-mono" style={{ color: "#92400E" }}>{formatBDT(subtotal)}</span>
                </div>
                {vatPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#92400E" }}>VAT ({vatPct}%)</span>
                    <span className="font-mono" style={{ color: "#92400E" }}>{formatBDT(vatAmount)}</span>
                  </div>
                )}
                {svcPct > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#92400E" }}>সার্ভিস চার্জ ({svcPct}%)</span>
                    <span className="font-mono" style={{ color: "#92400E" }}>{formatBDT(serviceAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t" style={{ borderColor: "#FED7AA" }}>
                  <span style={{ color: ORANGE }}>মোট</span>
                  <span className="font-mono" style={{ color: ORANGE }}>{formatBDT(total)}</span>
                </div>
              </div>

              {/* Customer info */}
              <div className="space-y-2">
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="আপনার নাম (ঐচ্ছিক)"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB", color: "#111827" }}
                />
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB", color: "#111827" }}
                />
                <textarea
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: "#E5E7EB", color: "#111827" }}
                />
              </div>

              {submitError && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                  {submitError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <button
                onClick={placeOrder}
                disabled={submitting || !cart.length}
                className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> অর্ডার পাঠানো হচ্ছে...</>
                ) : (
                  <>অর্ডার দিন — {formatBDT(total)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
