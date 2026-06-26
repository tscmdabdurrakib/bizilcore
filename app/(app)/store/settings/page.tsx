"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageShell, Card, Button, Input, SectionTitle } from "@/components/ui";

interface ShopData {
  storeCODEnabled: boolean;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
  zinipayConfigured?: boolean;
  storeShippingFee: number;
  storeDhakaFee: number;
  storeFreeShipping: number | null;
  storeMinOrder: number | null;
  storeShowStock: boolean;
  storeShowReviews: boolean;
}

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [form, setForm] = useState({
    storeCODEnabled: true,
    storeBkashNumber: "",
    storeNagadNumber: "",
    storeDhakaFee: "60",
    storeShippingFee: "120",
    storeFreeShipping: "",
    storeMinOrder: "",
    storeShowStock: false,
    storeShowReviews: true,
    zinipayApiKey: "",
    zinipayConfigured: false,
  });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/shop")
      .then(r => r.json())
      .then((d: ShopData) => {
        setForm({
          storeCODEnabled: d.storeCODEnabled,
          storeBkashNumber: d.storeBkashNumber ?? "",
          storeNagadNumber: d.storeNagadNumber ?? "",
          storeDhakaFee: String(d.storeDhakaFee ?? 60),
          storeShippingFee: String(d.storeShippingFee ?? 120),
          storeFreeShipping: d.storeFreeShipping != null ? String(d.storeFreeShipping) : "",
          storeMinOrder: d.storeMinOrder != null ? String(d.storeMinOrder) : "",
          storeShowStock: d.storeShowStock,
          storeShowReviews: d.storeShowReviews,
          zinipayApiKey: "",
          zinipayConfigured: d.zinipayConfigured ?? false,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const r = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeCODEnabled: form.storeCODEnabled,
        storeBkashNumber: form.storeBkashNumber || null,
        storeNagadNumber: form.storeNagadNumber || null,
        storeDhakaFee: Number(form.storeDhakaFee) || 60,
        storeShippingFee: Number(form.storeShippingFee) || 120,
        storeFreeShipping: form.storeFreeShipping ? Number(form.storeFreeShipping) : null,
        storeMinOrder: form.storeMinOrder ? Number(form.storeMinOrder) : null,
        storeShowStock: form.storeShowStock,
        storeShowReviews: form.storeShowReviews,
        ...(form.zinipayApiKey.trim() ? { zinipayApiKey: form.zinipayApiKey.trim() } : {}),
      }),
    });
    setSaving(false);
    if (r.ok) showToast("success", "সেটিংস সেভ হয়েছে ✓");
    else showToast("error", "সেভ করা যায়নি");
  }

  const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ backgroundColor: value ? "var(--c-primary)" : "var(--c-border)" }}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  const NumberInput = ({ label, value, onChange, placeholder, prefix = "৳" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string }) => (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--c-text-sub)" }}>{label}</label>
      <div className="flex items-center gap-0 rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)" }}>
        <span className="px-3 py-2.5 text-sm border-r" style={{ backgroundColor: "var(--c-surface-raised)", color: "var(--c-text-muted)", borderColor: "var(--c-border)" }}>{prefix}</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm outline-none"
          style={{ backgroundColor: "transparent", color: "var(--c-text)" }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
      </div>
    );
  }

  return (
    <PageShell
      title="স্টোর সেটিংস"
      subtitle="ডেলিভারি, পেমেন্ট ও অন্যান্য সেটিংস"
      className="max-w-2xl"
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <Card className="space-y-4">
        <SectionTitle title="ডেলিভারি ফি" className="mb-0" />
        <NumberInput
          label="ডেলিভারি চার্জ — ঢাকা ও আশেপাশে (ঢাকা, গাজীপুর, নারায়ণগঞ্জ ইত্যাদি)"
          value={form.storeDhakaFee}
          onChange={v => setForm(f => ({ ...f, storeDhakaFee: v }))}
          placeholder="60"
        />
        <NumberInput
          label="ডেলিভারি চার্জ — ঢাকার বাইরে (সারাদেশ)"
          value={form.storeShippingFee}
          onChange={v => setForm(f => ({ ...f, storeShippingFee: v }))}
          placeholder="120"
        />
        <NumberInput
          label="ফ্রি ডেলিভারির সীমা (এর বেশি অর্ডারে ফ্রি)"
          value={form.storeFreeShipping}
          onChange={v => setForm(f => ({ ...f, storeFreeShipping: v }))}
          placeholder="0 = বন্ধ"
        />
        <NumberInput
          label="সর্বনিম্ন অর্ডার পরিমাণ"
          value={form.storeMinOrder}
          onChange={v => setForm(f => ({ ...f, storeMinOrder: v }))}
          placeholder="0 = নেই"
        />
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="পেমেন্ট পদ্ধতি" className="mb-0" />
        <Toggle
          value={form.storeCODEnabled}
          onChange={v => setForm(f => ({ ...f, storeCODEnabled: v }))}
          label="ক্যাশ অন ডেলিভারি (COD)"
          desc="ডেলিভারির সময় পেমেন্ট"
        />
        <Input
          label="bKash নম্বর"
          value={form.storeBkashNumber}
          onChange={e => setForm(f => ({ ...f, storeBkashNumber: e.target.value }))}
          placeholder="01XXXXXXXXX"
        />
        <Input
          label="Nagad নম্বর"
          value={form.storeNagadNumber}
          onChange={e => setForm(f => ({ ...f, storeNagadNumber: e.target.value }))}
          placeholder="01XXXXXXXXX"
        />
        <Input
          label="ZiniPay API Key (automatic payment verification)"
          type="password"
          value={form.zinipayApiKey}
          onChange={e => setForm(f => ({ ...f, zinipayApiKey: e.target.value }))}
          placeholder={form.zinipayConfigured ? "•••••••• (configured — new key to replace)" : "ZiniPay service API key"}
          className="font-mono"
          hint={form.zinipayConfigured
            ? "Auto verification সক্রিয়। নতুন key দিলে replace হবে।"
            : "Optional — set করলে customer TxID automatic verify হবে।"}
        />
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="ডিসপ্লে সেটিংস" className="mb-0" />
        <Toggle
          value={form.storeShowStock}
          onChange={v => setForm(f => ({ ...f, storeShowStock: v }))}
          label="স্টক পরিমাণ দেখাবে"
          desc="পণ্যের পেজে কতটি আছে তা দেখাবে"
        />
        <Toggle
          value={form.storeShowReviews}
          onChange={v => setForm(f => ({ ...f, storeShowReviews: v }))}
          label="রিভিউ দেখাবে"
          desc="স্টোরে কাস্টমার রিভিউ প্রদর্শন করবে"
        />
      </Card>

      <Button onClick={handleSave} disabled={saving} loading={saving} className="w-full" size="lg">
        {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
      </Button>
    </PageShell>
  );
}
