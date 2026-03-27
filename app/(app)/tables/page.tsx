"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UtensilsCrossed, X, Loader2, Settings, Trash2, Minus, Clock, CheckCircle } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface DiningTable {
  id: string; number: number; capacity: number; floor?: string; status: string;
  restaurantOrders?: { id: string; status: string; totalAmount: number; createdAt: string; type: string }[];
}

interface MenuItem {
  id: string; name: string; category: string; price: number; isAvailable: boolean; isVeg: boolean;
}

interface ROrderItem {
  id: string; quantity: number; unitPrice: number; note?: string;
  menuItem: { id: string; name: string; category: string };
}

interface RestaurantOrder {
  id: string; type: string; status: string; totalAmount: number; paidAmount: number;
  customerName?: string; note?: string; createdAt: string; items: ROrderItem[];
  table?: { id: string; number: number } | null;
}

interface CartItem { menuItem: MenuItem; quantity: number; }

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)",
  bg: "var(--c-bg)",
};

const TABLE_STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  empty:    { label: "খালি",     bg: "#FFFFFF", color: "#374151", dot: "#D1D5DB" },
  occupied: { label: "ব্যস্ত",   bg: "#ECFDF5", color: "#059669", dot: "#059669" },
  reserved: { label: "রিজার্ভড", bg: "#FFFBEB", color: "#D97706", dot: "#D97706" },
  cleaning: { label: "পরিষ্কার", bg: "#F9FAFB", color: "#6B7280", dot: "#9CA3AF" },
};

const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pending",    bg: "var(--status-pending-bg)",   color: "var(--status-pending-text)"   },
  preparing: { label: "তৈরি হচ্ছে", bg: "#FEF3C7",                   color: "#92600A"                       },
  ready:     { label: "প্রস্তুত",   bg: "var(--status-confirmed-bg)", color: "var(--status-confirmed-text)" },
  served:    { label: "পরিবেশিত",  bg: "var(--status-shipped-bg)",   color: "var(--status-shipped-text)"   },
  paid:      { label: "পেমেন্ট",   bg: "var(--status-delivered-bg)", color: "var(--status-delivered-text)" },
};

const CATEGORIES = [
  { key: "all",     label: "সব"        },
  { key: "starter", label: "স্টার্টার" },
  { key: "main",    label: "মেইন"      },
  { key: "drinks",  label: "পানীয়"    },
  { key: "dessert", label: "ডেজার্ট"   },
  { key: "other",   label: "অন্যান্য"  },
];

