"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import OrdersTable from "@/components/fb-orders/OrdersTable";
import NewOrderToast from "@/components/fb-orders/NewOrderToast";

interface Order {
  id: string;
  commenterName: string;
  commentText: string;
  pageName?: string | null;
  status: string;
  createdAt: string;
}

const TABS = [
  { key: "all",       label: "সব" },
  { key: "pending",   label: "অপেক্ষায়" },
  { key: "confirmed", label: "কনফার্ম" },
  { key: "delivered", label: "ডেলিভারি" },
  { key: "cancelled", label: "বাতিল" },
];

export default function CommentOrdersPanel() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("all");
  const toastTriggerRef       = useRef<((name: string) => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fb-orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const es = new EventSource("/api/sse/facebook");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "NEW_ORDER") {
          setOrders((prev) => [data.order, ...prev]);
          toastTriggerRef.current?.(data.order.commenterName);
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch("/api/fb-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const updated = await res.json();
    if (updated?.id) {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
    }
  };

  const handleNewOrder = useCallback((fn: (name: string) => void) => {
    toastTriggerRef.current = fn;
  }, []);

  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  const stats = {
    total:     orders.length,
    pending:   orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const statCards = [
    { label: "মোট অর্ডার",  value: stats.total,     gradient: "linear-gradient(135deg, #1877F2 0%, #0B5FD9 100%)" },
    { label: "অপেক্ষায়",   value: stats.pending,   gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" },
    { label: "কনফার্ম",     value: stats.confirmed, gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)" },
    { label: "বাতিল",       value: stats.cancelled, gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" },
  ];

  return (
    <div className="space-y-5">
      <NewOrderToast onNew={handleNewOrder} />

      <div className="flex items-center justify-end">
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)", color: "#fff" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          রিফ্রেশ
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-4 text-white relative overflow-hidden shadow-sm"
            style={{ background: c.gradient }}
          >
            <p className="text-xs font-medium mb-1 opacity-90">{c.label}</p>
            <span className="text-3xl font-bold">{c.value}</span>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 bg-white" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              backgroundColor: tab === t.key ? "#0F6E56" : "var(--c-surface)",
              color:           tab === t.key ? "#fff"    : "var(--c-text-sub)",
              borderColor:     tab === t.key ? "#0F6E56" : "var(--c-border)",
            }}
          >
            {t.label}
            {t.key !== "all" && (
              <span className="ml-1 opacity-70">
                ({orders.filter((o) => o.status === t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
        >
          <div className="animate-spin w-6 h-6 rounded-full border-2 mx-auto" style={{ borderColor: "#0F6E56", borderTopColor: "transparent" }} />
          <p className="text-sm mt-3" style={{ color: "var(--c-text-muted)" }}>লোড হচ্ছে…</p>
        </div>
      ) : (
        <OrdersTable orders={filtered} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
