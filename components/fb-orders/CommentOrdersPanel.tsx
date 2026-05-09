"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  RefreshCw, Search, Download, CheckCircle, XCircle, PackageCheck,
  Clock, Trash2, Phone, ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import NewOrderToast from "@/components/fb-orders/NewOrderToast";
import OrderDetailDrawer from "@/components/fb-orders/OrderDetailDrawer";
import { extractContactInfo } from "@/lib/extract-contact";

interface Order {
  id: string;
  commenterName: string;
  commentText: string;
  pageName?: string | null;
  status: string;
  createdAt: string;
  fbProfile?: string | null;
  commenterFbId?: string | null;
  postId?: string | null;
  commentId?: string | null;
}

const STATUS_TABS = [
  { key: "all",       label: "সব",        color: "#0F6E56" },
  { key: "pending",   label: "অপেক্ষায়",  color: "#EF9F27" },
  { key: "confirmed", label: "কনফার্ম",   color: "#2B7CE9" },
  { key: "delivered", label: "ডেলিভারি",  color: "#0F6E56" },
  { key: "converted", label: "অর্ডার হয়েছে", color: "#8B5CF6" },
  { key: "cancelled", label: "বাতিল",     color: "#E24B4A" },
];

const DATE_PRESETS = [
  { key: "today", label: "আজ",      days: 1 },
  { key: "7d",    label: "৭ দিন",   days: 7 },
  { key: "30d",   label: "৩০ দিন",  days: 30 },
  { key: "all",   label: "সর্বদা",  days: null as number | null },
];

