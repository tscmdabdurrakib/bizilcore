"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, Settings, Info } from "lucide-react";

interface ShopSettings {
  restOrderPrefix: string;
  restVatPct: number;
  restServiceChargePct: number;
  restKotAutoSend: boolean;
  restCurrency: string;
  restDefaultFloors: string[];
  restDeliveryEnabled: boolean;
  restAutoStockDeduct: boolean;
  restRequireShift: boolean;
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#EA580C",
  bg: "var(--c-bg)",
};

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <h3 className="text-sm font-bold mb-4 pb-3 border-b" style={{ color: S.text, borderColor: S.border }}>{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-xs font-semibold" style={{ color: S.text }}>{label}</p>
        {hint && <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: value ? S.primary : "#D1D5DB", minWidth: "40px", height: "22px" }}>
      <span className="absolute top-0.5 transition-all rounded-full w-4 h-4 bg-white shadow"
        style={{ left: value ? "calc(100% - 18px)" : "2px" }} />
    </button>
  );
}

export default function RestaurantSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    restOrderPrefix: "RES",
    restVatPct: 0,
    restServiceChargePct: 0,
    restKotAutoSend: false,
    restCurrency: "BDT",
    restDefaultFloors: ["Ground"],
    restDeliveryEnabled: true,
    restAutoStockDeduct: true,
    restRequireShift: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };
  const [floorsInput, setFloorsInput] = useState("Ground");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/shop");
      if (res.ok) {
        const shop = await res.json();
        setSettings({
          restOrderPrefix: shop.restOrderPrefix ?? "RES",
          restVatPct: shop.restVatPct ?? 0,
          restServiceChargePct: shop.restServiceChargePct ?? 0,
          restKotAutoSend: shop.restKotAutoSend ?? false,
          restCurrency: shop.restCurrency ?? "BDT",
          restDefaultFloors: shop.restDefaultFloors ?? ["Ground"],
          restDeliveryEnabled: shop.restDeliveryEnabled ?? true,
          restAutoStockDeduct: shop.restAutoStockDeduct ?? true,
          restRequireShift: shop.restRequireShift ?? false,
        });
        setFloorsInput((shop.restDefaultFloors ?? ["Ground"]).join(", "));
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const floors = floorsInput.split(",").map(f => f.trim()).filter(Boolean);
    const payload = { ...settings, restDefaultFloors: floors };
    try {
      const res = await fetch("/api/settings/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSettings(s => ({ ...s, restDefaultFloors: floors }));
        showToast("success", "সেটিংস সেভ হয়েছে");
      } else showToast("error", "সেভ করা যায়নি");
    } catch { showToast("error", "Error"); }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  const inp = (className?: string) =>
    `px-3 py-2 rounded-xl border text-sm outline-none w-full ${className ?? ""}`;
  const inpStyle = { borderColor: S.border, backgroundColor: S.bg, color: S.text };

  return (
    <>
    <div className="max-w-2xl mx-auto pb-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>রেস্তোরাঁ সেটিংস</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>আপনার রেস্তোরাঁ কনফিগার করুন</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: S.primary }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
        </button>
      </div>

      <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" }}>
        <Info size={16} style={{ color: "#3B82F6", marginTop: 2, flexShrink: 0 }} />
        <p className="text-xs" style={{ color: "#1E40AF" }}>
          এই সেটিংস পরিবর্তন করলে রেস্তোরাঁর সকল ফাংশনালিটি প্রভাবিত হবে। সতর্কতার সাথে পরিবর্তন করুন।
        </p>
      </div>

      <SettingSection title="সাধারণ সেটিংস">
        <FieldRow label="অর্ডার প্রিফিক্স" hint="অর্ডার নম্বরের শুরুতে বসবে">
          <input value={settings.restOrderPrefix}
            onChange={e => setSettings(s => ({ ...s, restOrderPrefix: e.target.value.toUpperCase() }))}
            maxLength={6}
            placeholder="RES"
            className={inp("max-w-[100px]")} style={inpStyle} />
        </FieldRow>
        <FieldRow label="মুদ্রা" hint="বিলে ব্যবহৃত মুদ্রা">
          <select value={settings.restCurrency} onChange={e => setSettings(s => ({ ...s, restCurrency: e.target.value }))}
            className={inp("max-w-[120px]")} style={inpStyle}>
            <option value="BDT">BDT (৳)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </FieldRow>
      </SettingSection>

      <SettingSection title="মূল্য ও চার্জ">
        <FieldRow label="VAT (%)" hint="0 দিলে VAT প্রযোজ্য নয়">
          <input type="number" min="0" max="100" step="0.5" value={settings.restVatPct}
            onChange={e => setSettings(s => ({ ...s, restVatPct: Number(e.target.value) }))}
            className={inp("max-w-[100px]")} style={inpStyle} />
        </FieldRow>
        <FieldRow label="সার্ভিস চার্জ (%)" hint="0 দিলে সার্ভিস চার্জ নেই">
          <input type="number" min="0" max="100" step="0.5" value={settings.restServiceChargePct}
            onChange={e => setSettings(s => ({ ...s, restServiceChargePct: Number(e.target.value) }))}
            className={inp("max-w-[100px]")} style={inpStyle} />
        </FieldRow>
      </SettingSection>

      <SettingSection title="ফ্লোর ম্যানেজমেন্ট">
        <FieldRow label="ফ্লোরের তালিকা" hint="কমা দিয়ে আলাদা করুন">
          <input value={floorsInput} onChange={e => setFloorsInput(e.target.value)}
            placeholder="Ground, 1st Floor, Rooftop"
            className={inp()} style={inpStyle} />
          <p className="text-[10px] mt-1.5" style={{ color: S.muted }}>
            বর্তমান: {(floorsInput.split(",").map(f => f.trim()).filter(Boolean)).join(" · ")}
          </p>
        </FieldRow>
      </SettingSection>

      <SettingSection title="ফিচার চালু/বন্ধ">
        <FieldRow label="ডেলিভারি অর্ডার" hint="ডেলিভারি অর্ডার গ্রহণ করা হবে">
          <Toggle value={settings.restDeliveryEnabled} onChange={v => setSettings(s => ({ ...s, restDeliveryEnabled: v }))} />
        </FieldRow>
        <FieldRow label="KOT অটো সেন্ড" hint="অর্ডার দিলে কিচেনে স্বয়ংক্রিয় KOT যাবে">
          <Toggle value={settings.restKotAutoSend} onChange={v => setSettings(s => ({ ...s, restKotAutoSend: v }))} />
        </FieldRow>
        <FieldRow label="অটো স্টক ডিডাক্ট" hint="অর্ডার সম্পূর্ণ হলে কাঁচামালের স্টক কমবে">
          <Toggle value={settings.restAutoStockDeduct} onChange={v => setSettings(s => ({ ...s, restAutoStockDeduct: v }))} />
        </FieldRow>
        <FieldRow label="শিফট বাধ্যতামূলক" hint="POS-এ অর্ডার নিতে হলে আগে শিফট খুলতে হবে">
          <Toggle value={settings.restRequireShift} onChange={v => setSettings(s => ({ ...s, restRequireShift: v }))} />
        </FieldRow>
      </SettingSection>

      <div className="flex">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: S.primary }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
          {saving ? "সেভ হচ্ছে…" : "সব সেটিংস সেভ করুন"}
        </button>
      </div>
    </div>

    {toast && (
      <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
        style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
        {toast.msg}
      </div>
    )}
    </>
  );
}
