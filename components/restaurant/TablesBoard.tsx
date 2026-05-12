"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UtensilsCrossed, X, Loader2, Settings, Trash2, Minus, Clock, ArrowRightLeft, Merge, QrCode, Download } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import QRCode from "qrcode";

interface DiningTable {
  id: string; number: number; capacity: number; floor?: string; status: string;
  restaurantOrders?: {
    id: string; status: string; totalAmount: number; createdAt: string; type: string;
    waiter?: { user: { name: string } } | null;
  }[];
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
  orderNumber?: string; customerName?: string; note?: string; createdAt: string;
  items: ROrderItem[]; table?: { id: string; number: number } | null;
  waiter?: { id: string; user: { name: string } } | null;
  tipAmount?: number;
}

interface CartItem { menuItem: MenuItem; quantity: number; }

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", bg: "var(--c-bg)",
};

const ORANGE = "#EA580C";

const TABLE_STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  available:     { label: "খালি",      bg: "#FFFFFF",  color: "#374151", dot: "#D1D5DB" },
  occupied:      { label: "ব্যস্ত",    bg: "#FFF7ED",  color: ORANGE,    dot: ORANGE    },
  reserved:      { label: "রিজার্ভড",  bg: "#FFFBEB",  color: "#D97706", dot: "#D97706" },
  cleaning:      { label: "পরিষ্কার",  bg: "#F9FAFB",  color: "#6B7280", dot: "#9CA3AF" },
  bill_requested:{ label: "বিল চাই",   bg: "#FEF9C3",  color: "#854D0E", dot: "#EAB308" },
};

const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "নতুন",       bg: "var(--status-pending-bg)",   color: "var(--status-pending-text)"   },
  preparing: { label: "তৈরি হচ্ছে", bg: "#FEF3C7",                   color: "#92600A"                       },
  ready:     { label: "প্রস্তুত",   bg: "var(--status-confirmed-bg)", color: "var(--status-confirmed-text)" },
  served:    { label: "পরিবেশিত",  bg: "var(--status-shipped-bg)",   color: "var(--status-shipped-text)"   },
  billing:   { label: "বিল চাই",   bg: "#FEF9C3",                    color: "#854D0E"                       },
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

const PAY_METHODS = [
  { key: "cash",   label: "ক্যাশ"  },
  { key: "card",   label: "কার্ড"  },
  { key: "bkash",  label: "bKash" },
  { key: "nagad",  label: "Nagad" },
];

