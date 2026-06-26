"use client";

import { useState } from "react";
import { X, BadgeDollarSign, Loader2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";
import { PAYMENT_METHODS } from "@/lib/invoices/types";
import type { Invoice } from "@/lib/invoices/types";

export default function InvoicePaymentModal({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const due = Math.max(0, invoice.total - invoice.paidAmount);
  const [amount, setAmount] = useState(String(due));
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("সঠিক পরিমাণ দিন");
      return;
    }
    if (amt > due + 0.01) {
      setError(`সর্বোচ্চ ${formatBDT(due)} পরিশোধ করা যাবে`);
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record_payment",
        amount: amt,
        method,
        note: note || null,
        paidAt,
      }),
    });
    setLoading(false);
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? "সমস্যা হয়েছে");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <BadgeDollarSign size={22} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">পেমেন্ট রেকর্ড</h3>
              <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">মোট</span>
            <span className="font-bold">{formatBDT(invoice.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">পরিশোধিত</span>
            <span className="text-emerald-600 font-semibold">{formatBDT(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1">
            <span className="text-gray-700 font-semibold">বাকি</span>
            <span className="font-black text-red-600">{formatBDT(due)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">পরিমাণ (৳)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm"
            />
            <button
              type="button"
              onClick={() => setAmount(String(due))}
              className="text-xs text-emerald-700 font-bold mt-1 hover:underline"
            >
              সম্পূর্ণ পরিমাণ ({formatBDT(due)})
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">পেমেন্ট মাধ্যম</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">তারিখ</label>
            <DatePicker value={paidAt} onChange={setPaidAt} className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">নোট (ঐচ্ছিক)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="TxID বা মন্তব্য..."
              className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            পেমেন্ট সংরক্ষণ
          </button>
        </form>
      </div>
    </div>
  );
}
