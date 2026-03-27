"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Loader2, X, ChevronRight, Filter } from "lucide-react";

interface StoreOrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerDistrict: string | null;
  customerNote: string | null;
  items: StoreOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  couponCode: string | null;
  createdAt: string;
}

const STATUS_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:   ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed:    ["shipped", "cancelled"],
  shipped:   ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
const STATUS_LABELS: Record<string, string> = {
  pending: "অপেক্ষমান",
  confirmed: "নিশ্চিত",
  packed: "প্যাক",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি",
  cancelled: "বাতিল",
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "var(--status-pending-bg)",   text: "var(--status-pending-text)"   },
  confirmed: { bg: "var(--status-confirmed-bg)", text: "var(--status-confirmed-text)" },
  packed:    { bg: "#EEF2FF",                    text: "#4338CA"                      },
  shipped:   { bg: "var(--status-shipped-bg)",   text: "var(--status-shipped-text)"   },
  delivered: { bg: "var(--status-delivered-bg)", text: "var(--status-delivered-text)" },
  cancelled: { bg: "var(--status-returned-bg)",  text: "var(--status-returned-text)"  },
};
const PAYMENT_LABELS: Record<string, string> = {
  cod: "COD",
  bkash: "bKash",
  nagad: "Nagad",
};

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoreOrder | null>(null);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterPayment !== "all") params.set("paymentMethod", filterPayment);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    fetch(`/api/store/orders?${params}`)
      .then(r => r.json())
      .then(d => {
        setOrders(Array.isArray(d) ? d : d.orders ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterStatus, filterPayment, dateFrom, dateTo]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    const r = await fetch(`/api/store/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    if (r.ok) {
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
      setSelected(s => s?.id === id ? { ...s, status } : s);
      showToast("success", "স্ট্যাটাস আপডেট হয়েছে ✓");
    } else {
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  const filtered = orders;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: S.text }}>অর্ডার #{selected.orderNumber}</p>
                <p className="text-xs" style={{ color: S.muted }}>{formatDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                <X size={16} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>কাস্টমার</p>
                <p className="font-medium text-sm" style={{ color: S.text }}>{selected.customerName}</p>
                <p className="text-xs" style={{ color: S.secondary }}>{selected.customerPhone}</p>
                <p className="text-xs" style={{ color: S.secondary }}>{selected.customerAddress}{selected.customerDistrict ? `, ${selected.customerDistrict}` : ""}</p>
                {selected.customerNote && <p className="text-xs mt-1 italic" style={{ color: S.muted }}>নোট: {selected.customerNote}</p>}
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>পণ্যসমূহ</p>
                {selected.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: S.border }}>
                    <div>
                      <p className="text-sm" style={{ color: S.text }}>{item.productName}{item.variantName ? ` (${item.variantName})` : ""}</p>
                      <p className="text-xs" style={{ color: S.muted }}>৳{item.unitPrice} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: S.text }}>৳{item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-xs" style={{ color: S.secondary }}>
                    <span>সাবটোটাল</span><span>৳{selected.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: S.secondary }}>
                    <span>ডেলিভারি</span><span>৳{selected.shippingFee}</span>
                  </div>
                  {selected.discountAmount > 0 && (
                    <div className="flex justify-between text-xs" style={{ color: "#1D9E75" }}>
                      <span>ডিসকাউন্ট {selected.couponCode ? `(${selected.couponCode})` : ""}</span>
                      <span>-৳{selected.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ color: S.text, borderColor: S.border }}>
                    <span>মোট</span><span>৳{selected.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: STATUS_COLORS[selected.status]?.bg, color: STATUS_COLORS[selected.status]?.text }}>
                  {STATUS_LABELS[selected.status]}
                </span>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>
                  {PAYMENT_LABELS[selected.paymentMethod] ?? selected.paymentMethod}
                </span>
              </div>

              {(STATUS_TRANSITIONS[selected.status]?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>স্ট্যাটাস পরিবর্তন</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_TRANSITIONS[selected.status].filter(s => s !== "cancelled").map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={updating}
                        className="px-3 py-1.5 rounded-xl border text-xs font-medium disabled:opacity-50"
                        style={{ borderColor: S.border, color: S.text }}>
                        → {STATUS_LABELS[s]}
                      </button>
                    ))}
                    {STATUS_TRANSITIONS[selected.status].includes("cancelled") && (
                      <button
                        onClick={() => updateStatus(selected.id, "cancelled")}
                        disabled={updating}
                        className="px-3 py-1.5 rounded-xl border text-xs font-medium disabled:opacity-50"
                        style={{ borderColor: "#FECACA", color: "#EF4444" }}>
                        বাতিল করুন
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
            <ShoppingBag size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>স্টোর অর্ডার</h1>
            <p className="text-xs" style={{ color: S.muted }}>{orders.length}টি অর্ডার</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-xl border text-xs font-medium"
          style={{ borderColor: showFilters ? S.primary : S.border, color: showFilters ? S.primary : S.secondary, backgroundColor: S.surface }}>
          <Filter size={12} />
          ফিল্টার
        </button>
      </div>

      {showFilters && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                className="w-full text-xs rounded-lg border px-2 h-8"
                style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}>
                <option value="all">সব</option>
                <option value="cod">COD</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>তারিখ থেকে</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full text-xs rounded-lg border px-2 h-8"
                style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>তারিখ পর্যন্ত</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full text-xs rounded-lg border px-2 h-8"
                style={{ borderColor: S.border, backgroundColor: "var(--c-bg)", color: S.text }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterPayment("all"); setDateFrom(""); setDateTo(""); }}
                className="w-full h-8 text-xs rounded-lg border"
                style={{ borderColor: S.border, color: S.muted }}>
                রিসেট
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...STATUS_STEPS, "cancelled"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="flex-shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filterStatus === s ? S.primary : "var(--c-surface-raised)",
              color: filterStatus === s ? "#fff" : S.secondary,
            }}>
            {s === "all" ? "সব" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <ShoppingBag size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">কোনো অর্ডার নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <button
              key={order.id}
              onClick={() => setSelected(order)}
              className="w-full rounded-2xl border p-4 text-left hover:shadow-sm transition-shadow"
              style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold" style={{ color: S.text }}>#{order.orderNumber}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: STATUS_COLORS[order.status]?.bg, color: STATUS_COLORS[order.status]?.text }}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#EEF2FF", color: "#4338CA" }}>
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: S.secondary }}>{order.customerName} · {order.customerPhone}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{order.items.length}টি পণ্য · {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: S.text }}>৳{order.totalAmount.toLocaleString()}</p>
                  <ChevronRight size={16} style={{ color: S.muted }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
