"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Search, Trash2, Printer, X, Check, Loader2, ShoppingCart, Pill,
  AlertTriangle, Camera, Wifi, WifiOff, Package, RefreshCw, ChevronRight,
  ScanLine, PauseCircle, ListChecks, GitBranch, Store,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { syncProductsToIndexedDB, getOfflineProducts, enqueueSale, flushSaleQueue, newIdempotencyKey, type PosProduct } from "@/lib/posDb";

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
};

/* ─── Types ────────────────────────────────────────────────────────── */

interface ShopInfo { businessType: string; }
interface MedicineOption {
  id: string; brandName: string; genericName: string | null;
  sellPrice: number; unit: string; stockQty: number; requiresRx: boolean; category: string;
}
interface PharmacyCartItem {
  medicineId: string; brandName: string; unit: string;
  quantity: number; unitPrice: number; vatRate: number; requiresRx: boolean;
}
interface RetailCartItem {
  productId: string; variantId?: string | null; name: string;
  category: string | null; quantity: number; unitPrice: number; vatRate: number;
}
interface Customer { id: string; name: string; phone: string | null; }
interface HeldSale {
  id: string;
  label: string;
  cart: RetailCartItem[];
  customer: Customer | null;
  heldAt: number;
}
const HELD_SALES_KEY = "bizilcore-pos-held-sales";

const VAT_NON_ESSENTIAL = 0.075;
const ESSENTIAL_PHARMACY = new Set(["tablet", "syrup", "injection"]);