const PAGE_SIZE = 25;

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FFF3DC", color: "#EF9F27", label: "অপেক্ষায়" },
  confirmed: { bg: "#E1F0FF", color: "#2B7CE9", label: "কনফার্ম" },
  delivered: { bg: "#E1F5EE", color: "#0F6E56", label: "ডেলিভারি" },
  converted: { bg: "#F3E8FF", color: "#8B5CF6", label: "অর্ডার" },
  cancelled: { bg: "#FFE8E8", color: "#E24B4A", label: "বাতিল" },
};

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)} দিন আগে`;
}

function downloadCSV(rows: Order[]) {
  const headers = ["Name", "Comment", "Phone", "Page", "Status", "CreatedAt"];
  const lines = [headers.join(",")];
  for (const o of rows) {
    const { phones } = extractContactInfo(o.commentText);
    const cells = [
      o.commenterName,
      `"${(o.commentText ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      phones.join(" | "),
      o.pageName ?? "",
      o.status,
      o.createdAt,
    ];
    lines.push(cells.join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fb-comment-orders-${Date.now()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function CommentOrdersPanel() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("all");
  const [search, setSearch]   = useState("");
  const [datePreset, setDate] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [active, setActive]         = useState<Order | null>(null);
  const [visible, setVisible]       = useState(PAGE_SIZE);
  const [bulkBusy, setBulkBusy]     = useState(false);
  const toastTriggerRef = useRef<((name: string) => void) | null>(null);

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
      setActive((prev) => prev?.id === updated.id ? { ...prev, status: updated.status } as typeof prev : prev);
    }
  };

  const handleNewOrder = useCallback((fn: (name: string) => void) => {
    toastTriggerRef.current = fn;
  }, []);

  const pages = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) if (o.pageName) set.add(o.pageName);
    return Array.from(set);
  }, [orders]);

  const dateThreshold = useMemo(() => {
    const days = DATE_PRESETS.find((d) => d.key === datePreset)?.days;
    if (!days) return null;
    return Date.now() - days * 86400 * 1000;
  }, [datePreset]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (pageFilter !== "all" && o.pageName !== pageFilter) return false;
      if (dateThreshold && new Date(o.createdAt).getTime() < dateThreshold) return false;
      if (q && !(`${o.commenterName} ${o.commentText}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [orders, tab, search, dateThreshold, pageFilter]);

  useEffect(() => { setVisible(PAGE_SIZE); setSelected(new Set()); }, [tab, search, datePreset, pageFilter]);

  const shown = filtered.slice(0, visible);

  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  }), [orders]);

  const allSelected = shown.length > 0 && shown.every((o) => selected.has(o.id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(shown.map((o) => o.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkUpdate = async (status: string) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    await fetch("/api/fb-orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status } : o)));
    setSelected(new Set());
    setBulkBusy(false);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} টি মুছে ফেলবেন?`)) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    await fetch("/api/fb-orders/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setOrders((prev) => prev.filter((o) => !selected.has(o.id)));
    setSelected(new Set());
    setBulkBusy(false);
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl p-4 text-white relative overflow-hidden shadow-sm" style={{ background: c.gradient }}>
            <p className="text-xs font-medium mb-1 opacity-90">{c.label}</p>
            <span className="text-3xl font-bold">{c.value}</span>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 bg-white" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border p-3 flex flex-col gap-3" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম বা কমেন্ট খুঁজুন…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            />
          </div>

          {pages.length > 1 && (
            <select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm outline-none"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            >
              <option value="all">সব পেজ</option>
              {pages.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          <button
            onClick={() => downloadCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> রিফ্রেশ
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_TABS.map((t) => {
            const count = t.key === "all" ? orders.length : orders.filter((o) => o.status === t.key).length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: active ? t.color : "var(--c-surface)",
                  color:           active ? "#fff"   : "var(--c-text-sub)",
                  borderColor:     active ? t.color : "var(--c-border)",
                }}
              >
                {t.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
          <div className="flex-1" />
          <div className="flex items-center gap-1 p-1 rounded-full border" style={{ borderColor: "var(--c-border)" }}>
            {DATE_PRESETS.map((d) => (
              <button
                key={d.key}
                onClick={() => setDate(d.key)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  backgroundColor: datePreset === d.key ? "#0F6E56" : "transparent",
                  color: datePreset === d.key ? "#fff" : "var(--c-text-muted)",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          className="rounded-2xl border p-3 flex items-center gap-2 flex-wrap shadow-sm"
          style={{ borderColor: "#0F6E56", backgroundColor: "#E1F5EE" }}
        >
          <span className="text-sm font-semibold mr-2" style={{ color: "#0F6E56" }}>
            {selected.size} টি নির্বাচিত
          </span>
          <button
            disabled={bulkBusy}
            onClick={() => bulkUpdate("confirmed")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border transition-colors hover:bg-blue-50"
            style={{ borderColor: "#2B7CE9", color: "#2B7CE9" }}
          >
            <CheckCircle size={13} /> কনফার্ম
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => bulkUpdate("delivered")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border"
            style={{ borderColor: "#0F6E56", color: "#0F6E56" }}
          >
            <PackageCheck size={13} /> ডেলিভারি
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => bulkUpdate("cancelled")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border"
            style={{ borderColor: "#E24B4A", color: "#E24B4A" }}
          >
            <XCircle size={13} /> বাতিল
          </button>
          <button
            disabled={bulkBusy}
            onClick={bulkDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border ml-auto"
            style={{ borderColor: "#E24B4A", color: "#E24B4A" }}
          >
            <Trash2 size={13} /> মুছুন
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-medium px-2 py-1.5"
            style={{ color: "var(--c-text-muted)" }}
          >
            বাতিল
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div className="animate-spin w-6 h-6 rounded-full border-2 mx-auto" style={{ borderColor: "#0F6E56", borderTopColor: "transparent" }} />
          <p className="text-sm mt-3" style={{ color: "var(--c-text-muted)" }}>লোড হচ্ছে…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border text-center py-16" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold" style={{ color: "var(--c-text)" }}>কোনো অর্ডার নেই</p>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
            ফিল্টার পরিবর্তন করুন বা Facebook Webhook সেটআপ করুন
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--c-bg)" }}>
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                  </th>
                  {["কাস্টমার", "কমেন্ট ও তথ্য", "পেজ", "স্ট্যাটাস", "সময়", "একশন"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((order, i) => {
                  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending;
                  const { phones } = extractContactInfo(order.commentText);
                  const isSelected = selected.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer hover:bg-blue-50/30 transition-colors"
                      style={{
                        borderTop: i > 0 ? `1px solid var(--c-border)` : "none",
                        backgroundColor: isSelected ? "rgba(15,110,86,0.04)" : undefined,
                      }}
                      onClick={() => setActive(order)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleOne(order.id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--c-text)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#1877F2" }}>
                            {order.commenterName[0]?.toUpperCase()}
                          </div>
                          <span className="truncate max-w-[140px]">{order.commenterName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        <p className="line-clamp-2 leading-snug text-xs" style={{ color: "var(--c-text-sub)" }} title={order.commentText}>
                          {order.commentText}
                        </p>
                        {phones.length > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                            <Phone size={9} /> {phones[0]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: "#EEF3FD", color: "#1877F2" }}>
                          {order.pageName ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--c-text-muted)" }}>
                        <Clock size={12} className="inline mr-1 opacity-60" />
                        {relativeTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {order.status === "pending" && (
                            <button onClick={() => handleStatusChange(order.id, "confirmed")} title="কনফার্ম করুন" className="p-1.5 rounded-lg hover:bg-blue-50" style={{ color: "#2B7CE9" }}>
                              <CheckCircle size={15} />
                            </button>
                          )}
                          <Link
                            href={`/orders/new?customerName=${encodeURIComponent(order.commenterName)}&suggestId=${order.id}`}
                            title="অর্ডার তৈরি"
                            className="p-1.5 rounded-lg hover:bg-purple-50"
                            style={{ color: "#8B5CF6" }}
                          >
                            <ShoppingCart size={15} />
                          </Link>
                          {(order.status === "pending" || order.status === "confirmed") && (
                            <button onClick={() => handleStatusChange(order.id, "cancelled")} title="বাতিল" className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#E24B4A" }}>
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > visible && (
            <div className="border-t p-3 text-center" style={{ borderColor: "var(--c-border)" }}>
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
              >
                আরও দেখুন ({filtered.length - visible} বাকি)
              </button>
            </div>
          )}
        </div>
      )}

      <OrderDetailDrawer order={active} onClose={() => setActive(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}
