"use client";

import { useEffect, useState, useCallback } from "react";
import { Truck, MapPin, Phone, CheckCircle, Loader2, RefreshCw, Package } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface LOrder {
  id: string; orderNumber: string; clientName: string; clientPhone: string;
  clientAddress?: string; deliveryDate: string; totalAmount: number;
  dueAmount: number; status: string; isExpress: boolean;
}

const C = "#0284C7";
const CL = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };

function statusStyle(s: string) {
  if (s === "ready") return { bg: "#ECFDF5", color: "#10B981" };
  if (s === "out_for_delivery") return { bg: "#EFF6FF", color: "#3B82F6" };
  return { bg: "#F3F4F6", color: "#6B7280" };
}
function statusLabel(s: string) {
  return s === "ready" ? "Ready ✓" : s === "out_for_delivery" ? "On Route" : s;
}

export default function LaundryDelivery() {
  const [ready, setReady] = useState<LOrder[]>([]);
  const [onRoute, setOnRoute] = useState<LOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string|null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);

  function showToast(type: "success"|"error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [r, o] = await Promise.all([
      fetch("/api/laundry/orders?status=ready").then(r => r.json()).catch(() => []),
      fetch("/api/laundry/orders?status=out_for_delivery").then(r => r.json()).catch(() => []),
    ]);
    setReady(Array.isArray(r) ? r : []);
    setOnRoute(Array.isArray(o) ? o : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moveToDelivery(order: LOrder) {
    setUpdating(order.id);
    const r = await fetch(`/api/laundry/orders/${order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "out_for_delivery" }),
    });
    setUpdating(null);
    if (r.ok) { showToast("success", "Out for Delivery মার্ক হয়েছে ✓"); load(); }
    else showToast("error", "ব্যর্থ হয়েছে।");
  }

  async function markDelivered(order: LOrder) {
    setUpdating(order.id);
    const r = await fetch(`/api/laundry/orders/${order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "delivered" }),
    });
    setUpdating(null);
    if (r.ok) { showToast("success", "Delivered ✓"); load(); }
    else showToast("error", "ব্যর্থ হয়েছে।");
  }

  function OrderCard({ order, type }: { order: LOrder; type: "ready"|"route" }) {
    const ss = statusStyle(order.status);
    const isUpdating = updating === order.id;
    return (
      <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: CL, color: C }}>
                {order.orderNumber}
              </span>
              {order.isExpress && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>⚡</span>
              )}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: ss.bg, color: ss.color }}>
                {statusLabel(order.status)}
              </span>
            </div>
            <p className="font-bold text-base" style={{ color: S.text }}>{order.clientName}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {order.dueAmount > 0 && (
              <p className="text-sm font-bold" style={{ color: "#EF4444" }}>বাকি {formatBDT(order.dueAmount)}</p>
            )}
            <p className="text-xs" style={{ color: S.muted }}>{formatBDT(order.totalAmount)}</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: S.muted }}>
            <Phone size={13} style={{ flexShrink: 0 }} />
            <a href={`tel:${order.clientPhone}`} className="font-medium hover:underline" style={{ color: C }}>
              {order.clientPhone}
            </a>
          </div>
          {order.clientAddress && (
            <div className="flex items-start gap-2 text-sm" style={{ color: S.muted }}>
              <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{order.clientAddress}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs" style={{ color: S.muted }}>
            <Package size={12} />
            <span>ডেলিভারি: {new Date(order.deliveryDate).toLocaleDateString("bn-BD")}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {type === "ready" && (
            <button onClick={() => moveToDelivery(order)} disabled={isUpdating}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#3B82F6" }}>
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
              ডেলিভারিতে পাঠান
            </button>
          )}
          {type === "route" && (
            <button onClick={() => markDelivered(order)} disabled={isUpdating}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: "#10B981" }}>
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Delivered করুন
            </button>
          )}
          <a href={`tel:${order.clientPhone}`}
            className="w-11 flex items-center justify-center rounded-xl text-sm font-bold"
            style={{ backgroundColor: CL, color: C }}>
            <Phone size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, #3B82F6, #1D4ED8)` }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>ডেলিভারি ব্যবস্থাপনা</h1>
            <p className="text-xs" style={{ color: S.muted }}>
              Ready: {ready.length}টি • On Route: {onRoute.length}টি
            </p>
          </div>
        </div>
        <button onClick={load} className="w-10 h-10 rounded-xl border flex items-center justify-center"
          style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <RefreshCw size={15} style={{ color: S.muted }} />
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 size={24} className="animate-spin mx-auto" style={{ color: C }} />
        </div>
      ) : (
        <>
          {/* Ready section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={18} style={{ color: "#10B981" }} />
              <h2 className="font-bold text-base" style={{ color: S.text }}>Ready — ডেলিভারির অপেক্ষায়</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}>{ready.length}</span>
            </div>
            {ready.length === 0 ? (
              <div className="rounded-2xl border py-10 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
                <p className="text-sm" style={{ color: S.muted }}>কোনো Ready অর্ডার নেই</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {ready.map(o => <OrderCard key={o.id} order={o} type="ready" />)}
              </div>
            )}
          </div>

          {/* On Route section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Truck size={18} style={{ color: "#3B82F6" }} />
              <h2 className="font-bold text-base" style={{ color: S.text }}>On Route — পথে আছে</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>{onRoute.length}</span>
            </div>
            {onRoute.length === 0 ? (
              <div className="rounded-2xl border py-10 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
                <p className="text-sm" style={{ color: S.muted }}>কেউ পথে নেই</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {onRoute.map(o => <OrderCard key={o.id} order={o} type="route" />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
