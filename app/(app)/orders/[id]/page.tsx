"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronDown, ChevronRight, RefreshCw, Truck, Download, MessageCircle, Trash2, X, Copy, RotateCcw, Tag, Wallet, Check, Printer } from "lucide-react";
import RiskBadge from "@/components/orders/RiskBadge";
import { formatBDT, formatBanglaDate, getStatusStyle, STATUS_MAP } from "@/lib/utils";

interface Order {
  id: string; status: string; source: string;
  codStatus: string | null;
  codRemitted: boolean;
  codRemittedAt: string | null;
  courierName: string | null; courierTrackId: string | null; courierStatus: string | null;
  totalAmount: number; paidAmount: number; dueAmount: number; deliveryCharge: number; note: string | null;
  tags: string | null;
  riskScore: number | null;
  riskFlags: string | null;
  fakeReported: boolean;
  createdAt: string;
  customer: { id: string; name: string; phone: string | null; address: string | null } | null;
  items: { id: string; quantity: number; unitPrice: number; subtotal: number; productId: string | null; comboId: string | null; comboSnapshot: string | null; product: { id: string; name: string } | null; combo: { id: string; name: string; items: { quantity: number; product: { name: string } }[] } | null }[];
}

const COURIER_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  booked:    { label: "Booked",    bg: "var(--status-confirmed-bg)",  text: "var(--status-confirmed-text)" },
  picked:    { label: "Picked Up", bg: "var(--status-shipped-bg)",    text: "var(--status-shipped-text)" },
  transit:   { label: "Transit",   bg: "var(--status-pending-bg)",    text: "var(--status-pending-text)" },
  delivered: { label: "Delivered", bg: "var(--status-delivered-bg)",  text: "var(--status-delivered-text)" },
  returned:  { label: "Return",    bg: "var(--status-returned-bg)",   text: "var(--status-returned-text)" },
};

const COD_OPTIONS = [
  { value: "with_courier", label: "Courier এর কাছে আছে" },
  { value: "collected",    label: "Cash পেয়েছি" },
  { value: "returned",     label: "Return হয়েছে" },
];

