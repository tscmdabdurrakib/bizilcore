"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, ShoppingCart, Plus, Minus, X, ChefHat, Loader2, Printer,
  RotateCcw, SendHorizonal, CreditCard, Wallet, Smartphone, Banknote,
  CheckCircle, ChevronRight, Tag, UserCheck, PauseCircle, ListOrdered,
  Split, AlertCircle, ChevronDown,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface MenuVariant { name: string; price: number }
interface MenuAddon   { name: string; price: number }

interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  price: number;
  isAvailable: boolean;
  isVeg: boolean;
  variants: MenuVariant[] | null;
  addons:   MenuAddon[]   | null;
  menuCategory?: { id: string; name: string } | null;
}

interface CartItem {
  cartKey: string;
  menuItemId: string;
  name: string;
  nameEn?: string;
  category: string;
  basePrice: number;
  unitPrice: number;
  selectedVariant: string | null;
  selectedAddons: MenuAddon[];
  addonTotal: number;
  quantity: number;
  note: string;
  isVeg: boolean;
}

interface DiningTable {
  id: string;
  number: number;
  capacity: number;
  status: string;
  floor: string;
}

interface Waiter {
  id: string;
  name: string;
  jobTitle?: string | null;
}

interface OrderSplit {
  id: string;
  splitIndex: number;
  payerName: string | null;
  amount: number;
  paymentMethod: string;
  transactionRef: string | null;
}

interface HeldOrder {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  customerName: string | null;
  table: { number: number; floor: string } | null;
  heldAt: string | null;
  heldBy: string | null;
  items: { menuItem: { name: string }; quantity: number }[];
  splits: OrderSplit[];
  paidAmount: number;
  dueAmount: number;
}

// Split row for split bill UI
interface SplitRow {
  id: string;
  payerName: string;
  amount: string;
  paymentMethod: string;
  transactionRef: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "সব", starter: "স্টার্টার", main: "মেইন", drink: "পানীয়",
  dessert: "ডেজার্ট", snack: "স্ন্যাকস", soup: "স্যুপ",
  rice: "ভাত/বিরিয়ানি", bread: "রুটি/নান", other: "অন্যান্য",
};

const ORDER_TYPES = [
  { value: "dine_in",  label: "ডাইন ইন"   },
  { value: "takeaway", label: "টেকঅ্যাওয়ে" },
  { value: "delivery", label: "ডেলিভারি"   },
];

const PAYMENT_METHODS = [
  { value: "cash",   label: "ক্যাশ",  icon: Banknote,   color: "#10B981" },
  { value: "card",   label: "কার্ড",  icon: CreditCard, color: "#3B82F6" },
  { value: "bkash",  label: "bKash",  icon: Smartphone, color: "#E91E8C" },
  { value: "nagad",  label: "Nagad",  icon: Wallet,     color: "#F97316" },
];

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "#EA580C", bg: "var(--c-bg)",
};

function makeCartKey(menuItemId: string, variant: string | null, addons: MenuAddon[]) {
  return `${menuItemId}__${variant ?? ""}__${addons.map(a => a.name).sort().join(",")}`;
}

function makeSplitId() {
  return Math.random().toString(36).slice(2);
}

