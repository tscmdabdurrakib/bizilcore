"use client";

import { useEffect, useState, useCallback } from "react";
import { Store, Check, X, ExternalLink, Copy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface ShopData {
  id: string;
  storeEnabled: boolean;
  storeSlug: string | null;
  name: string;
  storeTheme: string | null;
  storeShippingFee: number | null;
  storeDhakaFee: number | null;
  storeVisibleProductCount?: number;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StoreSetupPage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [slugError, setSlugError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const debouncedSlug = useDebounce(slug, 500);

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
    Promise.all([
      fetch("/api/shop").then(r => r.json()),
      fetch("/api/products?limit=200").then(r => r.json()).catch(() => []),
    ]).then(([shopData, prodData]: [ShopData, { storeVisible?: boolean }[]]) => {
      const visibleCount = Array.isArray(prodData)
        ? prodData.filter((p) => p.storeVisible).length
        : 0;
      setShop({ ...shopData, storeVisibleProductCount: visibleCount });
      setStoreEnabled(shopData.storeEnabled);
      setSlug(shopData.storeSlug ?? "");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const checkSlug = useCallback(async (s: string) => {
    if (!s || s === shop?.storeSlug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    setSlugError("");
    try {
      const r = await fetch(`/api/store/check-slug?slug=${encodeURIComponent(s)}`);
      const d = await r.json();
      if (d.error) {
        setSlugStatus("error");
        setSlugError(d.error);
      } else {
        setSlugStatus(d.available ? "available" : "taken");
        if (!d.available) setSlugError("এই slug ইতিমধ্যে নেওয়া হয়েছে");
      }
    } catch {
      setSlugStatus("error");
      setSlugError("চেক করা যায়নি");
    }
  }, [shop?.storeSlug]);

  useEffect(() => {
    if (debouncedSlug && debouncedSlug !== shop?.storeSlug) {
      checkSlug(debouncedSlug);
    } else {
      setSlugStatus("idle");
    }
  }, [debouncedSlug, shop?.storeSlug, checkSlug]);

  async function handleSave() {
    if (!slug) { showToast("error", "স্টোর URL দিন"); return; }
    if (slugStatus === "taken" || slugStatus === "error") { showToast("error", "সঠিক URL দিন"); return; }
    setSaving(true);
    const r = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeEnabled, storeSlug: slug.toLowerCase().trim() }),
    });
    setSaving(false);
    if (r.ok) {
      const d = await r.json();
      setShop(d);
      setSlug(d.storeSlug ?? "");
      setSlugStatus("idle");
      showToast("success", "সেভ হয়েছে ✓");
    } else {
      showToast("error", "সেভ করা যায়নি");
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/store/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const storeUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/store/${slug}` : "";
  const hasShippingFee = !!(shop?.storeShippingFee || shop?.storeDhakaFee);
  const checklist = [
    { label: "স্টোর চালু করুন", done: storeEnabled },
    { label: "স্টোর URL সেট করুন", done: !!shop?.storeSlug },
    { label: "থিম বেছে নিন", done: !!shop?.storeTheme },
    { label: "পণ্য স্টোরে দেখাবে সেট করুন", done: (shop?.storeVisibleProductCount ?? 0) > 0 },
    { label: "ডেলিভারি সেটিংস দিন", done: hasShippingFee },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
          <Store size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>স্টোর সেটআপ</h1>
          <p className="text-xs" style={{ color: S.muted }}>আপনার পাবলিক অনলাইন স্টোর কনফিগার করুন</p>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm" style={{ color: S.text }}>স্টোর সক্রিয় করুন</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>কাস্টমাররা আপনার স্টোর দেখতে পাবে</p>
          </div>
          <button
            onClick={() => setStoreEnabled(v => !v)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: storeEnabled ? S.primary : S.border }}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${storeEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: S.secondary }}>স্টোর URL (Slug)</label>
          <div className="flex items-center gap-2 rounded-xl border overflow-hidden" style={{ borderColor: slugStatus === "taken" || slugStatus === "error" ? "#E24B4A" : slugStatus === "available" ? "#1D9E75" : S.border }}>
            <span className="px-3 py-2.5 text-xs border-r flex-shrink-0" style={{ backgroundColor: "var(--c-surface-raised)", color: S.muted, borderColor: S.border }}>
              /store/
            </span>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="amar-store"
              className="flex-1 px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "transparent", color: S.text }}
            />
            <div className="px-3 flex-shrink-0">
              {slugStatus === "checking" && <Loader2 size={16} className="animate-spin" style={{ color: S.muted }} />}
              {slugStatus === "available" && <Check size={16} style={{ color: "#1D9E75" }} />}
              {(slugStatus === "taken" || slugStatus === "error") && <X size={16} style={{ color: "#E24B4A" }} />}
            </div>
          </div>
          {slugError && <p className="text-xs mt-1" style={{ color: "#E24B4A" }}>{slugError}</p>}
          {slugStatus === "available" && <p className="text-xs mt-1" style={{ color: "#1D9E75" }}>এই URL পাওয়া যাবে ✓</p>}
          <p className="text-xs mt-1" style={{ color: S.muted }}>শুধু ছোট হাতের অক্ষর, সংখ্যা ও (-) ব্যবহার করুন</p>
        </div>

        {shop?.storeSlug && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <p className="text-xs flex-1 truncate" style={{ color: S.secondary }}>
              {storeUrl}
            </p>
            <button onClick={copyLink} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg" style={{ color: S.primary }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "কপি" : "কপি"}
            </button>
            <a href={`/store/${shop.storeSlug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg" style={{ color: S.primary }}>
              <ExternalLink size={13} />
              দেখুন
            </a>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || slugStatus === "taken" || slugStatus === "error" || slugStatus === "checking"}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: S.primary }}
        >
          {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
        </button>
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: S.text }}>শুরু করার চেকলিস্ট</h2>
        <div className="space-y-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.done ? "#E1F5EE" : "var(--c-surface-raised)" }}>
                {item.done
                  ? <CheckCircle2 size={14} style={{ color: "#0F6E56" }} />
                  : <AlertCircle size={14} style={{ color: S.muted }} />
                }
              </div>
              <p className="text-sm" style={{ color: item.done ? S.text : S.muted, textDecoration: item.done ? "line-through" : "none" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
