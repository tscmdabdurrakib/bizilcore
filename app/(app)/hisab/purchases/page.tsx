"use client";

import { useEffect, useState } from "react";
import {
  Plus, X, ChevronLeft, ChevronRight, Package, ArrowLeft,
  Truck, BadgeDollarSign, ShoppingBag, Loader2, Save,
  CheckCircle, Clock, Filter,
} from "lucide-react";
import Link from "next/link";
import { formatBDT, formatRelativeDate } from "@/lib/utils";

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; sku: string | null }
interface PurchaseItem { name: string; productId?: string; quantity: number; unitPrice: number }
interface Purchase {
  id: string; totalAmount: number; paidAmount: number; dueAmount: number;
  status: string; note: string | null; createdAt: string;
  supplier: { id: string; name: string } | null;
  items: { name: string; quantity: number; unitPrice: number; subtotal: number }[];
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";
const selectCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors appearance-none";

function NewPurchaseModal({ suppliers, products, onClose, onSave }: {
  suppliers: Supplier[]; products: Product[]; onClose: () => void; onSave: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([{ name: "", quantity: 1, unitPrice: 0 }]);
  const [loading, setLoading] = useState(false);

  const total = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const due = Math.max(0, total - parseFloat(paidAmount || "0"));

  function addItem() { setItems(p => [...p, { name: "", quantity: 1, unitPrice: 0 }]); }
  function removeItem(idx: number) { setItems(p => p.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof PurchaseItem, val: string | number) {
    setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }
  function selectProduct(idx: number, productId: string) {
    const p = products.find(x => x.id === productId);
    if (p) updateItem(idx, "name", p.name);
    updateItem(idx, "productId" as keyof PurchaseItem, productId);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!items.some(i => i.name.trim())) return;
    setLoading(true);
    await fetch("/api/purchases", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplierId || null, items, paidAmount, note }),
    });
    setLoading(false);
    onSave(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
              <ShoppingBag size={16} color="#fff" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">নতুন Purchase</h3>
              <p className="text-xs text-gray-400">মাল কেনার এন্ট্রি করুন</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier (ঐচ্ছিক)</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={selectCls}>
              <option value="">— Supplier বেছে নিন —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-gray-700">পণ্যের তালিকা *</label>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline"><Plus size={13} /> আইটেম যোগ</button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 p-4 space-y-3 bg-gray-50">
                  <div className="flex gap-2">
                    <select value={(item as unknown as Record<string, unknown>).productId as string ?? ""}
                      onChange={e => selectProduct(idx, e.target.value)}
                      className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-xs text-gray-700 bg-white outline-none focus:border-gray-400 appearance-none">
                      <option value="">পণ্য বেছে নিন</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                    </select>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="w-9 h-9 rounded-xl hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0">
                        <X size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                  <input type="text" placeholder="পণ্যের নাম *" value={item.name}
                    onChange={e => updateItem(idx, "name", e.target.value)} required
                    className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">পরিমাণ</label>
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 bg-white outline-none focus:border-gray-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">ক্রয়মূল্য (৳)</label>
                      <input type="number" min="0" value={item.unitPrice || ""}
                        onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full h-9 border border-gray-200 rounded-xl px-3 text-sm text-gray-900 bg-white outline-none focus:border-gray-400" />
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

          {/* Total */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-50 border border-purple-100">
            <span className="text-sm font-bold text-purple-700">মোট মূল্য</span>
            <span className="text-lg font-black text-purple-700">{formatBDT(total)}</span>
          </div>

          {/* Paid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">পরিশোধিত (৳)</label>
            <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="০" className={fieldCls} />
            {paidAmount && total > 0 && (
              <div className={`mt-2 p-3 rounded-xl text-xs font-semibold ${due > 0 ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                {due > 0 ? `বাকি থাকবে: ${formatBDT(due)}` : "সম্পূর্ণ পরিশোধ হবে ✓"}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="ঐচ্ছিক মন্তব্য..." className={fieldCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : <><Save size={15} /> Purchase সেভ করুন</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    const [pr, sup, prod] = await Promise.all([
      fetch(`/api/purchases?page=${page}`).then(r => r.json()),
      fetch("/api/suppliers").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]);
    setPurchases(pr.purchases ?? []);
    setPages(pr.pages ?? 1);
    setTotal(pr.total ?? 0);
    setSuppliers(Array.isArray(sup) ? sup : []);
    setProducts(Array.isArray(prod) ? prod : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page]);

  async function handlePayment(purchaseId: string) {
    if (!payAmt || parseFloat(payAmt) <= 0) return;
    setPayLoading(true);
    await fetch(`/api/purchases/${purchaseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addPayment: payAmt }),
    });
    setPayLoading(false);
    setPaying(null); setPayAmt("");
    showToast("success", "পেমেন্ট যোগ হয়েছে ✓");
    load();
  }

  const totalDue = purchases.reduce((s, p) => s + p.dueAmount, 0);
  const totalPurchased = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const paidCount = purchases.filter(p => p.status === "paid").length;

  const filtered = purchases.filter(p => {
    if (statusFilter === "paid") return p.status === "paid";
    if (statusFilter === "pending") return p.status !== "paid";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {showModal && <NewPurchaseModal suppliers={suppliers} products={products} onClose={() => setShowModal(false)} onSave={load} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/hisab" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} className="text-gray-500" />
          </Link>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
            <ShoppingBag size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">মাল কেনা (Purchases)</h1>
            <p className="text-xs text-gray-500">Supplier থেকে পণ্য ক্রয়ের হিসাব</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
          <Plus size={16} /> নতুন Purchase
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />)
        ) : [
          { label: "মোট কেনা", value: formatBDT(totalPurchased), icon: ShoppingBag, bg: "#F5F3FF", fg: "#7C3AED" },
          { label: "মোট Entry", value: `${total}টি`, icon: Package, bg: "#EFF6FF", fg: "#1D4ED8" },
          { label: "পরিশোধ হয়েছে", value: `${paidCount}টি`, icon: CheckCircle, bg: "#F0FDF4", fg: "#15803D" },
          { label: "Supplier বাকি", value: formatBDT(totalDue), icon: BadgeDollarSign, bg: totalDue > 0 ? "#FFF1F2" : "#F0FDF4", fg: totalDue > 0 ? "#DC2626" : "#15803D" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Purchase List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 flex-shrink-0">
            <Filter size={14} className="text-gray-400" /> ফিল্টার:
          </div>
          <div className="flex gap-1">
            {([["all", "সব"], ["paid", "পরিশোধ"], ["pending", "বাকি"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ backgroundColor: statusFilter === k ? "#7C3AED" : "#F3F4F6", color: statusFilter === k ? "#fff" : "#6B7280" }}>
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 ml-auto">{filtered.length}টি দেখাচ্ছে</p>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-5 animate-pulse">
                <div className="w-11 h-11 bg-gray-100 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-48" /><div className="h-3 bg-gray-100 rounded w-64" /><div className="h-3 bg-gray-100 rounded w-32" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" }}>
              <Package size={28} className="text-purple-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium">কোনো purchase entry নেই।</p>
            <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#7C3AED,#5B21B6)" }}>
              + নতুন Purchase যোগ করুন
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {filtered.map(p => (
                <div key={p.id} className="px-5 py-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" }}>
                      {p.supplier ? <Truck size={18} className="text-purple-600" /> : <Package size={18} className="text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-900 text-sm">{p.supplier?.name ?? "Supplier নেই"}</p>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: p.status === "paid" ? "#ECFDF5" : "#FFFBEB", color: p.status === "paid" ? "#059669" : "#92400E" }}>
                          {p.status === "paid" ? "✓ পরিশোধ" : "⏳ বাকি"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-0.5 truncate">
                        {p.items.map(it => `${it.name} ×${it.quantity}`).join(" · ")}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {formatRelativeDate(p.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-gray-900 text-base">{formatBDT(p.totalAmount)}</p>
                      {p.dueAmount > 0 && <p className="text-xs font-bold text-red-600 mt-0.5">বাকি {formatBDT(p.dueAmount)}</p>}
                    </div>
                  </div>

                  {/* Payment Row */}
                  {p.dueAmount > 0 && (
                    <div className="mt-3 ml-15 pl-0">
                      {paying === p.id ? (
                        <div className="flex gap-2 mt-2">
                          <input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="পরিমাণ লিখুন..."
                            className="h-9 px-3 rounded-xl border border-gray-200 text-sm flex-1 outline-none focus:border-purple-400 bg-gray-50" />
                          <button onClick={() => handlePayment(p.id)} disabled={payLoading}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60 flex items-center gap-1"
                            style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                            {payLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} পেমেন্ট
                          </button>
                          <button onClick={() => { setPaying(null); setPayAmt(""); }}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">বাতিল</button>
                        </div>
                      ) : (
                        <button onClick={() => setPaying(p.id)}
                          className="mt-2 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all hover:bg-purple-50"
                          style={{ borderColor: "#7C3AED", color: "#7C3AED" }}>
                          <BadgeDollarSign size={13} /> পেমেন্ট দিন
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  <ChevronLeft size={15} /> আগে
                </button>
                <span className="text-sm text-gray-500 font-medium">{page} / {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                  পরে <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
