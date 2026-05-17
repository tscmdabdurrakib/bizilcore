"use client";

import { useEffect, useState, useCallback } from "react";
import { Droplets, Plus, Search, RefreshCw, X, ChevronRight,
         CheckCircle, Clock, Truck, Package, Phone, Hash,
         AlertCircle, Loader2, CreditCard } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface LItem { id: string; itemName: string; quantity: number; unitPrice: number; subtotal: number; condition?: string; tag?: string; serviceId?: string; }
interface LPayment { id: string; amount: number; method: string; paidAt: string; }
interface LOrder {
  id: string; orderNumber: string; clientName: string; clientPhone: string;
  clientAddress?: string; orderType: string; isExpress: boolean;
  pickupDate?: string; deliveryDate: string; totalAmount: number;
  advancePaid: number; dueAmount: number; status: string; notes?: string;
  createdAt: string; items: LItem[]; payments: LPayment[];
}
interface LService { id: string; name: string; category: string; itemType: string; price: number; expressPrice?: number; isActive: boolean; }

const STATUS = {
  received:          { label: "Received",           color: "#6B7280", bg: "#F3F4F6" },
  in_process:        { label: "In Process",         color: "#F59E0B", bg: "#FFFBEB" },
  ready:             { label: "Ready ✓",            color: "#10B981", bg: "#ECFDF5" },
  out_for_delivery:  { label: "Out for Delivery",   color: "#3B82F6", bg: "#EFF6FF" },
  delivered:         { label: "Delivered",          color: "#6B7280", bg: "#F3F4F6" },
  cancelled:         { label: "Cancelled",          color: "#EF4444", bg: "#FEF2F2" },
};

const STATUS_NEXT: Record<string, string> = {
  received: "in_process", in_process: "ready", ready: "out_for_delivery",
  out_for_delivery: "delivered",
};
const STATUS_NEXT_LABEL: Record<string, string> = {
  received: "Processing শুরু করুন", in_process: "Ready হয়েছে",
  ready: "Out for Delivery", out_for_delivery: "Delivered করুন",
};

const TABS = [
  { key: "", label: "সব" },
  { key: "received", label: "Received" },
  { key: "in_process", label: "In Process" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Delivery" },
  { key: "delivered", label: "Delivered" },
];

const QUICK_ITEMS = ["Shirt", "Pant", "Saree", "Salwar Kameez", "Suit", "Jacket", "Blanket", "Curtain"];
const CATEGORIES = [
  { value: "wash_iron", label: "Wash & Iron" },
  { value: "dry_clean", label: "Dry Clean" },
  { value: "wash_only", label: "Wash Only" },
  { value: "iron_only", label: "Iron Only" },
  { value: "special", label: "Special" },
];

const C = "#0284C7";
const CL = "#E0F2FE";

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)",
};

function Badge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS] ?? { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  );
}

