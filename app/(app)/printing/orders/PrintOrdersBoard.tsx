"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Printer, Plus, X, Loader2, Search, AlertTriangle, CheckCircle,
  ChevronRight, Clock, Package, Phone, Calendar, Zap, ArrowRight,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface PrintItem {
  serviceId?: string;
  itemName: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  paperType?: string;
  colorMode?: string;
  sides?: string;
  designNote?: string;
}

interface PrintOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  deliveryDate: string;
  isUrgent: boolean;
  status: string;
  designApproved: boolean;
  notes?: string;
  items: Array<{ itemName: string; quantity: number; subtotal: number; size?: string }>;
  payments: Array<{ amount: number; paidAt: string }>;
}

interface Service { id: string; name: string; category: string; pricePerUnit: number; unit: string; minQuantity: number; }

const STATUS_FLOW = ["received", "design_approval", "printing", "finishing", "ready", "delivered"];
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  received:        { label: "Received",         color: "#6B7280", bg: "#F3F4F6" },
  design_approval: { label: "Design Approval",  color: "#F59E0B", bg: "#FFFBEB" },
  printing:        { label: "Printing",          color: "#3B82F6", bg: "#EFF6FF" },
  finishing:       { label: "Finishing",         color: "#8B5CF6", bg: "#F5F3FF" },
  ready:           { label: "Ready ✓",           color: "#10B981", bg: "#ECFDF5" },
  delivered:       { label: "Delivered",         color: "#0F6E56", bg: "#E1F5EE" },
};

const TABS = [
  { key: "all",            label: "সব" },
  { key: "design_approval",label: "Design Approval" },
  { key: "printing",       label: "Printing" },
  { key: "ready",          label: "Ready" },
  { key: "delivered",      label: "Delivered" },
  { key: "urgent",         label: "🔴 Urgent" },
];

const QUICK_ITEMS = [
  { name: "Business Card (Standard)",  size: "3.5×2 inch", unit: "pcs",  price: 1.5  },
  { name: "Flex Banner",               size: "Custom",      unit: "sqft", price: 35   },
  { name: "A4 Flyer",                  size: "A4",          unit: "pcs",  price: 5    },
  { name: "Poster (A3)",               size: "A3",          unit: "pcs",  price: 25   },
  { name: "Sticker (Custom)",          size: "Custom",      unit: "pcs",  price: 3    },
];

