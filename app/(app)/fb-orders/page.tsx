"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, RefreshCw, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
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

export default function FbOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("all");
  const toastTriggerRef         = useRef<((name: string) => void) | null>(null);

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
    { label: "মোট অর্ডার",   value: stats.total,     color: "#1877F2", bg: "#EEF3FD"  },
    { label: "অপেক্ষায়",    value: stats.pending,   color: "#EF9F27", bg: "#FFF3DC"  },
    { label: "কনফার্ম",      value: stats.confirmed, color: "#2B7CE9", bg: "#E1F0FF"  },
    { label: "বাতিল",        value: stats.cancelled, color: "#E24B4A", bg: "#FFE8E8"  },
  ];

  return (
    <div className="space-y-5">
      <NewOrderToast onNew={handleNewOrder} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EEF3FD" }}>
            <MessageSquare size={18} style={{ color: "#1877F2" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--c-text)" }}>Facebook কমেন্ট অর্ডার</h1>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              Facebook পোস্টের কমেন্ট থেকে আসা অর্ডারগুলো এখানে দেখুন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/fb-connect"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
          >
            <LinkIcon size={13} />
            পেজ কানেক্ট করুন
          </Link>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
            style={{ backgroundColor: "#0F6E56", color: "#fff" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>{c.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</span>
              <span className="text-xs mb-0.5 font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.color }}>
                টি
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              backgroundColor: tab === t.key ? "#0F6E56" : "var(--c-surface)",
              color: tab === t.key ? "#fff" : "var(--c-text-sub)",
              borderColor: tab === t.key ? "#0F6E56" : "var(--c-border)",
            }}
          >
            {t.label}
            {t.key !== "all" && (
              <span className="ml-1 opacity-70">
                ({orders.filter((o) => t.key === "all" || o.status === t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
        >
          <div className="animate-spin w-6 h-6 rounded-full border-2 border-t-transparent mx-auto" style={{ borderColor: "#0F6E56", borderTopColor: "transparent" }} />
          <p className="text-sm mt-3" style={{ color: "var(--c-text-muted)" }}>লোড হচ্ছে…</p>
        </div>
      ) : (
        <OrdersTable orders={filtered} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
