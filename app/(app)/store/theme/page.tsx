"use client";

import { useEffect, useState } from "react";
import { Palette, Check, Loader2, ExternalLink } from "lucide-react";
import { minimalTheme } from "@/lib/themes";

interface ShopData {
  storeTheme: string;
  storePrimaryColor: string | null;
  storeAccentColor: string | null;
  storeSlug: string | null;
}

const S_VARS = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  secondary: "var(--c-text-sub)",
  primary: "var(--c-primary)",
};

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
        <Loader2 size={24} className="animate-spin" style={{ color: S_VARS.muted }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
            <Palette size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S_VARS.text }}>স্টোর থিম</h1>
            <p className="text-xs" style={{ color: S_VARS.muted }}>থিমের রং কাস্টমাইজ করুন</p>
          </div>
        </div>
        {shop?.storeSlug && (
          <a
            href={`/store/${shop.storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-medium"
            style={{ borderColor: S_VARS.border, color: S_VARS.primary }}
          >
            <ExternalLink size={13} /> লাইভ স্টোর
          </a>
        )}
      </div>

      <div
        className="rounded-2xl border-2 overflow-hidden"
        style={{ borderColor: "var(--c-primary)" }}
      >
        <div className="p-5 flex items-center justify-between" style={{ backgroundColor: S_VARS.surface, borderBottom: `1px solid ${S_VARS.border}` }}>
          <div>
            <p className="font-bold text-sm" style={{ color: S_VARS.text }}>
              মিনিমাল <span className="font-normal opacity-60">(Minimal)</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: S_VARS.muted }}>সাধারণ ও পরিষ্কার ডিজাইন, সব ধরনের পণ্যের জন্য</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#10B981" }}>
            <Check size={12} /> ব্যবহার হচ্ছে
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-3" style={{ backgroundColor: S_VARS.surface }}>
          {[
            { label: "প্রাথমিক রঙ", value: primaryColor, onChange: (v: string) => { setPrimaryColor(v); setColorsDirty(true); } },
            { label: "সাথী রঙ (Accent)", value: accentColor, onChange: (v: string) => { setAccentColor(v); setColorsDirty(true); } },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="text-xs font-medium mb-2 block" style={{ color: S_VARS.secondary }}>{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border"
                  style={{ borderColor: S_VARS.border }}
                />
                <span className="text-sm font-mono" style={{ color: S_VARS.text }}>{value}</span>
              </div>
            </div>
          ))}
        </div>

        {colorsDirty && (
          <div className="px-5 pb-4" style={{ backgroundColor: S_VARS.surface }}>
            <p className="text-xs" style={{ color: S_VARS.muted }}>
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
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: "var(--c-primary)" }}
      >
        {saving ? "সেভ হচ্ছে..." : "প্রয়োগ করুন"}
      </button>
    </div>
  );
}