const PRINT_COLOR = "#7C3AED";
const PRINT_LIGHT = "#F5F3FF";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function PrintOrdersBoard() {
  const [orders, setOrders]     = useState<PrintOrder[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [tab, setTab]           = useState("all");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<PrintOrder | null>(null);
  const [showNew, setShowNew]   = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payAmt, setPayAmt]     = useState("");

  // New order form
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({ clientName: "", clientPhone: "", deliveryDate: "", isUrgent: false, notes: "", advancePaid: "" });
  const [items, setItems]       = useState<PrintItem[]>([{ itemName: "", quantity: 100, unitPrice: 0, subtotal: 0 }]);
  const [saving, setSaving]     = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all" && tab !== "urgent") params.set("status", tab);
      if (tab === "urgent") params.set("urgent", "1");
      if (search) params.set("search", search);
      const res = await fetch(`/api/printing/orders?${params}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      if (selected) {
        const updated = data.find((o: PrintOrder) => o.id === selected.id);
        if (updated) setSelected(updated);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, search, selected]);

  useEffect(() => {
    fetchOrders();
    fetch("/api/printing/services").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : []));
  }, [fetchOrders]);

  // Open "new" from URL param
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      setShowNew(true);
    }
  }, []);

  const addItem = () => setItems(p => [...p, { itemName: "", quantity: 100, unitPrice: 0, subtotal: 0 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string | number) => {
    setItems(p => {
      const copy = [...p];
      copy[i] = { ...copy[i], [field]: val };
      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? Number(val) : Number(copy[i].quantity);
        const price = field === "unitPrice" ? Number(val) : Number(copy[i].unitPrice);
        copy[i].subtotal = qty * price;
      }
      return copy;
    });
  };

  const addQuickItem = (qi: typeof QUICK_ITEMS[0]) => {
    setItems(p => [...p, {
      itemName: qi.name, size: qi.size, quantity: 100,
      unitPrice: qi.price, subtotal: qi.price * 100,
    }]);
  };

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.deliveryDate || items.every(i => !i.itemName)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/printing/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items, advancePaid: Number(form.advancePaid ?? 0) }),
      });
      if (res.ok) {
        setShowNew(false);
        setStep(1);
        setForm({ clientName: "", clientPhone: "", deliveryDate: "", isUrgent: false, notes: "", advancePaid: "" });
        setItems([{ itemName: "", quantity: 100, unitPrice: 0, subtotal: 0 }]);
        fetchOrders();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async (orderId: string) => {
    setAdvancing(true);
    try {
      await fetch(`/api/printing/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance_status" }),
      });
      fetchOrders();
    } finally {
      setAdvancing(false);
    }
  };

  const handleApproveDesign = async (orderId: string) => {
    await fetch(`/api/printing/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_design" }),
    });
    fetchOrders();
  };

  const handlePayment = async () => {
    if (!selected || !payAmt) return;
    await fetch(`/api/printing/orders/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "payment", amount: Number(payAmt), method: "cash" }),
    });
    setPayModal(false);
    setPayAmt("");
    fetchOrders();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Printer size={22} style={{ color: PRINT_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>প্রিন্ট অর্ডার</h1>
        </div>
        <button onClick={() => { setShowNew(true); setStep(1); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: PRINT_COLOR }}>
          <Plus size={16} /> নতুন অর্ডার
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="অর্ডার নম্বর, নাম বা ফোন দিয়ে খুঁজুন..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm"
          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all"
            style={tab === t.key
              ? { backgroundColor: PRINT_COLOR, color: "#fff", borderColor: PRINT_COLOR }
              : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders Grid / List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: PRINT_COLOR }} /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: PRINT_LIGHT }}>
            <Printer size={26} style={{ color: PRINT_COLOR }} />
          </div>
          <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো অর্ডার পাওয়া যায়নি</p>
          <button onClick={() => setShowNew(true)} className="text-sm font-bold" style={{ color: PRINT_COLOR }}>
            + নতুন অর্ডার নিন
          </button>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto">
          {orders.map(o => {
            const st = STATUS_META[o.status] ?? STATUS_META.received;
            const days = daysUntil(o.deliveryDate);
            return (
              <div key={o.id}
                onClick={() => setSelected(o)}
                className="rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md"
                style={{ backgroundColor: S.surface, borderColor: selected?.id === o.id ? PRINT_COLOR : S.border }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: PRINT_LIGHT, color: PRINT_COLOR }}>{o.orderNumber}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                    {o.isUrgent && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>🔴 Urgent</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: S.text }}>{formatBDT(o.totalAmount)}</p>
                    {o.dueAmount > 0 && <p className="text-xs font-bold" style={{ color: "#EF4444" }}>বাকি {formatBDT(o.dueAmount)}</p>}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold" style={{ color: S.text }}>{o.clientName}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{o.items.length}টি আইটেম · {o.clientPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold" style={{ color: days <= 0 ? "#EF4444" : days === 1 ? "#F59E0B" : S.muted }}>
                      {days <= 0 ? "⚠ আজকেই!" : days === 1 ? "আগামীকাল" : `${days}d`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-md h-full overflow-y-auto p-5 space-y-4"
            style={{ backgroundColor: S.surface }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black" style={{ color: PRINT_COLOR }}>{selected.orderNumber}</span>
                  {selected.isUrgent && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>🔴 Urgent</span>}
                </div>
                <p className="font-bold text-base mt-0.5" style={{ color: S.text }}>{selected.clientName}</p>
                <a href={`tel:${selected.clientPhone}`} className="text-xs flex items-center gap-1" style={{ color: PRINT_COLOR }}>
                  <Phone size={11} /> {selected.clientPhone}
                </a>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}>
                <X size={16} />
              </button>
            </div>

            {/* Status pipeline */}
            <div className="rounded-xl border p-3" style={{ borderColor: S.border }}>
              <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>STATUS PIPELINE</p>
              <div className="flex items-center gap-1 overflow-x-auto">
                {STATUS_FLOW.map((s, idx) => {
                  const currentIdx = STATUS_FLOW.indexOf(selected.status);
                  const meta = STATUS_META[s];
                  const active = s === selected.status;
                  const done = idx < currentIdx;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{
                            backgroundColor: done ? "#0F6E56" : active ? meta.color : "#E5E7EB",
                            color: done || active ? "#fff" : "#9CA3AF",
                          }}>
                          {done ? "✓" : idx + 1}
                        </div>
                        <p className="text-[9px] mt-0.5 text-center" style={{ color: active ? meta.color : S.muted }}>{meta.label.split(" ")[0]}</p>
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className="w-4 h-0.5 mb-3 flex-shrink-0" style={{ backgroundColor: done ? "#0F6E56" : "#E5E7EB" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Design Approval Block */}
            {selected.status === "design_approval" && !selected.designApproved && (
              <div className="rounded-xl border-2 p-4" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
                  <p className="font-bold text-sm" style={{ color: "#92400E" }}>Design Approval প্রয়োজন</p>
                </div>
                <p className="text-xs mb-3" style={{ color: "#B45309" }}>
                  কাস্টমার design approve করলে এই বাটনে ক্লিক করুন। তারপর printing শুরু হবে।
                </p>
                <button
                  onClick={() => handleApproveDesign(selected.id)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: "#F59E0B" }}>
                  ✓ Design Approved করুন
                </button>
              </div>
            )}
            {selected.designApproved && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#ECFDF5" }}>
                <CheckCircle size={14} style={{ color: "#10B981" }} />
                <p className="text-xs font-semibold" style={{ color: "#10B981" }}>Design Approved ✓</p>
              </div>
            )}

            {/* Items */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: S.border }}>
              <div className="px-4 py-2.5 border-b font-bold text-xs" style={{ borderColor: S.border, color: S.text }}>
                আইটেম তালিকা
              </div>
              <div className="divide-y" style={{ borderColor: S.border }}>
                {selected.items.map((item, idx) => (
                  <div key={idx} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold" style={{ color: S.text }}>{item.itemName}</p>
                      <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(item.subtotal)}</p>
                    </div>
                    <p className="text-xs" style={{ color: S.muted }}>
                      {item.quantity} × {item.size && `${item.size} · `}{formatBDT(item.subtotal / Math.max(1, item.quantity))} each
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 flex justify-between font-black text-sm border-t" style={{ borderColor: S.border }}>
                <span>মোট</span>
                <span style={{ color: PRINT_COLOR }}>{formatBDT(selected.totalAmount)}</span>
              </div>
            </div>

            {/* Payment summary */}
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: S.border }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.muted }}>অগ্রিম পেয়েছি</span>
                <span className="font-bold" style={{ color: "#10B981" }}>{formatBDT(selected.advancePaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: S.muted }}>বাকি আছে</span>
                <span className="font-bold" style={{ color: selected.dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                  {formatBDT(selected.dueAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: S.muted }}>
                <span>ডেলিভারি</span>
                <span>{new Date(selected.deliveryDate).toLocaleDateString("bn-BD")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              {selected.dueAmount > 0 && (
                <button onClick={() => setPayModal(true)}
                  className="py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: "#10B981" }}>
                  💰 পেমেন্ট নিন
                </button>
              )}
              {selected.status !== "delivered" && (
                <button
                  disabled={advancing}
                  onClick={() => handleAdvance(selected.id)}
                  className="py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1"
                  style={{ backgroundColor: PRINT_COLOR }}>
                  {advancing ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={14} /> পরের ধাপ</>}
                </button>
              )}
            </div>

            {selected.notes && (
              <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>
                <b>নোট:</b> {selected.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ backgroundColor: S.surface }}>
            <h3 className="font-black text-base" style={{ color: S.text }}>পেমেন্ট — {selected.orderNumber}</h3>
            <p className="text-sm" style={{ color: S.muted }}>বাকি: <b style={{ color: "#EF4444" }}>{formatBDT(selected.dueAmount)}</b></p>
            <input
              type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)}
              placeholder="পরিমাণ লিখুন"
              className="w-full h-11 px-4 rounded-xl border text-sm"
              style={{ borderColor: S.border, color: S.text }}
            />
            <div className="flex gap-2">
              <button onClick={() => setPayModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handlePayment} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#10B981" }}>নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
            style={{ backgroundColor: S.surface }}>
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10"
              style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <div className="flex items-center gap-2">
                <Printer size={18} style={{ color: PRINT_COLOR }} />
                <h2 className="font-black text-base" style={{ color: S.text }}>নতুন প্রিন্ট অর্ডার</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3].map(s => (
                    <div key={s} className="w-6 h-1.5 rounded-full transition-all"
                      style={{ backgroundColor: s <= step ? PRINT_COLOR : "#E5E7EB" }} />
                  ))}
                </div>
                <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1: Client Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>ধাপ ১ — কাস্টমারের তথ্য</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ক্লায়েন্টের নাম *</label>
                      <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}
                        placeholder="নাম লিখুন" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ফোন নম্বর *</label>
                      <input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}
                        placeholder="01XXXXXXXXX" type="tel" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ডেলিভারি তারিখ *</label>
                      <DatePicker
  value={form.deliveryDate}
  onChange={v => setForm(p => ({ ...p, deliveryDate: v }))}
  className="w-full h-11 px-4 rounded-xl border text-sm"
  style={{ borderColor: S.border, color: S.text }}