export default function TablesBoard() {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [qrTable, setQrTable] = useState<DiningTable | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

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
  const [payMethod, setPayMethod] = useState("cash");
  const [discount, setDiscount] = useState("0");
  const [tipInput, setTipInput] = useState("0");
  const [paying, setPaying] = useState(false);

  const [waiterList, setWaiterList] = useState<{ id: string; name: string }[]>([]);
  const [assigningWaiter, setAssigningWaiter] = useState(false);

  const [showMerge, setShowMerge] = useState(false);
  const [mergeSource, setMergeSource] = useState<DiningTable | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [merging, setMerging] = useState(false);

  const [showMove, setShowMove] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");
  const [moving, setMoving] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
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
    fetch("/api/restaurant/info")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.slug) setShopSlug(d.slug); })
      .catch(() => {});
  }, []);

  async function openQr(table: DiningTable) {
    setQrTable(table);
    setQrDataUrl(null);
    setQrLoading(true);
    try {
      const origin = window.location.origin;
      const url = `${origin}/qr/${shopSlug}/${table.number}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#1C1C1C", light: "#FFFFFF" } });
      setQrDataUrl(dataUrl);
    } catch { /* ignore */ }
    setQrLoading(false);
  }

  function downloadQr(table: DiningTable) {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `table-${table.number}-qr.png`;
    a.click();
  }

  useEffect(() => {
    if (orderTable) {
      fetch("/api/restaurant/menu-items?available=true").then(r => r.json()).then(setMenuItems).catch(() => {});
      setCart([]); setOrderNote(""); setMenuCat("all"); setOrderStep(1);
    }
  }, [orderTable]);

  function handleTableClick(table: DiningTable) {
    if (table.status === "available" || table.status === "reserved" || table.status === "cleaning") {
      setOrderTable(table);
    } else if (table.status === "occupied" || table.status === "bill_requested") {
      const orderId = table.restaurantOrders?.[0]?.id;
      if (orderId) {
        setOccupiedTable(table);
        setLoadingOrder(true);
        setActiveOrder(null);
        setPayMethod("cash");
        setDiscount("0");
        setTipInput("0");
        Promise.all([
          fetch(`/api/restaurant/orders/${orderId}`).then(r => r.json()),
          waiterList.length === 0
            ? fetch("/api/restaurant/waiters").then(r => r.ok ? r.json() : [])
            : Promise.resolve(null),
        ]).then(([order, waiters]) => {
          setActiveOrder(order);
          if (waiters) setWaiterList(waiters.map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })));
          setLoadingOrder(false);
        }).catch(() => setLoadingOrder(false));
      }
    }
  }

  async function assignWaiter(waiterId: string | null) {
    if (!activeOrder) return;
    setAssigningWaiter(true);
    const r = await fetch(`/api/restaurant/orders/${activeOrder.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_waiter", waiterId }),
    });
    setAssigningWaiter(false);
    if (r.ok) {
      const d = await r.json();
      setActiveOrder(d);
      showToast("success", waiterId ? "ওয়েটার নির্ধারিত ✓" : "ওয়েটার সরানো হয়েছে");
    } else {
      showToast("error", "ওয়েটার পরিবর্তন করা যায়নি");
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
      body: JSON.stringify({ number: parseInt(editNumber), capacity: parseInt(editCapacity), floor: editFloor }),
    });
    setEditSaving(false);
    if (r.ok) { showToast("success", "টেবিল আপডেট হয়েছে ✓"); setEditTable(null); loadTables(); }
    else { const d = await r.json(); showToast("error", d.error ?? "আপডেট করা যায়নি"); }
  }

  async function deleteTable(id: string) {
    if (!confirm("এই টেবিল মুছে ফেলবেন?")) return;
    const r = await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" });
    if (r.ok) { showToast("success", "টেবিল মুছে ফেলা হয়েছে"); setTables(prev => prev.filter(t => t.id !== id)); setEditTable(null); }
    else { const d = await r.json(); showToast("error", d.error ?? "মুছে ফেলা যায়নি"); }
  }

  async function addTable() {
    if (!newNumber) return;
    setSaving(true);
    const r = await fetch("/api/restaurant/tables", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: parseInt(newNumber), capacity: parseInt(newCapacity), floor: newFloor }),
    });
    setSaving(false);
    if (r.ok) { showToast("success", "টেবিল যোগ হয়েছে ✓"); setShowAdd(false); setNewNumber(""); setNewCapacity("4"); setNewFloor("Ground"); loadTables(); }
    else { const d = await r.json(); showToast("error", d.error ?? "টেবিল যোগ করা যায়নি"); }
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
    if (r.ok) { showToast("success", "অর্ডার তৈরি হয়েছে ✓"); setOrderTable(null); loadTables(); }
    else { const d = await r.json(); showToast("error", d.error ?? "অর্ডার তৈরি করা যায়নি"); }
  }

  async function sendKot() {
    if (!activeOrder) return;
    const r = await fetch(`/api/restaurant/orders/${activeOrder.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_kot" }),
    });
    if (r.ok) { const d = await r.json(); setActiveOrder(d); showToast("success", "KOT পাঠানো হয়েছে ✓"); }
    else showToast("error", "KOT পাঠানো যায়নি");
  }

  async function requestBill() {
    if (!activeOrder) return;
    const r = await fetch(`/api/restaurant/orders/${activeOrder.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_bill" }),
    });
    if (r.ok) { const d = await r.json(); setActiveOrder(d); showToast("success", "বিল অনুরোধ পাঠানো হয়েছে"); }
    else showToast("error", "বিল অনুরোধ করা যায়নি");
  }

  async function handlePayment() {
    if (!activeOrder) return;
    const disc = parseFloat(discount) || 0;
    const tip = parseFloat(tipInput) || 0;
    setPaying(true);
    const r = await fetch(`/api/restaurant/orders/${activeOrder.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete_payment", paymentMethod: payMethod, discount: disc, tipAmount: tip }),
    });
    setPaying(false);
    if (r.ok) { showToast("success", "পেমেন্ট সম্পন্ন ✓"); setOccupiedTable(null); loadTables(); }
    else showToast("error", "পেমেন্ট রেকর্ড করা যায়নি");
  }

  async function doMerge() {
    if (!mergeSource || !mergeTarget) return;
    setMerging(true);
    const r = await fetch("/api/restaurant/tables/merge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceTableId: mergeSource.id, targetTableId: mergeTarget }),
    });
    setMerging(false);
    if (r.ok) {
      const d = await r.json();
      showToast("success", d.message ?? "মার্জ সফল ✓");
      setShowMerge(false); setMergeSource(null); setMergeTarget(""); loadTables();
    } else {
      const d = await r.json(); showToast("error", d.error ?? "মার্জ করা যায়নি");
    }
  }

  async function doMove() {
    if (!activeOrder || !moveTarget) return;
    setMoving(true);
    const r = await fetch("/api/restaurant/tables/move", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: activeOrder.id, targetTableId: moveTarget }),
    });
    setMoving(false);
    if (r.ok) {
      showToast("success", "অর্ডার সরানো হয়েছে ✓");
      setShowMove(false); setMoveTarget(""); setOccupiedTable(null); loadTables();
    } else {
      const d = await r.json(); showToast("error", d.error ?? "সরানো যায়নি");
    }
  }

  const floors = ["all", ...Array.from(new Set(tables.map(t => t.floor ?? "Ground")))];
  const displayTables = filterFloor === "all" ? tables : tables.filter(t => (t.floor ?? "Ground") === filterFloor);
  const emptyCount = tables.filter(t => t.status === "available").length;
  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const filteredMenu = menuCat === "all" ? menuItems : menuItems.filter(m => m.category === menuCat);
  const elapsedMin = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 60000);

  const occupiedTablesForMove = tables.filter(t => t.id !== occupiedTable?.id && t.status === "available");

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
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
            <UtensilsCrossed size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>টেবিল ম্যাপ</h1>
            <p className="text-xs" style={{ color: S.muted }}>{emptyCount} খালি · {occupiedCount} ব্যস্ত</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMerge(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-semibold border"
            style={{ borderColor: S.border, color: S.secondary }}>
            <Merge size={14} /> মার্জ
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
            <Plus size={16} /> নতুন টেবিল
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {floors.map(f => (
          <button key={f} onClick={() => setFilterFloor(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium border flex-shrink-0 transition-colors"
            style={{
              backgroundColor: filterFloor === f ? ORANGE : S.surface,
              color: filterFloor === f ? "#fff" : S.secondary,
              borderColor: filterFloor === f ? ORANGE : S.border,
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
          <button onClick={() => setShowAdd(true)} className="text-sm font-semibold" style={{ color: ORANGE }}>
            + নতুন টেবিল যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayTables.map(table => {
            const st = TABLE_STATUS[table.status] ?? TABLE_STATUS.available;
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
                  <p className="text-2xl font-black mb-0.5" style={{ color: ORANGE }}>T{table.number}</p>
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
                  {activeOrd?.waiter?.user?.name && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ fontSize: 8, backgroundColor: ORANGE }}>
                        {activeOrd.waiter.user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[9px] truncate" style={{ color: st.color }}>
                        {activeOrd.waiter.user.name}
                      </span>
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
                {shopSlug && (
                  <button onClick={e => { e.stopPropagation(); openQr(table); }}
                    className="absolute bottom-2 right-2 p-1 rounded-lg"
                    style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                    title="QR কোড">
                    <QrCode size={11} style={{ color: st.color }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Order Modal */}
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
                  {[1,2].map(s => <div key={s} className="w-5 h-1.5 rounded-full" style={{ backgroundColor: orderStep >= s ? ORANGE : S.border }} />)}
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
                        backgroundColor: menuCat === cat.key ? ORANGE : S.surface,
                        color: menuCat === cat.key ? "#fff" : S.secondary,
                        borderColor: menuCat === cat.key ? ORANGE : S.border,
                      }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredMenu.length === 0 ? (
                      <p className="text-center py-8 text-sm" style={{ color: S.muted }}>
                        {menuItems.length === 0 ? "কোনো মেনু আইটেম নেই।" : "এই ক্যাটাগরিতে কিছু নেই"}
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
                            <p className="text-sm font-bold font-mono mt-0.5" style={{ color: ORANGE }}>{formatBDT(item.price)}</p>
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
                                  style={{ backgroundColor: ORANGE }}>
                                  <Plus size={12} />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => addToCart(item)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                                style={{ backgroundColor: ORANGE }}>
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
                              <p className="text-xs font-mono" style={{ color: ORANGE }}>{formatBDT(c.menuItem.price * c.quantity)}</p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => removeFromCart(c.menuItem.id)} className="w-5 h-5 rounded text-xs flex items-center justify-center border" style={{ borderColor: S.border }}>-</button>
                              <span className="text-xs w-4 text-center" style={{ color: S.text }}>{c.quantity}</span>
                              <button onClick={() => addToCart(c.menuItem)} className="w-5 h-5 rounded text-xs flex items-center justify-center text-white" style={{ backgroundColor: ORANGE }}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t mt-2" style={{ borderColor: S.border }}>
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: S.text }}>মোট</span>
                          <span style={{ color: ORANGE }}>{formatBDT(cartTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: S.border }}>
                  <div className="flex gap-2">
                    <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)}
                      placeholder="অর্ডার নোট (ঐচ্ছিক)" rows={1}
                      className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                      style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                    <button onClick={() => cart.length > 0 && setOrderStep(2)}
                      disabled={!cart.length}
                      className="px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40"
                      style={{ backgroundColor: ORANGE }}>
                      পরবর্তী ({cartCount})
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: S.border }}>
                  {cart.map(c => (
                    <div key={c.menuItem.id} className="flex justify-between text-sm">
                      <span style={{ color: S.text }}>{c.menuItem.name} × {c.quantity}</span>
                      <span style={{ color: ORANGE }} className="font-mono font-semibold">{formatBDT(c.menuItem.price * c.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold" style={{ borderColor: S.border }}>
                    <span style={{ color: S.text }}>মোট</span>
                    <span style={{ color: ORANGE }} className="font-mono">{formatBDT(cartTotal)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOrderStep(1)} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.secondary }}>
                    ← পেছনে
                  </button>
                  <button onClick={submitOrder} disabled={submittingOrder}
                    className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                    style={{ backgroundColor: ORANGE }}>
                    {submittingOrder ? <Loader2 size={16} className="animate-spin mx-auto" /> : "অর্ডার দিন ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Order Detail Modal */}
      {occupiedTable && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <div>
                <h2 className="font-bold" style={{ color: S.text }}>টেবিল {occupiedTable.number}</h2>
                {activeOrder?.orderNumber && (
                  <p className="text-xs font-mono" style={{ color: S.muted }}>{activeOrder.orderNumber}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMove(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: S.border, color: S.secondary }}>
                  <ArrowRightLeft size={12} /> সরান
                </button>
                <button onClick={() => setOccupiedTable(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={18} style={{ color: S.muted }} />
                </button>
              </div>
            </div>

            {loadingOrder ? (
              <div className="flex items-center justify-center py-16" style={{ color: S.muted }}>
                <Loader2 size={24} className="animate-spin mr-2" /> লোড হচ্ছে...
              </div>
            ) : activeOrder ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Items */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: S.border }}>
                  {activeOrder.items.map((item, idx) => (
                    <div key={item.id} className="flex justify-between items-center px-4 py-3"
                      style={{ borderBottom: idx < activeOrder.items.length - 1 ? `1px solid ${S.border}` : "none" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: S.text }}>{item.menuItem.name}</p>
                        <p className="text-xs" style={{ color: S.muted }}>× {item.quantity} · {formatBDT(item.unitPrice)} each</p>
                      </div>
                      <p className="text-sm font-bold font-mono" style={{ color: ORANGE }}>{formatBDT(item.unitPrice * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Waiter Assignment */}
                {waiterList.length > 0 && (
                  <div className="rounded-xl border p-4" style={{ borderColor: S.border }}>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: S.muted }}>
                      ওয়েটার নির্বাচন করুন
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={activeOrder.waiter?.id ?? ""}
                        onChange={e => assignWaiter(e.target.value || null)}
                        disabled={assigningWaiter}
                        className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none disabled:opacity-50"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                        <option value="">— কোনো ওয়েটার নেই —</option>
                        {waiterList.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      {assigningWaiter && <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: ORANGE }} />}
                    </div>
                  </div>
                )}

                {/* Bill summary */}
                <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: S.border }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: S.muted }}>সাবটোটাল</span>
                    <span className="font-mono" style={{ color: S.text }}>{formatBDT(activeOrder.totalAmount)}</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>ডিসকাউন্ট (৳)</label>
                    <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>টিপ (৳)</label>
                    <input type="number" min="0" value={tipInput} onChange={e => setTipInput(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                    <div className="flex gap-2 mt-1">
                      {PAY_METHODS.map(m => (
                        <button key={m.key} onClick={() => setPayMethod(m.key)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
                          style={{
                            backgroundColor: payMethod === m.key ? ORANGE : S.surface,
                            color: payMethod === m.key ? "#fff" : S.secondary,
                            borderColor: payMethod === m.key ? ORANGE : S.border,
                          }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  {!activeOrder.kotSent && (
                    <button onClick={sendKot}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold border"
                      style={{ borderColor: "#D97706", color: "#D97706", backgroundColor: "#FFFBEB" }}>
                      🔔 KOT পাঠান কিচেনে
                    </button>
                  )}
                  {activeOrder.status !== "billing" && activeOrder.status !== "paid" && (
                    <button onClick={requestBill}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold border"
                      style={{ borderColor: "#3B82F6", color: "#3B82F6", backgroundColor: "#EFF6FF" }}>
                      🧾 বিল অনুরোধ করুন
                    </button>
                  )}
                  <button onClick={handlePayment} disabled={paying}
                    className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                    style={{ backgroundColor: "#059669" }}>
                    {paying ? <Loader2 size={16} className="animate-spin mx-auto" /> : "✓ পেমেন্ট সম্পন্ন করুন"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Merge Tables Modal */}
      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: S.text }}>টেবিল মার্জ করুন</h3>
              <button onClick={() => setShowMerge(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>উৎস টেবিল (ব্যস্ত)</label>
                <select value={mergeSource?.id ?? ""} onChange={e => setMergeSource(tables.find(t => t.id === e.target.value) ?? null)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                  <option value="">টেবিল বেছে নিন</option>
                  {tables.filter(t => t.status === "occupied").map(t => (
                    <option key={t.id} value={t.id}>টেবিল {t.number} ({t.floor ?? "Ground"})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>লক্ষ্য টেবিল</label>
                <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                  <option value="">টেবিল বেছে নিন</option>
                  {tables.filter(t => t.id !== mergeSource?.id).map(t => (
                    <option key={t.id} value={t.id}>টেবিল {t.number} — {TABLE_STATUS[t.status]?.label ?? t.status}</option>
                  ))}
                </select>
              </div>
              <button onClick={doMerge} disabled={!mergeSource || !mergeTarget || merging}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}>
                {merging ? <Loader2 size={16} className="animate-spin mx-auto" /> : "মার্জ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Order Modal */}
      {showMove && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: S.text }}>অর্ডার সরান</h3>
              <button onClick={() => setShowMove(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm" style={{ color: S.muted }}>
                টেবিল {occupiedTable?.number} থেকে কোন টেবিলে সরাবেন?
              </p>
              <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                <option value="">টেবিল বেছে নিন</option>
                {occupiedTablesForMove.map(t => (
                  <option key={t.id} value={t.id}>টেবিল {t.number} — খালি</option>
                ))}
              </select>
              {occupiedTablesForMove.length === 0 && (
                <p className="text-xs" style={{ color: "#EF4444" }}>কোনো খালি টেবিল নেই</p>
              )}
              <button onClick={doMove} disabled={!moveTarget || moving}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}>
                {moving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সরান ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: S.text }}>নতুন টেবিল</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>টেবিল নম্বর *</label>
                <input type="number" value={newNumber} onChange={e => setNewNumber(e.target.value)}
                  placeholder="যেমন: 5"
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
                  placeholder="Ground"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <button onClick={addTable} disabled={!newNumber || saving}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold" style={{ color: S.text }}>টেবিল {qrTable.number} QR কোড</h3>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>স্ক্যান করে অর্ডার দিন</p>
              </div>
              <button onClick={() => { setQrTable(null); setQrDataUrl(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              {qrLoading ? (
                <div className="w-48 h-48 flex items-center justify-center rounded-xl border" style={{ borderColor: S.border }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: ORANGE }} />
                </div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt={`Table ${qrTable.number} QR`}
                  className="w-48 h-48 rounded-xl border"
                  style={{ borderColor: S.border }} />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center rounded-xl border text-xs text-center px-4"
                  style={{ borderColor: S.border, color: S.muted }}>
                  QR তৈরি হয়নি। শপের slug সেট আছে কি?
                </div>
              )}
              {qrDataUrl && (
                <div className="w-full space-y-2">
                  <p className="text-[10px] text-center font-mono break-all" style={{ color: S.muted }}>
                    {`${typeof window !== "undefined" ? window.location.origin : ""}/qr/${shopSlug}/${qrTable.number}`}
                  </p>
                  <button onClick={() => downloadQr(qrTable)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: ORANGE }}>
                    <Download size={15} /> PNG ডাউনলোড করুন
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/qr/${shopSlug}/${qrTable.number}`;
                      navigator.clipboard?.writeText(url).then(() => showToast("success", "লিংক কপি হয়েছে ✓")).catch(() => {});
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: S.border, color: S.secondary }}>
                    লিংক কপি করুন
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-6" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: S.text }}>টেবিল {editTable.number} সম্পাদনা</h3>
              <button onClick={() => setEditTable(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-3">
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
              <div className="flex gap-2">
                <button onClick={() => deleteTable(editTable.id)}
                  className="p-3 rounded-xl border"
                  style={{ borderColor: "#FECACA", color: "#EF4444", backgroundColor: "#FEF2F2" }}>
                  <Trash2 size={15} />
                </button>
                <button onClick={saveEdit} disabled={editSaving}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                  style={{ backgroundColor: ORANGE }}>
                  {editSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "আপডেট করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