export default function POSTerminal() {
  const [menuItems, setMenuItems]   = useState<MenuItem[]>([]);
  const [tables, setTables]         = useState<DiningTable[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("all");
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [orderType, setOrderType]   = useState("dine_in");
  const [selectedTable, setSelectedTable]     = useState("");
  const [customerName, setCustomerName]       = useState("");
  const [customerPhone, setCustomerPhone]     = useState("");
  const [note, setNote]             = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [vatPct, setVatPct]         = useState(0);
  const [svcPct, setSvcPct]         = useState(0);
  const [showPayModal, setShowPayModal]       = useState(false);
  const [payMethod, setPayMethod]             = useState("cash");
  const [lastOrderId, setLastOrderId]         = useState<string | null>(null);
  const [kotSentForOrder, setKotSentForOrder] = useState(false);
  const [sendingKot, setSendingKot]           = useState(false);
  const [paidOrderId, setPaidOrderId]         = useState<string | null>(null);
  const [waiters, setWaiters]               = useState<Waiter[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [tipAmount, setTipAmount]           = useState("");

  const [pickerItem, setPickerItem]               = useState<MenuItem | null>(null);
  const [pickerVariant, setPickerVariant]         = useState<string | null>(null);
  const [pickerAddons, setPickerAddons]           = useState<MenuAddon[]>([]);
  const [pickerVariantPrice, setPickerVariantPrice] = useState(0);

  // Hold orders
  const [heldOrders, setHeldOrders]   = useState<HeldOrder[]>([]);
  const [showHeldPanel, setShowHeldPanel] = useState(false);
  const [holdingOrder, setHoldingOrder] = useState(false);
  const [recalling, setRecalling]     = useState(false);

  // Split bill
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitMode, setSplitMode]           = useState<"equal" | "custom" | "partial">("equal");
  const [splitCount, setSplitCount]         = useState(2);
  const [splitRows, setSplitRows]           = useState<SplitRow[]>([]);
  const [savingSplit, setSavingSplit]       = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadHeldOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/restaurant/orders?held=true");
      if (r.ok) setHeldOrders(await r.json());
    } catch {}
  }, []);

  const load = useCallback(async () => {
    try {
      const [miRes, tRes, sRes, wRes] = await Promise.all([
        fetch("/api/restaurant/menu-items"),
        fetch("/api/restaurant/tables"),
        fetch("/api/settings/shop"),
        fetch("/api/restaurant/waiters"),
      ]);
      if (miRes.ok) setMenuItems(await miRes.json());
      if (tRes.ok)  setTables(await tRes.json());
      if (sRes.ok) {
        const s = await sRes.json();
        setVatPct(s.restVatPct ?? 0);
        setSvcPct(s.restServiceChargePct ?? 0);
      }
      if (wRes.ok) {
        const ws = await wRes.json();
        setWaiters(ws.map((w: { id: string; name: string; jobTitle?: string | null }) => ({ id: w.id, name: w.name, jobTitle: w.jobTitle })));
      }
    } catch {}
    setLoading(false);
    await loadHeldOrders();
  }, [loadHeldOrders]);

  useEffect(() => { load(); }, [load]);

  const categories = ["all", ...Array.from(new Set(menuItems.map(m => m.category))).sort()];

  const filtered = menuItems.filter(m => {
    if (!m.isAvailable) return false;
    if (category !== "all" && m.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !(m.nameEn?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const openPicker = (item: MenuItem) => {
    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      setPickerItem(item);
      setPickerVariant(null);
      setPickerVariantPrice(item.price);
      setPickerAddons([]);
    } else {
      addCartItem(item, null, item.price, []);
    }
  };

  const addCartItem = (item: MenuItem, variant: string | null, unitPrice: number, addons: MenuAddon[]) => {
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const finalPrice = unitPrice + addonTotal;
    const cartKey = makeCartKey(item.id, variant, addons);
    setCart(prev => {
      const ex = prev.find(c => c.cartKey === cartKey);
      if (ex) return prev.map(c => c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        cartKey, menuItemId: item.id, name: item.name, nameEn: item.nameEn,
        category: item.category, basePrice: item.price, unitPrice: finalPrice,
        selectedVariant: variant, selectedAddons: addons, addonTotal,
        quantity: 1, note: "", isVeg: item.isVeg,
      }];
    });
  };

  const confirmPicker = () => {
    if (!pickerItem) return;
    const hasVariants = pickerItem.variants && pickerItem.variants.length > 0;
    if (hasVariants && !pickerVariant) { showToast("error", "ভ্যারিয়েন্ট বেছে নিন"); return; }
    addCartItem(pickerItem, pickerVariant, pickerVariantPrice, pickerAddons);
    setPickerItem(null);
  };

  const togglePickerAddon = (addon: MenuAddon) => {
    setPickerAddons(prev => {
      const ex = prev.find(a => a.name === addon.name);
      return ex ? prev.filter(a => a.name !== addon.name) : [...prev, addon];
    });
  };

  const updateQty = (cartKey: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.cartKey === cartKey ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
          .filter(c => c.quantity > 0)
    );
  };

  const updateNote = (cartKey: string, val: string) =>
    setCart(prev => prev.map(c => c.cartKey === cartKey ? { ...c, note: val } : c));

  const subtotal  = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const vatAmount = Math.round(subtotal * (vatPct / 100) * 100) / 100;
  const svcAmount = Math.round(subtotal * (svcPct / 100) * 100) / 100;
  const total     = subtotal + vatAmount + svcAmount;

  const clearCart = () => {
    setCart([]);
    setSelectedTable("");
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setOrderType("dine_in");
    setLastOrderId(null);
    setKotSentForOrder(false);
    setPaidOrderId(null);
    setSelectedWaiter("");
    setTipAmount("");
  };

  const placeOrder = async () => {
    if (cart.length === 0) { showToast("error", "কার্টে কিছু নেই"); return; }
    if (orderType === "dine_in" && !selectedTable) { showToast("error", "টেবিল সিলেক্ট করুন"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/restaurant/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          tableId: selectedTable || null,
          waiterId: selectedWaiter || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          note: note || null,
          items: cart.map(c => ({
            menuItemId: c.menuItemId,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            selectedVariant: c.selectedVariant || null,
            selectedAddons: c.selectedAddons.length > 0 ? c.selectedAddons : null,
            addonTotal: c.addonTotal,
            note: c.note || null,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast("error", d.error ?? "অর্ডার দেওয়া যায়নি");
        setSubmitting(false);
        return;
      }
      const order = await res.json();
      setLastOrderId(order.id);
      setKotSentForOrder(false);
      setPaidOrderId(null);
      showToast("success", `✓ অর্ডার ${order.orderNumber} নিবন্ধিত — এখন KOT পাঠান`);
      load();
    } catch { showToast("error", "Error"); }
    setSubmitting(false);
  };

  const openPayModal = () => {
    if (!lastOrderId) { showToast("error", "আগে অর্ডার দিন"); return; }
    setShowPayModal(true);
  };

  const completePayment = async () => {
    if (!lastOrderId) return;
    setSubmitting(true);
    try {
      const tip = parseFloat(tipAmount) || 0;
      const payRes = await fetch(`/api/restaurant/orders/${lastOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_payment", paymentMethod: payMethod, tipAmount: tip }),
      });
      if (!payRes.ok) {
        const d = await payRes.json();
        showToast("error", d.error ?? "পেমেন্ট সম্পন্ন করা যায়নি");
        setSubmitting(false);
        return;
      }
      setPaidOrderId(lastOrderId);
      setShowPayModal(false);
      showToast("success", `✓ পেমেন্ট সম্পন্ন! (${PAYMENT_METHODS.find(p => p.value === payMethod)?.label})`);
      load();
    } catch { showToast("error", "Error"); }
    setSubmitting(false);
  };

  const sendKot = async (orderId: string) => {
    setSendingKot(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_kot" }),
      });
      if (r.ok) { setKotSentForOrder(true); showToast("success", "✓ KOT রান্নাঘরে পাঠানো হয়েছে!"); }
      else { const d = await r.json(); showToast("error", d.error ?? "KOT পাঠানো যায়নি"); }
    } catch { showToast("error", "Error"); }
    setSendingKot(false);
  };

  // ── HOLD ORDER ──────────────────────────────────────────────────
  const holdOrder = async () => {
    if (!lastOrderId) return;
    setHoldingOrder(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${lastOrderId}/hold`, { method: "POST" });
      if (r.ok) {
        showToast("success", "✓ অর্ডার পার্ক করা হয়েছে");
        clearCart();
        await loadHeldOrders();
      } else {
        const d = await r.json();
        showToast("error", d.error ?? "পার্ক করা যায়নি");
      }
    } catch { showToast("error", "Error"); }
    setHoldingOrder(false);
  };

  // ── RECALL HELD ORDER ───────────────────────────────────────────
  const recallHeldOrder = async (heldOrder: HeldOrder) => {
    setRecalling(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${heldOrder.id}/recall`, { method: "POST" });
      if (!r.ok) {
        const d = await r.json();
        showToast("error", d.error ?? "Recall করা যায়নি");
        setRecalling(false);
        return;
      }
      // Restore order to active tracking (just set lastOrderId; items stay in DB)
      setLastOrderId(heldOrder.id);
      setKotSentForOrder(false);
      setPaidOrderId(null);
      setCart([]); // clear local cart since items are in DB
      setShowHeldPanel(false);
      showToast("success", `✓ অর্ডার ${heldOrder.orderNumber} ফিরিয়ে আনা হয়েছে`);
      await loadHeldOrders();
      await load();
    } catch { showToast("error", "Error"); }
    setRecalling(false);
  };

  // ── SPLIT BILL ──────────────────────────────────────────────────
  const openSplitModal = () => {
    if (!lastOrderId) { showToast("error", "আগে অর্ডার দিন"); return; }
    setSplitMode("equal");
    setSplitCount(2);
    const equalAmt = (total / 2).toFixed(2);
    setSplitRows([
      { id: makeSplitId(), payerName: "", amount: equalAmt, paymentMethod: "cash", transactionRef: "" },
      { id: makeSplitId(), payerName: "", amount: equalAmt, paymentMethod: "cash", transactionRef: "" },
    ]);
    setShowSplitModal(true);
  };

  const updateSplitMode = (mode: "equal" | "custom" | "partial") => {
    setSplitMode(mode);
    if (mode === "equal") {
      const cnt = splitCount;
      const each = (total / cnt).toFixed(2);
      setSplitRows(Array.from({ length: cnt }, (_, i) => ({
        id: makeSplitId(), payerName: "", amount: each, paymentMethod: "cash", transactionRef: "",
      })));
    } else if (mode === "custom") {
      setSplitRows([
        { id: makeSplitId(), payerName: "", amount: total.toFixed(2), paymentMethod: "cash", transactionRef: "" },
      ]);
    } else if (mode === "partial") {
      setSplitRows([
        { id: makeSplitId(), payerName: "আংশিক পেমেন্ট", amount: "0", paymentMethod: "cash", transactionRef: "" },
      ]);
    }
  };

  const updateEqualSplitCount = (cnt: number) => {
    const c = Math.max(2, Math.min(10, cnt));
    setSplitCount(c);
    const each = (total / c).toFixed(2);
    setSplitRows(Array.from({ length: c }, (_, i) => ({
      id: makeSplitId(), payerName: "", amount: each, paymentMethod: "cash", transactionRef: "",
    })));
  };

  const addSplitRow = () => {
    setSplitRows(prev => [...prev, { id: makeSplitId(), payerName: "", amount: "0", paymentMethod: "cash", transactionRef: "" }]);
  };

  const removeSplitRow = (id: string) => {
    setSplitRows(prev => prev.filter(r => r.id !== id));
  };

  const updateSplitRow = (id: string, field: keyof SplitRow, value: string) => {
    setSplitRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const splitTotalEntered = splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const splitDiff = total - splitTotalEntered;

  const saveSplits = async () => {
    if (!lastOrderId) return;
    const validSplits = splitRows.filter(r => (parseFloat(r.amount) || 0) > 0);
    if (validSplits.length === 0) { showToast("error", "কমপক্ষে একটি পেমেন্ট এন্ট্রি দিন"); return; }

    const totalEntered = validSplits.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    if (splitMode !== "partial" && totalEntered < total - 0.5) {
      showToast("error", `মোট পরিমাণ (৳${totalEntered.toFixed(2)}) বিলের চেয়ে কম। "আংশিক পেমেন্ট" মোড ব্যবহার করুন অথবা পরিমাণ মিলিয়ে নিন।`);
      return;
    }

    setSavingSplit(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${lastOrderId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splits: validSplits.map(sp => ({
            payerName: sp.payerName || null,
            amount: parseFloat(sp.amount) || 0,
            paymentMethod: sp.paymentMethod,
            transactionRef: sp.transactionRef || null,
          })),
          isPartial: splitMode === "partial",
        }),
      });
      const data = await r.json();
      if (!r.ok) { showToast("error", data.error ?? "স্প্লিট সেভ হয়নি"); setSavingSplit(false); return; }

      setShowSplitModal(false);
      if (data.isFullyPaid) {
        setPaidOrderId(lastOrderId);
        showToast("success", `✓ পেমেন্ট সম্পন্ন! (${validSplits.length} জনের মধ্যে ভাগ করা)`);
      } else {
        showToast("success", `✓ আংশিক পেমেন্ট সেভ (৳${data.totalPaid?.toFixed(2)}) — বকেয়া: ৳${data.dueAmount?.toFixed(2)}`);
      }
      load();
    } catch { showToast("error", "Error"); }
    setSavingSplit(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  return (
    <>
    <div className="flex h-[calc(100vh-80px)] gap-0 -mx-4 -mt-4 overflow-hidden">

      {/* Left: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: S.border, backgroundColor: S.bg }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
            <ChefHat size={18} style={{ color: S.primary }} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-sm" style={{ color: S.text }}>POS টার্মিনাল</h1>
            <p className="text-xs" style={{ color: S.muted }}>{menuItems.filter(m => m.isAvailable).length}টি আইটেম</p>
          </div>
          {/* Held orders button */}
          <button onClick={() => { setShowHeldPanel(true); loadHeldOrders(); }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
            style={{ borderColor: heldOrders.length > 0 ? "#F59E0B" : S.border, color: heldOrders.length > 0 ? "#D97706" : S.muted, backgroundColor: heldOrders.length > 0 ? "#FFFBEB" : S.surface }}>
            <PauseCircle size={14} />
            পার্কড
            {heldOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: "#F59E0B" }}>
                {heldOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-3 border-b" style={{ borderColor: S.border }}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="মেনু আইটেম খুঁজুন…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
          </div>
        </div>

        <div className="flex gap-2 px-3 py-2.5 overflow-x-auto border-b" style={{ borderColor: S.border }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: category === cat ? S.primary : S.surface,
                color: category === cat ? "#fff" : S.muted,
                border: `1px solid ${category === cat ? S.primary : S.border}`,
              }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filtered.map(item => {
              const inCart = cart.filter(c => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0);
              const hasOptions = (item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0);
              return (
                <button key={item.id} onClick={() => openPicker(item)}
                  className="relative text-left p-3 rounded-2xl border transition-all hover:shadow-md active:scale-95"
                  style={{ backgroundColor: inCart > 0 ? "#FFF7ED" : S.surface, borderColor: inCart > 0 ? S.primary : S.border }}>
                  {item.isVeg && (
                    <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-green-100 text-green-700">VEG</span>
                  )}
                  {hasOptions && (
                    <span className="absolute top-2 right-2">
                      <Tag size={10} style={{ color: S.primary }} />
                    </span>
                  )}
                  <p className="text-xs font-bold mb-1 pr-4 leading-tight mt-3" style={{ color: S.text }}>{item.name}</p>
                  {item.nameEn && <p className="text-[10px] mb-2 opacity-60" style={{ color: S.muted }}>{item.nameEn}</p>}
                  {hasOptions && (
                    <p className="text-[9px] mb-1 opacity-70" style={{ color: S.primary }}>ভ্যারিয়েন্ট/অ্যাডঅন আছে</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold" style={{ color: S.primary }}>{formatBDT(item.price)}</p>
                    {inCart > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: S.primary }}>
                        ×{inCart}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12" style={{ color: S.muted }}>
                <p className="text-sm">কোনো আইটেম পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 flex flex-col overflow-hidden" style={{ backgroundColor: S.surface }}>
        <div className="p-4 border-b" style={{ borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: S.text }}>
              <ShoppingCart size={16} style={{ color: S.primary }} />
              কার্ট ({cart.reduce((s, c) => s + c.quantity, 0)}টি)
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
                <RotateCcw size={12} />ক্লিয়ার
              </button>
            )}
          </div>

          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
            {ORDER_TYPES.map(t => (
              <button key={t.value} onClick={() => setOrderType(t.value)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  backgroundColor: orderType === t.value ? S.primary : "transparent",
                  color: orderType === t.value ? "#fff" : S.muted,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {orderType === "dine_in" && (
            <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)}
              className="w-full mt-2 px-3 py-2 rounded-xl text-xs border outline-none"
              style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
              <option value="">— টেবিল বেছে নিন —</option>
              {tables.filter(t => t.status === "available" || t.id === selectedTable).map(t => (
                <option key={t.id} value={t.id}>টেবিল {t.number} ({t.floor})</option>
              ))}
            </select>
          )}
          {waiters.length > 0 && (
            <div className="mt-2 relative">
              <UserCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
              <select value={selectedWaiter} onChange={e => setSelectedWaiter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border outline-none"
                style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
                <option value="">— ওয়েটার বেছে নিন (ঐচ্ছিক) —</option>
                {waiters.map(w => (
                  <option key={w.id} value={w.id}>{w.name}{w.jobTitle ? ` (${w.jobTitle})` : ""}</option>
                ))}
              </select>
            </div>
          )}

          {orderType !== "dine_in" && (
            <div className="mt-2 space-y-1.5">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="কাস্টমারের নাম"
                className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
                style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="ফোন নম্বর"
                className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
                style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && !lastOrderId ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: S.muted }}>
              <ShoppingCart size={32} className="mb-3 opacity-30" />
              <p className="text-xs text-center">বাম দিক থেকে আইটেম বেছে নিন</p>
            </div>
          ) : lastOrderId && cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: S.muted }}>
              <CheckCircle size={28} className="mb-3 opacity-60" style={{ color: "#10B981" }} />
              <p className="text-xs text-center font-medium">অর্ডার সক্রিয়<br />নিচে থেকে পেমেন্ট করুন</p>
            </div>
          ) : cart.map(item => (
            <div key={item.cartKey} className="p-3 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight" style={{ color: S.text }}>{item.name}</p>
                  {item.selectedVariant && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                      {item.selectedVariant}
                    </span>
                  )}
                  {item.selectedAddons.length > 0 && (
                    <p className="text-[9px] mt-0.5" style={{ color: S.muted }}>
                      +{item.selectedAddons.map(a => a.name).join(", ")}
                    </p>
                  )}
                </div>
                <button onClick={() => updateQty(item.cartKey, -item.quantity)}>
                  <X size={13} style={{ color: "#EF4444" }} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 border rounded-lg overflow-hidden" style={{ borderColor: S.border }}>
                  <button onClick={() => updateQty(item.cartKey, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50">
                    <Minus size={12} style={{ color: "#EF4444" }} />
                  </button>
                  <span className="text-xs font-bold px-1 min-w-[20px] text-center" style={{ color: S.text }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.cartKey, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-green-50">
                    <Plus size={12} style={{ color: "#10B981" }} />
                  </button>
                </div>
                <p className="text-sm font-bold" style={{ color: S.primary }}>{formatBDT(item.unitPrice * item.quantity)}</p>
              </div>
              <input value={item.note} onChange={e => updateNote(item.cartKey, e.target.value)}
                placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)"
                className="w-full mt-2 px-2.5 py-1.5 rounded-lg text-[10px] border outline-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="px-3 pb-2">
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="অর্ডার নোট (ঐচ্ছিক)"
              className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
              style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
          </div>
        )}

        <div className="p-4 border-t space-y-2.5" style={{ borderColor: S.border }}>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: S.muted }}>
              <span>সাবটোটাল</span><span>{formatBDT(subtotal)}</span>
            </div>
            {vatPct > 0 && (
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>VAT ({vatPct}%)</span><span>{formatBDT(vatAmount)}</span>
              </div>
            )}
            {svcPct > 0 && (
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>সার্ভিস চার্জ ({svcPct}%)</span><span>{formatBDT(svcAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t" style={{ color: S.text, borderColor: S.border }}>
              <span>সর্বমোট</span>
              <span style={{ color: S.primary }}>{formatBDT(total)}</span>
            </div>
          </div>

          {lastOrderId && !paidOrderId && (
            <>
              <div className="flex gap-2">
                <button onClick={() => sendKot(lastOrderId!)} disabled={sendingKot || kotSentForOrder}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all"
                  style={{
                    borderColor: kotSentForOrder ? "#16A34A" : S.primary,
                    color: kotSentForOrder ? "#16A34A" : S.primary,
                    backgroundColor: kotSentForOrder ? "#DCFCE7" : "#FFF7ED",
                    opacity: kotSentForOrder ? 0.8 : 1,
                  }}>
                  {sendingKot ? <Loader2 size={12} className="animate-spin" /> : kotSentForOrder ? <CheckCircle size={12} /> : <SendHorizonal size={12} />}
                  {sendingKot ? "পাঠানো হচ্ছে…" : kotSentForOrder ? "KOT ✓" : "KOT পাঠান"}
                </button>
                <button onClick={openPayModal} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white transition-all"
                  style={{ backgroundColor: S.primary }}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                  {submitting ? "…" : "পেমেন্ট"}
                </button>
              </div>
              {/* Hold & Split buttons */}
              <div className="flex gap-2">
                <button onClick={holdOrder} disabled={holdingOrder}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all"
                  style={{ borderColor: "#F59E0B", color: "#D97706", backgroundColor: "#FFFBEB" }}>
                  {holdingOrder ? <Loader2 size={11} className="animate-spin" /> : <PauseCircle size={11} />}
                  পার্ক করুন
                </button>
                <button onClick={openSplitModal}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all"
                  style={{ borderColor: "#8B5CF6", color: "#7C3AED", backgroundColor: "#F5F3FF" }}>
                  <Split size={11} />
                  বিল ভাগ করুন
                </button>
              </div>
            </>
          )}
          {paidOrderId && (
            <div className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
              <CheckCircle size={13} /> পেমেন্ট সম্পন্ন ✓
            </div>
          )}

          {!lastOrderId && (
            <button onClick={placeOrder} disabled={submitting || cart.length === 0}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: cart.length > 0 ? S.primary : "#9CA3AF" }}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
              {submitting ? "প্রসেস হচ্ছে…" : "অর্ডার দিন"}
            </button>
          )}

          {paidOrderId && (
            <button onClick={clearCart} className="w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all"
              style={{ borderColor: S.border, color: S.muted }}>
              <RotateCcw size={12} /> নতুন অর্ডার
            </button>
          )}
        </div>
      </div>
    </div>

    {/* ── HELD ORDERS PANEL ───────────────────────────────────────── */}
    {showHeldPanel && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          style={{ backgroundColor: S.surface }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
                <PauseCircle size={18} style={{ color: "#D97706" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: S.text }}>পার্কড অর্ডার</h3>
                <p className="text-xs" style={{ color: S.muted }}>{heldOrders.length}টি অর্ডার পার্ক করা আছে</p>
              </div>
            </div>
            <button onClick={() => setShowHeldPanel(false)}><X size={18} style={{ color: S.muted }} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {heldOrders.length === 0 ? (
              <div className="text-center py-12" style={{ color: S.muted }}>
                <PauseCircle size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">কোনো পার্কড অর্ডার নেই</p>
              </div>
            ) : heldOrders.map(ho => (
              <div key={ho.id} className="p-4 rounded-2xl border" style={{ borderColor: "#F59E0B30", backgroundColor: "#FFFBEB" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-sm" style={{ color: S.text }}>{ho.orderNumber ?? ho.id.slice(0, 8)}</p>
                    {ho.table && <p className="text-xs" style={{ color: S.muted }}>টেবিল {ho.table.number} ({ho.table.floor})</p>}
                    {ho.customerName && <p className="text-xs" style={{ color: S.muted }}>{ho.customerName}</p>}
                    <p className="text-[10px] mt-1" style={{ color: "#D97706" }}>
                      {ho.heldAt ? `পার্কড: ${new Date(ho.heldAt).toLocaleTimeString("bn-BD")}` : ""}{ho.heldBy ? ` — ${ho.heldBy}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: S.primary }}>{formatBDT(ho.totalAmount)}</p>
                    {ho.dueAmount > 0 && (
                      <p className="text-[10px] mt-0.5" style={{ color: "#EF4444" }}>বকেয়া: {formatBDT(ho.dueAmount)}</p>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  {ho.items.slice(0, 3).map((item, i) => (
                    <p key={i} className="text-[10px]" style={{ color: S.muted }}>• {item.menuItem.name} ×{item.quantity}</p>
                  ))}
                  {ho.items.length > 3 && <p className="text-[10px]" style={{ color: S.muted }}>...আরও {ho.items.length - 3}টি আইটেম</p>}
                </div>
                <button onClick={() => recallHeldOrder(ho)} disabled={recalling}
                  className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white transition-all"
                  style={{ backgroundColor: "#D97706" }}>
                  {recalling ? <Loader2 size={12} className="animate-spin" /> : <ListOrdered size={12} />}
                  এই অর্ডারটি তুলুন
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* ── VARIANT & ADDON PICKER MODAL ──────────────────────────── */}
    {pickerItem && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <div>
              <h3 className="font-bold text-base" style={{ color: S.text }}>{pickerItem.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>বেছে নিন</p>
            </div>
            <button onClick={() => setPickerItem(null)}><X size={18} style={{ color: S.muted }} /></button>
          </div>
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {pickerItem.variants && pickerItem.variants.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.text }}>ভ্যারিয়েন্ট বেছে নিন *</p>
                <div className="grid grid-cols-2 gap-2">
                  {pickerItem.variants.map(v => (
                    <button key={v.name} onClick={() => { setPickerVariant(v.name); setPickerVariantPrice(v.price); }}
                      className="p-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: pickerVariant === v.name ? S.primary : S.border,
                        backgroundColor: pickerVariant === v.name ? "#FFF7ED" : S.bg,
                      }}>
                      <p className="text-xs font-semibold" style={{ color: S.text }}>{v.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: S.primary }}>{formatBDT(v.price)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pickerItem.addons && pickerItem.addons.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.text }}>অ্যাডঅন (ঐচ্ছিক)</p>
                <div className="space-y-2">
                  {pickerItem.addons.map(addon => {
                    const selected = pickerAddons.some(a => a.name === addon.name);
                    return (
                      <button key={addon.name} onClick={() => togglePickerAddon(addon)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border transition-all"
                        style={{
                          borderColor: selected ? S.primary : S.border,
                          backgroundColor: selected ? "#FFF7ED" : S.bg,
                        }}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: selected ? S.primary : S.border, backgroundColor: selected ? S.primary : "transparent" }}>
                            {selected && <CheckCircle size={10} className="text-white" />}
                          </div>
                          <span className="text-xs font-medium" style={{ color: S.text }}>{addon.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: S.primary }}>+{formatBDT(addon.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="flex justify-between text-xs mb-1" style={{ color: S.muted }}>
                <span>বেস দাম</span><span>{formatBDT(pickerVariant ? pickerVariantPrice : pickerItem.price)}</span>
              </div>
              {pickerAddons.length > 0 && (
                <div className="flex justify-between text-xs mb-1" style={{ color: S.muted }}>
                  <span>অ্যাডঅন</span><span>+{formatBDT(pickerAddons.reduce((s, a) => s + a.price, 0))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t" style={{ color: S.text, borderColor: S.border }}>
                <span>মোট</span>
                <span style={{ color: S.primary }}>
                  {formatBDT((pickerVariant ? pickerVariantPrice : pickerItem.price) + pickerAddons.reduce((s, a) => s + a.price, 0))}
                </span>
              </div>
            </div>

            <button onClick={confirmPicker}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: S.primary }}>
              <Plus size={16} />কার্টে যোগ করুন
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── PAYMENT METHOD MODAL ───────────────────────────────────── */}
    {showPayModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
          <div className="p-5 border-b" style={{ borderColor: S.border }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: S.text }}>পেমেন্ট পদ্ধতি</h3>
              <button onClick={() => setShowPayModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon;
                const selected = payMethod === pm.value;
                return (
                  <button key={pm.value} onClick={() => setPayMethod(pm.value)}
                    className="p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
                    style={{ borderColor: selected ? pm.color : S.border, backgroundColor: selected ? pm.color + "18" : S.bg }}>
                    <Icon size={22} style={{ color: selected ? pm.color : S.muted }} />
                    <span className="text-xs font-bold" style={{ color: selected ? pm.color : S.text }}>{pm.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>সাবটোটাল</span><span>{formatBDT(subtotal)}</span>
              </div>
              {vatPct > 0 && (
                <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                  <span>VAT ({vatPct}%)</span><span>{formatBDT(vatAmount)}</span>
                </div>
              )}
              {svcPct > 0 && (
                <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                  <span>সার্ভিস চার্জ ({svcPct}%)</span><span>{formatBDT(svcAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ color: S.text, borderColor: S.border }}>
                <span>সর্বমোট</span>
                <span style={{ color: S.primary }}>{formatBDT(total)}</span>
              </div>
            </div>

            {selectedWaiter && waiters.find(w => w.id === selectedWaiter) && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: S.muted }}>টিপস পরিমাণ (ঐচ্ছিক)</label>
                <input value={tipAmount} onChange={e => setTipAmount(e.target.value)}
                  type="number" min="0" step="10" placeholder="০"
                  className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
              </div>
            )}

            <button onClick={completePayment} disabled={submitting}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: S.primary }}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {submitting ? "প্রসেস হচ্ছে…" : "পেমেন্ট নিশ্চিত করুন"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── SPLIT BILL MODAL ───────────────────────────────────────── */}
    {showSplitModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          style={{ backgroundColor: S.surface }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5F3FF" }}>
                <Split size={18} style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: S.text }}>বিল ভাগ করুন</h3>
                <p className="text-xs" style={{ color: S.muted }}>সর্বমোট: {formatBDT(total)}</p>
              </div>
            </div>
            <button onClick={() => setShowSplitModal(false)}><X size={18} style={{ color: S.muted }} /></button>
          </div>

          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Mode selector */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
              {([
                { key: "equal", label: "সমানভাবে" },
                { key: "custom", label: "কাস্টম পরিমাণ" },
                { key: "partial", label: "আংশিক পেমেন্ট" },
              ] as const).map(m => (
                <button key={m.key} onClick={() => updateSplitMode(m.key)}
                  className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    backgroundColor: splitMode === m.key ? "#7C3AED" : "transparent",
                    color: splitMode === m.key ? "#fff" : S.muted,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Equal split count */}
            {splitMode === "equal" && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
                <span className="text-xs font-medium flex-1" style={{ color: S.text }}>কতজনের মধ্যে ভাগ করবেন?</span>
                <div className="flex items-center gap-2 border rounded-lg overflow-hidden" style={{ borderColor: S.border }}>
                  <button onClick={() => updateEqualSplitCount(splitCount - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-red-50">
                    <Minus size={13} style={{ color: "#EF4444" }} />
                  </button>
                  <span className="text-sm font-bold px-2 min-w-[28px] text-center" style={{ color: S.text }}>{splitCount}</span>
                  <button onClick={() => updateEqualSplitCount(splitCount + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-green-50">
                    <Plus size={13} style={{ color: "#10B981" }} />
                  </button>
                </div>
              </div>
            )}

            {/* Info banner for partial */}
            {splitMode === "partial" && (
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                <AlertCircle size={14} style={{ color: "#3B82F6", flexShrink: 0, marginTop: 1 }} />
                <p className="text-[11px]" style={{ color: "#1D4ED8" }}>
                  আংশিক পেমেন্ট নিলে অর্ডার পেইড হবে না। বকেয়া amount order-এ দেখা যাবে।
                </p>
              </div>
            )}

            {/* Split rows */}
            <div className="space-y-3">
              {splitRows.map((row, idx) => (
                <div key={row.id} className="p-3 rounded-2xl border space-y-2" style={{ borderColor: "#8B5CF620", backgroundColor: "#F5F3FF80" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: "#7C3AED" }}>
                      {splitMode === "equal" ? `জন ${idx + 1}` : splitMode === "partial" ? "আংশিক পেমেন্ট" : `পেমেন্ট ${idx + 1}`}
                    </span>
                    {splitMode === "custom" && splitRows.length > 1 && (
                      <button onClick={() => removeSplitRow(row.id)}><X size={13} style={{ color: "#EF4444" }} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>নাম (ঐচ্ছিক)</label>
                      <input value={row.payerName} onChange={e => updateSplitRow(row.id, "payerName", e.target.value)}
                        placeholder="পেয়ারের নাম"
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                        style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (৳)</label>
                      <input value={row.amount} onChange={e => updateSplitRow(row.id, "amount", e.target.value)}
                        type="number" min="0" step="1" placeholder="০"
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none font-bold"
                        readOnly={splitMode === "equal"}
                        style={{ borderColor: S.border, backgroundColor: splitMode === "equal" ? "#E9D5FF40" : "var(--c-bg)", color: S.text }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                      <select value={row.paymentMethod} onChange={e => updateSplitRow(row.id, "paymentMethod", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                        style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
                        {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                      </select>
                    </div>
                    {(row.paymentMethod === "bkash" || row.paymentMethod === "nagad" || row.paymentMethod === "card") && (
                      <div>
                        <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>Txn রেফারেন্স</label>
                        <input value={row.transactionRef} onChange={e => updateSplitRow(row.id, "transactionRef", e.target.value)}
                          placeholder="TXN ID"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {splitMode === "custom" && (
                <button onClick={addSplitRow}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all"
                  style={{ borderColor: "#8B5CF6", color: "#7C3AED", borderStyle: "dashed" }}>
                  <Plus size={13} /> আরেকজন যোগ করুন
                </button>
              )}
            </div>

            {/* Total summary */}
            <div className="p-3 rounded-xl space-y-1" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>মোট বিল</span><span>{formatBDT(total)}</span>
              </div>
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>এন্টার করা মোট</span>
                <span style={{ color: splitDiff < -0.5 ? "#EF4444" : "#10B981" }}>{formatBDT(splitTotalEntered)}</span>
              </div>
              {Math.abs(splitDiff) > 0.5 && (
                <div className="flex justify-between text-xs font-semibold" style={{ color: splitDiff > 0 ? "#EF4444" : "#10B981" }}>
                  <span>{splitDiff > 0 ? "বাকি" : "বেশি এন্টার"}</span>
                  <span>{formatBDT(Math.abs(splitDiff))}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 border-t" style={{ borderColor: S.border }}>
            <button onClick={saveSplits} disabled={savingSplit}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#7C3AED" }}>
              {savingSplit ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {savingSplit ? "সেভ হচ্ছে…" : splitMode === "partial" ? "আংশিক পেমেন্ট সেভ করুন" : "পেমেন্ট সম্পন্ন করুন"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Toast */}
    {toast && (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
        {toast.msg}
      </div>
    )}
    </>
  );
}
