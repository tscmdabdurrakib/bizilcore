"use client";

import { useEffect, useState } from "react";
import { Palette, Check, Loader2, ExternalLink } from "lucide-react";
import { THEMES } from "@/lib/themes";
import type { ThemeConfig } from "@/lib/themes";

interface ShopData {
  storeTheme: string;
  storePrimaryColor: string | null;
  storeAccentColor: string | null;
  storeSlug: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  fashion: "পোশাক",
  food: "খাবার",
  general: "সাধারণ",
  pharmacy: "ফার্মেসি",
};

function ThemeMockup({ theme }: { theme: ThemeConfig }) {
  const { colors, layout, components } = theme;
  const radius =
    components.borderRadius === "rounded-none" ? "0" :
    components.borderRadius === "rounded-sm" ? "3px" :
    components.borderRadius === "rounded-md" ? "5px" :
    components.borderRadius === "rounded-xl" ? "8px" :
    components.borderRadius === "rounded-2xl" ? "10px" :
    "999px";

  return (
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="280" height="160" fill={colors.background} />

      <rect x="0" y="0" width="280" height="26" fill={layout.navBg} />
      <rect x="8" y="9" width="36" height="8" rx="2" fill={layout.navTextColor + "99"} />
      {layout.navStyle === "topbar_centered" ? (
        <rect x="110" y="9" width="60" height="8" rx="2" fill={layout.navTextColor + "99"} />
      ) : (
        <>
          <rect x="90" y="11" width="100" height="5" rx="2.5" fill={layout.navTextColor + "40"} />
        </>
      )}
      <rect x="248" y="8" width="24" height="10" rx="5" fill={colors.primary} />

      {layout.heroStyle === "fullwidth_image" ? (
        <>
          <rect x="0" y="26" width="280" height="70" fill={colors.primary + "66"} />
          <rect x="0" y="26" width="280" height="70" fill="rgba(0,0,0,0.45)" />
          <rect x="8" y="38" width="100" height="12" rx="1" fill="#fff" opacity="0.95" />
          <rect x="8" y="55" width="60" height="6" rx="1" fill="#fff" opacity="0.6" />
          <rect x="8" y="65" width="40" height="14" rx={radius} fill={colors.accent} opacity="0.95" />
        </>
      ) : layout.heroStyle === "split_text_image" ? (
        <>
          <rect x="0" y="26" width="280" height="70" fill={colors.background} />
          <rect x="8" y="34" width="90" height="10" rx="1" fill={colors.text} opacity="0.85" />
          <rect x="8" y="49" width="60" height="5" rx="1" fill={colors.textMuted} opacity="0.6" />
          <rect x="8" y="60" width="35" height="12" rx={radius} fill={colors.primary} />
          <rect x="148" y="30" width="122" height="60" rx={radius === "0" ? "0" : "8"} fill={colors.primary + "44"} />
          <circle cx="209" cy="60" r="20" fill={colors.primary + "55"} />
        </>
      ) : layout.heroStyle === "banner_slider" ? (
        <>
          <rect x="0" y="26" width="280" height="60" fill={colors.primary + "33"} />
          <rect x="80" y="36" width="120" height="10" rx="1" fill={colors.text} opacity="0.85" />
          <rect x="100" y="51" width="80" height="8" rx="1" fill={colors.textMuted} opacity="0.6" />
          <rect x="115" y="65" width="50" height="10" rx={radius} fill={colors.primary} />
          <circle cx="130" cy="88" r="3" fill={colors.primary} />
          <circle cx="140" cy="88" r="2" fill={colors.primary + "50"} />
          <circle cx="150" cy="88" r="2" fill={colors.primary + "50"} />
        </>
      ) : (
        <>
          <rect x="0" y="26" width="280" height="55" fill={colors.background} />
          <rect x="90" y="35" width="100" height="10" rx="1" fill={colors.text} opacity="0.85" />
          <rect x="100" y="50" width="80" height="7" rx="1" fill={colors.textMuted} opacity="0.5" />
          <rect x="110" y="62" width="60" height="12" rx={radius} fill={colors.primary} />
        </>
      )}

      <g transform="translate(0, 97)">
        {(() => {
          const cols = layout.productGridCols;
          const colW = (280 - 8 * (cols + 1)) / cols;
          return Array.from({ length: Math.min(cols, 4) }).map((_, i) => {
            const x = 8 + i * (colW + 8);
            if (layout.productCardStyle === "image_overlay") {
              return (
                <g key={i}>
                  <rect x={x} y="0" width={colW} height={55} rx={radius} fill={colors.primary + "44"} />
                  <rect x={x} y="35" width={colW} height="20" rx={radius} fill="rgba(0,0,0,0.6)" />
                  <rect x={x + 4} y="39" width={colW - 8} height="5" rx="1" fill="#fff" opacity="0.8" />
                  <rect x={x + 4} y="47" width={16} height="4" rx="1" fill="#fff" opacity="0.6" />
                </g>
              );
            }
            if (layout.productCardStyle === "borderless") {
              return (
                <g key={i}>
                  <rect x={x} y="0" width={colW} height={35} rx="2" fill={colors.primary + "33"} />
                  <rect x={x} y="38" width={colW - 10} height="5" rx="1" fill={colors.text} opacity="0.7" />
                  <rect x={x} y="46" width={20} height="4" rx="1" fill={colors.primary} opacity="0.8" />
                </g>
              );
            }
            if (layout.productCardStyle === "outlined") {
              return (
                <g key={i}>
                  <rect x={x} y="0" width={colW} height={55} rx={radius} fill={colors.surface} stroke={colors.border} strokeWidth="1" />
                  <rect x={x} y="0" width={colW} height={32} rx={radius} fill={colors.primary + "22"} />
                  <rect x={x + 4} y="35" width={colW - 8} height="4" rx="1" fill={colors.text} opacity="0.7" />
                  <rect x={x + 4} y="43" width={18} height="4" rx="1" fill={colors.text} opacity="0.6" />
                  <rect x={x + colW - 22} y="42" width={18} height="7" rx={radius} fill="none" stroke={colors.primary} strokeWidth="1" />
                </g>
              );
            }
            return (
              <g key={i}>
                <rect x={x} y="0" width={colW} height={55} rx={radius} fill={colors.surface} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.12))" }} />
                <rect x={x} y="0" width={colW} height={33} rx={radius} fill={colors.primary + "33"} />
                <rect x={x + 4} y="36" width={colW - 8} height="4" rx="1" fill={colors.text} opacity="0.7" />
                <rect x={x + 4} y="43" width={18} height="4" rx="1" fill={colors.primary} opacity="0.8" />
                <rect x={x + colW - 20} y="41" width={16} height="8" rx={radius === "999px" ? "4" : radius} fill={colors.primary} />
              </g>
            );
          });
        })()}
      </g>
    </svg>
  );
}

