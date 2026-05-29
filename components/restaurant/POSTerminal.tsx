"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, ShoppingCart, Plus, Minus, X, ChefHat, Loader2, Printer,
  RotateCcw, SendHorizonal, CreditCard, Wallet, Smartphone, Banknote,
  CheckCircle, ChevronRight, Tag, UserCheck, PauseCircle, ListOrdered,
  Split, AlertCircle, Users, Hash, Ticket, Gift, Shield, Percent,
} from "lucide-react";
import ShiftManager from "@/components/restaurant/ShiftManager";
import { formatBDT } from "@/lib/utils";
import { buildReceiptHtml, buildKotHtml, buildA4InvoiceHtml } from "@/lib/receiptHtml";
import { runDiscountEngine, DiscountResult, BogoSuggestion, EngineCoupon } from "@/lib/restaurant/discount-engine";

// ── Types ────────────────────────────────────────────────────────
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

// Full server-side order state (used after order is placed/recalled)
interface ActiveOrderItem {
  id: string;
  menuItemId: string;
  name: string;        // from menuItem.name
  quantity: number;
  unitPrice: number;
  selectedVariant: string | null;
  isVoided: boolean;
}

interface ActiveOrder {
  id: string;
  orderNumber: string | null;
  status: string;
  type: string;
  totalAmount: number;
  subtotal: number;
  vatAmount: number;
  serviceAmount: number;
  discount: number;
  paidAmount: number;
  dueAmount: number;
  items: ActiveOrderItem[];
  splits: OrderSplit[];
  isHeld: boolean;
  customerName: string | null;
  table: { number: number; floor: string } | null;
}

interface HeldOrder {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  customerName: string | null;
  table: { number: number; floor: string } | null;
  heldAt: string | null;
  heldBy: string | null;
  items: { menuItem: { name: string }; quantity: number }[];
  splits: OrderSplit[];
}

// Split modal types
interface SplitRow {
  id: string;
  payerName: string;
  amount: string;
  paymentMethod: string;
  transactionRef: string;
}

interface Payer {
  id: string;
  name: string;
  paymentMethod: string;
  transactionRef: string;
}