const COD_STYLE: Record<string, { bg: string; text: string }> = {
  with_courier: { bg: "var(--status-pending-bg)",   text: "var(--status-pending-text)" },
  collected:    { bg: "var(--status-delivered-bg)", text: "var(--status-delivered-text)" },
  returned:     { bg: "var(--status-returned-bg)",  text: "var(--status-returned-text)" },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [payment, setPayment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<string>("pathao");
  const [bookingCourier, setBookingCourier] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [updatingCod, setUpdatingCod] = useState(false);
  const [togglingRemitted, setTogglingRemitted] = useState(false);
  const [expandedCombos, setExpandedCombos] = useState<Set<string>>(new Set());
  const [remittanceDateModal, setRemittanceDateModal] = useState(false);
  const [remittanceDate, setRemittanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState("");
  const [returnRestock, setReturnRestock] = useState(true);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTrackInput, setManualTrackInput] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  const MANUAL_COURIERS_LIST = ["sundarban", "paperfly", "carrybee", "delivery_tiger", "karatoa", "janani", "sheba", "sa_paribahan", "other"];

  const MANUAL_COURIER_WEBSITES: Record<string, string> = {
    sundarban: "https://www.sundarbanexpresscourier.com",
    paperfly: "https://paperfly.com.bd",
    carrybee: "https://carrybee.com.bd",
    delivery_tiger: "https://deliverytiger.com.bd",
    karatoa: "https://kcs.com.bd",
    janani: "https://jananiexpress.com.bd",
    sheba: "https://shebadelivery.com.bd",
    sa_paribahan: "https://saparibahan.com.bd",
    other: "",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    fetch(`/api/orders/${id}`).then((r) => r.json()).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    const r = await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) { const d = await r.json(); setOrder((o) => o ? { ...o, status: d.status } : o); showToast("success", "স্ট্যাটাস আপডেট হয়েছে ✓"); }
    setUpdatingStatus(false);
  }

  async function addPayment() {
    if (!payment || parseFloat(payment) <= 0) return;
    const r = await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addPayment: payment }),
    });
    if (r.ok) {
      const d = await r.json();
      setOrder((o) => o ? { ...o, paidAmount: d.paidAmount, dueAmount: d.dueAmount } : o);
      setPayment("");
      showToast("success", "পেমেন্ট যোগ হয়েছে ✓");
    }
  }

  async function bookCourier() {
    if (MANUAL_COURIERS_LIST.includes(selectedCourier)) {
      setManualTrackInput("");
      setShowManualModal(true);
      return;
    }
    setBookingCourier(true);
    const r = await fetch("/api/courier", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, courierName: selectedCourier }),
    });
    const d = await r.json();
    if (r.ok) {
      setOrder((o) => o ? { ...o, courierName: d.courierName, courierTrackId: d.trackingId, courierStatus: "booked", codStatus: "with_courier", status: "shipped" } : o);
      showToast("success", `Courier book হয়েছে ✓ Tracking: ${d.trackingId}`);
    } else {
      showToast("error", d.error ?? "Courier booking failed");
    }
    setBookingCourier(false);
  }

  async function bookManual() {
    if (!manualTrackInput.trim()) {
      showToast("error", "Tracking ID দিন");
      return;
    }
    setSubmittingManual(true);
    const r = await fetch("/api/courier", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, courierName: selectedCourier, manualTrackId: manualTrackInput.trim() }),
    });
    const d = await r.json();
    if (r.ok) {
      setOrder((o) => o ? { ...o, courierName: d.courierName, courierTrackId: d.trackingId, courierStatus: "manual", codStatus: "with_courier", status: "shipped" } : o);
      setShowManualModal(false);
      showToast("success", `Tracking ID সেভ হয়েছে ✓ ${d.trackingId}`);
    } else {
      showToast("error", d.error ?? "Booking failed");
    }
    setSubmittingManual(false);
  }

  async function refreshCourierStatus() {
    setRefreshingStatus(true);
    const r = await fetch(`/api/courier?orderId=${id}`);
    const d = await r.json();
    if (r.ok) {
      setOrder((o) => o ? { ...o, courierStatus: d.status } : o);
      showToast("success", "Courier স্ট্যাটাস আপডেট হয়েছে ✓");
    } else {
      showToast("error", d.error ?? "Status refresh failed");
    }
    setRefreshingStatus(false);
  }

  async function updateCodStatus(codStatus: string) {
    setUpdatingCod(true);
    const r = await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codStatus }),
    });
    if (r.ok) {
      setOrder((o) => o ? { ...o, codStatus } : o);
      showToast("success", "COD স্ট্যাটাস আপডেট হয়েছে ✓");
    }
    setUpdatingCod(false);
  }

  async function confirmCodRemitted(markAs: boolean, date?: string) {
    if (!order) return;
    setRemittanceDateModal(false);
    setTogglingRemitted(true);
    const body: Record<string, unknown> = { codRemitted: markAs };
    if (markAs && date) body.codRemittedAt = date;
    const r = await fetch(`/api/cod/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const d = await r.json();
      setOrder(o => o ? { ...o, codRemitted: d.codRemitted, codRemittedAt: d.codRemittedAt } : o);
      showToast("success", d.codRemitted ? "রেমিটেন্স পাওয়া গেছে চিহ্নিত ✓" : "রেমিটেন্স বাতিল করা হয়েছে");
    } else {
      showToast("error", "আপডেট করা যায়নি।");
    }
    setTogglingRemitted(false);
  }

  function downloadInvoice() {
    setDownloadingPdf(true);
    window.open(`/orders/${id}/invoice`, "_blank");
    setTimeout(() => setDownloadingPdf(false), 800);
  }

  async function handleDelete() {
    setDeleting(true);
    const r = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (r.ok) { router.push("/orders"); }
    else { showToast("error", "অর্ডার মুছে ফেলা যায়নি।"); setDeleting(false); setDeleteModal(false); }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    const r = await fetch(`/api/orders/${id}/duplicate`, { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      showToast("success", "অর্ডার কপি হয়েছে ✓");
      setTimeout(() => router.push(`/orders/${d.id}`), 1000);
    } else {
      showToast("error", "কপি করা যায়নি।");
    }
    setDuplicating(false);
  }

  async function handleReturn() {
    const items = Object.entries(returnItems)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (!items.length) { showToast("error", "কমপক্ষে একটি পণ্য বেছে নিন।"); return; }
    setSubmittingReturn(true);
    const r = await fetch(`/api/orders/${id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: returnReason, restock: returnRestock, items }),
    });
    if (r.ok) {
      showToast("success", "Return সফলভাবে নথিভুক্ত হয়েছে ✓");
      setReturnModal(false);
      setReturnItems({});
      setReturnReason("");
      setOrder(o => o ? { ...o, status: "returned" } : o);
    } else {
      showToast("error", "Return প্রক্রিয়া করা যায়নি।");
    }
    setSubmittingReturn(false);
  }

  function openWhatsApp() {
    if (!order?.customer?.phone) return;
    const phone = order.customer.phone.replace(/[^0-9]/g, "");
    const intlPhone = phone.startsWith("0") ? `88${phone}` : phone;
    const itemList = order.items.map((it) => `• ${it.combo?.name ?? it.product?.name ?? "পণ্য"} × ${it.quantity}`).join("\n");
    const orderRef = `#${order.id.slice(-6).toUpperCase()}`;

    let message = "";
    if (order.status === "pending") {
      message = `আস্সালামু আলাইকুম!\n\nআপনার অর্ডার ${orderRef} নিশ্চিত হয়েছে। ✅\n\n${itemList}\n\nমোট: ৳${order.totalAmount.toLocaleString()}\nপরিশোধিত: ৳${order.paidAmount.toLocaleString()}` +
        (order.dueAmount > 0 ? `\nবাকি: ৳${order.dueAmount.toLocaleString()}` : "") +
        `\n\nশীঘ্রই পণ্য পাঠানো হবে। ধন্যবাদ! 🙏`;
    } else if (order.status === "shipped") {
      message = `আস্সালামু আলাইকুম!\n\nআপনার অর্ডার ${orderRef} পাঠানো হয়েছে। 📦` +
        (order.courierName ? `\n\nCourier: ${{ pathao:"Pathao",ecourier:"eCourier",steadfast:"Steadfast",redx:"RedX",sundarban:"Sundarban (SCS)",paperfly:"Paperfly",carrybee:"CarryBee",delivery_tiger:"Delivery Tiger",karatoa:"Karatoa (KCS)",janani:"Janani Express",sheba:"Sheba Delivery",sa_paribahan:"SA Paribahan",other:"Manual" }[order.courierName] ?? order.courierName}` : "") +
        (order.courierTrackId ? `\nTracking ID: ${order.courierTrackId}` : "") +
        `\n\n২-৩ কার্যদিবসের মধ্যে পৌঁছাবে। ধন্যবাদ! 🙏`;
    } else if (order.status === "delivered") {
      message = `আস্সালামু আলাইকুম!\n\nআপনার অর্ডার ${orderRef} পৌঁছে গেছে। 🎉\n\nপণ্যটি পছন্দ হলে আমাদের page-এ রিভিউ দিন।` +
        (order.dueAmount > 0 ? `\n\nএখনো বাকি: ৳${order.dueAmount.toLocaleString()}` : "") +
        `\n\nধন্যবাদ আমাদের সাথে থাকার জন্য! ❤️`;
    } else {
      message = `আপনার অর্ডার ${orderRef} এর বিবরণ:\n${itemList}\n\nমোট: ৳${order.totalAmount.toLocaleString()}\nপরিশোধিত: ৳${order.paidAmount.toLocaleString()}` +
        (order.dueAmount > 0 ? `\nবাকি: ৳${order.dueAmount.toLocaleString()}` : "") +
        (order.courierTrackId ? `\n\nTracking: ${order.courierTrackId}` : "");
    }
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)", primary: "var(--c-primary)" };

  if (loading) return <div className="animate-pulse space-y-4 max-w-2xl">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div>;
  if (!order) return <div className="text-center py-20"><p style={{ color: S.muted }}>অর্ডার পাওয়া যায়নি।</p><button onClick={() => router.back()} className="mt-3 text-sm" style={{ color: S.primary }}>← ফিরে যান</button></div>;

  const st = getStatusStyle(order.status);
  const courierSt = order.courierStatus ? (COURIER_STATUS_MAP[order.courierStatus] ?? COURIER_STATUS_MAP.booked) : null;
  const codSt = order.codStatus ? COD_STYLE[order.codStatus] : null;

  return (
    <div className="max-w-[1200px]">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg max-w-sm" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>অর্ডার মুছে ফেলবেন?</h3>
              <button onClick={() => setDeleteModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-sm mb-5" style={{ color: S.secondary }}>
              অর্ডার #{order.id.slice(-6).toUpperCase()} মুছে ফেললে stock পূরণ হয়ে যাবে। এই কাজ আর ফেরানো যাবে না।
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: "#E24B4A" }}>
                {deleting ? "মুছছে..." : "মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div className="flex items-start gap-3">
          <Link href="/orders" className="mt-1 p-2 rounded-xl hover:bg-gray-100 flex-shrink-0 transition-colors">
            <ChevronLeft size={20} style={{ color: S.secondary }} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-bold text-xl" style={{ color: S.text }}>অর্ডার #{order.id.slice(-6).toUpperCase()}</h2>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>{formatBanglaDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button onClick={downloadInvoice} disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
            style={{ borderColor: S.border, color: S.text }}>
            <Download size={13} /> {downloadingPdf ? "তৈরি হচ্ছে..." : "Invoice"}
          </button>
          <button onClick={() => window.open(`/orders/${id}/packing-slip`, "_blank")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium hover:bg-gray-50 transition-colors"
            style={{ borderColor: S.border, color: S.secondary }}>
            <Download size={13} /> Packing Slip
          </button>
          {order.customer?.phone && (
            <button onClick={openWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}>
              <MessageCircle size={13} /> WhatsApp
            </button>
          )}
          <button onClick={() => router.push(`/orders/${id}/slip`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium hover:bg-gray-50 transition-colors"
            style={{ borderColor: S.border, color: S.secondary }}>
            <Printer size={13} /> স্লিপ
          </button>
          <button onClick={handleDuplicate} disabled={duplicating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
            style={{ borderColor: S.border, color: S.secondary }}>
            <Copy size={13} /> {duplicating ? "কপি হচ্ছে..." : "Copy"}
          </button>
          <button onClick={() => setReturnModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors"
            style={{ borderColor: "#E24B4A", color: "#E24B4A" }}>
            <RotateCcw size={13} /> Return
          </button>
          <button onClick={() => setDeleteModal(true)}
            className="p-2 rounded-xl border border-transparent hover:bg-red-50 hover:border-red-200 transition-colors" title="অর্ডার মুছুন">
            <Trash2 size={15} style={{ color: "#E24B4A" }} />
          </button>
        </div>
      </div>

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: S.text }}>Return নথিভুক্ত করুন</h3>
              <button onClick={() => setReturnModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: S.muted }}>কোন পণ্য কত টি ফেরত এসেছে বেছে নিন:</p>
            <div className="space-y-2 mb-3">
              {order.items.map(item => {
                const itemName = item.combo?.name ?? item.product?.name ?? "পণ্য";
                if (item.comboId) {
                  return (
                    <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ borderColor: "#FDE68A", backgroundColor: "#FFFBEB" }}>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: "#92400E" }}>📦 {itemName}</p>
                        <p className="text-xs" style={{ color: "#B45309" }}>কমবো আইটেম — আলাদাভাবে ফেরত দেওয়া যায় না</p>
                      </div>
                    </div>
                  );
                }
                const itemKey = item.productId!;
                return (
                <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ borderColor: S.border }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: S.text }}>{itemName}</p>
                    <p className="text-xs" style={{ color: S.muted }}>অর্ডার: {item.quantity} টি</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setReturnItems(prev => ({ ...prev, [itemKey]: Math.max(0, (prev[itemKey] ?? 0) - 1) }))}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold"
                      style={{ borderColor: S.border, color: S.secondary }}>−</button>
                    <span className="w-8 text-center text-sm font-semibold" style={{ color: S.text }}>
                      {returnItems[itemKey] ?? 0}
                    </span>
                    <button onClick={() => setReturnItems(prev => ({ ...prev, [itemKey]: Math.min(item.quantity, (prev[itemKey] ?? 0) + 1) }))}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-bold"
                      style={{ borderColor: S.border, color: S.secondary }}>+</button>
                  </div>
                </div>
                );
              })}
            </div>
            <div className="mb-3">
              <label className="block text-xs mb-1.5" style={{ color: S.muted }}>কারণ (ঐচ্ছিক)</label>
              <input type="text" value={returnReason} onChange={e => setReturnReason(e.target.value)}
                placeholder="যেমন: পণ্য নষ্ট, ভুল পণ্য..."
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, color: S.text }} />
            </div>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={returnRestock} onChange={e => setReturnRestock(e.target.checked)} className="rounded" />
              <span className="text-sm" style={{ color: S.text }}>স্টকে ফেরত যোগ করুন</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setReturnModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleReturn} disabled={submittingReturn}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: "#E24B4A" }}>
                {submittingReturn ? "প্রক্রিয়া হচ্ছে..." : "Return নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-Column Layout ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── LEFT: Products + Payment + Note ───────── */}
        <div className="space-y-4">

          {/* Tags */}
          {(() => {
            const parsedTags: string[] = (() => { try { return JSON.parse(order.tags ?? "[]"); } catch { return []; } })();
            return parsedTags.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap px-1">
                <Tag size={13} style={{ color: S.muted }} />
                {parsedTags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>{tag}</span>
                ))}
              </div>
            ) : null;
          })()}

          {/* Items */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>পণ্য সমূহ</h3>
            </div>
            <div>
              {order.items.map((item) => {
                let displayName: string;
                let comboComponents: { name: string; quantity: number }[] | null = null;
                if (item.comboId) {
                  if (item.comboSnapshot) {
                    try {
                      const snap = JSON.parse(item.comboSnapshot) as { name: string; items: { name: string; quantity: number }[] };
                      displayName = snap.name;
                      comboComponents = snap.items;
                    } catch {
                      displayName = item.combo?.name ?? "কমবো";
                      comboComponents = item.combo?.items.map(ci => ({ name: ci.product.name, quantity: ci.quantity })) ?? null;
                    }
                  } else {
                    displayName = item.combo?.name ?? "কমবো";
                    comboComponents = item.combo?.items.map(ci => ({ name: ci.product.name, quantity: ci.quantity })) ?? null;
                  }
                } else {
                  displayName = item.product?.name ?? "পণ্য";
                }
                const isComboExpanded = expandedCombos.has(item.id);
                return (
                  <div key={item.id} className="px-5 py-4 border-b last:border-0" style={{ borderColor: S.border }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-base" style={{ backgroundColor: "var(--c-primary-light)" }}>
                        {item.comboId ? "📦" : "🛍️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {item.comboId && comboComponents && comboComponents.length > 0 ? (
                            <button onClick={() => setExpandedCombos(prev => { const next = new Set(prev); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })}
                              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-semibold cursor-pointer"
                              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                              কমবো {isComboExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            </button>
                          ) : item.comboId ? (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>কমবো</span>
                          ) : null}
                          <p className="text-sm font-semibold" style={{ color: S.text }}>{displayName}</p>
                        </div>
                        <p className="text-xs" style={{ color: S.muted }}>{item.quantity} × {formatBDT(item.unitPrice)}</p>
                        {comboComponents && comboComponents.length > 0 && isComboExpanded && (
                          <div className="mt-1.5 pl-2 border-l-2 space-y-0.5" style={{ borderColor: "#FDE68A" }}>
                            {comboComponents.map((ci, ci_i) => (
                              <p key={ci_i} className="text-xs" style={{ color: S.muted }}>{ci.name} × {ci.quantity * item.quantity}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm flex-shrink-0" style={{ color: S.text }}>{formatBDT(item.subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 space-y-2" style={{ backgroundColor: "var(--c-bg)", borderTop: `1px solid ${S.border}` }}>
              {order.deliveryCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: S.secondary }}>ডেলিভারি চার্জ</span>
                  <span className="text-sm" style={{ color: S.secondary }}>{formatBDT(order.deliveryCharge)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm" style={{ color: S.text }}>মোট</span>
                <span className="font-bold text-xl" style={{ color: S.primary }}>{formatBDT(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>পেমেন্ট</h3>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "মোট", value: formatBDT(order.totalAmount), color: S.text, bg: "var(--c-bg)" },
                  { label: "পরিশোধিত", value: formatBDT(order.paidAmount), color: "var(--c-primary)", bg: "var(--c-primary-light)" },
                  { label: "বাকি", value: formatBDT(order.dueAmount), color: order.dueAmount > 0 ? "#E24B4A" : "var(--c-primary)", bg: order.dueAmount > 0 ? "#FFF0F0" : "var(--c-primary-light)" },
                ].map((row) => (
                  <div key={row.label} className="text-center rounded-xl py-3 px-2" style={{ backgroundColor: row.bg }}>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>{row.label}</p>
                    <p className="font-bold text-base" style={{ color: row.color }}>{row.value}</p>
                  </div>
                ))}
              </div>
              {order.dueAmount > 0 && (
                <div className="flex gap-2">
                  <input type="number" placeholder="পরিমাণ লিখুন" value={payment} onChange={(e) => setPayment(e.target.value)} min="0"
                    className="flex-1 h-10 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text }} />
                  <button onClick={addPayment} className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: S.primary }}>যোগ করুন</button>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <NoteEditor orderId={order.id} initialNote={order.note} onSaved={note => setOrder(o => o ? { ...o, note } : o)} showToast={showToast} S={S} />
          </div>
        </div>

        {/* ── RIGHT: Customer + Status + Courier ────── */}
        <div className="space-y-4">

          {/* Customer */}
          {order.customer && (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>কাস্টমার</h3>
                <Link href={`/customers/${order.customer.id}`} className="text-xs font-semibold" style={{ color: S.primary }}>প্রোফাইল →</Link>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
                    {order.customer.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate" style={{ color: S.text }}>{order.customer.name}</p>
                      {order.riskScore != null && order.riskScore > 0 && (
                        <RiskBadge
                          riskScore={order.riskScore}
                          riskLevel={
                            order.fakeReported ? "blocked"
                            : order.riskScore >= 80 ? "high"
                            : order.riskScore >= 50 ? "medium"
                            : order.riskScore >= 20 ? "low"
                            : "safe"
                          }
                          size="sm"
                        />
                      )}
                    </div>
                    {order.customer.phone && <p className="text-sm mt-0.5" style={{ color: S.secondary }}>{order.customer.phone}</p>}
                    {order.customer.address && <p className="text-xs mt-0.5 truncate" style={{ color: S.muted }}>{order.customer.address}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status update */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>স্ট্যাটাস পরিবর্তন</h3>
            </div>
            <div className="px-5 py-4">
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                  <button key={key} onClick={() => updateStatus(key)} disabled={updatingStatus || order.status === key}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80 disabled:opacity-50"
                    style={{
                      backgroundColor: order.status === key ? val.bg : "transparent",
                      color: order.status === key ? val.text : S.secondary,
                      borderColor: order.status === key ? val.text + "55" : S.border,
                    }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Courier Booking */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: S.border }}>
              <Truck size={15} style={{ color: S.primary }} />
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>Courier Booking</h3>
            </div>
            <div className="px-5 py-4">

          {!order.courierTrackId ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: S.muted }}>Courier বেছে নিন</label>
                <select value={selectedCourier} onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  <optgroup label="— API সংযুক্ত (Auto Book) —">
                    <option value="pathao">🚚 Pathao</option>
                    <option value="ecourier">📦 eCourier</option>
                    <option value="steadfast">🔵 Steadfast</option>
                    <option value="redx">🔴 RedX</option>
                  </optgroup>
                  <optgroup label="— Manual (Tracking ID দিন) —">
                    <option value="sundarban">🟠 Sundarban (SCS)</option>
                    <option value="paperfly">🟣 Paperfly</option>
                    <option value="carrybee">🐝 CarryBee</option>
                    <option value="delivery_tiger">🐯 Delivery Tiger</option>
                    <option value="karatoa">🔷 Karatoa (KCS)</option>
                    <option value="janani">🟢 Janani Express</option>
                    <option value="sheba">💜 Sheba Delivery</option>
                    <option value="sa_paribahan">🔴 SA Paribahan</option>
                    <option value="other">📮 অন্য Courier</option>
                  </optgroup>
                </select>
              </div>
              <button onClick={bookCourier} disabled={bookingCourier}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: S.primary }}>
                {bookingCourier ? "Book হচ্ছে..." : MANUAL_COURIERS_LIST.includes(selectedCourier) ? "Tracking ID সেট করুন" : "Courier Book করুন"}
              </button>
              <p className="text-xs text-center" style={{ color: S.muted }}>
                {MANUAL_COURIERS_LIST.includes(selectedCourier)
                  ? "Courier website এ book করে tracking ID টি এখানে paste করুন।"
                  : "Courier book করলে অর্ডার স্ট্যাটাস \"পাঠানো\" হয়ে যাবে।"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase" style={{ color: S.secondary }}>
                      {{
                        pathao: "Pathao",
                        ecourier: "eCourier",
                        steadfast: "Steadfast",
                        redx: "RedX",
                        sundarban: "Sundarban (SCS)",
                        paperfly: "Paperfly",
                        carrybee: "CarryBee",
                        delivery_tiger: "Delivery Tiger",
                        karatoa: "Karatoa (KCS)",
                        janani: "Janani Express",
                        sheba: "Sheba Delivery",
                        sa_paribahan: "SA Paribahan",
                        other: "Manual Courier",
                      }[order.courierName ?? ""] ?? order.courierName ?? "Courier"}
                    </span>
                    {courierSt && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: courierSt.bg, color: courierSt.text }}>
                        {courierSt.label}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm font-semibold" style={{ color: S.text }}>{order.courierTrackId}</p>
                </div>
                <button onClick={refreshCourierStatus} disabled={refreshingStatus}
                  className="p-2 rounded-xl border hover:bg-white transition-colors disabled:opacity-50"
                  style={{ borderColor: S.border }}
                  title="স্ট্যাটাস রিফ্রেশ">
                  <RefreshCw size={15} className={refreshingStatus ? "animate-spin" : ""} style={{ color: S.secondary }} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: S.muted }}>COD স্ট্যাটাস</label>
                <select value={order.codStatus ?? "with_courier"} onChange={(e) => updateCodStatus(e.target.value)}
                  disabled={updatingCod}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none disabled:opacity-60"
                  style={{
                    borderColor: codSt ? "transparent" : S.border,
                    color: codSt ? COD_STYLE[order.codStatus ?? "with_courier"]?.text : S.text,
                    backgroundColor: codSt ? COD_STYLE[order.codStatus ?? "with_courier"]?.bg : S.surface,
                  }}>
                  {COD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* COD Remittance toggle */}
              <div className="pt-3 border-t" style={{ borderColor: S.border }}>
                <label className="block text-xs font-medium mb-2" style={{ color: S.muted }}>Courier রেমিটেন্স</label>
                {!order.codRemitted ? (
                  <>
                    {remittanceDateModal ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: S.muted }}>প্রাপ্তির তারিখ</label>
                          <input type="date" value={remittanceDate}
                            onChange={e => setRemittanceDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border text-sm outline-none"
                            style={{ borderColor: S.border, color: S.text }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setRemittanceDateModal(false)}
                            className="flex-1 py-2 rounded-xl border text-xs font-medium"
                            style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                          <button onClick={() => confirmCodRemitted(true, remittanceDate)} disabled={togglingRemitted}
                            className="flex-1 py-2 rounded-xl text-white text-xs font-medium disabled:opacity-60"
                            style={{ backgroundColor: "var(--c-primary)" }}>
                            {togglingRemitted ? "..." : "নিশ্চিত করুন"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setRemittanceDateModal(true)} disabled={togglingRemitted}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
                        style={{ borderColor: S.border, color: S.secondary }}>
                        <Wallet size={13} />
                        বকেয়া আছে — পেয়েছি চিহ্নিত করুন
                      </button>
                    )}
                  </>
                ) : (
                  <div>
                    <button onClick={() => confirmCodRemitted(false)} disabled={togglingRemitted}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
                      style={{ backgroundColor: "var(--c-primary-light)", borderColor: "var(--c-primary)", color: "var(--c-primary)" }}>
                      {togglingRemitted ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      পাওয়া গেছে
                    </button>
                    {order.codRemittedAt && (
                      <p className="text-xs mt-1.5" style={{ color: S.muted }}>
                        {formatBanglaDate(order.codRemittedAt)}-এ রেমিট হয়েছে
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          </div>

          {/* COD Remittance standalone (no courier tracking) */}
          {!order.courierTrackId && (order.status === "shipped" || order.status === "delivered") && (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: S.border }}>
                <Wallet size={15} style={{ color: S.primary }} />
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>COD রেমিটেন্স</h3>
              </div>
              <div className="px-5 py-4">
                {!order.codRemitted ? (
                  <>
                    {remittanceDateModal ? (
                      <div className="space-y-2">
                        <label className="block text-xs mb-1" style={{ color: S.muted }}>প্রাপ্তির তারিখ</label>
                        <input type="date" value={remittanceDate} onChange={e => setRemittanceDate(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border text-sm outline-none"
                          style={{ borderColor: S.border, color: S.text }} />
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setRemittanceDateModal(false)} className="flex-1 py-2 rounded-xl border text-xs font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                          <button onClick={() => confirmCodRemitted(true, remittanceDate)} disabled={togglingRemitted}
                            className="flex-1 py-2 rounded-xl text-white text-xs font-medium disabled:opacity-60" style={{ backgroundColor: "var(--c-primary)" }}>
                            {togglingRemitted ? "..." : "নিশ্চিত করুন"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setRemittanceDateModal(true)} disabled={togglingRemitted}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
                        style={{ borderColor: S.border, color: S.secondary }}>
                        <Wallet size={13} />
                        বকেয়া আছে — পেয়েছি চিহ্নিত করুন
                      </button>
                    )}
                  </>
                ) : (
                  <div>
                    <button onClick={() => confirmCodRemitted(false)} disabled={togglingRemitted}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60"
                      style={{ backgroundColor: "var(--c-primary-light)", borderColor: "var(--c-primary)", color: "var(--c-primary)" }}>
                      {togglingRemitted ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      পাওয়া গেছে
                    </button>
                    {order.codRemittedAt && (
                      <p className="text-xs mt-1.5" style={{ color: S.muted }}>{formatBanglaDate(order.codRemittedAt)}-এ রেমিট হয়েছে</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* end right column */}
      </div>
      {/* end two-column grid */}

      {/* Manual Courier Tracking ID Modal */}
      {showManualModal && order && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: S.text }}>Tracking ID সেট করুন</h3>
              <button onClick={() => setShowManualModal(false)} style={{ color: S.muted }}>
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl p-3 space-y-1 text-sm" style={{ backgroundColor: "var(--c-bg)", borderLeft: `3px solid var(--c-primary)` }}>
              <p style={{ color: S.muted }} className="text-xs font-medium uppercase tracking-wide mb-1.5">অর্ডার তথ্য</p>
              <p style={{ color: S.text }}><span style={{ color: S.muted }}>নাম:</span> {order.customer?.name ?? "—"}</p>
              <p style={{ color: S.text }}><span style={{ color: S.muted }}>ফোন:</span> {order.customer?.phone ?? "—"}</p>
              <p style={{ color: S.text }}><span style={{ color: S.muted }}>ঠিকানা:</span> {order.customer?.address ?? "—"}</p>
              <p style={{ color: S.text }}><span style={{ color: S.muted }}>COD:</span> ৳{(order.dueAmount > 0 ? order.dueAmount : order.totalAmount).toLocaleString()}</p>
            </div>

            {MANUAL_COURIER_WEBSITES[selectedCourier] && (
              <a
                href={MANUAL_COURIER_WEBSITES[selectedCourier]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80"
                style={{ borderColor: "var(--c-primary)", color: "var(--c-primary)" }}
              >
                <Truck size={15} />
                Courier website এ booking করুন
              </a>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: S.muted }}>
                Booking করার পর tracking ID টি এখানে paste করুন
              </label>
              <input
                type="text"
                value={manualTrackInput}
                onChange={(e) => setManualTrackInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && bookManual()}
                placeholder="যেমন: SF-12345678"
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.text }}
              >
                বাতিল
              </button>
              <button
                onClick={bookManual}
                disabled={submittingManual || !manualTrackInput.trim()}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: "var(--c-primary)" }}
              >
                {submittingManual ? "সেভ হচ্ছে..." : "Tracking ID সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NoteEditor({ orderId, initialNote, onSaved, showToast, S }: {
  orderId: string;
  initialNote: string | null;
  onSaved: (note: string | null) => void;
  showToast: (type: "success" | "error", msg: string) => void;
  S: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const r = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setSaving(false);
    if (r.ok) {
      onSaved(note || null);
      setEditing(false);
      showToast("success", "নোট সেভ হয়েছে ✓");
    } else {
      showToast("error", "নোট সেভ করা যায়নি।");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm" style={{ color: S.text }}>নোট</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs" style={{ color: S.primary }}>সম্পাদনা</button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
            style={{ borderColor: S.border, color: S.text }} placeholder="নোট লিখুন..." />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { setEditing(false); setNote(initialNote ?? ""); }}
              className="flex-1 py-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm" style={{ color: initialNote ? S.text : S.muted }}>
          {initialNote || "কোনো নোট নেই।"}
        </p>
      )}
    </div>
  );
}