/* ═══════════════════════════════════════════════════════════════════ */
/*  PHARMACY POS                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function PharmacyPOS() {
  const [medicines, setMedicines] = useState<MedicineOption[]>([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<MedicineOption[]>([]);
  const [cart, setCart] = useState<PharmacyCartItem[]>([]);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<{ total: number; prescriptionId: string | null } | null>(null);
  const [rxNote, setRxNote] = useState("");
  const [rxPhotoUrl, setRxPhotoUrl] = useState("");
  const [showRxPrompt, setShowRxPrompt] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchMedicines = useCallback(async () => {
    const r = await fetch("/api/medicines");
    const data = await r.json();
    setMedicines(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); return; }
    const q = search.toLowerCase();
    setSuggestions(medicines.filter(m =>
      m.brandName.toLowerCase().includes(q) || (m.genericName ?? "").toLowerCase().includes(q)
    ).slice(0, 8));
  }, [search, medicines]);

  function addToCart(m: MedicineOption) {
    setCart(prev => {
      const exists = prev.find(i => i.medicineId === m.id);
      if (exists) return prev.map(i => i.medicineId === m.id ? { ...i, quantity: i.quantity + 1 } : i);
      const vatRate = ESSENTIAL_PHARMACY.has(m.category) ? 0 : VAT_NON_ESSENTIAL;
      return [...prev, { medicineId: m.id, brandName: m.brandName, unit: m.unit, quantity: 1, unitPrice: m.sellPrice, vatRate, requiresRx: m.requiresRx }];
    });
    setSearch(""); setSuggestions([]); searchRef.current?.focus();
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.medicineId !== id)); return; }
    setCart(prev => prev.map(i => i.medicineId === id ? { ...i, quantity: qty } : i));
  }

  function toggleVat(id: string) {
    setCart(prev => prev.map(i => i.medicineId === id ? { ...i, vatRate: i.vatRate > 0 ? 0 : VAT_NON_ESSENTIAL } : i));
  }

  const subTotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalVat = cart.reduce((s, i) => s + i.quantity * i.unitPrice * i.vatRate, 0);
  const grandTotal = subTotal + totalVat;
  const hasRxItems = cart.some(i => i.requiresRx);

  function handleCheckout() {
    if (cart.length === 0) { showToast("error", "কার্টে কোনো ওষুধ নেই।"); return; }
    if (hasRxItems) { setShowRxPrompt(true); return; }
    finishSale();
  }

  async function finishSale(skipRx = false) {
    setShowRxPrompt(false);
    setPaying(true);
    const r = await fetch("/api/medicines/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: patientName || undefined,
        patientPhone: patientPhone || undefined,
        items: cart.map(i => ({
          medicineId: i.medicineId,
          medicineName: i.brandName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          vatRate: i.vatRate,
        })),
        rxNote: skipRx ? "প্রেসক্রিপশন ছাড়া বিক্রয়" : (rxNote || undefined),
        rxPhotoUrl: rxPhotoUrl || undefined,
      }),
    });
    const data = await r.json();
    setPaying(false);
    if (!r.ok) { showToast("error", data.error ?? "বিক্রয় সম্পন্ন করা যায়নি।"); return; }
    setLastSale({ total: data.saleTotal, prescriptionId: data.prescriptionId });
    setShowReceipt(true);
    fetchMedicines();
  }

  function clearCart() {
    setCart([]); setPatientName(""); setPatientPhone(""); setRxNote(""); setRxPhotoUrl(""); setShowReceipt(false); setLastSale(null);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {showRxPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FEF9C3" }}>
                <AlertTriangle size={18} style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: S.text }}>প্রেসক্রিপশন প্রয়োজন</h3>
                <p className="text-xs" style={{ color: S.muted }}>Rx-চিহ্নিত ওষুধ আছে</p>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color: S.secondary }}>ডাক্তারের প্রেসক্রিপশন নম্বর বা ডাক্তারের নাম লিখুন।</p>
            <div className="space-y-2 mb-4">
              <input type="text" value={rxNote} onChange={e => setRxNote(e.target.value)}
                placeholder="যেমন: Dr. রহিম / RX-2025-01"
                style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
              <div className="flex items-center gap-2">
                <Camera size={14} style={{ color: S.muted }} />
                <input type="url" value={rxPhotoUrl} onChange={e => setRxPhotoUrl(e.target.value)}
                  placeholder="প্রেসক্রিপশন ছবির URL (ঐচ্ছিক)"
                  style={{ flex: 1, height: 36, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 13, outline: "none" }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => finishSale(true)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: "#F59E0B", color: "#F59E0B" }}>এড়িয়ে যান</button>
              <button onClick={() => finishSale(false)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: "#10B981" }}>নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: "#DCFCE7" }}>
                <Check size={22} style={{ color: "#10B981" }} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: S.text }}>বিক্রয় সম্পন্ন!</h3>
              {patientName && <p className="text-sm mt-1" style={{ color: S.muted }}>{patientName}</p>}
              {lastSale.prescriptionId && (
                <p className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>প্রেসক্রিপশন সংরক্ষিত</p>
              )}
            </div>
            <div className="space-y-2 mb-4">
              {cart.map(i => (
                <div key={i.medicineId} className="flex justify-between text-sm">
                  <span style={{ color: S.text }}>{i.brandName} × {i.quantity}</span>
                  <span className="font-mono" style={{ color: S.secondary }}>{formatBDT(i.quantity * i.unitPrice)}</span>
                </div>
              ))}
              {totalVat > 0 && (
                <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: S.border }}>
                  <span style={{ color: S.muted }}>VAT</span>
                  <span className="font-mono" style={{ color: S.secondary }}>{formatBDT(totalVat)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t" style={{ borderColor: S.border }}>
                <span style={{ color: S.text }}>মোট</span>
                <span className="font-mono" style={{ color: "#10B981" }}>{formatBDT(lastSale.total)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={clearCart} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>নতুন বিক্রয়</button>
              <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: "#10B981" }}>
                <Printer size={14} /> প্রিন্ট
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
          <Pill size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>ফার্মেসি POS</h1>
          <p className="text-xs" style={{ color: S.muted }}>দ্রুত বিক্রয় করুন — স্টক স্বয়ংক্রিয়ভাবে কাটা হবে (FIFO)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>রোগীর নাম (ঐচ্ছিক)</label>
              <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="যেমন: আব্দুল করিম"
                style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 10, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>মোবাইল (ঐচ্ছিক)</label>
              <input type="tel" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="01XXXXXXXXX"
                style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 10, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
            </div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 px-3 h-12 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <Search size={16} style={{ color: S.muted }} />
              <input ref={searchRef} className="flex-1 bg-transparent outline-none text-sm" placeholder="ওষুধের নাম দিয়ে খুঁজুন..."
                value={search} onChange={e => setSearch(e.target.value)} style={{ color: S.text }} />
              {search && <button onClick={() => setSearch("")} style={{ color: S.muted }}><X size={14} /></button>}
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 rounded-xl border shadow-lg z-20 mt-1 overflow-hidden"
                style={{ backgroundColor: S.surface, borderColor: S.border }}>
                {suggestions.map(m => (
                  <button key={m.id} onClick={() => addToCart(m)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 text-left transition-colors border-b last:border-0"
                    style={{ borderColor: S.border }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ECFDF5" }}>
                        <Pill size={14} style={{ color: "#10B981" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: S.text }}>
                          {m.brandName}
                          {m.requiresRx && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>Rx</span>}
                        </p>
                        {m.genericName && <p className="text-xs" style={{ color: S.muted }}>{m.genericName}</p>}
                        <p className="text-xs" style={{ color: m.stockQty <= 0 ? "#EF4444" : S.muted }}>স্টক: {m.stockQty} {m.unit}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold font-mono" style={{ color: "#10B981" }}>{formatBDT(m.sellPrice)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[48vh] overflow-y-auto">
            {medicines.filter(m => m.stockQty > 0).slice(0, 30).map(m => (
              <button key={m.id} onClick={() => addToCart(m)}
                className="text-left p-3 rounded-xl border hover:shadow-sm transition-all hover:border-green-300"
                style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <p className="text-xs font-semibold truncate" style={{ color: S.text }}>
                  {m.brandName}
                  {m.requiresRx && <span className="ml-1 text-[8px] px-1 rounded font-bold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>Rx</span>}
                </p>
                {m.genericName && <p className="text-[10px] truncate mt-0.5" style={{ color: S.muted }}>{m.genericName}</p>}
                <p className="text-sm font-bold font-mono mt-1" style={{ color: "#10B981" }}>{formatBDT(m.sellPrice)}</p>
                <p className="text-[10px]" style={{ color: m.stockQty <= 0 ? "#EF4444" : S.muted }}>স্টক: {m.stockQty}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="rounded-2xl border flex-1" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} style={{ color: S.primary }} />
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>কার্ট ({cart.length})</h3>
              </div>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs" style={{ color: "#E24B4A" }}>মুছুন</button>}
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
                <p className="text-sm" style={{ color: S.muted }}>ওষুধ যোগ করুন</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: S.border }}>
                {cart.map(item => (
                  <div key={item.medicineId} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: S.text }}>
                          {item.brandName}
                          {item.requiresRx && <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>Rx</span>}
                        </p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: S.muted }}>{formatBDT(item.unitPrice)} / {item.unit}</p>
                      </div>
                      <button onClick={() => setCart(prev => prev.filter(i => i.medicineId !== item.medicineId))} style={{ color: "#E24B4A" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(item.medicineId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: "var(--c-surface-raised)" }}>−</button>
                      <input type="number" value={item.quantity} min={1}
                        onChange={e => updateQty(item.medicineId, Number(e.target.value))}
                        style={{ width: 50, height: 28, border: `1px solid ${S.border}`, borderRadius: 6, backgroundColor: S.surface, color: S.text, fontSize: 13, textAlign: "center", outline: "none" }} />
                      <button onClick={() => updateQty(item.medicineId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: "var(--c-surface-raised)" }}>+</button>
                      <button onClick={() => toggleVat(item.medicineId)}
                        className="ml-auto text-[10px] px-2 py-1 rounded-lg border transition-colors"
                        style={{ borderColor: item.vatRate > 0 ? "#F59E0B" : S.border, color: item.vatRate > 0 ? "#F59E0B" : S.muted, backgroundColor: item.vatRate > 0 ? "#FFFBEB" : "transparent" }}>
                        VAT {item.vatRate > 0 ? "7.5%" : "0%"}
                      </button>
                      <span className="text-sm font-bold font-mono" style={{ color: "#10B981" }}>{formatBDT(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.secondary }}>উপমোট</span>
                <span className="font-mono" style={{ color: S.text }}>{formatBDT(subTotal)}</span>
              </div>
              {totalVat > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: S.secondary }}>VAT</span>
                  <span className="font-mono" style={{ color: "#F59E0B" }}>{formatBDT(totalVat)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ borderColor: S.border }}>
                <span style={{ color: S.text }}>সর্বমোট</span>
                <span className="font-mono" style={{ color: "#10B981" }}>{formatBDT(grandTotal)}</span>
              </div>
              {hasRxItems && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FFFBEB" }}>
                  <AlertTriangle size={13} style={{ color: "#F59E0B" }} />
                  <p className="text-xs" style={{ color: "#92400E" }}>প্রেসক্রিপশন-প্রয়োজনীয় ওষুধ আছে</p>
                </div>
              )}
              <button onClick={handleCheckout} disabled={paying}
                className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#10B981" }}>
                {paying ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {paying ? "প্রক্রিয়া হচ্ছে..." : `বিক্রয় সম্পন্ন করুন — ${formatBDT(grandTotal)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  RETAIL POS                                                         */