/>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border"
                    style={{ borderColor: form.isUrgent ? "#EF4444" : S.border, backgroundColor: form.isUrgent ? "#FEE2E2" : "transparent" }}>
                    <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(p => ({ ...p, isUrgent: e.target.checked }))} className="w-4 h-4" />
                    <div>
                      <p className="font-bold text-sm" style={{ color: form.isUrgent ? "#DC2626" : S.text }}>🔴 Urgent অর্ডার</p>
                      <p className="text-xs" style={{ color: S.muted }}>অতিরিক্ত চার্জ প্রযোজ্য হতে পারে</p>
                    </div>
                  </label>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>নোট (ঐচ্ছিক)</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border text-sm resize-none" rows={2}
                      style={{ borderColor: S.border, color: S.text }} placeholder="বিশেষ নির্দেশনা..." />
                  </div>
                </div>
              )}

              {/* Step 2: Items */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>ধাপ ২ — প্রিন্টিং আইটেম</h3>

                  {/* Quick add */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>দ্রুত যোগ করুন:</p>
                    <div className="flex gap-2 flex-wrap">
                      {QUICK_ITEMS.map(qi => (
                        <button key={qi.name} onClick={() => addQuickItem(qi)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1"
                          style={{ borderColor: PRINT_COLOR + "60", color: PRINT_COLOR, backgroundColor: PRINT_LIGHT }}>
                          <Zap size={11} /> {qi.name.split(" ")[0]} {qi.name.split(" ")[1] ?? ""}
                        </button>
                      ))}
                    </div>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-xl border p-4 space-y-3" style={{ borderColor: S.border }}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold" style={{ color: S.muted }}>আইটেম #{idx + 1}</p>
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
                            <X size={12} style={{ color: "#EF4444" }} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="text-xs mb-1 block" style={{ color: S.muted }}>আইটেমের নাম *</label>
                          <input value={item.itemName} onChange={e => updateItem(idx, "itemName", e.target.value)}
                            list={`services-${idx}`}
                            className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}
                            placeholder="Business Card, Flex Banner..." />
                          <datalist id={`services-${idx}`}>
                            {services.map(s => <option key={s.id} value={s.name} />)}
                          </datalist>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: S.muted }}>সাইজ</label>
                          <input value={item.size ?? ""} onChange={e => updateItem(idx, "size", e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}
                            placeholder="A4, 3.5×2 inch..." />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: S.muted }}>পরিমাণ</label>
                          <input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                        </div>
                        <div>
                          <label className="text-xs mb-1 block" style={{ color: S.muted }}>ইউনিট মূল্য (৳)</label>
                          <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                        </div>
                        <div className="flex items-end">
                          <div className="w-full h-10 px-3 rounded-xl flex items-center font-black text-sm"
                            style={{ backgroundColor: PRINT_LIGHT, color: PRINT_COLOR }}>
                            {formatBDT(item.subtotal)}
                          </div>
                        </div>
                        <div className="col-span-2 grid grid-cols-3 gap-2">
                          <select value={item.paperType ?? ""} onChange={e => updateItem(idx, "paperType", e.target.value)}
                            className="h-10 px-2 rounded-xl border text-xs" style={{ borderColor: S.border, color: S.text }}>
                            <option value="">পেপার টাইপ</option>
                            {["Matte", "Glossy", "Normal", "Art Card", "Flex"].map(p => <option key={p}>{p}</option>)}
                          </select>
                          <select value={item.colorMode ?? ""} onChange={e => updateItem(idx, "colorMode", e.target.value)}
                            className="h-10 px-2 rounded-xl border text-xs" style={{ borderColor: S.border, color: S.text }}>
                            <option value="">কালার মোড</option>
                            <option>Full Color</option>
                            <option>Black & White</option>
                          </select>
                          <select value={item.sides ?? ""} onChange={e => updateItem(idx, "sides", e.target.value)}
                            className="h-10 px-2 rounded-xl border text-xs" style={{ borderColor: S.border, color: S.text }}>
                            <option value="">Sides</option>
                            <option>Single Side</option>
                            <option>Double Side</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input value={item.designNote ?? ""} onChange={e => updateItem(idx, "designNote", e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border text-xs" style={{ borderColor: S.border, color: S.text }}
                            placeholder="Design note: attached / will provide / design needed..." />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={addItem}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold"
                    style={{ borderColor: PRINT_COLOR + "60", color: PRINT_COLOR }}>
                    + আইটেম যোগ করুন
                  </button>

                  <div className="rounded-xl p-3 flex justify-between items-center"
                    style={{ backgroundColor: PRINT_LIGHT }}>
                    <p className="font-bold text-sm" style={{ color: PRINT_COLOR }}>মোট মূল্য</p>
                    <p className="font-black text-lg" style={{ color: PRINT_COLOR }}>{formatBDT(total)}</p>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>ধাপ ৩ — পেমেন্ট ও নিশ্চিতকরণ</h3>
                  <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: S.border }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: S.muted }}>মোট মূল্য</span>
                      <span className="font-black" style={{ color: S.text }}>{formatBDT(total)}</span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>অগ্রিম (৳) — ন্যূনতম {Math.round(total * 0.5)} (৫০%)</label>
                      <input type="number" value={form.advancePaid} onChange={e => setForm(p => ({ ...p, advancePaid: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}
                        placeholder="অগ্রিম পরিমাণ" />
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: S.border }}>
                      <span style={{ color: S.muted }}>বাকি থাকবে</span>
                      <span className="font-bold" style={{ color: "#EF4444" }}>
                        {formatBDT(Math.max(0, total - Number(form.advancePaid ?? 0)))}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: "#F0FDF4" }}>
                    <p className="text-xs font-bold" style={{ color: "#166534" }}>অর্ডার সারসংক্ষেপ</p>
                    <p className="text-xs" style={{ color: "#166534" }}>{form.clientName} · {form.clientPhone}</p>
                    <p className="text-xs" style={{ color: "#166534" }}>{items.length}টি আইটেম · ডেলিভারি: {new Date(form.deliveryDate).toLocaleDateString("bn-BD")}</p>
                    {form.isUrgent && <p className="text-xs font-bold" style={{ color: "#EF4444" }}>🔴 Urgent অর্ডার</p>}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex gap-2 pt-2">
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex-1 py-3 rounded-xl border font-semibold text-sm"
                    style={{ borderColor: S.border, color: S.text }}>
                    ← আগে
                  </button>
                )}
                {step < 3 ? (
                  <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 && (!form.clientName || !form.clientPhone || !form.deliveryDate)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: PRINT_COLOR }}>
                    পরবর্তী <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={saving}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: PRINT_COLOR }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "✓ অর্ডার নিন"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
