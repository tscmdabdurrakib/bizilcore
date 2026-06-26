"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, Loader2, X, ChevronRight, Filter } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import { PageShell, Card, Tabs, Badge, Button, EmptyState } from "@/components/ui";

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
const PAYMENT_LABELS: Record<string, string> = {
  cod: "COD",
  bkash: "bKash",
  nagad: "Nagad",
};

const STATUS_TABS = [
  { key: "all", label: "সব" },
  ...STATUS_STEPS.map(s => ({ key: s, label: STATUS_LABELS[s] })),
  { key: "cancelled", label: STATUS_LABELS.cancelled },
];

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

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
      </div>
    );
  }

  return (
    <PageShell
      title="স্টোর অর্ডার"
      subtitle={`${orders.length}টি অর্ডার`}
      className="max-w-4xl"
      actions={
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          icon={Filter}
          onClick={() => setShowFilters(f => !f)}
        >
          ফিল্টার
        </Button>
      }
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card padding="none" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 card-premium" style={{ borderColor: "var(--c-border)" }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>অর্ডার #{selected.orderNumber}</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{formatDate(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                <X size={16} style={{ color: "var(--c-text-muted)" }} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>কাস্টমার</p>
                <p className="font-medium text-sm" style={{ color: "var(--c-text)" }}>{selected.customerName}</p>
                <p className="text-xs" style={{ color: "var(--c-text-sub)" }}>{selected.customerPhone}</p>
                <p className="text-xs" style={{ color: "var(--c-text-sub)" }}>{selected.customerAddress}{selected.customerDistrict ? `, ${selected.customerDistrict}` : ""}</p>
                {selected.customerNote && <p className="text-xs mt-1 italic" style={{ color: "var(--c-text-muted)" }}>নোট: {selected.customerNote}</p>}
              </div>

              <div>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>পণ্যসমূহ</p>
                {selected.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--c-border)" }}>
                    <div>
                      <p className="text-sm" style={{ color: "var(--c-text)" }}>{item.productName}{item.variantName ? ` (${item.variantName})` : ""}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>৳{item.unitPrice} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>৳{item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-xs" style={{ color: "var(--c-text-sub)" }}>
                    <span>সাবটোটাল</span><span>৳{selected.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--c-text-sub)" }}>
                    <span>ডেলিভারি</span><span>৳{selected.shippingFee}</span>
                  </div>
                  {selected.discountAmount > 0 && (
                    <div className="flex justify-between text-xs" style={{ color: "#1D9E75" }}>
                      <span>ডিসকাউন্ট {selected.couponCode ? `(${selected.couponCode})` : ""}</span>
                      <span>-৳{selected.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ color: "var(--c-text)", borderColor: "var(--c-border)" }}>
                    <span>মোট</span><span>৳{selected.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge status={selected.status}>{STATUS_LABELS[selected.status]}</Badge>
                <Badge variant="info">{PAYMENT_LABELS[selected.paymentMethod] ?? selected.paymentMethod}</Badge>
              </div>

              {(STATUS_TRANSITIONS[selected.status]?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>স্ট্যাটাস পরিবর্তন</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_TRANSITIONS[selected.status].filter(s => s !== "cancelled").map(s => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={updating}
                      >
                        → {STATUS_LABELS[s]}
                      </Button>
                    ))}
                    {STATUS_TRANSITIONS[selected.status].includes("cancelled") && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => updateStatus(selected.id, "cancelled")}
                        disabled={updating}
                      >
                        বাতিল করুন
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {showFilters && (
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--c-text-muted)" }}>পেমেন্ট পদ্ধতি</label>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                className="w-full text-xs rounded-lg border px-2 h-8"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                <option value="all">সব</option>
                <option value="cod">COD</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--c-text-muted)" }}>তারিখ থেকে</label>
              <DatePicker
                value={dateFrom}
                onChange={v => setDateFrom(v)}
                className="w-full text-xs rounded-lg border px-2 h-8"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--c-text-muted)" }}>তারিখ পর্যন্ত</label>
              <DatePicker
                value={dateTo}
                onChange={v => setDateTo(v)}
                className="w-full text-xs rounded-lg border px-2 h-8"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setFilterPayment("all"); setDateFrom(""); setDateTo(""); }}
              >
                রিসেট
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs tabs={STATUS_TABS} active={filterStatus} onChange={setFilterStatus} />

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="কোনো অর্ডার নেই" />
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <Card key={order.id} padding="md" onClick={() => setSelected(order)} className="hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>#{order.orderNumber}</p>
                    <Badge status={order.status}>{STATUS_LABELS[order.status]}</Badge>
                    <Badge variant="info">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</Badge>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--c-text-sub)" }}>{order.customerName} · {order.customerPhone}</p>
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{order.items.length}টি পণ্য · {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>৳{order.totalAmount.toLocaleString()}</p>
                  <ChevronRight size={16} style={{ color: "var(--c-text-muted)" }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