export default function StoreThemePage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState("minimal");
  const [primaryColor, setPrimaryColor] = useState("#0F6E56");
  const [accentColor, setAccentColor] = useState("#00E676");
  const [colorsDirty, setColorsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch("/api/shop")
      .then(r => r.json())
      .then((d: ShopData) => {
        setShop(d);
        const rawTid = d.storeTheme ?? "minimal";
        const tid = THEMES[rawTid] ? rawTid : "minimal";
        setSelectedTheme(tid);
        const theme = THEMES[tid];
        setPrimaryColor(d.storePrimaryColor ?? theme?.colors.primary ?? "#0F6E56");
        setAccentColor(d.storeAccentColor ?? theme?.colors.accent ?? "#00E676");
        if (d.storePrimaryColor || d.storeAccentColor) setColorsDirty(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleThemeSelect(themeId: string) {
    setSelectedTheme(themeId);
    const theme = THEMES[themeId];
    if (theme) {
      setPrimaryColor(theme.colors.primary);
      setAccentColor(theme.colors.accent);
      setColorsDirty(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const body: Record<string, string | null> = { storeTheme: selectedTheme };
    body.storePrimaryColor = colorsDirty ? primaryColor : null;
    body.storeAccentColor = colorsDirty ? accentColor : null;
    const r = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.ok) {
      showToast("success", "থিম সেভ হয়েছে ✓");
      setShop(prev => prev ? { ...prev, storeTheme: selectedTheme } : prev);
    } else {
      showToast("error", "সেভ করা যায়নি");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  const themeList = Object.values(THEMES);
  const activeThemeId = shop?.storeTheme ?? "minimal";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
            <h1 className="text-lg font-bold" style={{ color: S.text }}>স্টোর থিম</h1>
            <p className="text-xs" style={{ color: S.muted }}>আপনার ব্যবসার ধরন অনুযায়ী থিম বেছে নিন</p>
          </div>
        </div>
        {shop?.storeSlug && (
          <a
            href={`/store/${shop.storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-medium"
            style={{ borderColor: S.border, color: S.primary }}
          >
            <ExternalLink size={13} /> লাইভ স্টোর
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {themeList.map((theme: ThemeConfig) => {
          const isActive = activeThemeId === theme.id;
          const isSelected = selectedTheme === theme.id;
          return (
            <div
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleThemeSelect(theme.id); }}
              role="group"
              tabIndex={0}
              className="relative rounded-2xl border-2 overflow-hidden text-left transition-all hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                borderColor: isSelected ? "var(--c-primary)" : isActive ? "#10B981" : S.border,
                borderWidth: isSelected || isActive ? "2px" : "1px",
              }}
            >
              {isActive && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: "#10B981" }}>
                  <Check size={10} /> ব্যবহার হচ্ছে
                </div>
              )}
              {isSelected && !isActive && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: "var(--c-primary)" }}>
                  বেছে নেওয়া হয়েছে
                </div>
              )}

              <div className="h-52 overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
                <ThemeMockup theme={theme} />
              </div>

              <div className="p-4 border-t" style={{ borderColor: S.border }}>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-bold text-sm" style={{ color: S.text }}>{theme.namebn} <span className="font-normal opacity-60">({theme.name})</span></p>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>{theme.description}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 mt-0.5" style={{ backgroundColor: "var(--c-primary)" + "18", color: "var(--c-primary)" }}>
                    {CATEGORY_LABELS[theme.category] ?? theme.category}
                  </span>
                </div>

                <div className="flex gap-1.5 mt-3">
                  {Object.entries(theme.colors).slice(0, 5).map(([key, val]) => (
                    <div key={key} className="w-4 h-4 rounded-full border" title={key} style={{ backgroundColor: val as string, borderColor: S.border }} />
                  ))}
                </div>

                <button
                  onClick={e => { e.stopPropagation(); handleThemeSelect(theme.id); }}
                  className="mt-3 w-full py-2 text-xs font-semibold rounded-lg border transition-all"
                  style={isSelected ? {
                    backgroundColor: "var(--c-primary)",
                    color: "#fff",
                    borderColor: "var(--c-primary)",
                  } : {
                    backgroundColor: "transparent",
                    color: S.text,
                    borderColor: S.border,
                  }}
                >
                  {isSelected ? "✓ বেছে নেওয়া হয়েছে" : "এই থিম ব্যবহার করুন"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div>
          <h2 className="font-semibold text-sm mb-0.5" style={{ color: S.text }}>থিমের রং কাস্টমাইজ করুন (ঐচ্ছিক)</h2>
          <p className="text-xs" style={{ color: S.muted }}>রং না বদলালে থিমের ডিফল্ট রং ব্যবহার হবে</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: S.secondary }}>প্রাথমিক রঙ</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); setColorsDirty(true); }}
                className="w-10 h-10 rounded-xl cursor-pointer border"
                style={{ borderColor: S.border }}
              />
              <span className="text-sm font-mono" style={{ color: S.text }}>{primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: S.secondary }}>সাথী রঙ (Accent)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={e => { setAccentColor(e.target.value); setColorsDirty(true); }}
                className="w-10 h-10 rounded-xl cursor-pointer border"
                style={{ borderColor: S.border }}
              />
              <span className="text-sm font-mono" style={{ color: S.text }}>{accentColor}</span>
            </div>
          </div>
        </div>
        {colorsDirty && (
          <p className="text-xs" style={{ color: S.muted }}>
            * কাস্টম রং সেভ করলে থিমের ডিফল্ট রং বাতিল হবে।
            <button className="ml-1 underline" onClick={() => {
              const t = THEMES[selectedTheme];
              if (t) { setPrimaryColor(t.colors.primary); setAccentColor(t.colors.accent); setColorsDirty(false); }
            }}>রিসেট করুন</button>
          </p>
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