/* ═══════════════════════════════════════════════════════════════════ */

const PAYMENT_METHODS = [
  { key: "cash",  label: "নগদ",  color: "#10B981", bg: "#ECFDF5" },
  { key: "bkash", label: "bKash", color: "#E91E8C", bg: "#FDF2F8" },
  { key: "card",  label: "Card",  color: "#1D4ED8", bg: "#EFF6FF" },
  { key: "due",   label: "বাকি",  color: "#F59E0B", bg: "#FFFBEB" },
] as const;

function RetailPOS() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<RetailCartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState("");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<{ grandTotal: number; transactionId: string } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [offlineQueueLen, setOfflineQueueLen] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchStock, setBranchStock] = useState<Record<string, number>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch("/api/products?all=1");
      if (!r.ok) throw new Error("fail");
      const data: PosProduct[] = await r.json();
      setProducts(data);
      await syncProductsToIndexedDB(data);
      const cats = [...new Set(data.map(p => p.category).filter(Boolean))] as string[];
      setCategories(cats);
    } catch {
      const offline = await getOfflineProducts();
      setProducts(offline);
      const cats = [...new Set(offline.map(p => p.category).filter(Boolean))] as string[];
      setCategories(cats);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const r = await fetch("/api/customers?all=1&limit=200");
      if (r.ok) {
        const data = await r.json();
        setCustomers(Array.isArray(data) ? data : (data.customers ?? []));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch("/api/shops")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.branches?.length) setBranches(d.branches); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!branchId) { setBranchStock({}); return; }
    fetch(`/api/shops/${branchId}/stock`)
      .then(r => r.ok ? r.json() : { stock: [] })
      .then(d => {
        const map: Record<string, number> = {};
        for (const row of d.stock ?? []) map[row.productId] = row.quantity;
        setBranchStock(map);
      })
      .catch(() => setBranchStock({}));
  }, [branchId]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    const online = navigator.onLine;
    setIsOnline(online);
    if (online) {
      flushSaleQueue().then(({ flushed }) => {
        if (flushed > 0) {
          setOfflineQueueLen(0);
          showToast("success", `${flushed}টি অফলাইন বিক্রয় সিঙ্ক করা হয়েছে।`);
        }
      });
    }
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncing(true);
      const { flushed } = await flushSaleQueue();
      setSyncing(false);
      setOfflineQueueLen(0);
      if (flushed > 0) showToast("success", `${flushed}টি অফলাইন বিক্রয় সিঙ্ক করা হয়েছে।`);
      await fetchProducts();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, [fetchProducts, fetchCustomers]);

  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerSuggestions([]); return; }
    const q = customerSearch.toLowerCase();
    setCustomerSuggestions(customers.filter(c => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q)).slice(0, 6));
  }, [customerSearch, customers]);

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function effectiveStock(p: PosProduct) {
    if (branchId) return branchStock[p.id] ?? 0;
    return p.stockQty;
  }

  function addToCart(p: PosProduct) {
    const stock = effectiveStock(p);
    if (stock < 1) {
      showToast("error", branchId ? "Branch-এ স্টক নেই" : "স্টক শেষ");
      return;
    }
    setCart(prev => {
      const exists = prev.find(i => i.productId === p.id);
      if (exists) {
        const nextQty = exists.quantity + 1;
        if (nextQty > stock) return prev;
        return prev.map(i => i.productId === p.id ? { ...i, quantity: nextQty } : i);
      }
      return [...prev, { productId: p.id, name: p.name, category: p.category, quantity: 1, unitPrice: p.sellPrice, vatRate: 0 }];
    });
  }

  /** Match a scanned/typed code to a product by SKU (exact) or unique name. */
  function findProductByCode(code: string): PosProduct | null {
    const c = code.trim().toLowerCase();
    if (!c) return null;
    const bySku = products.find(p => (p.sku ?? "").toLowerCase() === c);
    if (bySku) return bySku;
    const byName = products.filter(p => p.name.toLowerCase().includes(c));
    return byName.length === 1 ? byName[0] : null;
  }

  // USB/Bluetooth barcode scanners type the code then press Enter.
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const match = findProductByCode(search);
    if (match) {
      addToCart(match);
      setSearch("");
      showToast("success", `${match.name} যোগ হয়েছে`);
    } else {
      showToast("error", "এই কোড/নামে পণ্য পাওয়া যায়নি।");
    }
  }

  // Camera-based barcode scanning via @zxing/browser (lazy-loaded).
  async function startCameraScan() {
    setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          if (result) {
            const code = result.getText();
            const match = findProductByCode(code);
            if (match) {
              addToCart(match);
              showToast("success", `${match.name} যোগ হয়েছে`);
              stopCameraScan();
            } else {
              showToast("error", `কোড "${code}" এর পণ্য পাওয়া যায়নি।`);
            }
          }
        },
      );
      scannerControlsRef.current = controls;
    } catch {
      setScanning(false);
      showToast("error", "ক্যামেরা চালু করা যায়নি।");
    }
  }

  function stopCameraScan() {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setScanning(false);
  }

  // ── Hold / Park sales (persisted to localStorage) ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HELD_SALES_KEY);
      if (raw) setHeldSales(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function persistHeld(next: HeldSale[]) {
    setHeldSales(next);
    try { localStorage.setItem(HELD_SALES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function holdCurrentSale() {
    if (cart.length === 0) { showToast("error", "কার্ট খালি।"); return; }
    const held: HeldSale = {
      id: newIdempotencyKey(),
      label: selectedCustomer?.name || `Hold #${heldSales.length + 1}`,
      cart,
      customer: selectedCustomer,
      heldAt: Date.now(),
    };
    persistHeld([held, ...heldSales]);
    setCart([]); setSelectedCustomer(null); setCustomerSearch(""); setDiscountValue("");
    showToast("success", "বিক্রয় হোল্ড করা হয়েছে।");
  }

  function resumeHeldSale(held: HeldSale) {
    if (cart.length > 0) holdCurrentSale();
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    persistHeld(heldSales.filter(h => h.id !== held.id));
    setShowHeld(false);
    showToast("success", "হোল্ড বিক্রয় ফিরিয়ে আনা হয়েছে।");
  }

  function deleteHeldSale(id: string) {
    persistHeld(heldSales.filter(h => h.id !== id));
  }

  function printReceipt() {
    if (typeof window !== "undefined") window.print();
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.productId !== id)); return; }
    setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: qty } : i));
  }

  const subTotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatRate = vatEnabled ? 0.075 : 0;
  const vatAmount = subTotal * vatRate;
  const discountAmt = discountType === "flat"
    ? Math.min(Number(discountValue ?? 0), subTotal)
    : subTotal * Math.min(Number(discountValue ?? 0), 100) / 100;
  const grandTotal = Math.max(0, subTotal + vatAmount - discountAmt);

  async function handleCheckout() {
    if (cart.length === 0) { showToast("error", "কার্টে কোনো পণ্য নেই।"); return; }
    setPaying(true);

    const payload = {
      items: cart.map(i => ({ productId: i.productId, productName: i.name, quantity: i.quantity, unitPrice: i.unitPrice, vatRate })),
      customerId: selectedCustomer?.id,
      paymentMethod,
      discountAmount: discountAmt,
      note: `POS বিক্রয় — ${paymentMethod}${branchId ? ` — branch` : ""}`,
      idempotencyKey: newIdempotencyKey(),
      ...(branchId ? { branchId } : {}),
    };

    if (!isOnline) {
      await enqueueSale(payload);
      setOfflineQueueLen(q => q + 1);
      setPaying(false);
      setLastSale({ grandTotal, transactionId: "offline-queued" });
      setShowReceipt(true);
      return;
    }

    const r = await fetch("/api/pos/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    setPaying(false);
    if (!r.ok) { showToast("error", data.error ?? "বিক্রয় সম্পন্ন করা যায়নি।"); return; }
    setLastSale({ grandTotal: data.grandTotal, transactionId: data.transactionId });
    setShowReceipt(true);
    await fetchProducts();
  }

  function clearCart() {
    setCart([]); setSelectedCustomer(null); setCustomerSearch(""); setDiscountValue(""); setShowReceipt(false); setLastSale(null);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {scanning && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 no-print">
          <div className="rounded-2xl p-4 w-full max-w-sm" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: S.text }}>
                <ScanLine size={18} style={{ color: "#F59E0B" }} /> বারকোড স্ক্যান
              </h3>
              <button onClick={stopCameraScan} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            <video ref={videoRef} className="w-full rounded-xl bg-black" style={{ aspectRatio: "4/3" }} />
            <p className="text-xs text-center mt-2" style={{ color: S.muted }}>পণ্যের বারকোড ক্যামেরার সামনে ধরুন</p>
          </div>
        </div>
      )}

      {showHeld && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="rounded-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{ color: S.text }}>
                <ListChecks size={18} style={{ color: "#1D4ED8" }} /> হোল্ড করা বিক্রয় ({heldSales.length})
              </h3>
              <button onClick={() => setShowHeld(false)} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            {heldSales.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: S.muted }}>কোনো হোল্ড করা বিক্রয় নেই।</p>
            ) : (
              <div className="space-y-2">
                {heldSales.map(h => {
                  const total = h.cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                  return (
                    <div key={h.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border" style={{ borderColor: S.border }}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{h.label}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{h.cart.length}টি পণ্য · {formatBDT(total)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => resumeHeldSale(h)} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: "#10B981" }}>ফিরিয়ে আনুন</button>
                        <button onClick={() => deleteHeldSale(h.id)} style={{ color: "#E24B4A" }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="mb-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "#FEF9C3", color: "#92400E" }}>
          <WifiOff size={16} />
          <span>অফলাইন মোড — পণ্য তালিকা থেকে বিক্রয় করুন, ইন্টারনেট ফিরলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।</span>
          {offlineQueueLen > 0 && <span className="ml-auto font-bold">{offlineQueueLen}টি পেন্ডিং</span>}
        </div>
      )}

      {syncing && (
        <div className="mb-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
          <RefreshCw size={16} className="animate-spin" />
          <span>অফলাইন বিক্রয় সিঙ্ক হচ্ছে...</span>
        </div>
      )}

      {branches.length > 0 && (
        <div
          className="mb-3 rounded-2xl border overflow-hidden"
          style={{ borderColor: S.border, backgroundColor: S.surface }}
        >
          <div
            className="px-4 py-2.5 flex items-center gap-2 border-b"
            style={{ borderColor: S.border, background: "linear-gradient(90deg, #E1F5EE 0%, #ECFDF5 100%)" }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(15,110,86,0.12)" }}>
              <GitBranch size={14} style={{ color: "#0F6E56" }} />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight" style={{ color: "#065F46" }}>বিক্রির লোকেশন</p>
              <p className="text-[10px]" style={{ color: "#047857" }}>
                {branchId ? "শাখার স্টক থেকে কাটা হবে" : "মূল শপের স্টক ব্যবহার হচ্ছে"}
              </p>
            </div>
          </div>
          <div className="p-3 flex gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => { setBranchId(""); setCart([]); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
              style={{
                borderColor: !branchId ? "#0F6E56" : S.border,
                backgroundColor: !branchId ? "#E1F5EE" : S.surface,
                color: !branchId ? "#065F46" : S.muted,
                boxShadow: !branchId ? "0 0 0 1px #0F6E56" : undefined,
              }}
            >
              <Store size={13} />
              মূল শপ
              {!branchId && <Check size={12} style={{ color: "#0F6E56" }} />}
            </button>
            {branches.map(b => {
              const active = branchId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBranchId(b.id); setCart([]); }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                  style={{
                    borderColor: active ? "#7C3AED" : S.border,
                    backgroundColor: active ? "#F5F3FF" : S.surface,
                    color: active ? "#5B21B6" : S.text,
                    boxShadow: active ? "0 0 0 1px #7C3AED" : undefined,
                  }}
                >
                  <GitBranch size={12} style={{ color: active ? "#7C3AED" : S.muted }} />
                  {b.name}
                  {active && <Check size={12} style={{ color: "#7C3AED" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: "#DCFCE7" }}>
                {isOnline ? <Check size={22} style={{ color: "#10B981" }} /> : <WifiOff size={22} style={{ color: "#F59E0B" }} />}
              </div>
              <h3 className="font-bold text-lg" style={{ color: S.text }}>
                {lastSale.transactionId === "offline-queued" ? "বিক্রয় সংরক্ষিত (অফলাইন)" : "বিক্রয় সম্পন্ন!"}
              </h3>
              {selectedCustomer && <p className="text-sm mt-1" style={{ color: S.muted }}>{selectedCustomer.name}</p>}
            </div>
            <div className="space-y-2 mb-4">
              {cart.map(i => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span style={{ color: S.text }}>{i.name} × {i.quantity}</span>
                  <span className="font-mono" style={{ color: S.secondary }}>{formatBDT(i.quantity * i.unitPrice)}</span>
                </div>
              ))}
              {vatAmount > 0 && (
                <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: S.border }}>
                  <span style={{ color: S.muted }}>VAT (7.5%)</span>
                  <span className="font-mono" style={{ color: "#F59E0B" }}>{formatBDT(vatAmount)}</span>
                </div>
              )}
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm" style={{ borderColor: S.border }}>
                  <span style={{ color: S.muted }}>ছাড়</span>
                  <span className="font-mono" style={{ color: "#EF4444" }}>-{formatBDT(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t" style={{ borderColor: S.border }}>
                <span style={{ color: S.text }}>সর্বমোট</span>
                <span className="font-mono" style={{ color: "#10B981" }}>{formatBDT(lastSale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</span>
                <span className="font-medium" style={{ color: S.text }}>{paymentMethod === "cash" ? "নগদ" : paymentMethod === "bkash" ? "bKash" : paymentMethod === "card" ? "Card" : "বাকি"}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={clearCart} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>নতুন বিক্রয়</button>
              <button onClick={printReceipt} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: "#10B981" }}>
                <Printer size={14} /> প্রিন্ট
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal receipt — hidden on screen, the only thing that prints */}
      {lastSale && (
        <div className="thermal-receipt">
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14 }}>রসিদ / RECEIPT</div>
          <div style={{ textAlign: "center", fontSize: 10 }}>{new Date().toLocaleString("bn-BD")}</div>
          {selectedCustomer && <div style={{ fontSize: 11, marginTop: 4 }}>কাস্টমার: {selectedCustomer.name}</div>}
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          {cart.map(i => (
            <div key={i.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>{i.name} x{i.quantity}</span>
              <span>{(i.quantity * i.unitPrice).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span>উপমোট</span><span>{subTotal.toFixed(2)}</span>
          </div>
          {vatAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>VAT</span><span>{vatAmount.toFixed(2)}</span>
            </div>
          )}
          {discountAmt > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>ছাড়</span><span>-{discountAmt.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
            <span>মোট</span><span>{lastSale.grandTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            পেমেন্ট: {paymentMethod === "cash" ? "নগদ" : paymentMethod === "bkash" ? "bKash" : paymentMethod === "card" ? "Card" : "বাকি"}
          </div>
          <div style={{ textAlign: "center", fontSize: 10, marginTop: 8 }}>ধন্যবাদ! আবার আসবেন।</div>
        </div>
      )}

      <style jsx global>{`
        .thermal-receipt { display: none; }
        @media print {
          body * { visibility: hidden; }
          .thermal-receipt, .thermal-receipt * { visibility: visible; }
          .thermal-receipt {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
            color: #000;
            font-family: 'Courier New', monospace;
          }
          .no-print { display: none !important; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <ShoppingCart size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>রিটেইল POS</h1>
            <p className="text-xs" style={{ color: S.muted }}>দ্রুত বিক্রয় — স্টক স্বয়ংক্রিয়ভাবে কাটা হবে</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: isOnline ? "#10B981" : "#F59E0B" }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? "অনলাইন" : "অফলাইন"}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Product Grid */}
        <div className="lg:col-span-3 space-y-3">
          {/* Search + Barcode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 h-12 rounded-xl border flex-1" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <Search size={16} style={{ color: S.muted }} />
              <input ref={searchRef} className="flex-1 bg-transparent outline-none text-sm" placeholder="নাম/SKU দিয়ে খুঁজুন বা স্ক্যান করুন..."
                value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown} style={{ color: S.text }} />
              {search && <button onClick={() => setSearch("")} style={{ color: S.muted }}><X size={14} /></button>}
            </div>
            <button onClick={startCameraScan} title="বারকোড স্ক্যান"
              className="h-12 px-3 rounded-xl border flex items-center justify-center flex-shrink-0"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: "#F59E0B" }}>
              <ScanLine size={18} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["all", ...categories].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: activeCategory === cat ? "#F59E0B" : S.surface,
                  color: activeCategory === cat ? "#fff" : S.muted,
                  border: `1px solid ${activeCategory === cat ? "#F59E0B" : S.border}`,
                }}>
                {cat === "all" ? "সব পণ্য" : cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[52vh] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="col-span-3 text-center py-10">
                <Package size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
                <p className="text-sm" style={{ color: S.muted }}>কোনো পণ্য পাওয়া যায়নি</p>
              </div>
            ) : (
              filteredProducts.map(p => {
                const stock = effectiveStock(p);
                return (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="text-left p-3 rounded-xl border hover:shadow-sm transition-all hover:border-amber-300"
                  style={{ backgroundColor: S.surface, borderColor: S.border, opacity: stock <= 0 ? 0.5 : 1 }}>
                  {p.imageUrl ? (
                    <div className="relative w-full h-20 rounded-lg mb-2 overflow-hidden">
                      <Image src={p.imageUrl} alt={p.name} fill sizes="120px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-20 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
                      <Package size={24} style={{ color: "#F59E0B" }} />
                    </div>
                  )}
                  <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{p.name}</p>
                  {p.category && <p className="text-[10px] truncate" style={{ color: S.muted }}>{p.category}</p>}
                  <p className="text-sm font-bold font-mono mt-1" style={{ color: "#F59E0B" }}>{formatBDT(p.sellPrice)}</p>
                  <p className="text-[10px]" style={{ color: stock <= 0 ? "#EF4444" : S.muted }}>
                    স্টক: {stock <= 0 ? "শেষ" : stock}
                    {branchId && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-md font-bold" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                        branch
                      </span>
                    )}
                  </p>
                </button>
              );})
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Cart Items */}
          <div className="rounded-2xl border flex-1" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} style={{ color: "#F59E0B" }} />
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>কার্ট ({cart.length})</h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowHeld(true)} className="text-xs flex items-center gap-1" style={{ color: S.muted }}>
                  <ListChecks size={13} /> হোল্ড{heldSales.length > 0 ? ` (${heldSales.length})` : ""}
                </button>
                {cart.length > 0 && (
                  <button onClick={holdCurrentSale} className="text-xs flex items-center gap-1" style={{ color: "#1D4ED8" }}>
                    <PauseCircle size={13} /> পার্ক
                  </button>
                )}
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs" style={{ color: "#E24B4A" }}>মুছুন</button>}
              </div>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
                <p className="text-sm" style={{ color: S.muted }}>পণ্য যোগ করুন</p>
              </div>
            ) : (
              <div className="divide-y overflow-y-auto max-h-48" style={{ borderColor: S.border }}>
                {cart.map(item => (
                  <div key={item.productId} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{item.name}</p>
                        <p className="text-xs font-mono" style={{ color: S.muted }}>{formatBDT(item.unitPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: "var(--c-surface-raised)" }}>−</button>
                        <span className="w-8 text-center text-sm font-medium" style={{ color: S.text }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                          className="w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: "var(--c-surface-raised)" }}>+</button>
                        <span className="ml-2 text-sm font-bold font-mono w-16 text-right" style={{ color: "#F59E0B" }}>{formatBDT(item.quantity * item.unitPrice)}</span>
                        <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ color: "#E24B4A", marginLeft: 4 }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer + Discount + Totals + Payment */}
          {cart.length > 0 && (
            <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              {/* Customer Search */}
              <div className="relative">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>কাস্টমার (ঐচ্ছিক)</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between px-3 h-9 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                    <span style={{ color: S.text }}>{selectedCustomer.name}</span>
                    <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} style={{ color: S.muted }}><X size={13} /></button>
                  </div>
                ) : (
                  <>
                    <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                      placeholder="নাম বা ফোন দিয়ে খুঁজুন"
                      style={{ width: "100%", height: 36, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 10px", fontSize: 13, outline: "none" }} />
                    {customerSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 rounded-xl border shadow-lg z-20 mt-0.5 overflow-hidden"
                        style={{ backgroundColor: S.surface, borderColor: S.border }}>
                        {customerSuggestions.map(c => (
                          <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setCustomerSuggestions([]); }}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 text-left border-b last:border-0 text-sm"
                            style={{ borderColor: S.border }}>
                            <span style={{ color: S.text }}>{c.name}</span>
                            {c.phone && <span style={{ color: S.muted }}>{c.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Discount */}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>ছাড়</label>
                <div className="flex gap-2">
                  <button onClick={() => setDiscountType("flat")}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                    style={{ borderColor: discountType === "flat" ? "#F59E0B" : S.border, color: discountType === "flat" ? "#F59E0B" : S.muted, backgroundColor: discountType === "flat" ? "#FFFBEB" : "transparent" }}>৳</button>
                  <button onClick={() => setDiscountType("percent")}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                    style={{ borderColor: discountType === "percent" ? "#F59E0B" : S.border, color: discountType === "percent" ? "#F59E0B" : S.muted, backgroundColor: discountType === "percent" ? "#FFFBEB" : "transparent" }}>%</button>
                  <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} min={0}
                    placeholder={discountType === "flat" ? "যেমন: 50" : "যেমন: 10"}
                    style={{ flex: 1, height: 34, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 10px", fontSize: 13, outline: "none" }} />
                </div>
              </div>

              {/* VAT Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: S.secondary }}>VAT (7.5%)</label>
                <button onClick={() => setVatEnabled(v => !v)}
                  className="px-3 py-1 rounded-lg border text-xs font-medium transition-colors"
                  style={{ borderColor: vatEnabled ? "#F59E0B" : S.border, color: vatEnabled ? "#F59E0B" : S.muted, backgroundColor: vatEnabled ? "#FFFBEB" : "transparent" }}>
                  {vatEnabled ? "চালু" : "বন্ধ"}
                </button>
              </div>

              {/* Totals */}
              <div className="space-y-1 border-t pt-2" style={{ borderColor: S.border }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: S.secondary }}>উপমোট</span>
                  <span className="font-mono" style={{ color: S.text }}>{formatBDT(subTotal)}</span>
                </div>
                {vatAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: S.secondary }}>VAT</span>
                    <span className="font-mono" style={{ color: "#F59E0B" }}>{formatBDT(vatAmount)}</span>
                  </div>
                )}
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: S.secondary }}>ছাড়</span>
                    <span className="font-mono" style={{ color: "#EF4444" }}>-{formatBDT(discountAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1 border-t" style={{ borderColor: S.border }}>
                  <span style={{ color: S.text }}>সর্বমোট</span>
                  <span className="font-mono" style={{ color: "#10B981" }}>{formatBDT(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: S.secondary }}>পেমেন্ট পদ্ধতি</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                      className="py-2 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        borderColor: paymentMethod === m.key ? m.color : S.border,
                        backgroundColor: paymentMethod === m.key ? m.bg : S.surface,
                        color: paymentMethod === m.key ? m.color : S.muted,
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Button */}
              <button onClick={handleCheckout} disabled={paying}
                className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#F59E0B" }}>
                {paying ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                {paying ? "প্রক্রিয়া হচ্ছে..." : `বিল করুন — ${formatBDT(grandTotal)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  ROOT  (detects business type and renders appropriate POS)          */
/* ═══════════════════════════════════════════════════════════════════ */

export default function PosPage() {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      const shopData = data?.shop ?? data;
      setShop(shopData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--c-primary)" }} />
      </div>
    );
  }

  if (!shop) return null;

  if (shop.businessType === "pharmacy") return <PharmacyPOS />;
  if (shop.businessType === "retail") return <RetailPOS />;

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <ShoppingCart size={40} className="mx-auto mb-4" style={{ color: S.muted }} />
      <h2 className="text-lg font-bold mb-2" style={{ color: S.text }}>POS এই ব্যবসার জন্য নেই</h2>
      <p style={{ color: S.muted }}>POS শুধুমাত্র রিটেইল ও ফার্মেসি ব্যবসার জন্য।</p>
      <p className="text-sm mt-1" style={{ color: S.muted }}>আপনার ব্যবসার ধরন: <strong>{shop.businessType}</strong></p>
    </div>
  );
}
