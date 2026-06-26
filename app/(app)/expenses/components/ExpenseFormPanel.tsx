"use client";

import { useEffect, useState } from "react";
import {
  X, Trash2, TrendingDown, Loader2, Save, ImageIcon, Repeat,
} from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import {
  EXPENSE_CATEGORIES, PAYMENT_METHODS, getExpenseCategory,
} from "@/lib/expenses/categories";
import type { Expense } from "@/lib/expenses/types";

interface Supplier { id: string; name: string; }

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

export default function ExpenseFormPanel({
  initial, onClose, onSave, isDesktop,
}: {
  initial?: Expense | null;
  onClose: () => void;
  onSave: () => void;
  isDesktop: boolean;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    amount: initial ? String(initial.amount) : "",
    category: initial?.category ?? "other",
    date: initial
      ? (initial.date?.split("T")[0] ?? new Date().toISOString().slice(0, 10))
      : new Date().toISOString().slice(0, 10),
    notes: initial?.notes ?? "",
    paymentMethod: initial?.paymentMethod ?? "",
    supplierId: initial?.supplierId ?? "",
    taxRate: initial ? String(initial.taxRate ?? "") : "",
    isRecurring: initial?.isRecurring ?? false,
    recurringInterval: initial?.recurringInterval ?? "monthly",
    receiptUrl: initial?.receiptUrl ?? "",
  });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  useEffect(() => {
    fetch("/api/suppliers").then(r => r.json()).then(d => {
      setSuppliers(Array.isArray(d) ? d : []);
    }).catch(() => {});
  }, []);

  function close() { setVisible(false); setTimeout(onClose, 300); }

  const baseAmount = parseFloat(form.amount || "0");
  const taxRate = parseFloat(form.taxRate || "0");
  const taxAmount = baseAmount * (taxRate / 100);

  async function uploadReceipt(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload/receipt", { method: "POST", body: fd });
      const d = await r.json();
      if (d.url) setForm(f => ({ ...f, receiptUrl: d.url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setLoading(true);
    const payload = { ...form, taxAmount, notes: form.notes };
    if (isEdit && initial) {
      await fetch(`/api/expenses/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setLoading(false);
    onSave();
    close();
  }

  const selCat = getExpenseCategory(form.category);

  return (
    <>
      <div
        onClick={close}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        className="fixed z-50 bg-white flex flex-col"
        style={isDesktop ? {
          top: 0, right: 0, bottom: 0, width: 460,
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
        }}
      >
        {!isDesktop && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
        )}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              <TrendingDown size={18} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{isEdit ? "খরচ সম্পাদনা" : "নতুন খরচ"}</p>
              <p className="text-xs text-gray-400">{isEdit ? "Edit expense" : "Add expense entry"}</p>
            </div>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">শিরোনাম *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="যেমন: মাসের অফিস ভাড়া" required className={fieldCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পরিমাণ (৳) *</label>
                <input type="number" min="0" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="০" required className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">তারিখ *</label>
                <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))}
                  className={fieldCls} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পেমেন্ট মাধ্যম</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className={fieldCls}>
                  <option value="">নির্বাচন করুন</option>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">VAT/Tax (%)</label>
                <input type="number" min="0" value={form.taxRate}
                  onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                  placeholder="০" className={fieldCls} />
                {taxAmount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Tax: ৳{taxAmount.toFixed(2)}</p>
                )}
              </div>
            </div>

            {suppliers.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">সাপ্লায়ার (ঐচ্ছিক)</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                  className={fieldCls}>
                  <option value="">—</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ক্যাটাগরি</label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const selected = form.category === cat.value;
                  return (
                    <button key={cat.value} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                      style={{ borderColor: selected ? cat.color : "#E5E7EB", backgroundColor: selected ? cat.bg : "#fff" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: selected ? cat.color + "22" : "#F3F4F6" }}>
                        <Icon size={13} style={{ color: selected ? cat.color : "#9CA3AF" }} />
                      </div>
                      <span className="text-xs font-semibold truncate"
                        style={{ color: selected ? cat.color : "#6B7280" }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ঐচ্ছিক মন্তব্য..." className={fieldCls} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">রসিদ / বিল (ঐচ্ছিক)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
                  <ImageIcon size={15} />
                  {uploading ? "আপলোড..." : "ছবি আপলোড"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(f); }} />
                </label>
                {form.receiptUrl && (
                  <a href={form.receiptUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 font-semibold truncate max-w-[160px]">
                    রসিদ দেখুন
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                  className="rounded"
                />
                <div className="flex items-center gap-2">
                  <Repeat size={15} className="text-purple-600" />
                  <span className="text-sm font-bold text-purple-900">পুনরাবৃত্ত খরচ</span>
                </div>
              </label>
              {form.isRecurring && (
                <select value={form.recurringInterval}
                  onChange={e => setForm(f => ({ ...f, recurringInterval: e.target.value }))}
                  className={fieldCls}>
                  <option value="weekly">সাপ্তাহিক</option>
                  <option value="monthly">মাসিক</option>
                  <option value="yearly">বার্ষিক</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button type="button" onClick={close}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
              বাতিল
            </button>
            <button type="submit" disabled={loading || !form.title || !form.amount}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> সেভ...</> : <><Save size={15} /> সেভ করুন</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
