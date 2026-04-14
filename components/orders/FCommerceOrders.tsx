"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Download, Facebook, CheckCircle, XCircle, ExternalLink, ChevronLeft, ChevronRight, ShoppingBag, Loader2, MoreHorizontal, Printer, Truck } from "lucide-react";
import { formatBDT, formatRelativeDate, getStatusStyle } from "@/lib/utils";
import { downloadExcel } from "@/lib/excel";
import OrderCreatePanel from "./OrderCreatePanel";

interface Order {
  id: string; status: string; totalAmount: number; paidAmount: number; dueAmount: number;
  createdAt: string; codStatus: string | null; courierName: string | null;
  courierTrackId: string | null; courierStatus: string | null;
  source?: string | null;
  storeOrderId?: string | null;
  customer: { name: string; phone: string | null } | null;
  items: { productId: string | null; comboId: string | null; comboSnapshot: string | null; product: { name: string } | null; combo: { name: string } | null }[];
}

interface SuggestedOrder {
  id: string; commenterName: string; commentText: string; fbProfile: string | null;
  postId: string | null; createdAt: string;
}

interface PaginatedOrders { orders: Order[]; total: number; page: number; limit: number; pages: number; }

const STATUS_TABS = [
  { key: "all", label: "সব" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "নিশ্চিত" },
  { key: "shipped", label: "পাঠানো" },
  { key: "delivered", label: "পৌঁছেছে" },
  { key: "returned", label: "Return" },
  { key: "cod_pending", label: "COD Pending" },
];

const COURIER_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  booked:    { bg: "var(--status-confirmed-bg)",  text: "var(--status-confirmed-text)", label: "Booked" },
  picked:    { bg: "var(--status-shipped-bg)",    text: "var(--status-shipped-text)",   label: "Picked" },
  transit:   { bg: "var(--status-pending-bg)",    text: "var(--status-pending-text)",   label: "Transit" },
  delivered: { bg: "var(--status-delivered-bg)",  text: "var(--status-delivered-text)", label: "Delivered" },
  returned:  { bg: "var(--status-returned-bg)",   text: "var(--status-returned-text)",  label: "Return" },
};

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

const STATUS_OPTIONS = [
  { key: "pending",   label: "Pending",    bg: "var(--status-pending-bg)",   text: "var(--status-pending-text)",   dot: "#EF9F27" },
  { key: "confirmed", label: "নিশ্চিত",   bg: "var(--status-confirmed-bg)", text: "var(--status-confirmed-text)", dot: "#1D9E75" },
  { key: "shipped",   label: "পাঠানো",    bg: "var(--status-shipped-bg)",   text: "var(--status-shipped-text)",   dot: "#3B82F6" },
  { key: "delivered", label: "পৌঁছেছে",   bg: "var(--status-delivered-bg)", text: "var(--status-delivered-text)", dot: "#059669" },
  { key: "returned",  label: "Return",     bg: "var(--status-returned-bg)",  text: "var(--status-returned-text)",  dot: "#E24B4A" },
];

const COURIER_LIST = [
  { key: "pathao",         label: "Pathao",          manual: false },
  { key: "steadfast",      label: "Steadfast",       manual: false },
  { key: "redx",           label: "RedX",            manual: false },
  { key: "ecourier",       label: "eCourier",        manual: false },
  { key: "sundarban",      label: "Sundarban",       manual: true  },
  { key: "paperfly",       label: "Paperfly",        manual: true  },
  { key: "carrybee",       label: "CarryBee",        manual: true  },
  { key: "delivery_tiger", label: "Delivery Tiger",  manual: true  },
  { key: "karatoa",        label: "Karatoa",         manual: true  },
  { key: "janani",         label: "Janani",          manual: true  },
  { key: "sheba",          label: "Sheba",           manual: true  },
  { key: "sa_paribahan",   label: "SA Paribahan",    manual: true  },
  { key: "other",          label: "অন্য",            manual: true  },
];

