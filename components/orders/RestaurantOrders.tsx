"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ShoppingBag, UtensilsCrossed, Package, Bike, Clock, CheckCircle, X, Minus, Loader2, ReceiptText, ArrowRight } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface MenuItem {
  id: string; name: string; category: string;
  price: number; isAvailable: boolean; isVeg: boolean;
}

interface DiningTable {
  id: string; number: number; capacity: number; floor?: string; status: string;
}

interface ROrderItem {
  id: string; quantity: number; unitPrice: number; note?: string;
  menuItem: { id: string; name: string; category: string };
}

interface RestaurantOrder {
  id: string; type: string; status: string; totalAmount: number; paidAmount: number;
  customerName?: string; customerPhone?: string; note?: string;
  createdAt: string;
  items: ROrderItem[];
  table?: { id: string; number: number; floor?: string } | null;
}

interface CartItem { menuItem: MenuItem; quantity: number; note: string; }

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "অপেক্ষমাণ",  bg: "var(--status-pending-bg)",   color: "var(--status-pending-text)"   },
  preparing: { label: "তৈরি হচ্ছে", bg: "#FEF3C7",                   color: "#92600A"                       },
  ready:     { label: "প্রস্তুত",   bg: "var(--status-confirmed-bg)", color: "var(--status-confirmed-text)" },
  served:    { label: "পরিবেশিত",  bg: "var(--status-shipped-bg)",   color: "var(--status-shipped-text)"   },
  paid:      { label: "পরিশোধিত",  bg: "var(--status-delivered-bg)", color: "var(--status-delivered-text)" },
};

const CATEGORIES = [
  { key: "all",     label: "সব"       },
  { key: "starter", label: "স্টার্টার" },
  { key: "main",    label: "মেইন"     },
  { key: "drinks",  label: "পানীয়"   },
  { key: "dessert", label: "মিষ্টি"   },
  { key: "other",   label: "অন্যান্য" },
];

const ORDER_TYPES = [
  { key: "dine_in",  icon: UtensilsCrossed, label: "টেবিলে বসা",   color: "#0F6E56" },
  { key: "takeaway", icon: Package,          label: "নিয়ে যাবে",   color: "#F59E0B" },
  { key: "delivery", icon: Bike,             label: "হোম ডেলিভারি", color: "#3B82F6" },
];

const ACTIVE_STATUSES = ["pending", "preparing", "ready", "served"];

const STEP_LABELS = ["ধরন", "বিস্তারিত", "মেনু", "নিশ্চিত"];

