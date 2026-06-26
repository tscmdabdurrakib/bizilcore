"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

const S = { primary: "#0F6E56", surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", textMuted: "#A8A69E" };

interface Discount {
  id: string;
  code: string | null;
  discountType: string;
  discountValue: number;
  minPurchaseAmount: number;
  maxUses: number | null;
  usedCount: number;
  validUntil: string | null;
  isActive: boolean;
  description: string | null;
}

const emptyForm = {
  code: "", discountType: "percent", discountValue: "", minPurchaseAmount: "0",
  maxUses: "", validUntil: "", description: "", isActive: true,
};

export default function SmsDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/sms/discounts");
    const d = await r.json();
    setDiscounts(d.discounts ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setSaving(true);
    await fetch("/api/admin/sms/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code || null,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minPurchaseAmount: parseFloat(form.minPurchaseAmount) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        validUntil: form.validUntil || null,
        description: form.description || null,
        isActive: form.isActive,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("মুছে ফেলবেন?")) return;
    await fetch(`/api/admin/sms/discounts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <Link href="/admin/sms-credits" className="flex items-center gap-1 text-sm mb-4" style={{ color: S.textMuted }}>
        <ArrowLeft size={14} /> SMS Credits
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: S.text }}>Discount Manager</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: S.primary }}>
          <Plus size={14} /> নতুন ডিসকাউন্ট
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border p-5 mb-6 space-y-3" style={{ background: S.surface, borderColor: S.border }}>
          <input placeholder="কোড (ঐচ্ছিক)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }} />
          <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }}>
            <option value="percent">শতাংশ</option>
            <option value="flat">নির্দিষ্ট পরিমাণ</option>
          </select>
          <input type="number" placeholder="মান" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }} />
          <input type="number" placeholder="ন্যূনতম কেনার পরিমাণ" value={form.minPurchaseAmount} onChange={(e) => setForm((f) => ({ ...f, minPurchaseAmount: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }} />
          <input type="number" placeholder="সর্বোচ্চ ব্যবহার (খালি = ∞)" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }} />
          <input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }} />
          <textarea placeholder="বিবরণ" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }} rows={2} />
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="flex-1 py-2 rounded-xl text-white font-bold text-sm" style={{ background: S.primary }}>
              {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "তৈরি করুন"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: S.border }}>বাতিল</button>
          </div>
        </div>
      )}

      {loading ? <p>লোড হচ্ছে...</p> : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: S.surface, borderColor: S.border }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#F7F6F2", color: S.textMuted }}>
                <th className="text-left px-4 py-3">কোড</th>
                <th className="text-left px-4 py-3">ধরন</th>
                <th className="text-left px-4 py-3">মান</th>
                <th className="text-left px-4 py-3">ব্যবহার</th>
                <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} style={{ borderTop: `1px solid ${S.border}` }}>
                  <td className="px-4 py-3 font-mono">{d.code ?? "(auto)"}</td>
                  <td className="px-4 py-3">{d.discountType}</td>
                  <td className="px-4 py-3">{d.discountType === "percent" ? `${d.discountValue}%` : `৳${d.discountValue}`}</td>
                  <td className="px-4 py-3">{d.usedCount}/{d.maxUses ?? "∞"}</td>
                  <td className="px-4 py-3">{d.isActive ? "সক্রিয়" : "বন্ধ"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(d.id)}><Trash2 size={14} color="#DC2626" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
