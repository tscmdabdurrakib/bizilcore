"use client";

import { useEffect, useState } from "react";
import { Palette, Check, Loader2, ExternalLink } from "lucide-react";
import { minimalTheme } from "@/lib/themes";
import { PageShell, Card, Badge, Button } from "@/components/ui";

interface ShopData {
  storeTheme: string;
  storePrimaryColor: string | null;
  storeAccentColor: string | null;
  storeSlug: string | null;
}

export default function StoreThemePage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState(minimalTheme.colors.primary);
  const [accentColor, setAccentColor] = useState(minimalTheme.colors.accent);
  const [colorsDirty, setColorsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/shop")
      .then(r => r.json())
      .then((d: ShopData) => {
        setShop(d);
        setPrimaryColor(d.storePrimaryColor ?? minimalTheme.colors.primary);
        setAccentColor(d.storeAccentColor ?? minimalTheme.colors.accent);
        if (d.storePrimaryColor || d.storeAccentColor) setColorsDirty(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const body: Record<string, string | null> = {
      storeTheme: "minimal",
      storePrimaryColor: colorsDirty ? primaryColor : null,
      storeAccentColor: colorsDirty ? accentColor : null,
    };
    const r = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.ok) {
      showToast("success", "থিম সেভ হয়েছে ✓");
      setShop(prev => prev ? { ...prev, storeTheme: "minimal" } : prev);
    } else {
      showToast("error", "সেভ করা যায়নি");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
      </div>
    );
  }

  return (
    <PageShell
      title="স্টোর থিম"
      subtitle="থিমের রং কাস্টমাইজ করুন"
      className="max-w-2xl"
      actions={shop?.storeSlug ? (
        <a href={`/store/${shop.storeSlug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" icon={ExternalLink}>লাইভ স্টোর</Button>
        </a>
      ) : undefined}
    >
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}
        >
          {toast.msg}
        </div>
      )}

      <Card padding="none" className="border-2 overflow-hidden border-[var(--c-primary)]">
        <div className="p-5 flex items-center justify-between border-b" style={{ borderColor: "var(--c-border)" }}>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--c-text)" }}>
              মিনিমাল <span className="font-normal opacity-60">(Minimal)</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>সাধারণ ও পরিষ্কার ডিজাইন, সব ধরনের পণ্যের জন্য</p>
          </div>
          <Badge variant="success"><Check size={12} className="inline mr-1" />ব্যবহার হচ্ছে</Badge>
        </div>

        <div className="p-5 grid grid-cols-2 gap-3">
          {[
            { label: "প্রাথমিক রঙ", value: primaryColor, onChange: (v: string) => { setPrimaryColor(v); setColorsDirty(true); } },
            { label: "সাথী রঙ (Accent)", value: accentColor, onChange: (v: string) => { setAccentColor(v); setColorsDirty(true); } },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="text-xs font-medium mb-2 block" style={{ color: "var(--c-text-sub)" }}>{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border"
                  style={{ borderColor: "var(--c-border)" }}
                />
                <span className="text-sm font-mono" style={{ color: "var(--c-text)" }}>{value}</span>
              </div>
            </div>
          ))}
        </div>

        {colorsDirty && (
          <div className="px-5 pb-4">
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              * কাস্টম রং সেভ করলে থিমের ডিফল্ট রং বাতিল হবে।{" "}
              <button
                className="underline"
                onClick={() => {
                  setPrimaryColor(minimalTheme.colors.primary);
                  setAccentColor(minimalTheme.colors.accent);
                  setColorsDirty(false);
                }}
              >
                রিসেট করুন
              </button>
            </p>
          </div>
        )}
      </Card>

      <Button onClick={handleSave} disabled={saving} loading={saving} className="w-full" size="lg">
        {saving ? "সেভ হচ্ছে..." : "প্রয়োগ করুন"}
      </Button>
    </PageShell>
  );
}
