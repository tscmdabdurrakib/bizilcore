"use client";

import { useEffect, useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Package } from "lucide-react";
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

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)" };
const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`, borderRadius: "8px",
  color: "var(--c-text)", backgroundColor: "var(--c-surface)", padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

function NewPurchaseModal({ suppliers, products, onClose, onSave }: {
  suppliers: Supplier[]; products: Product[]; onClose: () => void; onSave: () => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([{ name: "", quantity: 1, unitPrice: 0 }]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const total = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

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
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-raised)" }}>
        <div className="sticky top-0 px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: S.border, backgroundColor: "var(--c-surface-raised)" }}>
          <h3 className="font-semibold text-base" style={{ color: S.text }}>নতুন মাল কেনা (Purchase)</h3>
          <button onClick={onClose}><X size={18} style={{ color: S.muted }} /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: S.muted }}>Supplier (ঐচ্ছিক)</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              style={{ ...inp(false), appearance: "auto" }}>
              <option value="">— Supplier বেছে নিন —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: S.muted }}>পণ্যের তালিকা *</label>
              <button type="button" onClick={addItem} className="text-xs font-medium" style={{ color: S.primary }}>+ আইটেম যোগ করুন</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border p-3 space-y-2" style={{ borderColor: S.border }}>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <select value={(item as unknown as Record<string, unknown>).productId as string ?? ""}
                        onChange={e => selectProduct(idx, e.target.value)}
                        style={{ ...inp(false), height: "36px", fontSize: "12px", appearance: "auto" }}>
                        <option value="">পণ্য বেছে নিন</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
                      </select>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-red-50">
                        <X size={14} style={{ color: "#E24B4A" }} />
                      </button>
                    )}
                  </div>
                  <input type="text" placeholder="পণ্যের নাম *" value={item.name}
                    onChange={e => updateItem(idx, "name", e.target.value)} required
                    style={{ ...inp(false), height: "36px", fontSize: "13px" }} />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] mb-0.5" style={{ color: S.muted }}>পরিমাণ</label>
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        style={{ ...inp(false), height: "36px", fontSize: "13px" }} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] mb-0.5" style={{ color: S.muted }}>ক্রয়মূল্য (৳)</label>
                      <input type="number" min="0" value={item.unitPrice || ""}
                        onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        style={{ ...inp(false), height: "36px", fontSize: "13px" }} />
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                      <label className="block text-[10px] mb-0.5" style={{ color: S.muted }}>সাবটোটাল</label>
                      <div className="h-9 flex items-center px-2 rounded-lg" style={{ backgroundColor: "var(--c-bg)", fontSize: "13px", fontWeight: 600, color: S.text }}>
                        ৳{(item.quantity * item.unitPrice).toLocaleString("bn-BD")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--c-primary-light)" }}>
            <span className="text-sm font-semibold" style={{ color: S.primary }}>মোট</span>
            <span className="text-base font-bold" style={{ color: S.primary }}>{formatBDT(total)}</span>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: S.muted }}>পরিশোধিত (৳)</label>
            <input type="number" min="0" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
              placeholder="০"
              style={inp(focused === "paid")} onFocus={() => setFocused("paid")} onBlur={() => setFocused(null)} />
            {paidAmount && total > 0 && (
              <p className="text-xs mt-1" style={{ color: total - parseFloat(paidAmount || "0") > 0 ? "#E24B4A" : S.primary }}>
                বাকি: {formatBDT(Math.max(0, total - parseFloat(paidAmount || "0")))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: S.muted }}>নোট</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="ঐচ্ছিক"
              style={inp(focused === "note")} onFocus={() => setFocused("note")} onBlur={() => setFocused(null)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {loading ? "সেভ..." : "Purchase সেভ করুন"}
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
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");

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
    await fetch(`/api/purchases/${purchaseId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addPayment: payAmt }),
    });
    setPaying(null); setPayAmt("");
    showToast("success", "পেমেন্ট যোগ হয়েছে ✓");
    load();
  }

  const totalDue = purchases.reduce((s, p) => s + p.dueAmount, 0);
  const totalPurchased = purchases.reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div>
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {showModal && (
        <NewPurchaseModal suppliers={suppliers} products={products}
          onClose={() => setShowModal(false)} onSave={load} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-xs mb-1" style={{ color: S.muted }}>মোট মাল কেনা</p>
          <p className="text-xl font-bold" style={{ color: S.text }}>{formatBDT(totalPurchased)}</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>{total}টি entry</p>
        </div>
        <div className="rounded-2xl border p-4" style={{ backgroundColor: totalDue > 0 ? "#FFF8EE" : S.surface, borderColor: totalDue > 0 ? "#F5D9A0" : S.border }}>
          <p className="text-xs mb-1" style={{ color: totalDue > 0 ? "#92600A" : S.muted }}>Supplier-কে বাকি</p>
          <p className="text-xl font-bold" style={{ color: totalDue > 0 ? "#E24B4A" : S.muted }}>{formatBDT(totalDue)}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ color: S.text }}>Purchase তালিকা</h2>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: S.primary }}>
          <Plus size={16} /> নতুন Purchase
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Package size={32} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm mb-3" style={{ color: S.muted }}>কোনো purchase entry নেই।</p>
          <button onClick={() => setShowModal(true)} className="text-sm font-medium" style={{ color: S.primary }}>+ নতুন Purchase যোগ করুন</button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            {purchases.map((p, i) => (
              <div key={p.id} className="border-b last:border-0 px-5 py-4" style={{ borderColor: S.border }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0E8FF" }}>
                    <Package size={18} style={{ color: "#7C3AED" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: S.text }}>
                        {p.supplier?.name ?? "Supplier নেই"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: p.status === "paid" ? "var(--c-primary-light)" : "#FFF3DC", color: p.status === "paid" ? "var(--c-primary)" : "#92600A" }}>
                        {p.status === "paid" ? "পরিশোধ" : "বাকি"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                      {p.items.map(it => `${it.name} ×${it.quantity}`).join(", ")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{formatRelativeDate(p.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(p.totalAmount)}</p>
                    {p.dueAmount > 0 && <p className="text-xs font-medium" style={{ color: "#E24B4A" }}>বাকি {formatBDT(p.dueAmount)}</p>}
                  </div>
                </div>
                {p.dueAmount > 0 && (
                  <div className="mt-3 pl-13">
                    {paying === p.id ? (
                      <div className="flex gap-2">
                        <input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="পরিমাণ"
                          className="h-8 px-2 rounded-lg border text-sm flex-1 outline-none" style={{ borderColor: S.border }} />
                        <button onClick={() => handlePayment(p.id)} className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: S.primary }}>পেমেন্ট</button>
                        <button onClick={() => { setPaying(null); setPayAmt(""); }} className="px-2 py-1 rounded-lg text-xs" style={{ color: S.muted }}>বাতিল</button>
                      </div>
                    ) : (
                      <button onClick={() => setPaying(p.id)} className="text-xs font-medium px-3 py-1 rounded-lg border" style={{ borderColor: S.primary, color: S.primary }}>
                        পেমেন্ট দিন
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-between mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40"
                style={{ borderColor: S.border, color: S.secondary }}>
                <ChevronLeft size={15} /> আগে
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm disabled:opacity-40"
                style={{ borderColor: S.border, color: S.secondary }}>
                পরে <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