export default function LaundryOrders() {
  const [orders, setOrders] = useState<LOrder[]>([]);
  const [services, setServices] = useState<LService[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LOrder | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [payModal, setPayModal] = useState<LOrder | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");

  // New order form state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    clientName: "", clientPhone: "", clientAddress: "",
    orderType: "drop_in", isExpress: false,
    pickupDate: "", deliveryDate: getDefaultDelivery(false),
    totalAmount: 0, advancePaid: 0, notes: "", paymentMethod: "cash",
  });
  const [newItems, setNewItems] = useState<Omit<LItem,"id"|"subtotal">[]>([
    { itemName: "", quantity: 1, unitPrice: 0, condition: "", tag: "", serviceId: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function getDefaultDelivery(express: boolean) {
    const d = new Date();
    d.setDate(d.getDate() + (express ? 1 : 2));
    return d.toISOString().split("T")[0];
  }

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab) params.set("status", tab);
    if (search.trim()) params.set("search", search.trim());
    const d = await fetch(`/api/laundry/orders?${params}`).then(r => r.json()).catch(() => []);
    setOrders(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [tab, search]);

  const loadServices = useCallback(async () => {
    const d = await fetch("/api/laundry/services").then(r => r.json()).catch(() => []);
    setServices(Array.isArray(d) ? d : []);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadServices(); }, [loadServices]);

  // Check if URL has ?new=1
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      setShowNew(true);
      window.history.replaceState({}, "", "/orders");
    }
  }, []);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(true);
    const r = await fetch(`/api/laundry/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(false);
    if (r.ok) {
      showToast("success", "Status আপডেট হয়েছে ✓");
      loadOrders();
      if (selected?.id === orderId) {
        const updated = await r.json();
        setSelected(updated);
      }
    } else {
      showToast("error", "আপডেট ব্যর্থ হয়েছে।");
    }
  }

  async function submitPayment() {
    if (!payModal || !payAmount || isNaN(Number(payAmount))) return;
    setUpdating(true);
    const r = await fetch(`/api/laundry/orders/${payModal.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment: { amount: Number(payAmount), method: payMethod } }),
    });
    setUpdating(false);
    if (r.ok) {
      showToast("success", "পেমেন্ট রেকর্ড হয়েছে ✓");
      setPayModal(null); setPayAmount(""); setPayMethod("cash");
      loadOrders();
    } else {
      showToast("error", "পেমেন্ট ব্যর্থ হয়েছে।");
    }
  }

  function calcTotal() {
    return newItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);
  }

  async function submitOrder() {
    setSubmitting(true);
    const total = calcTotal();
    const r = await fetch("/api/laundry/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, totalAmount: total, items: newItems,
        deliveryDate: form.deliveryDate || getDefaultDelivery(form.isExpress),
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      showToast("success", "অর্ডার নেওয়া হয়েছে ✓");
      setShowNew(false); setStep(1);
      setForm({ clientName: "", clientPhone: "", clientAddress: "", orderType: "drop_in",
        isExpress: false, pickupDate: "", deliveryDate: getDefaultDelivery(false),
        totalAmount: 0, advancePaid: 0, notes: "", paymentMethod: "cash" });
      setNewItems([{ itemName: "", quantity: 1, unitPrice: 0, condition: "", tag: "", serviceId: "" }]);
      loadOrders();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "ব্যর্থ হয়েছে।");
    }
  }

  function addItem(name?: string) {
    const svc = name ? services.find(s => s.name.toLowerCase().includes(name.toLowerCase())) : undefined;
    setNewItems(p => [...p, {
      itemName: name ?? "", quantity: 1,
      unitPrice: svc ? (form.isExpress && svc.expressPrice ? svc.expressPrice : svc.price) : 0,
      condition: "", tag: "",
      serviceId: svc?.id ?? "",
    }]);
  }

  function removeItem(i: number) {
    setNewItems(p => p.filter((_, j) => j !== i));
  }

  function updateItem(i: number, field: string, val: string | number) {
    setNewItems(p => p.map((it, j) => {
      if (j !== i) return it;
      const updated = { ...it, [field]: val };
      if (field === "serviceId") {
        const svc = services.find(s => s.id === val);
        if (svc) updated.unitPrice = form.isExpress && svc.expressPrice ? svc.expressPrice : svc.price;
      }
      return updated;
    }));
  }

  const total = calcTotal();
  const advance = Number(form.advancePaid ?? 0);
  const due = Math.max(0, total - advance);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C}, #0369A1)` }}>
            <Droplets size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>লন্ড্রি অর্ডার</h1>
            <p className="text-xs" style={{ color: S.muted }}>{orders.length}টি অর্ডার</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadOrders} className="w-10 h-10 rounded-xl border flex items-center justify-center"
            style={{ borderColor: S.border, backgroundColor: S.surface }}>
            <RefreshCw size={15} style={{ color: S.muted }} />
          </button>
          <button onClick={() => { setShowNew(true); setStep(1); }}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: C }}>
            <Plus size={16} /> নতুন অর্ডার
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম, ফোন বা অর্ডার নম্বর দিয়ে খুঁজুন…"
          className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={tab === t.key
              ? { backgroundColor: C, color: "#fff" }
              : { backgroundColor: S.surface, color: S.muted, border: `1px solid ${S.border}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: CL }}>
              <Droplets size={24} style={{ color: C }} />
            </div>
            <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো অর্ডার নেই</p>
            <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-semibold" style={{ color: C }}>
              + নতুন অর্ডার নিন
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: S.border }}>
            {orders.map(o => (
              <div key={o.id}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => setSelected(o)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: CL, color: C }}>{o.orderNumber}</span>
                    {o.isExpress && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>⚡ Express</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{o.clientName}</p>
                  <p className="text-xs" style={{ color: S.muted }}>
                    📞 {o.clientPhone} • {o.items?.length ?? 0}টি আইটেম •
                    ডেলিভারি: {new Date(o.deliveryDate).toLocaleDateString("bn-BD")}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    {o.dueAmount > 0 && (
                      <p className="text-xs font-bold" style={{ color: "#EF4444" }}>বাকি {formatBDT(o.dueAmount)}</p>
                    )}
                    <p className="text-xs font-medium" style={{ color: S.muted }}>{formatBDT(o.totalAmount)}</p>
                  </div>
                  <Badge status={o.status} />
                  <ChevronRight size={14} style={{ color: S.muted }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
              style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <div>
                <p className="text-xs font-bold" style={{ color: C }}>{selected.orderNumber}</p>
                <h3 className="font-bold text-lg" style={{ color: S.text }}>{selected.clientName}</h3>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "ফোন", value: selected.clientPhone, icon: Phone },
                  { label: "টাইপ", value: selected.orderType === "pickup_delivery" ? "Pickup & Delivery" : "Drop-in", icon: Package },
                  { label: "ডেলিভারি", value: new Date(selected.deliveryDate).toLocaleDateString("bn-BD"), icon: Clock },
                  { label: "Express", value: selected.isExpress ? "হ্যাঁ ⚡" : "না", icon: AlertCircle },
                ].map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                      <Icon size={14} style={{ color: C, flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p className="text-xs" style={{ color: S.muted }}>{f.label}</p>
                        <p className="text-sm font-semibold" style={{ color: S.text }}>{f.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: S.text }}>আইটেম তালিকা</h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: S.border }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: S.bg }}>
                        <th className="text-left px-3 py-2 font-semibold" style={{ color: S.muted }}>আইটেম</th>
                        <th className="text-center px-3 py-2 font-semibold" style={{ color: S.muted }}>Tag</th>
                        <th className="text-right px-3 py-2 font-semibold" style={{ color: S.muted }}>মূল্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: S.border }}>
                      {(selected.items ?? []).map((item, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">
                            <p className="font-semibold" style={{ color: S.text }}>{item.itemName} ×{item.quantity}</p>
                            {item.condition && <p style={{ color: S.muted }}>{item.condition}</p>}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.tag ? (
                              <span className="font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: CL, color: C }}>
                                <Hash size={10} className="inline" />{item.tag}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold" style={{ color: S.text }}>
                            {formatBDT(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: CL }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#0369A1" }}>মোট</span>
                  <span className="font-bold" style={{ color: "#0369A1" }}>{formatBDT(selected.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#0369A1" }}>পরিশোধ</span>
                  <span style={{ color: "#0369A1" }}>{formatBDT(selected.advancePaid)}</span>
                </div>
                {selected.dueAmount > 0 && (
                  <div className="flex justify-between text-sm font-bold border-t pt-1" style={{ borderColor: "#BAE6FD" }}>
                    <span style={{ color: "#EF4444" }}>বাকি</span>
                    <span style={{ color: "#EF4444" }}>{formatBDT(selected.dueAmount)}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selected.notes && (
                <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: S.bg, color: S.muted }}>
                  📝 {selected.notes}
                </p>
              )}

              {/* Status actions */}
              {STATUS_NEXT[selected.status] && (
                <button onClick={() => updateStatus(selected.id, STATUS_NEXT[selected.status])}
                  disabled={updating}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: C }}>
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {STATUS_NEXT_LABEL[selected.status]}
                </button>
              )}

              {/* Collect payment */}
              {selected.dueAmount > 0 && (
                <button onClick={() => { setPayModal(selected); setPayAmount(String(selected.dueAmount)); }}
                  className="w-full py-3 rounded-xl font-bold text-sm border flex items-center justify-center gap-2"
                  style={{ borderColor: "#10B981", color: "#10B981", backgroundColor: "#ECFDF5" }}>
                  <CreditCard size={15} /> পেমেন্ট নিন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-lg" style={{ color: S.text }}>পেমেন্ট নিন</h3>
              <button onClick={() => setPayModal(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>পরিমাণ (৳)</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border text-sm outline-none font-bold"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>পদ্ধতি</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}>
                  {["cash", "bkash", "nagad", "card"].map(m => (
                    <option key={m} value={m}>{m === "cash" ? "ক্যাশ" : m === "bkash" ? "bKash" : m === "nagad" ? "Nagad" : "Card"}</option>
                  ))}
                </select>
              </div>
              <button onClick={submitPayment} disabled={updating}
                className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#10B981" }}>
                {updating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ backgroundColor: S.surface }}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
              style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color: S.text }}>নতুন অর্ডার</h3>
                <div className="flex gap-1 mt-1">
                  {[1,2,3].map(s => (
                    <div key={s} className="h-1 w-8 rounded-full transition-all"
                      style={{ backgroundColor: step >= s ? C : S.border }} />
                  ))}
                </div>
              </div>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1: Client info */}
              {step === 1 && (
                <>
                  <h4 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ১ — কাস্টমারের তথ্য</h4>
                  {[
                    { label: "নাম *", field: "clientName", type: "text", placeholder: "কাস্টমারের নাম" },
                    { label: "ফোন *", field: "clientPhone", type: "tel", placeholder: "01XXXXXXXXX" },
                    { label: "ঠিকানা", field: "clientAddress", type: "text", placeholder: "বাড়ি/রাস্তা" },
                  ].map(f => (
                    <div key={f.field}>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>{f.label}</label>
                      <input type={f.type} value={(form as any)[f.field]} placeholder={f.placeholder}
                        onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>অর্ডার টাইপ</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: "drop_in", l: "Drop-in (কাপড় দিয়ে গেছেন)" }, { v: "pickup_delivery", l: "Pickup & Delivery" }].map(o => (
                        <button key={o.v} onClick={() => setForm(p => ({ ...p, orderType: o.v }))}
                          className="p-3 rounded-xl border-2 text-xs font-semibold text-left transition-all"
                          style={{ borderColor: form.orderType === o.v ? C : S.border,
                                   backgroundColor: form.orderType === o.v ? CL : S.surface,
                                   color: form.orderType === o.v ? C : S.text }}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.orderType === "pickup_delivery" && (
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>Pickup তারিখ</label>
                      <DatePicker
  value={form.pickupDate}
  onChange={v => setForm(p => ({ ...p, pickupDate: v }))}
  className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
  min={new Date().toISOString().split("T")[0]}
/>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                    style={{ borderColor: form.isExpress ? "#F59E0B" : S.border,
                             backgroundColor: form.isExpress ? "#FFFBEB" : S.surface }}>
                    <input type="checkbox" checked={form.isExpress}
                      onChange={e => setForm(p => ({
                        ...p, isExpress: e.target.checked,
                        deliveryDate: getDefaultDelivery(e.target.checked),
                      }))}
                      className="w-4 h-4 accent-amber-500" />
                    <div>
                      <p className="text-sm font-bold" style={{ color: form.isExpress ? "#92400E" : S.text }}>
                        ⚡ জরুরি সার্ভিস (Express)
                      </p>
                      <p className="text-xs" style={{ color: S.muted }}>অতিরিক্ত চার্জ প্রযোজ্য</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>ডেলিভারির তারিখ</label>
                    <DatePicker
  value={form.deliveryDate}
  onChange={v => setForm(p => ({ ...p, deliveryDate: v }))}
  className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
  min={new Date().toISOString().split("T")[0]}
/>
                  </div>

                  <button onClick={() => setStep(2)}
                    disabled={!form.clientName.trim() || !form.clientPhone.trim()}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ backgroundColor: C }}>
                    পরবর্তী — কাপড়ের তালিকা <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* Step 2: Items */}
              {step === 2 && (
                <>
                  <h4 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ২ — কাপড়ের তালিকা</h4>

                  {/* Quick add chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ITEMS.map(q => (
                      <button key={q} onClick={() => addItem(q)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: C, color: C, backgroundColor: CL }}>
                        + {q}
                      </button>
                    ))}
                  </div>

                  {/* Item rows */}
                  <div className="space-y-3">
                    {newItems.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl border space-y-2" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold" style={{ color: S.muted }}>আইটেম {i + 1}</p>
                          {newItems.length > 1 && (
                            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                              <X size={13} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <input placeholder="কাপড়ের নাম" value={item.itemName}
                              onChange={e => updateItem(i, "itemName", e.target.value)}
                              className="w-full h-9 px-3 rounded-lg border text-sm outline-none"
                              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                          </div>
                          <select value={item.serviceId ?? ""}
                            onChange={e => updateItem(i, "serviceId", e.target.value)}
                            className="h-9 px-2 rounded-lg border text-xs outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}>
                            <option value="">-- Service --</option>
                            {services.filter(s => s.isActive).map(s => (
                              <option key={s.id} value={s.id}>{s.name} (৳{s.price})</option>
                            ))}
                          </select>
                          <input type="number" placeholder="মূল্য" value={item.unitPrice || ""}
                            onChange={e => updateItem(i, "unitPrice", Number(e.target.value))}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                          <input type="number" placeholder="পরিমাণ" value={item.quantity}
                            min={1} onChange={e => updateItem(i, "quantity", Number(e.target.value))}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                          <input placeholder="Tag নং" value={item.tag ?? ""}
                            onChange={e => updateItem(i, "tag", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                          <input placeholder="অবস্থা (দাগ ইত্যাদি)" value={item.condition ?? ""}
                            onChange={e => updateItem(i, "condition", e.target.value)}
                            className="h-9 px-3 rounded-lg border text-sm outline-none col-span-2"
                            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                        </div>
                        <p className="text-xs text-right font-semibold" style={{ color: C }}>
                          উপমোট: {formatBDT(Number(item.quantity) * Number(item.unitPrice))}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => addItem()}
                    className="w-full py-2.5 rounded-xl border border-dashed text-sm font-semibold"
                    style={{ borderColor: C, color: C }}>
                    + আরো আইটেম যোগ করুন
                  </button>

                  <div className="flex items-center justify-between p-3 rounded-xl font-bold"
                    style={{ backgroundColor: CL, color: C }}>
                    <span>মোট মূল্য</span>
                    <span>{formatBDT(total)}</span>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border font-semibold text-sm"
                      style={{ borderColor: S.border, color: S.text }}>পেছনে</button>
                    <button onClick={() => setStep(3)} disabled={newItems.every(i => !i.itemName.trim())}
                      className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
                      style={{ backgroundColor: C }}>
                      পরবর্তী — পেমেন্ট
                    </button>
                  </div>
                </>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <>
                  <h4 className="text-sm font-bold" style={{ color: S.text }}>ধাপ ৩ — পেমেন্ট</h4>

                  <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: CL }}>
                    <div className="flex justify-between text-sm font-bold" style={{ color: C }}>
                      <span>মোট মূল্য</span><span>{formatBDT(total)}</span>
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: "#0369A1" }}>
                      <span>আইটেম</span><span>{newItems.filter(i => i.itemName.trim()).length}টি</span>
                    </div>
                    {form.isExpress && <p className="text-xs font-bold" style={{ color: "#92400E" }}>⚡ Express charge included</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>অগ্রিম পেমেন্ট (৳)</label>
                    <input type="number" value={form.advancePaid || ""} min={0} max={total}
                      onChange={e => setForm(p => ({ ...p, advancePaid: Number(e.target.value) }))}
                      className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                    <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}>
                      {["cash", "bkash", "nagad", "card"].map(m => (
                        <option key={m} value={m}>{m === "cash" ? "ক্যাশ" : m === "bkash" ? "bKash" : m === "nagad" ? "Nagad" : "Card"}</option>
                      ))}
                    </select>
                  </div>

                  {due > 0 && (
                    <div className="p-3 rounded-xl flex items-center gap-2"
                      style={{ backgroundColor: "#FEF2F2", borderLeft: "3px solid #EF4444" }}>
                      <AlertCircle size={14} style={{ color: "#EF4444" }} />
                      <p className="text-sm font-bold" style={{ color: "#EF4444" }}>বাকি থাকবে: {formatBDT(due)}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>নোট (ঐচ্ছিক)</label>
                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                      rows={2} placeholder="বিশেষ নির্দেশনা..."
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                      style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border font-semibold text-sm"
                      style={{ borderColor: S.border, color: S.text }}>পেছনে</button>
                    <button onClick={submitOrder} disabled={submitting}
                      className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: C }}>
                      {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                      অর্ডার নিন
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
