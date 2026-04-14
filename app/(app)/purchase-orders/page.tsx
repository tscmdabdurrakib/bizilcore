"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, X, ShoppingCart, Trash2, PackageCheck, Search, Download,
  Loader2, Save, ChevronDown, ChevronUp, Send, Ban, Building2,
  Package, Clock, CheckCircle2,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Supplier { id: string; name: string }

interface POItem {
  id: string; name: string; quantity: number; unitPrice: number; subtotal: number;
}

interface PurchaseOrder {
  id: string; poNumber: string; status: string; total: number;
  notes: string | null; expectedDate: string | null; receivedAt: string | null;
  createdAt: string; supplier: Supplier | null; items: POItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "খসড়া",           color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  sent:      { label: "পাঠানো হয়েছে",   color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  received:  { label: "পণ্য পাওয়া গেছে", color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  cancelled: { label: "বাতিল",           color: "#EF4444", bg: "#FEF2F2", dot: "#F87171" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date(0);
  const dt = new Date(y, m - 1, d); dt.setHours(0, 0, 0, 0); return dt;
}
function todayMidnight(): Date { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
function daysUntil(dateStr: string): number {
  return Math.round((parseLocalDate(dateStr).getTime() - todayMidnight().getTime()) / 86400000);
}
function ExpectedChip({ date, status }: { date: string | null; status: string }) {
  if (!date || status === "received" || status === "cancelled") return null;
  const diff = daysUntil(date);
  if (diff < 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{Math.abs(diff)} দিন বিলম্ব</span>;
  if (diff === 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">আজ পাওয়ার কথা</span>;
  if (diff <= 3) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{diff} দিনে আসবে</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{diff} দিনে আসবে</span>;
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const selectCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors appearance-none";

function CreatePanel({
  onClose, onSave, isDesktop, initialProduct, initialSupplierId,
}: {
  onClose: () => void; onSave: () => void; isDesktop: boolean;
  initialProduct?: string; initialSupplierId?: string;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [items, setItems] = useState([{ name: initialProduct ?? "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10);
    fetch("/api/suppliers?limit=100").then(r => r.json()).then(d => setSuppliers(d.suppliers ?? []));
  }, []);

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function close() { setVisible(false); setTimeout(onClose, 300); }
  function addItem() { setItems(p => [...p, { name: "", quantity: 1, unitPrice: 0 }]); }
  function updateItem(idx: number, field: string, val: string | number) {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }
  function removeItem(idx: number) { setItems(p => p.filter((_, i) => i !== idx)); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (items.some(i => !i.name)) return;
    setLoading(true);
    await fetch("/api/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplierId || null, items, notes, expectedDate: expectedDate || null }),
    });
    setLoading(false);
    onSave(); close();
  }

  return (
    <>
      <div onClick={close} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }} />
      <div className="fixed z-50 bg-white flex flex-col"
        style={isDesktop ? {
          top: 0, right: 0, bottom: 0, width: 500,
          borderLeft: "1px solid #F3F4F6",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        } : {
          left: 0, right: 0, bottom: 0, height: "92svh",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}>

        {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
              <ShoppingCart size={18} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-gray-900">নতুন ক্রয় অর্ডার</p>
              <p className="text-xs text-gray-400">New Purchase Order</p>
            </div>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {(initialProduct || initialSupplierId) && (
              <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 font-medium">
                ⚡ প্রোডাক্ট ইন্টেলিজেন্স থেকে পূর্ব-পূরণ করা হয়েছে। পরিমাণ ও দাম সংশোধন করুন।
              </div>
            )}

            {/* Supplier */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">সরবরাহকারী (ঐচ্ছিক)</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={selectCls}>
                <option value="">— সরবরাহকারী বেছে নিন —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">পণ্যসমূহ *</label>
                <button type="button" onClick={addItem}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline">
                  <Plus size={12} /> পণ্য যোগ
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-2">
                    <div className="flex gap-2">
                      <input placeholder="পণ্যের নাম *" value={item.name}
                        onChange={e => updateItem(idx, "name", e.target.value)} required
                        className="flex-1 h-10 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400 placeholder:text-gray-400" />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)}
                          className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-colors">
                          <X size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">পরিমাণ</label>
                        <input type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">একক মূল্য (৳)</label>
                        <input type="number" min="0" value={item.unitPrice || ""}
                          onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">সাবটোটাল</label>
                        <div className="h-9 flex items-center px-3 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-700">
                          ৳{(item.quantity * item.unitPrice).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected date + notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">প্রত্যাশিত তারিখ</label>
                <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ঐচ্ছিক..." className={fieldCls} />
              </div>
            </div>

            {/* Total */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800">মোট মূল্য</span>
              <span className="text-2xl font-black text-emerald-800">{formatBDT(total)}</span>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button type="button" onClick={close}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> তৈরি হচ্ছে...</> : <><Save size={15} /> অর্ডার তৈরি</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function POCard({
  order, isExpanded, onToggle, onChangeStatus, onDeleteRequest,
}: {
  order: PurchaseOrder; isExpanded: boolean; onToggle: () => void;
  onChangeStatus: (id: string, status: string) => void;
  onDeleteRequest: (order: PurchaseOrder) => void;
}) {
  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/40 transition-colors">
        {/* Supplier avatar */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: order.supplier ? "linear-gradient(135deg,#0F6E56,#065E48)" : "#F3F4F6" }}>
          {order.supplier
            ? <span className="text-white font-black text-xs">{order.supplier.name.slice(0, 2).toUpperCase()}</span>
            : <Building2 size={16} className="text-gray-400" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top: PO number + total */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-black text-emerald-700">{order.poNumber}</span>
              <StatusBadge status={order.status} />
              <ExpectedChip date={order.expectedDate} status={order.status} />
            </div>
            <p className="font-black text-gray-900 text-base">{formatBDT(order.total)}</p>
          </div>

          {/* Supplier + date */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-gray-700 font-medium">
              {order.supplier?.name ?? <span className="text-gray-400 italic">সরবরাহকারী নেই</span>}
            </span>
            <span className="text-xs text-gray-400">• {new Date(order.createdAt).toLocaleDateString("bn-BD")}</span>
            {order.expectedDate && order.status !== "received" && (
              <span className="text-xs text-gray-400">• প্রত্যাশিত: {new Date(order.expectedDate).toLocaleDateString("bn-BD")}</span>
            )}
            {order.receivedAt && (
              <span className="text-xs text-emerald-600 font-semibold">• পাওয়া: {new Date(order.receivedAt).toLocaleDateString("bn-BD")}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {order.status === "draft" && (
              <button onClick={() => onChangeStatus(order.id, "sent")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                <Send size={11} /> Supplier-এ পাঠান
              </button>
            )}
            {order.status === "sent" && (
              <button onClick={() => onChangeStatus(order.id, "received")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <PackageCheck size={11} /> পণ্য পাওয়া গেছে
              </button>
            )}
            {(order.status === "draft" || order.status === "sent") && (
              <button onClick={() => onChangeStatus(order.id, "cancelled")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <Ban size={11} /> বাতিল করুন
              </button>
            )}

            <span className="w-px h-4 bg-gray-200" />

            <button onClick={() => onDeleteRequest(order)}
              className="p-1.5 rounded-xl hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>

          {order.notes && <p className="mt-2 text-xs text-gray-500">📝 {order.notes}</p>}
        </div>

        {/* Expand toggle */}
        <button onClick={onToggle}
          className="flex-shrink-0 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors mt-0.5">
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded items */}
      {isExpanded && (
        <div className="px-5 pb-5 bg-gray-50/60">
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">পণ্যের নাম</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">পরিমাণ</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">একক মূল্য</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-800 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatBDT(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">{formatBDT(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-100">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">মোট:</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 text-base">{formatBDT(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const prefillProduct = searchParams.get("product") ?? undefined;
  const prefillSupplierId = searchParams.get("supplierId") ?? undefined;

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (prefillProduct || prefillSupplierId) setShowPanel(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, [prefillProduct, prefillSupplierId]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const q = filterStatus ? `?status=${filterStatus}&limit=100` : "?limit=100";
    const res = await fetch(`/api/purchase-orders${q}`);
    const data = await res.json();
    setOrders(data.purchaseOrders ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const msgs: Record<string, string> = {
      sent: "Supplier-এ পাঠানো হয়েছে ✓",
      received: "পণ্য পাওয়া গেছে চিহ্নিত হয়েছে ✓",
      cancelled: "অর্ডার বাতিল করা হয়েছে",
    };
    showToast(msgs[status] ?? "Status আপডেট হয়েছে", "success");
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/purchase-orders/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    showToast("ক্রয় অর্ডার মুছে দেওয়া হয়েছে ✓", "success");
    load();
  }

  function handleExport() {
    setExporting(true);
    try {
      const rows = [["PO নং", "সরবরাহকারী", "তারিখ", "প্রত্যাশিত তারিখ", "স্ট্যাটাস", "মোট"]];
      for (const o of filtered) {
        rows.push([
          o.poNumber, o.supplier?.name ?? "—",
          new Date(o.createdAt).toLocaleDateString("bn-BD"),
          o.expectedDate ? new Date(o.expectedDate).toLocaleDateString("bn-BD") : "—",
          STATUS_CONFIG[o.status]?.label ?? o.status,
          String(o.total),
        ]);
      }
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "purchase-orders.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("Export ব্যর্থ", "error"); }
    setExporting(false);
  }

  // Stats
  const totalSpent      = orders.filter(o => o.status === "received").reduce((s, o) => s + o.total, 0);
  const totalPending    = orders.filter(o => o.status === "sent").reduce((s, o) => s + o.total, 0);
  const pendingCount    = orders.filter(o => o.status === "sent").length;
  const receivedCount   = orders.filter(o => o.status === "received").length;

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.poNumber.toLowerCase().includes(q) ||
      (o.supplier?.name ?? "").toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}>
          {toast.type === "success" ? <CheckCircle2 size={14} /> : <X size={14} />} {toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">অর্ডার মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-800">{deleteTarget.poNumber}</span> — {formatBDT(deleteTarget.total)}</p>
            <p className="text-xs text-gray-400 mb-6">এই ক্রয় অর্ডারটি স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">মুছে দিন</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel */}
      {showPanel && (
        <CreatePanel
          onClose={() => setShowPanel(false)}
          onSave={load}
          isDesktop={isDesktop}
          initialProduct={prefillProduct}
          initialSupplierId={prefillSupplierId}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
            <ShoppingCart size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ক্রয় অর্ডার (PO)</h1>
            <p className="text-xs text-gray-500">Supplier থেকে মাল কেনার formal অর্ডার তৈরি ও ট্র্যাক করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Download size={14} /> {exporting ? "..." : "CSV"}
          </button>
          <button onClick={() => setShowPanel(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
            <Plus size={16} /> নতুন PO
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />)
        ) : [
          { label: "মোট অর্ডার", value: `${orders.length}টি`, icon: ShoppingCart, bg: "#ECFDF5", fg: "#059669" },
          { label: "মোট ব্যয় (received)", value: formatBDT(totalSpent), icon: Package, bg: "#ECFDF5", fg: "#059669" },
          { label: "পাঠানো হয়েছে", value: `${pendingCount}টি — ${formatBDT(totalPending)}`, icon: Clock, bg: "#EFF6FF", fg: "#2563EB" },
          { label: "পণ্য পাওয়া গেছে", value: `${receivedCount}টি`, icon: CheckCircle2, bg: "#ECFDF5", fg: "#059669" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <p className="text-xl font-black text-gray-900 truncate">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── List Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="PO নং বা সরবরাহকারী..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div className="flex gap-1 flex-shrink-0 flex-wrap">
            {[{ value: "", label: "সব" }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map(tab => (
              <button key={tab.value} onClick={() => setFilterStatus(tab.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={{ backgroundColor: filterStatus === tab.value ? "#0F6E56" : "#F3F4F6", color: filterStatus === tab.value ? "#fff" : "#6B7280" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                  <div className="h-8 bg-gray-100 rounded w-48 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={28} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">কোনো ক্রয় অর্ডার পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mb-4">Supplier-এর কাছে প্রথম PO পাঠান</p>
            <button onClick={() => setShowPanel(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold mx-auto"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
              <Plus size={14} /> নতুন PO
            </button>
          </div>
        ) : (
          <>
            {filtered.map(order => (
              <POCard
                key={order.id}
                order={order}
                isExpanded={expandedId === order.id}
                onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                onChangeStatus={changeStatus}
                onDeleteRequest={setDeleteTarget}
              />
            ))}
            {/* Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{filtered.length}টি অর্ডার</span>
              <span className="font-black text-gray-900 text-base">{formatBDT(filtered.reduce((s, o) => s + o.total, 0))}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto p-12 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" /> লোড হচ্ছে...
      </div>
    }>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