export default function FCommerceOrders() {
  const router = useRouter();
  const [slipLoadingId, setSlipLoadingId] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedOrders>({ orders: [], total: 0, page: 1, limit: 50, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const [suggestions, setSuggestions] = useState<SuggestedOrder[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [fbConnected, setFbConnected] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("confirmed");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [quickMenu, setQuickMenu] = useState<{ type: "status" | "actions" | "courier"; orderId: string; x: number; y: number } | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [inlineCourier, setInlineCourier] = useState("steadfast");
  const [inlineTrackInput, setInlineTrackInput] = useState("");
  const [bookingInline, setBookingInline] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [panelPrefillName, setPanelPrefillName] = useState<string | undefined>(undefined);
  const [panelPrefillSuggestId, setPanelPrefillSuggestId] = useState<string | undefined>(undefined);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(o => o.id)));
  }

  function openMenu(e: React.MouseEvent, type: "status" | "actions", orderId: string) {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 220);
    const y = rect.bottom + 6;
    setQuickMenu({ type, orderId, x, y });
  }

  async function bookCourierInline(orderId: string) {
    const courier = COURIER_LIST.find(c => c.key === inlineCourier);
    if (courier?.manual && !inlineTrackInput.trim()) {
      showToast("error", "Tracking ID দিন");
      return;
    }
    setBookingInline(true);
    const body: Record<string, string> = { orderId, courierName: inlineCourier };
    if (courier?.manual) body.manualTrackId = inlineTrackInput.trim();
    const r = await fetch("/api/courier", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setBookingInline(false);
    if (r.ok) {
      setData(prev => ({
        ...prev,
        orders: prev.orders.map(o => o.id === orderId
          ? { ...o, courierName: d.courierName, courierTrackId: d.trackingId, courierStatus: "booked", codStatus: "with_courier", status: "shipped" }
          : o),
      }));
      setQuickMenu(null);
      setInlineTrackInput("");
      showToast("success", `কুরিয়ার বুক হয়েছে ✓ ${d.trackingId}`);
    } else {
      showToast("error", d.error ?? "Courier booking failed");
    }
  }

  async function quickUpdateStatus(orderId: string, status: string) {
    setQuickMenu(null);
    setUpdatingIds(prev => new Set([...prev, orderId]));
    const r = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingIds(prev => { const next = new Set(prev); next.delete(orderId); return next; });
    if (r.ok) {
      setData(d => ({ ...d, orders: d.orders.map(o => o.id === orderId ? { ...o, status } : o) }));
      showToast("success", "স্ট্যাটাস আপডেট হয়েছে ✓");
    } else {
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  async function handleBulkStatus() {
    if (!selectedIds.size) return;
    setBulkUpdating(true);
    const r = await fetch("/api/orders/bulk-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds], status: bulkStatus }),
    });
    if (r.ok) {
      const d = await r.json();
      showToast("success", `${d.updated}টি অর্ডার আপডেট হয়েছে ✓`);
      setSelectedIds(new Set());
      loadOrders(page);
    } else {
      showToast("error", "আপডেট করা যায়নি।");
    }
    setBulkUpdating(false);
  }

  async function loadOrders(pg = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: "50" });
    if (tab !== "all" && tab !== "cod_pending") params.set("status", tab);
    if (search) params.set("search", search);
    const res = await fetch(`/api/orders?${params}`);
    const json = await res.json();
    if (Array.isArray(json)) {
      setData({ orders: json, total: json.length, page: 1, limit: 50, pages: 1 });
    } else {
      setData(json);
    }
    setLoading(false);
  }

  useEffect(() => { setPage(1); }, [tab, search]);
  useEffect(() => { loadOrders(page); }, [page, tab, search]);

  useEffect(() => {
    // Load Facebook suggestions
    setSuggestionsLoading(true);
    fetch("/api/facebook/disconnect")
      .then(r => r.json())
      .then(d => {
        setFbConnected(d.connected);
        if (d.connected) {
          return fetch("/api/facebook/comments").then(r => r.json());
        }
        return { suggestions: [] };
      })
      .then(d => {
        if (d.suggestions) setSuggestions(d.suggestions as SuggestedOrder[]);
      })
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));

    // Also load from DB
    fetch("/api/suggested-orders")
      .then(r => r.json())
      .then(arr => { if (Array.isArray(arr)) setSuggestions(arr); })
      .catch(() => {});
  }, []);

  function dismissSuggestion(id: string) {
    setDismissedIds(prev => new Set([...prev, id]));
    fetch("/api/suggested-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "dismissed" }),
    });
  }

  function convertSuggestion(s: SuggestedOrder) {
    setPanelPrefillName(s.commenterName);
    setPanelPrefillSuggestId(s.id);
    setCreatePanelOpen(true);
  }

  const orders = data.orders;
  const filtered = orders.filter(o => {
    if (tab === "cod_pending") return o.codStatus === "with_courier";
    return true;
  });
  const codPendingCount = orders.filter(o => o.codStatus === "with_courier").length;
  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

  function exportToExcel() {
    const rows = filtered.map(o => ({
      "অর্ডার ID": `#${o.id.slice(-6).toUpperCase()}`,
      "কাস্টমার": o.customer?.name ?? "অজানা",
      "ফোন": o.customer?.phone ?? "",
      "পণ্য": o.items.map(it => {
        if (it.comboId) {
          if (it.comboSnapshot) {
            try { return (JSON.parse(it.comboSnapshot) as { name: string }).name; } catch { /* fall through */ }
          }
          return it.combo?.name ?? "কমবো";
        }
        return it.product?.name ?? "পণ্য";
      }).join(", "),
      "মোট (৳)": o.totalAmount,
      "পরিশোধিত (৳)": o.paidAmount,
      "বাকি (৳)": o.dueAmount,
      "স্ট্যাটাস": getStatusStyle(o.status).label,
      "Courier": o.courierName ?? "",
      "Tracking ID": o.courierTrackId ?? "",
      "তারিখ": new Date(o.createdAt).toLocaleDateString("bn-BD"),
    }));
    const today = new Date().toISOString().split("T")[0];
    downloadExcel(rows, `orders-${today}.xlsx`, "অর্ডার");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl shadow-2xl"
          style={{ backgroundColor: "var(--c-text)", color: "#FFF", minWidth: 340 }}>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold">{selectedIds.size}টি অর্ডার নির্বাচিত</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#CCC" }}>✕ বাতিল</button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {STATUS_OPTIONS.map(s => (
              <button key={s.key} onClick={() => setBulkStatus(s.key)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: bulkStatus === s.key ? s.bg : "rgba(255,255,255,0.1)",
                  color: bulkStatus === s.key ? s.text : "rgba(255,255,255,0.7)",
                  outline: bulkStatus === s.key ? `2px solid ${s.dot}` : "none",
                  outlineOffset: 1,
                }}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={handleBulkStatus} disabled={bulkUpdating}
            className="w-full py-2 rounded-xl text-sm font-bold disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "var(--c-primary)", color: "#FFF" }}>
            {bulkUpdating ? "আপডেট হচ্ছে..." : `${selectedIds.size}টি অর্ডার → ${STATUS_OPTIONS.find(s => s.key === bulkStatus)?.label ?? ""}`}
          </button>
        </div>
      )}

      {/* ── Facebook Suggested Orders ──────────────── */}
      {fbConnected && (suggestionsLoading || visibleSuggestions.length > 0) && (
        <div className="mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: "#1877F2", borderWidth: 1.5 }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--bg-fb-soft)" }}>
            <Facebook size={18} style={{ color: "#1877F2" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--bg-fb-text)" }}>Facebook থেকে সম্ভাব্য অর্ডার</span>
            {visibleSuggestions.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#1877F2", color: "#fff" }}>
                {visibleSuggestions.length}
              </span>
            )}
          </div>

          {suggestionsLoading ? (
            <div className="px-4 py-3 text-sm" style={{ color: S.muted }}>মন্তব্য বিশ্লেষণ করা হচ্ছে...</div>
          ) : visibleSuggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: S.muted }}>এখন কোনো সম্ভাব্য অর্ডার নেই।</div>
          ) : (
            <div className="divide-y" style={{ borderColor: S.border }}>
              {visibleSuggestions.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: "#1877F2" }}>
                    {s.commenterName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: S.text }}>{s.commenterName}</span>
                      {s.fbProfile && (
                        <a href={s.fbProfile} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs" style={{ color: "#1877F2" }}
                          onClick={e => e.stopPropagation()}>
                          <ExternalLink size={10} /> FB
                        </a>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: S.secondary }}>
                      &ldquo;{s.commentText}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => convertSuggestion(s)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: S.primary }}>
                      <CheckCircle size={12} /> অর্ডার বানান
                    </button>
                    <button onClick={() => dismissSuggestion(s.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="বাতিল করুন">
                      <XCircle size={16} style={{ color: S.muted }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Page Header ──────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
            <ShoppingBag size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>অর্ডার</h1>
            <p className="text-xs" style={{ color: S.muted }}>Facebook সেলের সব অর্ডার ট্র্যাক করুন</p>
          </div>
        </div>
        <button
          onClick={() => { setPanelPrefillName(undefined); setPanelPrefillSuggestId(undefined); setCreatePanelOpen(true); }}
          className="flex items-center gap-2 px-5 h-10 rounded-2xl text-white text-sm font-semibold flex-shrink-0 shadow-md hover:opacity-90 transition-opacity active:scale-95"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
          <Plus size={16} /> নতুন অর্ডার
        </button>
      </div>

      {/* ── Mini Stats Bar ───────────────────────── */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "মোট অর্ডার",   value: `${data.total}টি`,                                                                         color: "#0F6E56", bg: "#E8F5F0" },
            { label: "Pending",       value: `${orders.filter(o => o.status === "pending").length}টি`,                                  color: "#EF9F27", bg: "#FFF3DC" },
            { label: "COD বাকি",     value: `${codPendingCount}টি`,                                                                    color: "#3B82F6", bg: "#EFF6FF" },
            { label: "মোট বিক্রি",  value: `৳${orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString("en-IN")}`,               color: "#8B5CF6", bg: "#F5F3FF" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: s.bg }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.color }}>{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Search + Export ──────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input type="text" placeholder="কাস্টমার, অর্ডার ID বা Tracking..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-11 rounded-2xl border text-sm outline-none focus:ring-2 transition-all"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
        </div>
        <button onClick={exportToExcel} disabled={loading || filtered.length === 0}
          className="flex items-center gap-2 px-4 h-11 rounded-2xl border text-sm font-semibold flex-shrink-0 hover:bg-gray-50 disabled:opacity-40 transition-all active:scale-95"
          style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}>
          <Download size={15} /> Excel
        </button>
      </div>

      {/* ── Status Tabs ────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_TABS.map(t => {
          const isCodTab = t.key === "cod_pending";
          const isActive = tab === t.key;
          const tabColors: Record<string, string> = {
            all: "#0F6E56", pending: "#EF9F27", confirmed: "#1D9E75",
            shipped: "#3B82F6", delivered: "#059669", returned: "#EF4444", cod_pending: "#EF9F27",
          };
          const tabBgs: Record<string, string> = {
            all: "#E8F5F0", pending: "#FFF3DC", confirmed: "#D1FAE5",
            shipped: "#EFF6FF", delivered: "#D1FAE5", returned: "#FEE2E2", cod_pending: "#FFF3DC",
          };
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold flex-shrink-0 transition-all active:scale-95"
              style={{
                backgroundColor: isActive ? tabColors[t.key] : S.surface,
                color: isActive ? "#fff" : S.secondary,
                border: `1.5px solid ${isActive ? tabColors[t.key] : S.border}`,
                boxShadow: isActive ? `0 4px 12px ${tabColors[t.key]}40` : "none",
              }}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />}
              {t.label}
              {isCodTab && codPendingCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.25)" : tabBgs[t.key], color: isActive ? "#FFF" : tabColors[t.key] }}>
                  {codPendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Orders Table ───────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
        {loading ? (
          <div className="p-4 space-y-2.5 animate-pulse">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--c-bg)" }}>
                <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ backgroundColor: S.border }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full w-32" style={{ backgroundColor: S.border }} />
                  <div className="h-2.5 rounded-full w-20" style={{ backgroundColor: S.border }} />
                </div>
                <div className="h-3 rounded-full w-16" style={{ backgroundColor: S.border }} />
                <div className="h-6 rounded-full w-20" style={{ backgroundColor: S.border }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)" }}>
              <ShoppingBag size={32} style={{ color: "#0F6E56" }} />
            </div>
            <p className="text-base font-bold mb-1" style={{ color: S.text }}>
              {tab === "cod_pending" ? "কোনো COD pending নেই" : "কোনো অর্ডার পাওয়া যায়নি"}
            </p>
            <p className="text-sm mb-5" style={{ color: S.muted }}>
              {tab === "all" ? "এখনো কোনো অর্ডার নেই। প্রথম অর্ডারটি যোগ করুন!" : `"${STATUS_TABS.find(t => t.key === tab)?.label}" স্ট্যাটাসে কোনো অর্ডার নেই।`}
            </p>
            {tab === "all" && (
              <button
                onClick={() => { setPanelPrefillName(undefined); setPanelPrefillSuggestId(undefined); setCreatePanelOpen(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity active:scale-95"
                style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>
                <Plus size={15} /> নতুন অর্ডার তৈরি করুন
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr style={{ backgroundColor: "var(--c-bg)", borderBottom: `1px solid ${S.border}` }}>
                <th className="pl-4 pr-2 py-3.5 w-9">
                  <input type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer accent-green-700"
                  />
                </th>
                {["কাস্টমার", "পণ্য", "পরিমাণ", "স্ট্যাটাস", "Courier", "তারিখ", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const st = getStatusStyle(o.status);
                const courierSt = o.courierStatus ? COURIER_STATUS_STYLE[o.courierStatus] : null;
                const COURIER_LABEL: Record<string, string> = { pathao:"Pathao", ecourier:"eCourier", steadfast:"Steadfast", redx:"RedX", sundarban:"Sundarban", paperfly:"Paperfly", carrybee:"CarryBee", delivery_tiger:"Delivery Tiger", karatoa:"Karatoa", janani:"Janani", sheba:"Sheba", sa_paribahan:"SA Paribahan", other:"Manual" };
                const summary = o.items.slice(0, 1).map(it => {
                  if (it.comboId) {
                    if (it.comboSnapshot) { try { return (JSON.parse(it.comboSnapshot) as { name: string }).name; } catch { /* */ } }
                    return it.combo?.name ?? "কমবো";
                  }
                  return it.product?.name ?? "পণ্য";
                }).join("") + (o.items.length > 1 ? ` +${o.items.length - 1}টি` : "");
                const isSelected = selectedIds.has(o.id);
                const initials = (o.customer?.name ?? "?")[0].toUpperCase();
                const AVATAR_COLORS = ["#0F6E56","#3B82F6","#8B5CF6","#EF4444","#EF9F27","#EC4899","#06B6D4","#14B8A6"];
                const avatarBg = AVATAR_COLORS[(o.customer?.name ?? "?").charCodeAt(0) % AVATAR_COLORS.length];
                return (
                  <tr key={o.id}
                    className="border-b last:border-0 cursor-pointer transition-colors"
                    style={{ borderColor: S.border, backgroundColor: isSelected ? "var(--c-primary-light)" : "transparent" }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--c-primary-light)"; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    onClick={() => window.location.href = `/orders/${o.id}`}
                  >
                    {/* Checkbox */}
                    <td className="pl-4 pr-2 py-4 w-9" onClick={e => { e.stopPropagation(); toggleSelect(o.id); }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(o.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-green-700" />
                    </td>

                    {/* Customer + Order ID */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: avatarBg }}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{o.customer?.name ?? "অজানা"}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: "var(--c-bg)", color: S.muted }}>#{o.id.slice(-6).toUpperCase()}</span>
                            {o.customer?.phone && <span className="text-[11px]" style={{ color: S.muted }}>{o.customer.phone}</span>}
                            {o.storeOrderId && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>🛍 স্টোর</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3.5 max-w-[160px]">
                      <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{summary}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{o.items.length} আইটেম</p>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold font-mono" style={{ color: S.text }}>{formatBDT(o.totalAmount)}</p>
                      {o.dueAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg mt-0.5"
                          style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                          বাকি {formatBDT(o.dueAmount)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg mt-0.5"
                          style={{ backgroundColor: "#D1FAE5", color: "#059669" }}>
                          ✓ পরিশোধিত
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => openMenu(e, "status", o.id)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl transition-all hover:opacity-80 active:scale-95 shadow-sm"
                        style={{ backgroundColor: st.bg, color: st.text }}
                        title="স্ট্যাটাস পরিবর্তন করুন"
                      >
                        {updatingIds.has(o.id)
                          ? <Loader2 size={10} className="animate-spin" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        }
                        {st.label}
                      </button>
                    </td>

                    {/* Courier */}
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      {o.courierTrackId ? (
                        <div>
                          <p className="text-xs font-bold" style={{ color: S.text }}>{COURIER_LABEL[o.courierName ?? ""] ?? o.courierName}</p>
                          {courierSt ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg mt-0.5 inline-block" style={{ backgroundColor: courierSt.bg, color: courierSt.text }}>
                              {courierSt.label}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: S.muted }}>ID: {o.courierTrackId.slice(0, 8)}…</span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={e => { setInlineTrackInput(""); openMenu(e, "courier", o.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all hover:opacity-80 active:scale-95"
                          style={{ backgroundColor: "#EFF6FF", color: "#3B82F6", border: "1.5px dashed #93C5FD" }}
                        >
                          <Truck size={11} /> বুক করুন
                        </button>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold" style={{ color: S.secondary }}>{formatRelativeDate(o.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 w-10" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => openMenu(e, "actions", o.id)}
                        className="p-2 rounded-xl transition-colors hover:bg-gray-100"
                        style={{ color: S.muted }}
                        title="দ্রুত কাজ"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────── */}
      {data.pages > 1 && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-medium" style={{ color: S.muted }}>
            <span className="font-bold" style={{ color: S.text }}>{data.total}</span> অর্ডার — পৃষ্ঠা{" "}
            <span className="font-bold" style={{ color: S.text }}>{data.page}</span>/{data.pages}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1.5 px-4 h-9 rounded-2xl border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-all active:scale-95"
              style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}>
              <ChevronLeft size={14} /> আগের
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className="w-9 h-9 rounded-2xl text-sm font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: page === pg ? S.primary : S.surface,
                      color: page === pg ? "#fff" : S.secondary,
                      border: `1px solid ${page === pg ? S.primary : S.border}`,
                    }}>
                    {pg}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="flex items-center gap-1.5 px-4 h-9 rounded-2xl border text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-all active:scale-95"
              style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}>
              পরের <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Menus ──────────────────────────── */}
      {quickMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setQuickMenu(null)} />

          {/* Status Menu */}
          {quickMenu.type === "status" && (
            <div
              className="fixed z-50 py-2 rounded-2xl shadow-2xl border overflow-hidden"
              style={{
                top: Math.min(quickMenu.y, window.innerHeight - 260),
                left: quickMenu.x,
                backgroundColor: S.surface,
                borderColor: S.border,
                minWidth: 190,
              }}
            >
              <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: S.muted }}>স্ট্যাটাস পরিবর্তন</p>
              <div className="h-px mb-1" style={{ backgroundColor: S.border }} />
              {STATUS_OPTIONS.map(s => {
                const current = data.orders.find(o => o.id === quickMenu.orderId)?.status;
                return (
                  <button key={s.key} onClick={() => quickUpdateStatus(quickMenu.orderId, s.key)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                    style={{ color: S.text, opacity: current === s.key ? 0.4 : 1 }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                    <span className="flex-1">{s.label}</span>
                    {current === s.key && <span className="text-xs" style={{ color: S.muted }}>✓ বর্তমান</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Courier Booking Panel */}
          {quickMenu.type === "courier" && (
            <div
              className="fixed z-50 rounded-2xl shadow-2xl border overflow-hidden"
              style={{
                top: Math.min(quickMenu.y, window.innerHeight - 440),
                left: Math.min(quickMenu.x, window.innerWidth - 280),
                backgroundColor: S.surface,
                borderColor: S.border,
                width: 272,
              }}
            >
              <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: S.border }}>
                <Truck size={14} style={{ color: S.primary }} />
                <span className="text-sm font-semibold" style={{ color: S.text }}>কুরিয়ার বুক করুন</span>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs mb-2 font-medium" style={{ color: S.muted }}>কুরিয়ার বেছে নিন</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {COURIER_LIST.map(c => (
                      <button key={c.key} onClick={() => { setInlineCourier(c.key); setInlineTrackInput(""); }}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all"
                        style={{
                          backgroundColor: inlineCourier === c.key ? "var(--c-primary-light)" : "transparent",
                          borderColor: inlineCourier === c.key ? S.primary : S.border,
                          color: inlineCourier === c.key ? S.primary : S.secondary,
                        }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {COURIER_LIST.find(c => c.key === inlineCourier)?.manual && (
                  <div>
                    <p className="text-xs mb-1.5 font-medium" style={{ color: S.muted }}>Tracking ID পেস্ট করুন</p>
                    <input
                      type="text"
                      value={inlineTrackInput}
                      onChange={e => setInlineTrackInput(e.target.value)}
                      placeholder="Courier ওয়েবসাইট থেকে বুক করে ID দিন"
                      className="w-full px-3 py-2 text-sm rounded-xl border outline-none"
                      style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                    />
                    <p className="text-xs mt-1" style={{ color: S.muted }}>
                      প্রথমে courier এর website থেকে বুক করুন, তারপর Tracking ID এখানে লিখুন।
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setQuickMenu(null)}
                    className="flex-1 py-2 rounded-xl text-sm border transition-colors"
                    style={{ borderColor: S.border, color: S.secondary }}>
                    বাতিল
                  </button>
                  <button
                    onClick={() => bookCourierInline(quickMenu.orderId)}
                    disabled={bookingInline}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
                    style={{ backgroundColor: S.primary }}>
                    {bookingInline ? <Loader2 size={14} className="animate-spin mx-auto" /> : "বুক করুন"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions Menu */}
          {quickMenu.type === "actions" && (
            <div
              className="fixed z-50 py-2 rounded-2xl shadow-2xl border overflow-hidden"
              style={{
                top: Math.min(quickMenu.y, window.innerHeight - 220),
                left: Math.min(quickMenu.x, window.innerWidth - 200),
                backgroundColor: S.surface,
                borderColor: S.border,
                minWidth: 190,
              }}
            >
              <Link href={`/orders/${quickMenu.orderId}`}
                onClick={() => setQuickMenu(null)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                style={{ color: S.text }}>
                <ExternalLink size={14} style={{ color: S.muted }} /> অর্ডার খুলুন
              </Link>
              <button
                onClick={() => { setQuickMenu(null); setSlipLoadingId(quickMenu.orderId); router.push(`/orders/${quickMenu.orderId}/slip`); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                style={{ color: S.text }}>
                <Printer size={14} style={{ color: S.muted }} /> স্লিপ প্রিন্ট
              </button>
              {!data.orders.find(o => o.id === quickMenu.orderId)?.courierTrackId && (
                <button
                  onClick={() => { setInlineTrackInput(""); setQuickMenu({ ...quickMenu, type: "courier" }); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: S.primary }}>
                  <Truck size={14} /> কুরিয়ার বুক করুন
                </button>
              )}
              <div className="h-px my-1" style={{ backgroundColor: S.border }} />
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide" style={{ color: S.muted }}>স্ট্যাটাস বদলান</p>
              {STATUS_OPTIONS.map(s => {
                const current = data.orders.find(o => o.id === quickMenu.orderId)?.status;
                return (
                  <button key={s.key} onClick={() => quickUpdateStatus(quickMenu.orderId, s.key)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                    style={{ color: S.text, opacity: current === s.key ? 0.4 : 1 }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                    {s.label}
                    {current === s.key && <span className="text-xs ml-auto" style={{ color: S.muted }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Order Create Panel ── */}
      {createPanelOpen && (
        <OrderCreatePanel
          onClose={() => { setCreatePanelOpen(false); setPanelPrefillName(undefined); setPanelPrefillSuggestId(undefined); }}
          onCreated={() => { loadOrders(1); setPage(1); }}
          prefillCustomerName={panelPrefillName}
          prefillSuggestId={panelPrefillSuggestId}
        />
      )}
    </div>
  );
}
