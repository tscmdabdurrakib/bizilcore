"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChefHat, Clock, Loader2, RotateCcw, CheckCircle } from "lucide-react";

interface ROrderItem {
  id: string; quantity: number; note?: string;
  menuItem: { id: string; name: string; category: string };
}

interface RestaurantOrder {
  id: string; type: string; status: string; totalAmount: number;
  customerName?: string; note?: string; createdAt: string;
  items: ROrderItem[];
  table?: { id: string; number: number } | null;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)",
  bg: "var(--c-bg)",
};

const COLUMNS: { key: string; label: string; color: string; bg: string; nextStatus: string; nextLabel: string }[] = [
  { key: "pending",   label: "নতুন অর্ডার",   color: "#EF4444", bg: "#FEF2F2", nextStatus: "preparing", nextLabel: "রান্না শুরু করুন" },
  { key: "preparing", label: "রান্না চলছে",    color: "#D97706", bg: "#FFFBEB", nextStatus: "ready",     nextLabel: "প্রস্তুত ✓"       },
  { key: "ready",     label: "পরিবেশনের জন্য", color: "#059669", bg: "#ECFDF5", nextStatus: "served",    nextLabel: "পরিবেশিত"         },
];

function elapsedMin(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function elapsedBorderColor(minutes: number): string {
  if (minutes < 10) return "#059669";
  if (minutes < 20) return "#F59E0B";
  return "#EF4444";
}

function elapsedTextColor(minutes: number): string {
  if (minutes < 10) return "#9CA3AF";
  if (minutes < 20) return "#D97706";
  return "#EF4444";
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tick, setTick] = useState(0);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string } | null>(null);

  function showToast(msg: string) {
    setToast({ msg });
    setTimeout(() => setToast(null), 2500);
  }

  const loadOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/restaurant/orders?status=pending&status=preparing&status=ready");
      if (r.ok) {
        const data: RestaurantOrder[] = await r.json();
        setOrders(data.filter(o => ["pending", "preparing", "ready"].includes(o.status)));
        setLastRefresh(new Date());
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    intervalRef.current = setInterval(loadOrders, 30000);
    tickRef.current = setInterval(() => setTick(t => t + 1), 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [loadOrders]);

  async function advance(orderId: string, newStatus: string) {
    setUpdating(prev => new Set([...prev, orderId]));
    const r = await fetch(`/api/restaurant/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(prev => { const n = new Set(prev); n.delete(orderId); return n; });
    if (r.ok) {
      const updated = await r.json();
      setOrders(prev => {
        const filtered = prev.filter(o => o.id !== orderId);
        if (["pending", "preparing", "ready"].includes(updated.status)) {
          return [...filtered, updated];
        }
        return filtered;
      });
      showToast("আপডেট হয়েছে ✓");
    }
  }

  const formatted = lastRefresh.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-7xl mx-auto space-y-4" suppressHydrationWarning>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: "#1D9E75" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)" }}>
            <ChefHat size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>কিচেন ডিসপ্লে</h1>
            <p className="text-xs" style={{ color: S.muted }}>শেষ আপডেট: {formatted} · প্রতি ৩০ সেকেন্ডে রিফ্রেশ হয়</p>
          </div>
        </div>
        <button onClick={loadOrders}
          className="flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: S.border, color: S.secondary }}>
          <RotateCcw size={15} /> রিফ্রেশ
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: S.muted }}>
          <Loader2 size={28} className="animate-spin mr-3" /> অর্ডার লোড হচ্ছে...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#059669" }} />
          <p className="text-lg font-bold mb-1" style={{ color: S.text }}>সব অর্ডার সম্পন্ন!</p>
          <p className="text-sm" style={{ color: S.muted }}>এখন কোনো সক্রিয় অর্ডার নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map(col => {
            const colOrders = orders.filter(o => o.status === col.key);
            return (
              <div key={col.key} className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                <div className="px-4 py-3 flex items-center justify-between border-b"
                  style={{ backgroundColor: col.bg, borderColor: S.border }}>
                  <span className="text-sm font-bold" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: col.color }}>
                    {colOrders.length}
                  </span>
                </div>
                <div className="p-3 space-y-3">
                  {colOrders.length === 0 ? (
                    <p className="text-center py-8 text-sm" style={{ color: S.muted }}>কোনো অর্ডার নেই</p>
                  ) : colOrders.map(order => {
                    const elapsed = elapsedMin(order.createdAt);
                    const borderColor = elapsedBorderColor(elapsed);
                    const timeColor = elapsedTextColor(elapsed);
                    const isUpdating = updating.has(order.id);
                    return (
                      <div key={`${order.id}-${tick}`}
                        className="rounded-xl border-2 p-3"
                        style={{ borderColor, backgroundColor: S.surface }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: order.table ? "#EF4444" : order.type === "takeaway" ? "#F59E0B" : "#3B82F6" }}>
                              {order.table ? `T${order.table.number}` : order.type === "takeaway" ? "T/A" : "D"}
                            </div>
                            <div>
                              <p className="text-xs font-bold font-mono" style={{ color: S.text }}>
                                #{order.id.slice(-4).toUpperCase()}
                              </p>
                              {order.customerName && <p className="text-[10px]" style={{ color: S.muted }}>{order.customerName}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1" style={{ color: timeColor }}>
                            <Clock size={11} />
                            <span className="text-xs font-bold">{elapsed}মি</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          {order.items.map(item => (
                            <div key={item.id} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: col.color }}>
                                {item.quantity}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: S.text }}>{item.menuItem.name}</p>
                                {item.note && <p className="text-[10px]" style={{ color: "#D97706" }}>⚠ {item.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.note && (
                          <p className="text-xs px-2 py-1.5 rounded-lg mb-3" style={{ backgroundColor: "#FFFBEB", color: "#92600A" }}>
                            📝 {order.note}
                          </p>
                        )}
                        <button onClick={() => advance(order.id, col.nextStatus)} disabled={isUpdating}
                          className="w-full py-2 rounded-xl text-white text-xs font-bold transition-opacity disabled:opacity-60"
                          style={{ backgroundColor: col.color }}>
                          {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : col.nextLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