export default function TablesPage() {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");
  const [newFloor, setNewFloor] = useState("Ground");
  const [saving, setSaving] = useState(false);

  const [editTable, setEditTable] = useState<DiningTable | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editFloor, setEditFloor] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [filterFloor, setFilterFloor] = useState("all");

  const [orderTable, setOrderTable] = useState<DiningTable | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCat, setMenuCat] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [orderStep, setOrderStep] = useState(1);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [occupiedTable, setOccupiedTable] = useState<DiningTable | null>(null);
  const [activeOrder, setActiveOrder] = useState<RestaurantOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/restaurant/tables");
      if (r.ok) setTables(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  useEffect(() => {
    if (orderTable) {
      fetch("/api/restaurant/menu-items?available=true").then(r => r.json()).then(setMenuItems).catch(() => {});
      setCart([]); setOrderNote(""); setMenuCat("all"); setOrderStep(1);
    }
  }, [orderTable]);

  function handleTableClick(table: DiningTable) {
    if (table.status === "empty" || table.status === "reserved" || table.status === "cleaning") {
      setOrderTable(table);
    } else if (table.status === "occupied") {
      const orderId = table.restaurantOrders?.[0]?.id;
      if (orderId) {
        setOccupiedTable(table);
        setLoadingOrder(true);
        setActiveOrder(null);
        setPayAmount("");
        fetch(`/api/restaurant/orders/${orderId}`)
          .then(r => r.json())
          .then(o => { setActiveOrder(o); setLoadingOrder(false); })
          .catch(() => setLoadingOrder(false));
      }
    }
  }

  function openEdit(table: DiningTable) {
    setEditTable(table);
    setEditNumber(String(table.number));
    setEditCapacity(String(table.capacity));
    setEditFloor(table.floor ?? "Ground");
  }

  async function saveEdit() {
    if (!editTable) return;
    setEditSaving(true);
    const r = await fetch(`/api/restaurant/tables/${editTable.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: parseInt(editNumber),
        capacity: parseInt(editCapacity),
        floor: editFloor,
      }),
    });
    setEditSaving(false);
    if (r.ok) {
      showToast("success", "টেবিল আপডেট হয়েছে ✓");
      setEditTable(null);
      loadTables();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "আপডেট করা যায়নি");
    }
  }

  async function deleteTable(id: string) {
    if (!confirm("এই টেবিল মুছে ফেলবেন?")) return;
    const r = await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" });
    if (r.ok) {
      showToast("success", "টেবিল মুছে ফেলা হয়েছে");
      setTables(prev => prev.filter(t => t.id !== id));
      setEditTable(null);
    } else {
      showToast("error", "মুছে ফেলা যায়নি");
    }
  }

  async function addTable() {
    if (!newNumber) return;
    setSaving(true);
    const r = await fetch("/api/restaurant/tables", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: parseInt(newNumber), capacity: parseInt(newCapacity), floor: newFloor }),
    });
    setSaving(false);
    if (r.ok) {
      showToast("success", "টেবিল যোগ হয়েছে ✓");
      setShowAdd(false); setNewNumber(""); setNewCapacity("4"); setNewFloor("Ground");
      loadTables();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "টেবিল যোগ করা যায়নি");
    }
  }

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const ex = prev.find(c => c.menuItem.id === item.id);
      if (ex) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const ex = prev.find(c => c.menuItem.id === itemId);
      if (!ex) return prev;
      if (ex.quantity <= 1) return prev.filter(c => c.menuItem.id !== itemId);
      return prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }

  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  async function submitOrder() {
    if (!cart.length || !orderTable) return;
    setSubmittingOrder(true);
    const r = await fetch("/api/restaurant/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "dine_in", tableId: orderTable.id, note: orderNote || null,
        items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
      }),
    });
    setSubmittingOrder(false);
    if (r.ok) {
      showToast("success", "অর্ডার তৈরি হয়েছে ✓");
      setOrderTable(null);
      loadTables();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "অর্ডার তৈরি করা যায়নি");
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const r = await fetch(`/api/restaurant/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const updated = await r.json();
      setActiveOrder(updated);
      if (status === "paid") { setOccupiedTable(null); loadTables(); }
      showToast("success", "আপডেট হয়েছে ✓");
    } else {
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  async function handlePayment() {
    if (!activeOrder) return;
    const amount = parseFloat(payAmount) || activeOrder.totalAmount;
    setPaying(true);
    const r = await fetch(`/api/restaurant/orders/${activeOrder.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid", paidAmount: amount }),
    });
    setPaying(false);
    if (r.ok) {
      showToast("success", "পেমেন্ট সম্পন্ন ✓");
      setOccupiedTable(null);
      loadTables();
    } else {
      showToast("error", "পেমেন্ট রেকর্ড করা যায়নি");
    }
  }

  const floors = ["all", ...Array.from(new Set(tables.map(t => t.floor ?? "Ground")))];
  const displayTables = filterFloor === "all" ? tables : tables.filter(t => (t.floor ?? "Ground") === filterFloor);
  const emptyCount = tables.filter(t => t.status === "empty").length;
  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const filteredMenu = menuCat === "all" ? menuItems : menuItems.filter(m => m.category === menuCat);
  const elapsedMin = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 60000);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)" }}>
            <UtensilsCrossed size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>টেবিল ম্যাপ</h1>
            <p className="text-xs" style={{ color: S.muted }}>{emptyCount} খালি · {occupiedCount} ব্যস্ত</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)" }}>
          <Plus size={16} /> নতুন টেবিল
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {floors.map(f => (
          <button key={f} onClick={() => setFilterFloor(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border flex-shrink-0 transition-colors"
            style={{
              backgroundColor: filterFloor === f ? "#EF4444" : S.surface,
              color: filterFloor === f ? "#fff" : S.secondary,
              borderColor: filterFloor === f ? "#EF4444" : S.border,
            }}>
            {f === "all" ? "সব ফ্লোর" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16" style={{ color: S.muted }}>
          <Loader2 size={24} className="animate-spin mr-2" /> লোড হচ্ছে...
        </div>
      ) : displayTables.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <UtensilsCrossed size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm mb-1" style={{ color: S.text }}>এখনো কোনো টেবিল নেই</p>
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold" style={{ color: "#EF4444" }}>
            + নতুন টেবিল যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayTables.map(table => {
            const st = TABLE_STATUS[table.status] ?? TABLE_STATUS.empty;
            const activeOrd = table.restaurantOrders?.[0];
            return (
              <div key={table.id} className="relative">
                <button
                  onClick={() => handleTableClick(table)}
                  className="w-full rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md active:scale-95"
                  style={{ borderColor: st.dot, backgroundColor: st.bg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: st.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: st.color }}>{st.label}</span>
                  </div>
                  <p className="text-2xl font-black mb-0.5" style={{ color: "#EF4444" }}>T{table.number}</p>
                  <p className="text-xs" style={{ color: st.color }}>{table.capacity} জন</p>
                  {table.floor && table.floor !== "Ground" && (
                    <p className="text-[10px] mt-1" style={{ color: st.color }}>{table.floor}</p>
                  )}
                  {activeOrd && (
                    <div className="mt-2 flex items-center gap-1" style={{ color: st.color }}>
                      <Clock size={10} />
                      <span className="text-[10px]">{elapsedMin(activeOrd.createdAt)}মি</span>
                      <span className="text-[10px] ml-auto font-semibold">{formatBDT(activeOrd.totalAmount)}</span>
                    </div>
                  )}
                  {table.status === "empty" && (
                    <p className="text-[10px] mt-2 font-semibold" style={{ color: "#059669" }}>+ অর্ডার দিন</p>
                  )}
                </button>
                <button onClick={e => { e.stopPropagation(); openEdit(table); }}
                  className="absolute top-2 right-2 p-1 rounded-lg"
                  style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                  title="সম্পাদনা">
                  <Settings size={11} style={{ color: st.color }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {orderTable && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-2xl rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold" style={{ color: S.text }}>টেবিল {orderTable.number} — নতুন অর্ডার</h2>
                <p className="text-xs" style={{ color: S.muted }}>
                  {orderStep === 1 ? "মেনু থেকে আইটেম বেছে নিন" : "অর্ডার নিশ্চিত করুন"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1,2].map(s => <div key={s} className="w-5 h-1.5 rounded-full" style={{ backgroundColor: orderStep >= s ? "#EF4444" : S.border }} />)}
                </div>
                <button onClick={() => setOrderTable(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={18} style={{ color: S.muted }} />
                </button>
              </div>
            </div>

            {orderStep === 1 ? (
              <>
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
                    {filteredMenu.length === 0 ? (
                      <p className="text-center py-8 text-sm" style={{ color: S.muted }}>
                        {menuItems.length === 0 ? "কোনো মেনু আইটেম নেই। আগে মেনু তৈরি করুন।" : "এই ক্যাটাগরিতে কিছু নেই"}
                      </p>
                    ) : filteredMenu.map(item => {
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
                                <button onClick={() => removeFromCart(item.id)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center border"
                                  style={{ borderColor: S.border }}>
                                  <Minus size={12} style={{ color: S.secondary }} />
                                </button>
                                <span className="w-6 text-center text-sm font-bold" style={{ color: S.text }}>{inCart.quantity}</span>
                                <button onClick={() => addToCart(item)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                                  style={{ backgroundColor: "#EF4444" }}>
                                  <Plus size={12} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => addToCart(item)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                                style={{ backgroundColor: "#EF4444" }}>
                                + যোগ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {cart.length > 0 && (
                    <div className="w-48 border-l p-3 overflow-y-auto flex flex-col" style={{ borderColor: S.border }}>
                      <p className="text-xs font-bold mb-2" style={{ color: S.text }}>কার্ট ({cartCount})</p>
                      <div className="flex-1 space-y-2">
                        {cart.map(c => (
                          <div key={c.menuItem.id} className="flex items-center gap-1.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate" style={{ color: S.text }}>{c.menuItem.name}</p>
                              <p className="text-xs font-mono" style={{ color: "#EF4444" }}>{formatBDT(c.menuItem.price * c.quantity)}</p>
                            </div>
                            <div className="flex items-center gap-0.5">
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
                <div className="px-4 py-3 flex-shrink-0">
                  <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)}
                    placeholder="অর্ডার নোট (ঐচ্ছিক)" rows={2}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: S.text }}>টেবিল {orderTable.number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EF4444" }}>Dine-in</span>
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
                    <span className="font-bold" style={{ color: S.text }}>মোট</span>
                    <span className="text-lg font-black font-mono" style={{ color: "#EF4444" }}>{formatBDT(cartTotal)}</span>
                  </div>
                  {orderNote && <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#FFFBEB", color: "#92600A" }}>📝 {orderNote}</p>}
                </div>
              </div>
            )}

            <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0" style={{ borderColor: S.border }}>
              {orderStep === 2 && (
                <button onClick={() => setOrderStep(1)}
                  className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
                  style={{ borderColor: S.border, color: S.secondary }}>
                  পেছনে
                </button>
              )}
              {orderStep === 1 ? (
                <button onClick={() => setOrderStep(2)} disabled={cart.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "#EF4444" }}>
                  নিশ্চিত করুন ({cartCount} আইটেম) →
                </button>
              ) : (
                <button onClick={submitOrder} disabled={submittingOrder}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "#EF4444" }}>
                  {submittingOrder ? <Loader2 size={16} className="animate-spin mx-auto" /> : `অর্ডার দিন — ${formatBDT(cartTotal)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {occupiedTable && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "85vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>টেবিল {occupiedTable.number} — চলমান অর্ডার</h2>
              <button onClick={() => { setOccupiedTable(null); setActiveOrder(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingOrder ? (
                <div className="text-center py-8" style={{ color: S.muted }}>
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" /> লোড হচ্ছে...
                </div>
              ) : activeOrder ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm px-3 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: ORDER_STATUS[activeOrder.status]?.bg, color: ORDER_STATUS[activeOrder.status]?.color }}>
                      {ORDER_STATUS[activeOrder.status]?.label}
                    </span>
                    <div className="flex items-center gap-1" style={{ color: S.muted }}>
                      <Clock size={12} />
                      <span className="text-xs">{elapsedMin(activeOrder.createdAt)}মি</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {activeOrder.items.map(item => (
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
                      <span className="text-lg font-bold font-mono" style={{ color: "#EF4444" }}>{formatBDT(activeOrder.totalAmount)}</span>
                    </div>
                  </div>

                  {activeOrder.status !== "paid" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {activeOrder.status === "pending" && (
                          <button onClick={() => updateOrderStatus(activeOrder.id, "preparing")}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                            style={{ backgroundColor: "#F59E0B" }}>রান্না শুরু</button>
                        )}
                        {activeOrder.status === "preparing" && (
                          <button onClick={() => updateOrderStatus(activeOrder.id, "ready")}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                            style={{ backgroundColor: "#10B981" }}>প্রস্তুত ✓</button>
                        )}
                        {activeOrder.status === "ready" && (
                          <button onClick={() => updateOrderStatus(activeOrder.id, "served")}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                            style={{ backgroundColor: "#3B82F6" }}>পরিবেশিত</button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold" style={{ color: S.muted }}>বিল সংগ্রহ করুন</p>
                        <div className="flex gap-2">
                          <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                            placeholder={`${activeOrder.totalAmount} (মোট)`}
                            className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
                            style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                          <button onClick={handlePayment} disabled={paying}
                            className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                            style={{ backgroundColor: "#0F6E56" }}>
                            {paying ? <Loader2 size={14} className="animate-spin" /> : "বিল ✓"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeOrder.status === "paid" && (
                    <div className="flex items-center gap-2 py-3 px-4 rounded-xl" style={{ backgroundColor: "#ECFDF5" }}>
                      <CheckCircle size={18} style={{ color: "#059669" }} />
                      <span className="text-sm font-semibold" style={{ color: "#059669" }}>পেমেন্ট সম্পন্ন</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center py-8 text-sm" style={{ color: S.muted }}>অর্ডার খুঁজে পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        </div>
      )}

      {editTable && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setEditTable(null)}>
          <div className="w-full max-w-sm rounded-t-3xl md:rounded-2xl p-5"
            style={{ backgroundColor: S.surface }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: S.text }}>টেবিল সম্পাদনা</h3>
              <button onClick={() => setEditTable(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>টেবিল নম্বর</label>
                <input type="number" value={editNumber} onChange={e => setEditNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>আসন সংখ্যা</label>
                <input type="number" value={editCapacity} onChange={e => setEditCapacity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ফ্লোর</label>
                <input value={editFloor} onChange={e => setEditFloor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: "#0F6E56" }}>
                {editSaving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "সংরক্ষণ করুন"}
              </button>
              <button onClick={() => deleteTable(editTable.id)}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#EF4444" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-t-3xl md:rounded-2xl p-5"
            style={{ backgroundColor: S.surface }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: S.text }}>নতুন টেবিল যোগ করুন</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>টেবিল নম্বর *</label>
                <input type="number" value={newNumber} onChange={e => setNewNumber(e.target.value)}
                  placeholder="যেমন: 1, 2, 3..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>আসন সংখ্যা</label>
                <input type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ফ্লোর</label>
                <input value={newFloor} onChange={e => setNewFloor(e.target.value)}
                  placeholder="যেমন: Ground, 1st Floor..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <button onClick={addTable} disabled={!newNumber || saving}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: "#EF4444" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "টেবিল যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
