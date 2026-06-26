"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";

const S = {
  primary: "#0F6E56", surface: "#FFFFFF", border: "#E8E6DF",
  text: "#1A1A18", textMuted: "#A8A69E", bg: "#F7F6F2",
};

interface BonusTier { min_amount: number; bonus_percent: number }

export default function SmsPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pricePerSmsMasking: 0.35,
    pricePerSmsNonMasking: 0.3,
    maskingEnabled: false,
    nonMaskingEnabled: true,
    minPurchaseAmount: 10,
    maxPurchaseAmount: "" as string | number,
    bonusCreditEnabled: false,
    bonusTiers: [] as BonusTier[],
    lowCreditAlertThreshold: 10,
    isSmsServiceActive: true,
  });

  useEffect(() => {
    fetch("/api/admin/sms/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          pricePerSmsMasking: d.pricePerSmsMasking ?? d.pricePerSms ?? 0.35,
          pricePerSmsNonMasking: d.pricePerSmsNonMasking ?? d.pricePerSms ?? 0.3,
          maskingEnabled: d.maskingEnabled ?? false,
          nonMaskingEnabled: d.nonMaskingEnabled ?? true,
          minPurchaseAmount: d.minPurchaseAmount ?? 10,
          maxPurchaseAmount: d.maxPurchaseAmount ?? "",
          bonusCreditEnabled: d.bonusCreditEnabled ?? false,
          bonusTiers: (d.bonusTiers as BonusTier[]) ?? [],
          lowCreditAlertThreshold: d.lowCreditAlertThreshold ?? 10,
          isSmsServiceActive: d.isSmsServiceActive ?? true,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/admin/sms/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxPurchaseAmount: form.maxPurchaseAmount === "" ? null : Number(form.maxPurchaseAmount),
      }),
    });
    setSaving(false);
  }

  if (loading) return <p>লোড হচ্ছে...</p>;

  return (
    <div className="max-w-xl">
      <Link href="/admin/sms-credits" className="flex items-center gap-1 text-sm mb-4" style={{ color: S.textMuted }}>
        <ArrowLeft size={14} /> SMS Credits
      </Link>
      <h1 className="text-xl font-bold mb-6" style={{ color: S.text }}>Pricing Management</h1>

      <div className="rounded-2xl border p-6 space-y-4" style={{ background: S.surface, borderColor: S.border }}>
        <label className="block text-sm">
          Non-Masking SMS মূল্য (৳/segment)
          <input type="number" step="0.01" value={form.pricePerSmsNonMasking}
            onChange={(e) => setForm((f) => ({ ...f, pricePerSmsNonMasking: parseFloat(e.target.value) }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border" style={{ borderColor: S.border }} />
        </label>

        {form.maskingEnabled && (
        <>
        <label className="block text-sm">
          Masking SMS মূল্য (৳/segment)
          <input type="number" step="0.01" value={form.pricePerSmsMasking}
            onChange={(e) => setForm((f) => ({ ...f, pricePerSmsMasking: parseFloat(e.target.value) }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border" style={{ borderColor: S.border }} />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-sm">Masking SMS সক্রিয়</span>
          <input type="checkbox" checked={form.maskingEnabled}
            onChange={(e) => setForm((f) => ({ ...f, maskingEnabled: e.target.checked }))} />
        </div>
        </>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm">Non-Masking SMS সক্রিয়</span>
          <input type="checkbox" checked={form.nonMaskingEnabled}
            onChange={(e) => setForm((f) => ({ ...f, nonMaskingEnabled: e.target.checked }))} />
        </div>

        <label className="block text-sm">
          সর্বনিম্ন কেনার পরিমাণ (BDT)
          <input type="number" value={form.minPurchaseAmount}
            onChange={(e) => setForm((f) => ({ ...f, minPurchaseAmount: parseFloat(e.target.value) }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border" style={{ borderColor: S.border }} />
        </label>
        <label className="block text-sm">
          সর্বোচ্চ কেনার পরিমাণ (খালি = সীমা নেই)
          <input type="number" value={form.maxPurchaseAmount}
            onChange={(e) => setForm((f) => ({ ...f, maxPurchaseAmount: e.target.value }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border" style={{ borderColor: S.border }} />
        </label>
        <label className="block text-sm">
          Low credit alert threshold
          <input type="number" value={form.lowCreditAlertThreshold}
            onChange={(e) => setForm((f) => ({ ...f, lowCreditAlertThreshold: parseInt(e.target.value) }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border" style={{ borderColor: S.border }} />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-sm">বোনাস ক্রেডিট সিস্টেম</span>
          <input type="checkbox" checked={form.bonusCreditEnabled}
            onChange={(e) => setForm((f) => ({ ...f, bonusCreditEnabled: e.target.checked }))} />
        </div>

        {form.bonusCreditEnabled && (
          <div className="space-y-2">
            <p className="text-xs font-bold" style={{ color: S.textMuted }}>বোনাস স্তর</p>
            {form.bonusTiers.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="number" placeholder="Min BDT" value={t.min_amount}
                  onChange={(e) => {
                    const tiers = [...form.bonusTiers];
                    tiers[i] = { ...tiers[i], min_amount: parseFloat(e.target.value) };
                    setForm((f) => ({ ...f, bonusTiers: tiers }));
                  }}
                  className="flex-1 px-2 py-1 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                <input type="number" placeholder="%" value={t.bonus_percent}
                  onChange={(e) => {
                    const tiers = [...form.bonusTiers];
                    tiers[i] = { ...tiers[i], bonus_percent: parseFloat(e.target.value) };
                    setForm((f) => ({ ...f, bonusTiers: tiers }));
                  }}
                  className="w-20 px-2 py-1 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, bonusTiers: f.bonusTiers.filter((_, j) => j !== i) }))}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setForm((f) => ({ ...f, bonusTiers: [...f.bonusTiers, { min_amount: 100, bonus_percent: 5 }] }))}
              className="flex items-center gap-1 text-xs font-bold" style={{ color: S.primary }}>
              <Plus size={12} /> নতুন স্তর
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: S.border }}>
          <span className="text-sm font-bold">SMS সার্ভিস সক্রিয়</span>
          <input type="checkbox" checked={form.isSmsServiceActive}
            onChange={(e) => setForm((f) => ({ ...f, isSmsServiceActive: e.target.checked }))} />
        </div>

        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
          style={{ background: S.primary }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          সেভ করুন
        </button>
      </div>
    </div>
  );
}