// ── Constants ────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────
function makeCartKey(menuItemId: string, variant: string | null, addons: MenuAddon[]) {
  return `${menuItemId}__${variant ?? ""}__${addons.map(a => a.name).sort().join(",")}`;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

function normalizeOrder(raw: Record<string, unknown>): ActiveOrder {
  const items = (raw.items as Record<string, unknown>[] | undefined ?? []).map((it: Record<string, unknown>) => ({
    id: it.id as string,
    menuItemId: it.menuItemId as string,
    name: (it.menuItem as { name: string } | undefined)?.name ?? "—",
    quantity: it.quantity as number,
    unitPrice: it.unitPrice as number,
    selectedVariant: (it.selectedVariant as string | null) ?? null,
    isVoided: (it.isVoided as boolean) ?? false,
  }));
  return {
    id: raw.id as string,
    orderNumber: (raw.orderNumber as string | null) ?? null,
    status: raw.status as string,
    type: raw.type as string,
    totalAmount: raw.totalAmount as number,
    subtotal: (raw.subtotal as number) ?? 0,
    vatAmount: (raw.vatAmount as number) ?? 0,
    serviceAmount: (raw.serviceAmount as number) ?? 0,
    discount: (raw.discount as number) ?? 0,
    paidAmount: (raw.paidAmount as number) ?? 0,
    dueAmount: (raw.dueAmount as number) ?? 0,
    items,
    splits: (raw.splits as OrderSplit[] | undefined) ?? [],
    isHeld: (raw.isHeld as boolean) ?? false,
    customerName: (raw.customerName as string | null) ?? null,
    table: (raw.table as ActiveOrder["table"]) ?? null,
  };
}

// ── Component ────────────────────────────────────────────────────
export default function POSTerminal() {
  // Menu & lookup data
  const [menuItems, setMenuItems]   = useState<MenuItem[]>([]);
  const [tables, setTables]         = useState<DiningTable[]>([]);
  const [waiters, setWaiters]       = useState<Waiter[]>([]);
  const [loading, setLoading]       = useState(true);

  // Search / filter
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("all");

  // Cart (local, pre-order)
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState("dine_in");
  const [selectedTable, setSelectedTable]   = useState("");
  const [customerName, setCustomerName]     = useState("");
  const [customerPhone, setCustomerPhone]   = useState("");
  const [note, setNote]                     = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [tipAmount, setTipAmount]           = useState("");

  // Tax settings
  const [vatPct, setVatPct] = useState(0);
  const [svcPct, setSvcPct] = useState(0);

  // Active order (from DB — set after place/recall)
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [kotSentForOrder, setKotSentForOrder] = useState(false);
  const [paidOrderId, setPaidOrderId]         = useState<string | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [sendingKot, setSendingKot] = useState(false);
  const [toast, setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Variant/addon picker
  const [pickerItem, setPickerItem]                 = useState<MenuItem | null>(null);
  const [pickerVariant, setPickerVariant]           = useState<string | null>(null);
  const [pickerAddons, setPickerAddons]             = useState<MenuAddon[]>([]);
  const [pickerVariantPrice, setPickerVariantPrice] = useState(0);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod]       = useState("cash");

  // Hold / recall
  const [heldOrders, setHeldOrders]     = useState<HeldOrder[]>([]);
  const [showHeldPanel, setShowHeldPanel] = useState(false);
  const [holdingOrder, setHoldingOrder] = useState(false);
  const [recalling, setRecalling]       = useState(false);

  // Split bill
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitMode, setSplitMode]           = useState<"equal" | "item_wise" | "custom" | "partial">("equal");
  const [splitCount, setSplitCount]         = useState(2);
  const [splitRows, setSplitRows]           = useState<SplitRow[]>([]);
  const [savingSplit, setSavingSplit]       = useState(false);
  // Item-wise split state
  const [payers, setPayers]             = useState<Payer[]>([]);
  const [itemPayerMap, setItemPayerMap] = useState<Record<string, number>>({}); // itemId -> payerIndex
  // Split receipt state (for per-split printing after successful payment)
  const [splitReceiptData, setSplitReceiptData] = useState<{
    orderNumber: string; isFullyPaid: boolean; dueAmount: number;
    splits: { payerName: string; amount: number; paymentMethod: string }[];
  } | null>(null);

  // ── Discount state ───────────────────────────────────────────────
  const [allCoupons, setAllCoupons]             = useState<EngineCoupon[]>([]);
  const [appliedDiscounts, setAppliedDiscounts] = useState<DiscountResult[]>([]);
  const [bogoSuggestions, setBogoSuggestions]   = useState<BogoSuggestion[]>([]);
  const [couponInput, setCouponInput]           = useState("");
  const [couponError, setCouponError]           = useState("");
  const [couponLoading, setCouponLoading]       = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount]     = useState(0);
  const [manualDiscountInput, setManualDiscountInput] = useState("");
  const [managerDiscountThreshold, setManagerDiscountThreshold] = useState(20);
  const [showManagerPinModal, setShowManagerPinModal] = useState(false);
  const [managerPinInput, setManagerPinInput]   = useState("");
  const [managerPinError, setManagerPinError]   = useState("");
  const [managerPinLoading, setManagerPinLoading] = useState(false);
  const [pendingManualDiscount, setPendingManualDiscount] = useState(0);
  const [showBogoModal, setShowBogoModal]       = useState(false);
  const [acceptedBogo, setAcceptedBogo]         = useState<BogoSuggestion | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Effective totals: use server-side values when order exists
  const cartSubtotal  = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const cartVat       = Math.round(cartSubtotal * (vatPct / 100) * 100) / 100;
  const cartSvc       = Math.round(cartSubtotal * (svcPct / 100) * 100) / 100;

  // Discount totals (state is declared above as useState)
  const _totalAutoDiscount = appliedDiscounts.reduce((s, d) => s + d.amount, 0);
  const _bogoDiscount      = acceptedBogo ? acceptedBogo.discountAmount : 0;
  const totalDiscount      = _totalAutoDiscount + manualDiscount + _bogoDiscount;

  const cartTotal = Math.max(0, cartSubtotal + cartVat + cartSvc - totalDiscount);

  const effectiveTotal   = activeOrder ? activeOrder.totalAmount : cartTotal;
  const effectivePaid    = activeOrder ? activeOrder.paidAmount  : 0;
  const effectiveDue     = Math.max(0, effectiveTotal - effectivePaid);
  const effectiveSubtotal = activeOrder ? activeOrder.subtotal   : cartSubtotal;
  const effectiveVat      = activeOrder ? activeOrder.vatAmount  : cartVat;
  const effectiveSvc      = activeOrder ? activeOrder.serviceAmount : cartSvc;

  // ── Data loading ─────────────────────────────────────────────────
  const loadHeldOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/restaurant/orders?held=true");
      if (r.ok) setHeldOrders(await r.json());
    } catch {}
  }, []);

  const refreshActiveOrder = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/restaurant/orders/${id}/split`);
      if (r.ok) {
        const raw = await r.json();
        setActiveOrder(normalizeOrder(raw));
      }
    } catch {}
  }, []);

  const load = useCallback(async () => {
    try {
      const [miRes, tRes, sRes, wRes, cpRes] = await Promise.all([
        fetch("/api/restaurant/menu-items"),
        fetch("/api/restaurant/tables"),
        fetch("/api/settings/shop"),
        fetch("/api/restaurant/waiters"),
        fetch("/api/restaurant/coupons"),
      ]);
      if (miRes.ok) setMenuItems(await miRes.json());
      if (tRes.ok)  setTables(await tRes.json());
      if (sRes.ok) {
        const s = await sRes.json();
        setVatPct(s.restVatPct ?? 0);
        setSvcPct(s.restServiceChargePct ?? 0);
        setManagerDiscountThreshold(s.managerDiscountThreshold ?? 20);
      }
      if (wRes.ok) {
        const ws: { id: string; name: string; jobTitle?: string | null }[] = await wRes.json();
        setWaiters(ws.map(w => ({ id: w.id, name: w.name, jobTitle: w.jobTitle })));
      }
      if (cpRes.ok) {
        const rawCoupons = await cpRes.json();
        setAllCoupons(rawCoupons.map((c: { id: string; code: string; name?: string | null; type: string; value: number; minOrder?: number | null; maxDiscount?: number | null; maxUse?: number | null; usedCount: number; expiresAt?: string | null; isActive: boolean; applicableItemIds?: unknown; applicableCategories?: unknown; happyHourStart?: string | null; happyHourEnd?: string | null; happyHourDays?: unknown; memberTier?: string | null; bogoGetItemId?: string | null; bogoGetQty?: number; bogoGetDiscount?: number }) => ({
          ...c,
          applicableItemIds: (c.applicableItemIds as string[] | null) ?? [],
          applicableCategories: (c.applicableCategories as string[] | null) ?? [],
          happyHourDays: (c.happyHourDays as number[] | null) ?? [0, 1, 2, 3, 4, 5, 6],
        })));
      }
    } catch {}
    setLoading(false);
    await loadHeldOrders();
  }, [loadHeldOrders]);

  useEffect(() => { load(); }, [load]);

  // ── Auto-discount engine ─────────────────────────────────────────
  useEffect(() => {
    if (activeOrder) return; // don't auto-run when order already placed
    if (cart.length === 0) {
      setAppliedDiscounts([]);
      setBogoSuggestions([]);
      return;
    }
    const engineItems = cart.map(c => ({
      menuItemId: c.menuItemId,
      name: c.name,
      category: c.category,
      unitPrice: c.unitPrice,
      quantity: c.quantity,
    }));
    const result = runDiscountEngine(engineItems, allCoupons, new Date(), null, appliedCouponCode);
    const autoDiscounts = result.discounts.filter(d => d.type !== "coupon" || d.couponCode === appliedCouponCode);
    setAppliedDiscounts(autoDiscounts);
    setBogoSuggestions(result.bogoSuggestions);
  }, [cart, allCoupons, appliedCouponCode, activeOrder]);

  // ── Discount functions ───────────────────────────────────────────

  const applyManualDiscountFn = (amt: number) => {
    const discountPct = cartSubtotal > 0 ? (amt / cartSubtotal) * 100 : 0;
    if (discountPct > managerDiscountThreshold) {
      setPendingManualDiscount(amt);
      setManagerPinInput("");
      setManagerPinError("");
      setShowManagerPinModal(true);
    } else {
      setManualDiscount(amt);
    }
  };

  const verifyManagerPin = async () => {
    if (!managerPinInput) { setManagerPinError("PIN দিন"); return; }
    setManagerPinLoading(true);
    try {
      const r = await fetch("/api/restaurant/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: managerPinInput }),
      });
      if (r.ok) {
        setManualDiscount(pendingManualDiscount);
        setShowManagerPinModal(false);
        setManagerPinInput("");
        setManagerPinError("");
        showToast("success", "ম্যানেজার অনুমোদিত");
      } else {
        setManagerPinError("ভুল PIN");
      }
    } catch { setManagerPinError("Error"); }
    setManagerPinLoading(false);
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("কুপন কোড দিন"); return; }
    setCouponLoading(true);
    setCouponError("");
    try {
      const engineItems = cart.map(c => ({
        menuItemId: c.menuItemId,
        name: c.name,
        category: c.category,
        unitPrice: c.unitPrice,
        quantity: c.quantity,
      }));
      const r = await fetch("/api/restaurant/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, items: engineItems }),
      });
      const data = await r.json();
      if (!r.ok || !data.valid) {
        setCouponError(data.error ?? "কুপন প্রযোজ্য নয়");
      } else {
        setAppliedCouponCode(code);
        setCouponInput("");
        showToast("success", `কুপন ${code} প্রয়োগ হয়েছে`);
      }
    } catch { setCouponError("Error"); }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCouponCode(null);
    setCouponInput("");
    setCouponError("");
  };

  // ── Menu filtering ───────────────────────────────────────────────
  const categories = ["all", ...Array.from(new Set(menuItems.map(m => m.category))).sort()];
  const filtered   = menuItems.filter(m => {
    if (!m.isAvailable) return false;
    if (category !== "all" && m.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !(m.nameEn?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  // ── Cart actions ─────────────────────────────────────────────────
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
    const cartKey    = makeCartKey(item.id, variant, addons);
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
    if (pickerItem.variants?.length && !pickerVariant) { showToast("error", "ভ্যারিয়েন্ট বেছে নিন"); return; }
    addCartItem(pickerItem, pickerVariant, pickerVariantPrice, pickerAddons);
    setPickerItem(null);
  };

  const togglePickerAddon = (addon: MenuAddon) => {
    setPickerAddons(prev => {
      const ex = prev.find(a => a.name === addon.name);
      return ex ? prev.filter(a => a.name !== addon.name) : [...prev, addon];
    });
  };

  const updateQty  = (cartKey: string, delta: number) =>
    setCart(prev => prev.map(c => c.cartKey === cartKey ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  const updateNote = (cartKey: string, val: string) =>
    setCart(prev => prev.map(c => c.cartKey === cartKey ? { ...c, note: val } : c));

  const clearCart = () => {
    setCart([]);
    setSelectedTable("");
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setOrderType("dine_in");
    setActiveOrder(null);
    setKotSentForOrder(false);
    setPaidOrderId(null);
    setSelectedWaiter("");
    setTipAmount("");
  };

  // ── Place order ──────────────────────────────────────────────────
  const placeOrder = async () => {
    if (cart.length === 0) { showToast("error", "কার্টে কিছু নেই"); return; }
    if (orderType === "dine_in" && !selectedTable) { showToast("error", "টেবিল সিলেক্ট করুন"); return; }
    setSubmitting(true);
    try {
      // Build full discount breakdown for receipt
      const discountBreakdown: { type: string; label: string; amount: number; couponId?: string; couponCode?: string }[] = [
        ...appliedDiscounts,
        ...(acceptedBogo ? [{
          type: "bogo" as const,
          label: `BOGO ছাড় — ${acceptedBogo.couponCode}`,
          amount: acceptedBogo.discountAmount,
          couponId: acceptedBogo.couponId,
          couponCode: acceptedBogo.couponCode,
        }] : []),
        ...(manualDiscount > 0 ? [{ type: "manual" as const, label: "ম্যানুয়াল ছাড়", amount: manualDiscount }] : []),
      ];
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
          discount: totalDiscount,
          discountBreakdown: discountBreakdown.length > 0 ? discountBreakdown : null,
          couponCode: appliedCouponCode,
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
        if (d.code === "NO_ACTIVE_SHIFT") {
          showToast("error", "⚠️ শিফট শুরু করা নেই — POS হেডারে শিফট শুরু করুন");
        } else {
          showToast("error", d.error ?? "অর্ডার দেওয়া যায়নি");
        }
        setSubmitting(false);
        return;
      }
      const raw = await res.json();
      const order = normalizeOrder(raw);
      setActiveOrder(order);
      setCart([]); // items now in DB
      setKotSentForOrder(false);
      setPaidOrderId(null);
      showToast("success", `✓ অর্ডার ${order.orderNumber} নিবন্ধিত — KOT পাঠান`);
      load();
    } catch { showToast("error", "Error"); }
    setSubmitting(false);
  };

  // ── Receipt print ─────────────────────────────────────────────────
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const printReceiptForOrder = async (orderId: string) => {
    setPrintingReceipt(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${orderId}/receipt`);
      if (!r.ok) { showToast("error", "রসিদ লোড করা যায়নি"); return; }
      const { order, shop, qrDataUrl } = await r.json();
      const html = buildReceiptHtml(order, shop, qrDataUrl);
      const win = window.open("", "_blank", "width=420,height=700");
      if (!win) { showToast("error", "Popup ব্লক করা আছে — অনুমতি দিন"); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    } catch { showToast("error", "Error"); }
    finally { setPrintingReceipt(false); }
  };

  const printA4InvoiceForOrder = async (orderId: string) => {
    try {
      const r = await fetch(`/api/restaurant/orders/${orderId}/receipt`);
      if (!r.ok) { showToast("error", "ইনভয়েস লোড করা যায়নি"); return; }
      const { order, shop, qrDataUrl } = await r.json();
      const html = buildA4InvoiceHtml(order, shop, qrDataUrl);
      const win = window.open("", "_blank", "width=900,height=900");
      if (!win) { showToast("error", "Popup ব্লক করা আছে — অনুমতি দিন"); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
    } catch { showToast("error", "Error"); }
  };

  const printKotForOrder = async (orderId: string) => {
    try {
      const r = await fetch(`/api/restaurant/orders/${orderId}`);
      if (!r.ok) return;
      const order = await r.json();
      const latestKot = order.kotTickets?.[0];
      const html = buildKotHtml(order, latestKot?.kotNumber);
      const win = window.open("", "_blank", "width=380,height=600");
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    } catch {}
  };

  // ── Send KOT ─────────────────────────────────────────────────────
  const sendKot = async (orderId: string) => {
    setSendingKot(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_kot" }),
      });
      if (r.ok) {
        setKotSentForOrder(true);
        showToast("success", "✓ KOT রান্নাঘরে পাঠানো হয়েছে!");
        setTimeout(() => printKotForOrder(orderId), 500);
      } else {
        const d = await r.json();
        showToast("error", d.error ?? "KOT পাঠানো যায়নি");
      }
    } catch { showToast("error", "Error"); }
    setSendingKot(false);
  };

  // ── Standard payment ─────────────────────────────────────────────
  const completePayment = async () => {
    if (!activeOrder) return;
    setSubmitting(true);
    try {
      const tip = parseFloat(tipAmount) || 0;
      const payRes = await fetch(`/api/restaurant/orders/${activeOrder.id}`, {
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
      setPaidOrderId(activeOrder.id);
      setShowPayModal(false);
      showToast("success", `✓ পেমেন্ট সম্পন্ন! (${PAYMENT_METHODS.find(p => p.value === payMethod)?.label})`);
      load();
    } catch { showToast("error", "Error"); }
    setSubmitting(false);
  };

  // ── Hold order ───────────────────────────────────────────────────
  const holdOrder = async () => {
    if (!activeOrder) return;
    setHoldingOrder(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${activeOrder.id}/hold`, { method: "POST" });
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

  // ── Recall held order ────────────────────────────────────────────
  const recallHeldOrder = async (ho: HeldOrder) => {
    setRecalling(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${ho.id}/recall`, { method: "POST" });
      if (!r.ok) {
        const d = await r.json();
        showToast("error", d.error ?? "Recall করা যায়নি");
        setRecalling(false);
        return;
      }
      const raw = await r.json();
      // Hydrate full order state from server response
      const order = normalizeOrder(raw as Record<string, unknown>);
      setActiveOrder(order);
      setCart([]); // items are in DB, not local cart
      setKotSentForOrder(false);
      setPaidOrderId(null);
      setShowHeldPanel(false);
      showToast("success", `✓ অর্ডার ${order.orderNumber ?? ho.id.slice(0, 8)} ফিরিয়ে আনা হয়েছে`);
      await loadHeldOrders();
      await load();
    } catch { showToast("error", "Error"); }
    setRecalling(false);
  };

  // ── Split bill ───────────────────────────────────────────────────
  const openSplitModal = async () => {
    if (!activeOrder) { showToast("error", "আগে অর্ডার দিন"); return; }
    // Refresh active order to get latest items/splits/due
    await refreshActiveOrder(activeOrder.id);
    setSplitMode("equal");
    setSplitCount(2);
    const each = (effectiveDue / 2).toFixed(2);
    setSplitRows([
      { id: makeId(), payerName: "", amount: each, paymentMethod: "cash", transactionRef: "" },
      { id: makeId(), payerName: "", amount: each, paymentMethod: "cash", transactionRef: "" },
    ]);
    // Init item-wise state
    const defaultPayers: Payer[] = [
      { id: makeId(), name: "পেয়ার ১", paymentMethod: "cash", transactionRef: "" },
      { id: makeId(), name: "পেয়ার ২", paymentMethod: "cash", transactionRef: "" },
    ];
    setPayers(defaultPayers);
    const firstMap: Record<string, number> = {};
    activeOrder.items.filter(i => !i.isVoided).forEach(item => { firstMap[item.id] = 0; });
    setItemPayerMap(firstMap);
    setShowSplitModal(true);
  };

  const updateSplitMode = (mode: "equal" | "item_wise" | "custom" | "partial") => {
    setSplitMode(mode);
    const due = effectiveDue;
    if (mode === "equal") {
      const cnt  = splitCount;
      const each = (due / cnt).toFixed(2);
      setSplitRows(Array.from({ length: cnt }, () => ({
        id: makeId(), payerName: "", amount: each, paymentMethod: "cash", transactionRef: "",
      })));
    } else if (mode === "custom") {
      setSplitRows([
        { id: makeId(), payerName: "", amount: due.toFixed(2), paymentMethod: "cash", transactionRef: "" },
      ]);
    } else if (mode === "partial") {
      setSplitRows([
        { id: makeId(), payerName: "আংশিক পেমেন্ট", amount: "0", paymentMethod: "cash", transactionRef: "" },
      ]);
    } else if (mode === "item_wise") {
      // handled in item-wise section
    }
  };

  const updateEqualCount = (cnt: number) => {
    const c    = Math.max(2, Math.min(10, cnt));
    const each = (effectiveDue / c).toFixed(2);
    setSplitCount(c);
    setSplitRows(Array.from({ length: c }, () => ({
      id: makeId(), payerName: "", amount: each, paymentMethod: "cash", transactionRef: "",
    })));
  };

  const addSplitRow = () =>
    setSplitRows(prev => [...prev, { id: makeId(), payerName: "", amount: "0", paymentMethod: "cash", transactionRef: "" }]);
  const removeSplitRow = (id: string) =>
    setSplitRows(prev => prev.filter(r => r.id !== id));
  const updateSplitRow  = (id: string, field: keyof SplitRow, value: string) =>
    setSplitRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  // Item-wise: payer management
  const addPayer = () =>
    setPayers(prev => [...prev, { id: makeId(), name: `পেয়ার ${prev.length + 1}`, paymentMethod: "cash", transactionRef: "" }]);
  const updatePayer = (id: string, field: keyof Payer, value: string) =>
    setPayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const removePayer = (id: string) => {
    const remaining = payers.filter(p => p.id !== id);
    setPayers(remaining);
    // Reassign items from removed payer to payer 0
    const removedIndex = payers.findIndex(p => p.id === id);
    setItemPayerMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k] === removedIndex) next[k] = 0;
        else if (next[k] > removedIndex) next[k] -= 1;
      });
      return next;
    });
  };
  const setItemPayer = (itemId: string, payerIndex: number) =>
    setItemPayerMap(prev => ({ ...prev, [itemId]: payerIndex }));

  // Compute item-wise payer amounts from activeOrder items
  // Uses effectiveDue (remaining unpaid amount) so already-paid amounts are excluded
  const itemWisePayerAmounts = (): { payerIndex: number; amount: number }[] => {
    if (!activeOrder) return [];
    const totals: number[] = payers.map(() => 0);
    const activeItems = activeOrder.items.filter(i => !i.isVoided);
    activeItems.forEach(item => {
      const pi = itemPayerMap[item.id] ?? 0;
      if (pi < totals.length) totals[pi] += item.unitPrice * item.quantity;
    });
    // Gross from items
    const itemsGross = activeItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    // Scale to effectiveDue (remaining due after any prior payments)
    const scale = itemsGross > 0 ? effectiveDue / itemsGross : 1;
    return totals.map((amt, pi) => ({
      payerIndex: pi,
      amount: Math.round(amt * scale * 100) / 100,
    }));
  };

  // Build splits payload from mode
  const buildSplitsPayload = () => {
    if (splitMode === "item_wise") {
      const amounts = itemWisePayerAmounts();
      return amounts
        .filter(a => a.amount > 0)
        .map(a => ({
          payerName: payers[a.payerIndex]?.name || null,
          amount: a.amount,
          paymentMethod: payers[a.payerIndex]?.paymentMethod || "cash",
          transactionRef: payers[a.payerIndex]?.transactionRef || null,
        }));
    }
    return splitRows
      .filter(r => (parseFloat(r.amount) || 0) > 0)
      .map(r => ({
        payerName: r.payerName || null,
        amount: parseFloat(r.amount) || 0,
        paymentMethod: r.paymentMethod,
        transactionRef: r.transactionRef || null,
      }));
  };

  const splitEntered = splitMode === "item_wise"
    ? itemWisePayerAmounts().reduce((s, a) => s + a.amount, 0)
    : splitRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const splitDiff = effectiveDue - splitEntered;

  const saveSplits = async () => {
    if (!activeOrder) return;
    const splits = buildSplitsPayload();
    if (splits.length === 0) { showToast("error", "কমপক্ষে একটি পেমেন্ট এন্ট্রি দিন"); return; }

    if (splitMode !== "partial" && splitEntered < effectiveDue - 0.5) {
      showToast("error", `মোট পরিমাণ (৳${splitEntered.toFixed(2)}) বকেয়ার চেয়ে কম। "আংশিক পেমেন্ট" মোড ব্যবহার করুন।`);
      return;
    }

    setSavingSplit(true);
    try {
      const r = await fetch(`/api/restaurant/orders/${activeOrder.id}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splits, isPartial: splitMode === "partial" }),
      });
      const data = await r.json();
      if (!r.ok) { showToast("error", data.error ?? "স্প্লিট সেভ হয়নি"); setSavingSplit(false); return; }

      // Store receipt data for per-split printing
      setSplitReceiptData({
        orderNumber: activeOrder.orderNumber,
        isFullyPaid: data.isFullyPaid,
        dueAmount:   data.dueAmount ?? 0,
        splits:      splits.map((sp, i) => ({
          payerName:     sp.payerName ?? `পেয়ার ${i + 1}`,
          amount:        sp.amount,
          paymentMethod: sp.paymentMethod,
        })),
      });

      setShowSplitModal(false);
      if (data.isFullyPaid) {
        setPaidOrderId(activeOrder.id);
        showToast("success", `✓ পেমেন্ট সম্পন্ন! (${splits.length} জনের মধ্যে ভাগ করা)`);
      } else {
        showToast("success", `✓ আংশিক পেমেন্ট — বকেয়া: ৳${data.dueAmount?.toFixed(2)}`);
      }
      await refreshActiveOrder(activeOrder.id);
      load();
    } catch { showToast("error", "Error"); }
    setSavingSplit(false);
  };

  // ── Per-split receipt print ───────────────────────────────────────
  const printSplitReceipt = () => {
    if (!splitReceiptData) return;
    const METHOD_LABELS: Record<string, string> = {
      cash: "নগদ", card: "কার্ড", bkash: "বিকাশ", nagad: "নগদ অ্যাপ", bank: "ব্যাংক", other: "অন্যান্য",
    };
    const total = splitReceiptData.splits.reduce((s, sp) => s + sp.amount, 0);
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>স্প্লিট রসিদ — ${splitReceiptData.orderNumber}</title>
      <style>
        body{font-family:monospace;font-size:12px;padding:16px;max-width:300px;margin:0 auto}
        h2{text-align:center;font-size:14px;margin:0 0 8px}
        .line{border-top:1px dashed #ccc;margin:6px 0}
        .row{display:flex;justify-content:space-between;margin:3px 0}
        .bold{font-weight:bold}
        .due{color:#EF4444;font-weight:bold}
        .paid{color:#10B981;font-weight:bold}
        @media print{button{display:none}}
      </style>
    </head><body>
      <h2>স্প্লিট বিল রসিদ</h2>
      <div class="row"><span>অর্ডার নম্বর</span><span class="bold">${splitReceiptData.orderNumber}</span></div>
      <div class="row"><span>তারিখ</span><span>${new Date().toLocaleString("bn-BD")}</span></div>
      <div class="line"></div>
      ${splitReceiptData.splits.map((sp, i) => `
        <div class="row bold"><span>${sp.payerName || `পেয়ার ${i + 1}`}</span><span>৳${sp.amount.toFixed(2)}</span></div>
        <div class="row" style="color:#666;font-size:11px"><span>পেমেন্ট</span><span>${METHOD_LABELS[sp.paymentMethod] ?? sp.paymentMethod}</span></div>
      `).join("")}
      <div class="line"></div>
      <div class="row bold"><span>সর্বমোট সংগৃহীত</span><span>৳${total.toFixed(2)}</span></div>
      ${splitReceiptData.dueAmount > 0
        ? `<div class="row due"><span>বকেয়া</span><span>৳${splitReceiptData.dueAmount.toFixed(2)}</span></div>`
        : `<div class="row paid"><span>সম্পূর্ণ পরিশোধিত</span><span>✓</span></div>`
      }
      <div class="line"></div>
      <div style="text-align:center;margin-top:8px;color:#888;font-size:11px">ধন্যবাদ!</div>
      <div style="text-align:center;margin-top:12px">
        <button onclick="window.print()" style="padding:6px 16px;cursor:pointer">প্রিন্ট করুন</button>
      </div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  // ── Render ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  const activeOrderItems = activeOrder?.items.filter(i => !i.isVoided) ?? [];

  return (
    <>
    <div className="flex h-[calc(100vh-80px)] gap-0 -mx-4 -mt-4 overflow-hidden">

      {/* ── Left: Menu ── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: S.border, backgroundColor: S.bg }}>
        <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
            <ChefHat size={18} style={{ color: S.primary }} />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-sm" style={{ color: S.text }}>POS টার্মিনাল</h1>
            <p className="text-xs" style={{ color: S.muted }}>{menuItems.filter(m => m.isAvailable).length}টি আইটেম</p>
          </div>
          <ShiftManager />
          <button onClick={() => { setShowHeldPanel(true); loadHeldOrders(); }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
            style={{
              borderColor: heldOrders.length > 0 ? "#F59E0B" : S.border,
              color: heldOrders.length > 0 ? "#D97706" : S.muted,
              backgroundColor: heldOrders.length > 0 ? "#FFFBEB" : S.surface,
            }}>
            <PauseCircle size={14} />পার্কড
            {heldOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: "#F59E0B" }}>{heldOrders.length}</span>
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
              const inCart    = cart.filter(c => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0);
              const hasOpts   = !!(item.variants?.length || item.addons?.length);
              return (
                <button key={item.id} onClick={() => openPicker(item)}
                  className="relative text-left p-3 rounded-2xl border transition-all hover:shadow-md active:scale-95"
                  style={{ backgroundColor: inCart > 0 ? "#FFF7ED" : S.surface, borderColor: inCart > 0 ? S.primary : S.border }}>
                  {item.isVeg && (
                    <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-green-100 text-green-700">VEG</span>
                  )}
                  {hasOpts && <Tag size={10} className="absolute top-2 right-2" style={{ color: S.primary }} />}
                  <p className="text-xs font-bold mb-1 pr-4 leading-tight mt-3" style={{ color: S.text }}>{item.name}</p>
                  {item.nameEn && <p className="text-[10px] mb-2 opacity-60" style={{ color: S.muted }}>{item.nameEn}</p>}
                  {hasOpts && <p className="text-[9px] mb-1 opacity-70" style={{ color: S.primary }}>ভ্যারিয়েন্ট আছে</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold" style={{ color: S.primary }}>{formatBDT(item.price)}</p>
                    {inCart > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: S.primary }}>×{inCart}</span>
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

      {/* ── Right: Cart / Order ── */}
      <div className="w-80 flex flex-col overflow-hidden" style={{ backgroundColor: S.surface }}>
        <div className="p-4 border-b" style={{ borderColor: S.border }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: S.text }}>
              <ShoppingCart size={16} style={{ color: S.primary }} />
              {activeOrder
                ? `অর্ডার: ${activeOrder.orderNumber ?? "—"}`
                : `কার্ট (${cart.reduce((s, c) => s + c.quantity, 0)}টি)`}
            </h2>
            {(cart.length > 0 || activeOrder) && !paidOrderId && (
              <button onClick={clearCart} className="text-xs flex items-center gap-1" style={{ color: "#EF4444" }}>
                <RotateCcw size={12} />ক্লিয়ার
              </button>
            )}
          </div>

          {!activeOrder && (
            <>
              <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
                {ORDER_TYPES.map(t => (
                  <button key={t.value} onClick={() => setOrderType(t.value)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    style={{ backgroundColor: orderType === t.value ? S.primary : "transparent", color: orderType === t.value ? "#fff" : S.muted }}>
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
                    <option value="">— ওয়েটার (ঐচ্ছিক) —</option>
                    {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              {orderType !== "dine_in" && (
                <div className="mt-2 space-y-1.5">
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="কাস্টমারের নাম"
                    className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
                    style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                  <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="ফোন নম্বর"
                    className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
                    style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                </div>
              )}
            </>
          )}

          {/* Active order summary banner */}
          {activeOrder && (
            <div className="mt-2 p-3 rounded-xl text-xs space-y-1" style={{ backgroundColor: "#FFF7ED" }}>
              {activeOrder.table && (
                <p style={{ color: S.text }}>🪑 টেবিল {activeOrder.table.number} ({activeOrder.table.floor})</p>
              )}
              {activeOrder.customerName && <p style={{ color: S.text }}>👤 {activeOrder.customerName}</p>}
              <p style={{ color: S.muted }}>{activeOrderItems.length}টি আইটেম ইন-অর্ডার</p>
              {activeOrder.paidAmount > 0 && (
                <p style={{ color: "#10B981" }}>✓ পরিশোধ: {formatBDT(activeOrder.paidAmount)} | বকেয়া: {formatBDT(effectiveDue)}</p>
              )}
            </div>
          )}
        </div>

        {/* Cart / Order items list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Show DB order items when active order exists */}
          {activeOrder && activeOrderItems.length > 0 ? (
            activeOrderItems.map(item => (
              <div key={item.id} className="p-3 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{item.name}</p>
                    {item.selectedVariant && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "#FFF7ED", color: S.primary }}>{item.selectedVariant}</span>
                    )}
                  </div>
                  <p className="text-xs font-bold" style={{ color: S.primary }}>
                    ×{item.quantity} = {formatBDT(item.unitPrice * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          ) : !activeOrder && cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: S.muted }}>
              <ShoppingCart size={32} className="mb-3 opacity-30" />
              <p className="text-xs text-center">বাম দিক থেকে আইটেম বেছে নিন</p>
            </div>
          ) : !activeOrder && cart.map(item => (
            <div key={item.cartKey} className="p-3 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight" style={{ color: S.text }}>{item.name}</p>
                  {item.selectedVariant && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "#FFF7ED", color: S.primary }}>{item.selectedVariant}</span>
                  )}
                  {item.selectedAddons.length > 0 && (
                    <p className="text-[9px] mt-0.5" style={{ color: S.muted }}>+{item.selectedAddons.map(a => a.name).join(", ")}</p>
                  )}
                </div>
                <button onClick={() => updateQty(item.cartKey, -item.quantity)}><X size={13} style={{ color: "#EF4444" }} /></button>
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

        {!activeOrder && cart.length > 0 && (
          <div className="px-3 pb-2">
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="অর্ডার নোট (ঐচ্ছিক)"
              className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
              style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
          </div>
        )}

        {/* ── Discount section (pre-order only) ── */}
        {!activeOrder && cart.length > 0 && (
          <div className="px-3 pb-3 space-y-2.5 border-t pt-3" style={{ borderColor: S.border }}>
            {/* BOGO banner */}
            {bogoSuggestions.length > 0 && !acceptedBogo && (
              <button onClick={() => setShowBogoModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white animate-pulse"
                style={{ backgroundColor: "#BE185D" }}>
                <Gift size={13} /> BOGO অফার পাওয়া গেছে! ক্লিক করুন
              </button>
            )}
            {acceptedBogo && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#FDF2F8", color: "#BE185D" }}>
                <span><Gift size={11} className="inline mr-1" />BOGO: {acceptedBogo.couponCode} −{formatBDT(acceptedBogo.discountAmount)}</span>
                <button onClick={() => setAcceptedBogo(null)}><X size={11} /></button>
              </div>
            )}

            {/* Auto discounts */}
            {appliedDiscounts.filter(d => d.type !== "coupon").map((d, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
                <span>✓ {d.label}</span>
                <span>−{formatBDT(d.amount)}</span>
              </div>
            ))}

            {/* Coupon input */}
            {!appliedCouponCode ? (
              <div className="flex gap-1.5">
                <input value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                  placeholder="কুপন কোড লিখুন…"
                  className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none font-mono tracking-wider"
                  style={{ borderColor: couponError ? "#EF4444" : S.border, backgroundColor: S.bg, color: S.text }} />
                <button onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: S.primary }}>
                  {couponLoading ? <Loader2 size={12} className="animate-spin" /> : <Ticket size={12} />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                <span><Ticket size={11} className="inline mr-1" />কুপন {appliedCouponCode}: −{formatBDT(appliedDiscounts.find(d => d.couponCode === appliedCouponCode)?.amount ?? 0)}</span>
                <button onClick={removeCoupon}><X size={11} /></button>
              </div>
            )}
            {couponError && <p className="text-[10px] text-red-500 px-1">{couponError}</p>}

            {/* Manual discount */}
            <div className="flex gap-1.5 items-center">
              <Percent size={13} style={{ color: S.muted, flexShrink: 0 }} />
              <input type="number" value={manualDiscountInput}
                onChange={e => setManualDiscountInput(e.target.value)}
                onBlur={() => {
                  const amt = Math.max(0, Math.min(Number(manualDiscountInput) || 0, cartSubtotal + cartVat + cartSvc));
                  setManualDiscountInput(amt ? String(amt) : "");
                  applyManualDiscountFn(amt);
                }}
                placeholder="ম্যানুয়াল ছাড় (৳)"
                className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none"
                style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              {manualDiscount > 0 && (
                <button onClick={() => { setManualDiscount(0); setManualDiscountInput(""); }}
                  className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#EF4444" }}>
                  <X size={11} />
                </button>
              )}
              {manualDiscount > 0 && (
                <span className="text-[10px] font-semibold text-green-600 whitespace-nowrap">−{formatBDT(manualDiscount)}</span>
              )}
            </div>
            {manualDiscount > 0 && cartSubtotal > 0 && (manualDiscount / cartSubtotal) * 100 > managerDiscountThreshold && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold"
                style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                <Shield size={11} /> ম্যানেজার অনুমোদিত
              </div>
            )}
          </div>
        )}

        {/* Bill summary */}
        <div className="p-4 border-t space-y-2.5" style={{ borderColor: S.border }}>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: S.muted }}>
              <span>সাবটোটাল</span><span>{formatBDT(effectiveSubtotal)}</span>
            </div>
            {vatPct > 0 && (
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>VAT ({vatPct}%)</span><span>{formatBDT(effectiveVat)}</span>
              </div>
            )}
            {svcPct > 0 && (
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>সার্ভিস চার্জ ({svcPct}%)</span><span>{formatBDT(effectiveSvc)}</span>
              </div>
            )}
            {!activeOrder && totalDiscount > 0 && (
              <div className="flex justify-between text-xs font-semibold" style={{ color: "#059669" }}>
                <span>মোট ছাড়</span><span>−{formatBDT(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t" style={{ color: S.text, borderColor: S.border }}>
              <span>সর্বমোট</span>
              <span style={{ color: S.primary }}>{formatBDT(effectiveTotal)}</span>
            </div>
            {activeOrder && activeOrder.paidAmount > 0 && effectiveDue > 0 && (
              <div className="flex justify-between text-xs font-semibold" style={{ color: "#EF4444" }}>
                <span>বকেয়া</span><span>{formatBDT(effectiveDue)}</span>
              </div>
            )}
          </div>

          {/* Action buttons when active order exists & not paid */}
          {activeOrder && !paidOrderId && (
            <>
              <div className="flex gap-2">
                <button onClick={() => sendKot(activeOrder.id)} disabled={sendingKot || kotSentForOrder}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all"
                  style={{
                    borderColor: kotSentForOrder ? "#16A34A" : S.primary,
                    color: kotSentForOrder ? "#16A34A" : S.primary,
                    backgroundColor: kotSentForOrder ? "#DCFCE7" : "#FFF7ED",
                    opacity: kotSentForOrder ? 0.8 : 1,
                  }}>
                  {sendingKot ? <Loader2 size={12} className="animate-spin" /> : kotSentForOrder ? <CheckCircle size={12} /> : <SendHorizonal size={12} />}
                  {sendingKot ? "…" : kotSentForOrder ? "KOT ✓" : "KOT পাঠান"}
                </button>
                <button onClick={() => setShowPayModal(true)} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white transition-all"
                  style={{ backgroundColor: S.primary }}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                  পেমেন্ট
                </button>
              </div>
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
                  <Split size={11} />বিল ভাগ
                </button>
              </div>
            </>
          )}

          {paidOrderId && (
            <div className="space-y-2">
              <div className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                <CheckCircle size={13} /> পেমেন্ট সম্পন্ন ✓
              </div>
              <button onClick={() => printReceiptForOrder(paidOrderId)} disabled={printingReceipt}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all"
                style={{ borderColor: S.primary, color: S.primary, backgroundColor: "#FFF7ED" }}>
                {printingReceipt ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
                {printingReceipt ? "লোড হচ্ছে…" : "থার্মাল রসিদ প্রিন্ট"}
              </button>
              <button onClick={() => printA4InvoiceForOrder(paidOrderId)}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all"
                style={{ borderColor: "#1D4ED8", color: "#1D4ED8", backgroundColor: "#EFF6FF" }}>
                <Printer size={12} /> A4 ইনভয়েস / PDF
              </button>
            </div>
          )}

          {!activeOrder && (
            <button onClick={placeOrder} disabled={submitting || cart.length === 0}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: cart.length > 0 ? S.primary : "#9CA3AF" }}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
              {submitting ? "প্রসেস হচ্ছে…" : "অর্ডার দিন"}
            </button>
          )}

          {paidOrderId && (
            <button onClick={clearCart} className="w-full py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2"
              style={{ borderColor: S.border, color: S.muted }}>
              <RotateCcw size={12} /> নতুন অর্ডার
            </button>
          )}
        </div>
      </div>
    </div>

    {/* ── HELD ORDERS PANEL ─────────────────────────────────────────── */}
    {showHeldPanel && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" style={{ backgroundColor: S.surface }}>
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
                      {ho.heldAt ? `পার্কড: ${new Date(ho.heldAt).toLocaleTimeString("bn-BD")}` : ""}
                      {ho.heldBy ? ` — ${ho.heldBy}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: S.primary }}>{formatBDT(ho.totalAmount)}</p>
                    {ho.dueAmount > 0 && <p className="text-[10px] mt-0.5" style={{ color: "#EF4444" }}>বকেয়া: {formatBDT(ho.dueAmount)}</p>}
                  </div>
                </div>
                <div className="mb-3">
                  {ho.items.slice(0, 3).map((item, i) => (
                    <p key={i} className="text-[10px]" style={{ color: S.muted }}>• {item.menuItem.name} ×{item.quantity}</p>
                  ))}
                  {ho.items.length > 3 && <p className="text-[10px]" style={{ color: S.muted }}>...আরও {ho.items.length - 3}টি</p>}
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

    {/* ── VARIANT / ADDON PICKER ─────────────────────────────────── */}
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
                      style={{ borderColor: pickerVariant === v.name ? S.primary : S.border, backgroundColor: pickerVariant === v.name ? "#FFF7ED" : S.bg }}>
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
                    const sel = pickerAddons.some(a => a.name === addon.name);
                    return (
                      <button key={addon.name} onClick={() => togglePickerAddon(addon)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border transition-all"
                        style={{ borderColor: sel ? S.primary : S.border, backgroundColor: sel ? "#FFF7ED" : S.bg }}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center"
                            style={{ borderColor: sel ? S.primary : S.border, backgroundColor: sel ? S.primary : "transparent" }}>
                            {sel && <CheckCircle size={10} className="text-white" />}
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
                <span>বেস দাম</span>
                <span>{formatBDT(pickerVariant ? pickerVariantPrice : pickerItem.price)}</span>
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
              <Plus size={16} />কার্টে যোগ করুন<ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── PAYMENT MODAL ─────────────────────────────────────────────── */}
    {showPayModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <h3 className="font-bold text-base" style={{ color: S.text }}>পেমেন্ট পদ্ধতি</h3>
            <button onClick={() => setShowPayModal(false)}><X size={18} style={{ color: S.muted }} /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon;
                const sel  = payMethod === pm.value;
                return (
                  <button key={pm.value} onClick={() => setPayMethod(pm.value)}
                    className="p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all"
                    style={{ borderColor: sel ? pm.color : S.border, backgroundColor: sel ? pm.color + "18" : S.bg }}>
                    <Icon size={22} style={{ color: sel ? pm.color : S.muted }} />
                    <span className="text-xs font-bold" style={{ color: sel ? pm.color : S.text }}>{pm.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                <span>সর্বমোট</span><span>{formatBDT(effectiveTotal)}</span>
              </div>
              {effectivePaid > 0 && (
                <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                  <span>পূর্বে পরিশোধ</span><span>{formatBDT(effectivePaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ color: S.text, borderColor: S.border }}>
                <span>এখন দিতে হবে</span>
                <span style={{ color: S.primary }}>{formatBDT(effectiveDue > 0 ? effectiveDue : effectiveTotal)}</span>
              </div>
            </div>
            {selectedWaiter && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: S.muted }}>টিপস পরিমাণ (ঐচ্ছিক)</label>
                <input value={tipAmount} onChange={e => setTipAmount(e.target.value)} type="number" min="0" step="10" placeholder="০"
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

    {/* ── SPLIT BILL MODAL ──────────────────────────────────────────── */}
    {showSplitModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{ backgroundColor: S.surface }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5F3FF" }}>
                <Split size={18} style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: S.text }}>বিল ভাগ করুন</h3>
                <p className="text-xs" style={{ color: S.muted }}>
                  মোট: {formatBDT(effectiveTotal)}
                  {effectivePaid > 0 && ` | বকেয়া: ${formatBDT(effectiveDue)}`}
                </p>
              </div>
            </div>
            <button onClick={() => setShowSplitModal(false)}><X size={18} style={{ color: S.muted }} /></button>
          </div>

          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Mode tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
              {([
                { key: "equal",     label: "সমানভাবে", icon: Users },
                { key: "item_wise", label: "আইটেম ভিত্তিক", icon: Hash },
                { key: "custom",    label: "কাস্টম", icon: Split },
                { key: "partial",   label: "আংশিক", icon: AlertCircle },
              ] as const).map(m => {
                const Icon = m.icon;
                return (
                  <button key={m.key} onClick={() => updateSplitMode(m.key)}
                    className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      backgroundColor: splitMode === m.key ? "#7C3AED" : "transparent",
                      color: splitMode === m.key ? "#fff" : S.muted,
                    }}>
                    <Icon size={12} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Equal mode */}
            {splitMode === "equal" && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
                  <span className="text-xs font-medium flex-1" style={{ color: S.text }}>কতজনের মধ্যে ভাগ করবেন?</span>
                  <div className="flex items-center gap-2 border rounded-lg overflow-hidden" style={{ borderColor: S.border }}>
                    <button onClick={() => updateEqualCount(splitCount - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-red-50">
                      <Minus size={13} style={{ color: "#EF4444" }} />
                    </button>
                    <span className="text-sm font-bold px-2 min-w-[28px] text-center" style={{ color: S.text }}>{splitCount}</span>
                    <button onClick={() => updateEqualCount(splitCount + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-green-50">
                      <Plus size={13} style={{ color: "#10B981" }} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {splitRows.map((row, idx) => (
                    <div key={row.id} className="p-3 rounded-2xl border space-y-2" style={{ borderColor: "#8B5CF620", backgroundColor: "#F5F3FF80" }}>
                      <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>জন {idx + 1} — {formatBDT(parseFloat(row.amount) || 0)}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>নাম (ঐচ্ছিক)</label>
                          <input value={row.payerName} onChange={e => updateSplitRow(row.id, "payerName", e.target.value)}
                            placeholder="পেয়ারের নাম"
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                            style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                          <select value={row.paymentMethod} onChange={e => updateSplitRow(row.id, "paymentMethod", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                            style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
                            {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {(row.paymentMethod === "bkash" || row.paymentMethod === "nagad" || row.paymentMethod === "card") && (
                        <input value={row.transactionRef} onChange={e => updateSplitRow(row.id, "transactionRef", e.target.value)}
                          placeholder="Transaction ID / রেফারেন্স"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Item-wise mode */}
            {splitMode === "item_wise" && (
              <>
                <div className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <AlertCircle size={13} style={{ color: "#3B82F6", flexShrink: 0 }} />
                  <p className="text-[11px]" style={{ color: "#1D4ED8" }}>প্রতিটি আইটেম কোন পেয়ারের সেটি নির্ধারণ করুন। ট্যাক্স pro-rate হিসেবে ভাগ হবে।</p>
                </div>
                {/* Payer list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold" style={{ color: S.text }}>পেয়ার তালিকা</p>
                    <button onClick={addPayer}
                      className="text-[10px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border"
                      style={{ borderColor: "#8B5CF6", color: "#7C3AED" }}>
                      <Plus size={11} />পেয়ার যোগ করুন
                    </button>
                  </div>
                  {payers.map((payer, idx) => (
                    <div key={payer.id} className="p-3 rounded-xl border space-y-2" style={{ borderColor: "#8B5CF620", backgroundColor: "#F5F3FF80" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: "#7C3AED" }}>{idx + 1}</div>
                        <input value={payer.name} onChange={e => updatePayer(payer.id, "name", e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg text-xs border outline-none font-semibold"
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                        <select value={payer.paymentMethod} onChange={e => updatePayer(payer.id, "paymentMethod", e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs border outline-none"
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
                          {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                        </select>
                        {payers.length > 2 && (
                          <button onClick={() => removePayer(payer.id)}><X size={13} style={{ color: "#EF4444" }} /></button>
                        )}
                      </div>
                      {(payer.paymentMethod === "bkash" || payer.paymentMethod === "nagad" || payer.paymentMethod === "card") && (
                        <input value={payer.transactionRef} onChange={e => updatePayer(payer.id, "transactionRef", e.target.value)}
                          placeholder="Transaction ID"
                          className="w-full px-2 py-1 rounded-lg text-xs border outline-none"
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                      )}
                    </div>
                  ))}
                </div>
                {/* Item assignment */}
                <div className="space-y-2">
                  <p className="text-xs font-bold" style={{ color: S.text }}>আইটেম বরাদ্দ করুন</p>
                  {activeOrder?.items.filter(i => !i.isVoided).length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: S.muted }}>কোনো আইটেম নেই</p>
                  ) : activeOrder?.items.filter(i => !i.isVoided).map(item => {
                    const pi = itemPayerMap[item.id] ?? 0;
                    return (
                      <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ borderColor: S.border, backgroundColor: "var(--c-bg)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight" style={{ color: S.text }}>{item.name}</p>
                          <p className="text-[10px]" style={{ color: S.muted }}>×{item.quantity} = {formatBDT(item.unitPrice * item.quantity)}</p>
                        </div>
                        <select value={pi} onChange={e => setItemPayer(item.id, parseInt(e.target.value))}
                          className="px-2 py-1.5 rounded-lg text-xs border outline-none font-semibold"
                          style={{ borderColor: "#8B5CF6", backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                          {payers.map((p, i) => <option key={p.id} value={i}>{p.name}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
                {/* Per-payer summary */}
                <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: "var(--c-bg)" }}>
                  <p className="text-[10px] font-bold mb-2" style={{ color: S.muted }}>প্রতিজনের হিসাব (ট্যাক্স সহ)</p>
                  {itemWisePayerAmounts().map((a, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span style={{ color: S.text }}>{payers[a.payerIndex]?.name}</span>
                      <span className="font-bold" style={{ color: S.primary }}>{formatBDT(a.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Custom mode */}
            {splitMode === "custom" && (
              <div className="space-y-3">
                {splitRows.map((row, idx) => (
                  <div key={row.id} className="p-3 rounded-2xl border space-y-2" style={{ borderColor: "#8B5CF620", backgroundColor: "#F5F3FF80" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: "#7C3AED" }}>পেমেন্ট {idx + 1}</span>
                      {splitRows.length > 1 && (
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
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
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
                <button onClick={addSplitRow}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2"
                  style={{ borderColor: "#8B5CF6", color: "#7C3AED", borderStyle: "dashed" }}>
                  <Plus size={13} />আরেকজন যোগ করুন
                </button>
              </div>
            )}

            {/* Partial mode */}
            {splitMode === "partial" && (
              <>
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <AlertCircle size={14} style={{ color: "#3B82F6", flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[11px]" style={{ color: "#1D4ED8" }}>
                    আংশিক পেমেন্ট নিলে অর্ডার পেইড হবে না। বকেয়া amount অর্ডারে track হবে।
                  </p>
                </div>
                <div className="space-y-3">
                  {splitRows.map((row) => (
                    <div key={row.id} className="p-3 rounded-2xl border space-y-2" style={{ borderColor: "#8B5CF620", backgroundColor: "#F5F3FF80" }}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>পরিমাণ (৳) *</label>
                          <input value={row.amount} onChange={e => updateSplitRow(row.id, "amount", e.target.value)}
                            type="number" min="0" step="1" placeholder="০"
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none font-bold"
                            style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium mb-1 block" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                          <select value={row.paymentMethod} onChange={e => updateSplitRow(row.id, "paymentMethod", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                            style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
                            {PAYMENT_METHODS.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {(row.paymentMethod === "bkash" || row.paymentMethod === "nagad" || row.paymentMethod === "card") && (
                        <input value={row.transactionRef} onChange={e => updateSplitRow(row.id, "transactionRef", e.target.value)}
                          placeholder="Transaction ID"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                          style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }} />
                      )}
                      <div className="flex justify-between text-xs pt-1" style={{ color: S.muted }}>
                        <span>মোট বকেয়া</span>
                        <span className="font-bold" style={{ color: "#EF4444" }}>{formatBDT(effectiveDue)}</span>
                      </div>
                      {parseFloat(row.amount) > 0 && (
                        <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                          <span>পেমেন্টের পর বকেয়া</span>
                          <span className="font-bold" style={{ color: "#F97316" }}>{formatBDT(Math.max(0, effectiveDue - (parseFloat(row.amount) || 0)))}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Running total summary (for equal/custom/item_wise) */}
            {splitMode !== "partial" && (
              <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: "var(--c-bg)" }}>
                <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                  <span>বকেয়া বিল</span><span>{formatBDT(effectiveDue)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                  <span>এন্টার করা মোট</span>
                  <span style={{ color: splitDiff < -0.5 ? "#EF4444" : "#10B981" }}>{formatBDT(splitEntered)}</span>
                </div>
                {Math.abs(splitDiff) > 0.5 && (
                  <div className="flex justify-between text-xs font-semibold" style={{ color: splitDiff > 0 ? "#EF4444" : "#10B981" }}>
                    <span>{splitDiff > 0 ? "বাকি" : "বেশি এন্টার হয়েছে"}</span>
                    <span>{formatBDT(Math.abs(splitDiff))}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-5 border-t" style={{ borderColor: S.border }}>
            <button onClick={saveSplits} disabled={savingSplit}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#7C3AED" }}>
              {savingSplit ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {savingSplit ? "সেভ হচ্ছে…"
                : splitMode === "partial" ? "আংশিক পেমেন্ট সেভ করুন"
                : "পেমেন্ট সম্পন্ন করুন"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── SPLIT RECEIPT PRINT PROMPT ─────────────────────────────── */}
    {splitReceiptData && (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>
        <Printer size={16} />
        <span>স্প্লিট রসিদ প্রিন্ট করুন?</span>
        <button onClick={printSplitReceipt}
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
          প্রিন্ট
        </button>
        <button onClick={() => setSplitReceiptData(null)}
          className="text-white/70 hover:text-white">
          <X size={14} />
        </button>
      </div>
    )}

    {/* ── BOGO MODAL ──────────────────────────────────────────────── */}
    {showBogoModal && bogoSuggestions.length > 0 && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: "var(--c-surface)" }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--c-border)" }}>
            <div className="flex items-center gap-2">
              <Gift size={18} style={{ color: "#BE185D" }} />
              <h3 className="font-bold text-base" style={{ color: "var(--c-text)" }}>BOGO অফার</h3>
            </div>
            <button onClick={() => setShowBogoModal(false)}><X size={18} style={{ color: "var(--c-text-muted)" }} /></button>
          </div>
          <div className="p-5 space-y-3">
            {bogoSuggestions.map((s, i) => (
              <div key={i} className="p-4 rounded-2xl border-2" style={{ borderColor: "#BE185D", backgroundColor: "#FDF2F8" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "#BE185D" }}>🎁 {s.couponCode}</p>
                <p className="text-xs mb-3" style={{ color: "var(--c-text-muted)" }}>
                  {s.triggerItemName} কিনলে {s.getQty}টি {s.getDiscountPct === 100 ? "বিনামূল্যে" : `${s.getDiscountPct}% ছাড়ে`} পাবেন
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: "#BE185D" }}>সাশ্রয়: {formatBDT(s.discountAmount)}</span>
                </div>
                <button
                  onClick={() => { setAcceptedBogo(s); setShowBogoModal(false); showToast("success", `BOGO ${s.couponCode} প্রয়োগ হয়েছে`); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "#BE185D" }}>
                  অফার গ্রহণ করুন
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <button onClick={() => setShowBogoModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
              বাদ দিন
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── MANAGER PIN MODAL ────────────────────────────────────────── */}
    {showManagerPinModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: "var(--c-surface)" }}>
          <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: "var(--c-border)" }}>
            <Shield size={18} style={{ color: "#D97706" }} />
            <h3 className="font-bold text-base" style={{ color: "var(--c-text)" }}>ম্যানেজার অনুমোদন</h3>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              ছাড়ের পরিমাণ {managerDiscountThreshold}%-এর বেশি। ম্যানেজারের PIN দিন।
            </p>
            <div className="p-3 rounded-xl text-center text-sm font-bold" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
              ছাড়: {formatBDT(pendingManualDiscount)}
            </div>
            <input
              type="password"
              value={managerPinInput}
              onChange={e => { setManagerPinInput(e.target.value); setManagerPinError(""); }}
              onKeyDown={e => e.key === "Enter" && verifyManagerPin()}
              placeholder="ম্যানেজার PIN"
              className="w-full px-4 py-3 rounded-xl text-center text-lg font-mono border outline-none tracking-widest"
              style={{ borderColor: managerPinError ? "#EF4444" : "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
              autoFocus />
            {managerPinError && <p className="text-xs text-red-500 text-center">{managerPinError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowManagerPinModal(false); setManagerPinInput(""); setManagerPinError(""); setManualDiscountInput(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                বাতিল
              </button>
              <button onClick={verifyManagerPin} disabled={managerPinLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: "#D97706" }}>
                {managerPinLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                নিশ্চিত
              </button>
            </div>
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