export default function RestaurantOrders() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "all">("active");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [detailOrder, setDetailOrder] = useState<RestaurantOrder | null>(null);

  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState("dine_in");
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCat, setMenuCat] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/restaurant/orders?all=true");
      if (r.ok) setOrders(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (showNewOrder) {
      fetch("/api/restaurant/tables").then(r => r.json()).then(setTables).catch(() => {});
      fetch("/api/restaurant/menu-items?available=true").then(r => r.json()).then(setMenuItems).catch(() => {});
    }
  }, [showNewOrder]);

  function openNewOrder() {
    setStep(1); setOrderType("dine_in"); setSelectedTable(null);
    setCart([]); setCustomerName(""); setCustomerPhone(""); setOrderNote("");
    setPayAmount(""); setMenuCat("all");
    setShowNewOrder(true);
  }

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1, note: "" }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(c => c.menuItem.id !== itemId);
      return prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  function canAdvance(): boolean {
    if (step === 1) return true;
    if (step === 2) {
      if (orderType === "dine_in") return selectedTable !== null;
      return true;
    }
    if (step === 3) return cart.length > 0;
    return false;
  }

  async function submitOrder() {
    if (!cart.length) return;
    setSubmitting(true);
    const body = {
      type: orderType,
      tableId: orderType === "dine_in" ? (selectedTable?.id ?? null) : null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      note: orderNote || null,
      items: cart.map(c => ({
        menuItemId: c.menuItem.id,
        quantity: c.quantity,
        note: c.note || null,
      })),
    };
    const r = await fetch("/api/restaurant/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (r.ok) {
      showToast("success", "অর্ডার তৈরি হয়েছে ✓");
      setShowNewOrder(false);
      loadOrders();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "অর্ডার তৈরি করা যায়নি");
    }
  }

  async function updateStatus(orderId: string, status: string) {
    const r = await fetch(`/api/restaurant/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const updated = await r.json();
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (detailOrder?.id === orderId) setDetailOrder(updated);
      showToast("success", "স্ট্যাটাস আপডেট হয়েছে ✓");
    } else {
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  async function handlePayment(orderId: string, total: number) {
    const amount = parseFloat(payAmount) || total;
    setPaying(true);
    const r = await fetch(`/api/restaurant/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paidAmount: amount }),
    });
    setPaying(false);
    if (r.ok) {
      const updated = await r.json();
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setDetailOrder(null);
      showToast("success", "পেমেন্ট সম্পন্ন ✓");
    } else {
      showToast("error", "পেমেন্ট রেকর্ড করা যায়নি");
    }
  }

  const filteredMenuItems = menuCat === "all" ? menuItems : menuItems.filter(m => m.category === menuCat);
  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const displayOrders = tab === "active" ? activeOrders : orders;
  const elapsedMin = (createdAt: string) => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)" }}>
            <ShoppingBag size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>রেস্তোরাঁ অর্ডার</h1>
            <p className="text-xs" style={{ color: S.muted }}>সব অর্ডার ট্র্যাক করুন</p>
          </div>
        </div>
        <button onClick={openNewOrder}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)" }}>
          <Plus size={16} /> নতুন অর্ডার
        </button>
      </div>

      <div className="flex gap-2">
        {(["active", "all"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={{
              backgroundColor: tab === t ? "#EF4444" : S.surface,
              color: tab === t ? "#fff" : S.secondary,
              borderColor: tab === t ? "#EF4444" : S.border,
            }}>
            {t === "active" ? `সক্রিয় (${activeOrders.length})` : "সব অর্ডার"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center" style={{ color: S.muted }}>
          <Loader2 size={24} className="animate-spin mx-auto mb-2" /> লোড হচ্ছে...
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
            <ShoppingBag size={28} style={{ color: "#EF4444" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: S.text }}>এখনো কোনো অর্ডার নেই।</p>
          <button onClick={openNewOrder} className="text-sm font-semibold" style={{ color: "#EF4444" }}>
            + নতুন অর্ডার তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {displayOrders.map(order => {
            const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;
            const elapsed = elapsedMin(order.createdAt);
            const isUrgent = elapsed > 20 && order.status !== "paid";
            return (
              <div key={order.id} onClick={() => { setDetailOrder(order); setPayAmount(""); }}
                className="rounded-2xl border cursor-pointer transition-all hover:shadow-md"
                style={{
                  borderColor: isUrgent ? "#EF4444" : S.border,
                  backgroundColor: S.surface,
                  borderWidth: isUrgent ? 2 : 1,
                }}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {order.table ? (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#EF4444" }}>
                          T{order.table.number}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: order.type === "takeaway" ? "#F59E0B" : "#3B82F6" }}>
                          {order.type === "takeaway" ? "T/A" : "D"}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-mono font-semibold" style={{ color: S.muted }}>#{order.id.slice(-6).toUpperCase()}</p>
                        {order.customerName && <p className="text-xs" style={{ color: S.secondary }}>{order.customerName}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      <div className="flex items-center gap-1 mt-1 justify-end" style={{ color: isUrgent ? "#EF4444" : S.muted }}>
                        <Clock size={10} /><span className="text-[10px]">{elapsed}মি</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs" style={{ color: S.secondary }}>
                        <span className="truncate">{item.menuItem.name}</span>
                        <span className="font-medium ml-2 flex-shrink-0">×{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && <p className="text-xs" style={{ color: S.muted }}>+{order.items.length - 3}টি আরো</p>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: S.border }}>
                    <span className="text-sm font-bold font-mono" style={{ color: S.text }}>{formatBDT(order.totalAmount)}</span>
                    {order.status !== "paid" && (
                      <div className="flex gap-1.5">
                        {order.status === "pending" && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(order.id, "preparing"); }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#F59E0B" }}>
                            শুরু করুন
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(order.id, "ready"); }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#10B981" }}>
                            প্রস্তুত
                          </button>
                        )}
                        {order.status === "ready" && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(order.id, "served"); }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#3B82F6" }}>
                            পরিবেশিত
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-2xl rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "92vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: S.text }}>নতুন অর্ডার</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  {STEP_LABELS.map((label, i) => {
                    const s = i + 1;
                    return (
                      <div key={s} className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                            style={{
                              backgroundColor: step >= s ? "#EF4444" : S.border,
                              color: step >= s ? "#fff" : S.muted,
                            }}>{s}</div>
                          <span className="text-[10px]" style={{ color: step >= s ? "#EF4444" : S.muted }}>{label}</span>
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                          <div className="w-4 h-0.5" style={{ backgroundColor: step > s ? "#EF4444" : S.border }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => setShowNewOrder(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: S.muted }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {step === 1 && (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>অর্ডারের ধরন বেছে নিন</p>
                  <div className="grid grid-cols-3 gap-3">
                    {ORDER_TYPES.map(ot => (
                      <button key={ot.key} onClick={() => setOrderType(ot.key)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all"
                        style={{
                          borderColor: orderType === ot.key ? ot.color : S.border,
                          backgroundColor: orderType === ot.key ? `${ot.color}18` : S.surface,
                        }}>
                        <ot.icon size={28} style={{ color: ot.color }} />
                        <span className="text-sm font-semibold text-center leading-tight" style={{ color: S.text }}>{ot.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="p-5 space-y-4">
                  {orderType === "dine_in" ? (
                    <>
                      <p className="text-sm font-semibold" style={{ color: S.text }}>টেবিল বেছে নিন</p>
                      {tables.length === 0 ? (
                        <p className="text-sm text-center py-6" style={{ color: S.muted }}>কোনো টেবিল নেই। আগে টেবিল তৈরি করুন।</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {tables.map(t => (
                            <button key={t.id} onClick={() => setSelectedTable(selectedTable?.id === t.id ? null : t)}
                              disabled={t.status === "occupied"}
                              className="p-3 rounded-xl border-2 text-center transition-all disabled:opacity-50"
                              style={{
                                borderColor: selectedTable?.id === t.id ? "#0F6E56" : t.status === "occupied" ? "#EF444466" : S.border,
                                backgroundColor: selectedTable?.id === t.id ? "#E1F5EE" : t.status === "occupied" ? "#FEF2F2" : S.surface,
                              }}>
                              <p className="text-sm font-bold" style={{ color: S.text }}>T{t.number}</p>
                              <p className="text-[10px]" style={{ color: S.muted }}>{t.capacity} জন</p>
                              {t.status === "occupied" && <p className="text-[9px]" style={{ color: "#EF4444" }}>ব্যস্ত</p>}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedTable ? (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#E1F5EE" }}>
                          <CheckCircle size={14} style={{ color: "#0F6E56" }} />
                          <span className="text-sm font-semibold" style={{ color: "#0F6E56" }}>টেবিল {selectedTable.number} নির্বাচিত</span>
                        </div>
                      ) : (
                        <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: "#FFFBEB", color: "#92600A" }}>
                          ⚠ পরবর্তী ধাপে যেতে একটি টেবিল নির্বাচন করুন
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold" style={{ color: S.text }}>কাস্টমার তথ্য</p>
                      <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                        placeholder="নাম (ঐচ্ছিক)"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                      <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="ফোন নম্বর (ঐচ্ছিক)"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col h-full">
                  <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto flex-shrink-0">
                    {CATEGORIES.map(cat => (
                      <button key={cat.key} onClick={() => setMenuCat(cat.key)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: menuCat === cat.key ? "#EF4444" : S.surface,
                          color: menuCat === cat.key ? "#fff" : S.secondary,
                          borderColor: menuCat === cat.key ? "#EF4444" : S.border,
                        }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {filteredMenuItems.length === 0 ? (
                        <p className="text-center py-8 text-sm" style={{ color: S.muted }}>এই ক্যাটাগরিতে কোনো আইটেম নেই</p>
                      ) : filteredMenuItems.map(item => {
                        const inCart = cart.find(c => c.menuItem.id === item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border"
                            style={{ borderColor: S.border, backgroundColor: S.surface }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {item.isVeg && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>নিরামিষ</span>}
                                <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{item.name}</p>
                              </div>
                              <p className="text-sm font-bold font-mono mt-0.5" style={{ color: "#EF4444" }}>{formatBDT(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {inCart ? (
                                <>
                                  <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full flex items-center justify-center border" style={{ borderColor: S.border }}>
                                    <Minus size={12} style={{ color: S.secondary }} />
                                  </button>
                                  <span className="w-6 text-center text-sm font-bold" style={{ color: S.text }}>{inCart.quantity}</span>
                                  <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#EF4444" }}>
                                    <Plus size={12} />
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => addToCart(item)} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#EF4444" }}>
                                  + যোগ
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {cart.length > 0 && (
                      <div className="w-52 border-l p-3 overflow-y-auto flex flex-col" style={{ borderColor: S.border }}>
                        <p className="text-xs font-bold mb-2" style={{ color: S.text }}>কার্ট ({cartCount})</p>
                        <div className="flex-1 space-y-2">
                          {cart.map(c => (
                            <div key={c.menuItem.id} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate" style={{ color: S.text }}>{c.menuItem.name}</p>
                                <p className="text-xs font-mono" style={{ color: "#EF4444" }}>{formatBDT(c.menuItem.price * c.quantity)}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => removeFromCart(c.menuItem.id)} className="w-5 h-5 rounded text-xs flex items-center justify-center border" style={{ borderColor: S.border }}>-</button>
                                <span className="text-xs w-4 text-center" style={{ color: S.text }}>{c.quantity}</span>
                                <button onClick={() => addToCart(c.menuItem)} className="w-5 h-5 rounded text-xs flex items-center justify-center text-white" style={{ backgroundColor: "#EF4444" }}>+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t mt-2" style={{ borderColor: S.border }}>
                          <div className="flex justify-between text-sm font-bold">
                            <span style={{ color: S.text }}>মোট</span>
                            <span style={{ color: "#EF4444" }}>{formatBDT(cartTotal)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-3 flex-shrink-0">
                    <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)}
                      placeholder="অর্ডার নোট (ঐচ্ছিক)" rows={2}
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                      style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>অর্ডার নিশ্চিত করুন</p>
                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(() => {
                        const ot = ORDER_TYPES.find(t => t.key === orderType)!;
                        return (
                          <div className="flex items-center gap-2">
                            <ot.icon size={16} style={{ color: ot.color }} />
                            <span className="text-sm font-semibold" style={{ color: S.text }}>{ot.label}</span>
                          </div>
                        );
                      })()}
                      {selectedTable && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EF4444" }}>
                          টেবিল {selectedTable.number}
                        </span>
                      )}
                      {customerName && <span className="text-xs" style={{ color: S.muted }}>{customerName}</span>}
                    </div>
                    <div className="h-px" style={{ backgroundColor: S.border }} />
                    {cart.map(c => (
                      <div key={c.menuItem.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "#EF4444" }}>{c.quantity}</span>
                          <span className="text-sm" style={{ color: S.text }}>{c.menuItem.name}</span>
                        </div>
                        <span className="text-sm font-bold font-mono" style={{ color: S.text }}>{formatBDT(c.menuItem.price * c.quantity)}</span>
                      </div>
                    ))}
                    <div className="h-px" style={{ backgroundColor: S.border }} />
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold" style={{ color: S.text }}>মোট</span>
                      <span className="text-xl font-black font-mono" style={{ color: "#EF4444" }}>{formatBDT(cartTotal)}</span>
                    </div>
                    {orderNote && (
                      <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#FFFBEB", color: "#92600A" }}>📝 {orderNote}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0" style={{ borderColor: S.border }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: S.border, color: S.secondary }}>
                  পেছনে
                </button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "#EF4444" }}>
                  {step === 3 ? `নিশ্চিত করুন (${cartCount} আইটেম)` : "পরবর্তী"} <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={submitOrder} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "#EF4444" }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : `অর্ডার দিন — ${formatBDT(cartTotal)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "85vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-2">
                <ReceiptText size={18} style={{ color: "#EF4444" }} />
                <h2 className="font-bold" style={{ color: S.text }}>অর্ডার #{detailOrder.id.slice(-6).toUpperCase()}</h2>
              </div>
              <button onClick={() => setDetailOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm px-3 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: ORDER_STATUS[detailOrder.status]?.bg, color: ORDER_STATUS[detailOrder.status]?.color }}>
                  {ORDER_STATUS[detailOrder.status]?.label}
                </span>
                {detailOrder.table && <span className="text-sm" style={{ color: S.secondary }}>টেবিল {detailOrder.table.number}</span>}
              </div>
              <div className="space-y-2">
                {detailOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm" style={{ color: S.text }}>{item.menuItem.name}</p>
                      {item.note && <p className="text-xs" style={{ color: S.muted }}>{item.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: S.muted }}>×{item.quantity}</p>
                      <p className="text-sm font-bold font-mono" style={{ color: S.text }}>{formatBDT(item.unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t" style={{ borderColor: S.border }}>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: S.text }}>মোট</span>
                  <span className="text-lg font-bold font-mono" style={{ color: "#EF4444" }}>{formatBDT(detailOrder.totalAmount)}</span>
                </div>
              </div>
              {detailOrder.status !== "paid" && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {detailOrder.status === "pending" && (
                      <button onClick={() => updateStatus(detailOrder.id, "preparing")}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#F59E0B" }}>
                        রান্না শুরু
                      </button>
                    )}
                    {detailOrder.status === "preparing" && (
                      <button onClick={() => updateStatus(detailOrder.id, "ready")}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#10B981" }}>
                        প্রস্তুত ✓
                      </button>
                    )}
                    {detailOrder.status === "ready" && (
                      <button onClick={() => updateStatus(detailOrder.id, "served")}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#3B82F6" }}>
                        পরিবেশিত
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold" style={{ color: S.muted }}>পেমেন্ট গ্রহণ করুন</p>
                    <div className="flex gap-2">
                      <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                        placeholder={`${detailOrder.totalAmount} (মোট)`}
                        className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                      <button onClick={() => handlePayment(detailOrder.id, detailOrder.totalAmount)} disabled={paying}
                        className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                        style={{ backgroundColor: "#0F6E56" }}>
                        {paying ? <Loader2 size={14} className="animate-spin" /> : "পেমেন্ট ✓"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {detailOrder.status === "paid" && (
                <div className="flex items-center gap-2 py-3 px-4 rounded-xl" style={{ backgroundColor: "#ECFDF5" }}>
                  <CheckCircle size={18} style={{ color: "#059669" }} />
                  <span className="text-sm font-semibold" style={{ color: "#059669" }}>পেমেন্ট সম্পন্ন</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
