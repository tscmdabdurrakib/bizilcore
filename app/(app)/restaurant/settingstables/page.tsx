"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Printer, Eye, EyeOff, QrCode, Image as ImageIcon,
  Settings, Save, Loader2, CheckCircle, AlertCircle,
} from "lucide-react";

const S = {
  primary: "#EA580C", text: "#1F2937", muted: "#6B7280",
  border: "#E5E7EB", surface: "#FFFFFF", bg: "#F9FAFB",
};

interface ShopSettings {
  name: string; phone?: string; address?: string; logoUrl?: string;
  receiptLogo?: string; receiptHeaderLine1?: string; receiptHeaderLine2?: string;
  receiptFooter?: string; receiptPaperSize?: string;
  receiptShowVat?: boolean; receiptShowQr?: boolean; receiptShowLogo?: boolean;
  restVatPct?: number; restServiceChargePct?: number;
  restOrderPrefix?: string; restKotAutoSend?: boolean;
  restCurrency?: string; restRequireShift?: boolean;
  managerPin?: string;
}

export default function RestaurantSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [form, setForm]         = useState<Partial<ShopSettings>>({});
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"receipt" | "general" | "pos">("receipt");

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const r = await fetch("/api/settings/shop");
    if (r.ok) {
      const d = await r.json();
      setSettings(d);
      setForm({
        receiptLogo:        d.receiptLogo ?? "",
        receiptHeaderLine1: d.receiptHeaderLine1 ?? "",
        receiptHeaderLine2: d.receiptHeaderLine2 ?? "",
        receiptFooter:      d.receiptFooter ?? "ধন্যবাদ! আবার আসবেন।",
        receiptPaperSize:   d.receiptPaperSize ?? "80mm",
        receiptShowVat:     d.receiptShowVat ?? true,
        receiptShowQr:      d.receiptShowQr  ?? true,
        receiptShowLogo:    d.receiptShowLogo ?? true,
        restVatPct:         d.restVatPct ?? 0,
        restServiceChargePct: d.restServiceChargePct ?? 0,
        restOrderPrefix:    d.restOrderPrefix ?? "RES",
        restKotAutoSend:    d.restKotAutoSend ?? false,
        restCurrency:       d.restCurrency ?? "BDT",
        restRequireShift:   d.restRequireShift ?? false,
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        await load();
        showToast("success", "সেটিংস সংরক্ষিত হয়েছে");
      } else {
        showToast("error", "সংরক্ষণ ব্যর্থ হয়েছে");
      }
    } catch {
      showToast("error", "Error");
    }
    setSaving(false);
  };

  const patch = (k: keyof ShopSettings, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  if (!settings) return (
    <div className="flex justify-center items-center h-40">
      <Loader2 size={24} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  const tabs = [
    { id: "receipt", label: "রসিদ / প্রিন্ট", icon: Printer },
    { id: "general", label: "সাধারণ সেটিংস", icon: Settings },
    { id: "pos",     label: "POS সেটিংস", icon: Settings },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
          <Settings size={20} style={{ color: S.primary }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>রেস্তোরাঁ সেটিংস</h1>
          <p className="text-sm" style={{ color: S.muted }}>টেবিল, রসিদ ও POS কনফিগারেশন</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: S.bg, borderColor: S.border }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === t.id ? S.surface : "transparent",
              color: activeTab === t.id ? S.primary : S.muted,
              boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Receipt Tab */}
      {activeTab === "receipt" && (
        <div className="space-y-5">
          {/* Paper Size */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: S.text }}>
              <Printer size={16} style={{ color: S.primary }} /> কাগজের আকার
            </h2>
            <div className="flex gap-3">
              {(["80mm", "58mm", "A4"] as const).map(size => (
                <button key={size} onClick={() => patch("receiptPaperSize", size)}
                  className="flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all"
                  style={{
                    borderColor: form.receiptPaperSize === size ? S.primary : S.border,
                    color: form.receiptPaperSize === size ? S.primary : S.muted,
                    backgroundColor: form.receiptPaperSize === size ? "#FFF7ED" : S.surface,
                  }}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: S.text }}>
              <ImageIcon size={16} style={{ color: S.primary }} /> হেডার / লোগো
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>লোগো URL (receipt-এ আলাদা লোগো)</label>
                <input value={form.receiptLogo ?? ""} onChange={e => patch("receiptLogo", e.target.value)}
                  placeholder="https://... (খালি রাখলে দোকানের ডিফল্ট লোগো)"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>হেডার লাইন ১</label>
                  <input value={form.receiptHeaderLine1 ?? ""} onChange={e => patch("receiptHeaderLine1", e.target.value)}
                    placeholder="রেস্তোরাঁর স্লোগান"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>হেডার লাইন ২</label>
                  <input value={form.receiptHeaderLine2 ?? ""} onChange={e => patch("receiptHeaderLine2", e.target.value)}
                    placeholder="TIN/ট্রেড লাইসেন্স"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ফুটার বার্তা</label>
                <input value={form.receiptFooter ?? ""} onChange={e => patch("receiptFooter", e.target.value)}
                  placeholder="ধন্যবাদ! আবার আসবেন।"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text }} />
              </div>
            </div>
          </div>

          {/* Show/Hide Options */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: S.text }}>
              <Eye size={16} style={{ color: S.primary }} /> দেখানো / লুকানো
            </h2>
            <div className="space-y-3">
              {([
                { key: "receiptShowLogo" as keyof ShopSettings,  label: "লোগো দেখাও",     icon: ImageIcon },
                { key: "receiptShowVat"  as keyof ShopSettings,  label: "VAT/চার্জ দেখাও", icon: Eye },
                { key: "receiptShowQr"   as keyof ShopSettings,  label: "QR কোড দেখাও",   icon: QrCode },
              ] as { key: keyof ShopSettings; label: string; icon: typeof Eye }[]).map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: S.muted }} />
                    <span className="text-sm font-semibold" style={{ color: S.text }}>{label}</span>
                  </div>
                  <button onClick={() => patch(key, !form[key])}
                    className="w-12 h-6 rounded-full transition-all relative"
                    style={{ backgroundColor: form[key] ? S.primary : S.border }}>
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: form[key] ? "calc(100% - 22px)" : "2px" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-base flex items-center gap-2 mb-4" style={{ color: S.text }}>
              <Eye size={16} style={{ color: S.primary }} /> লাইভ প্রিভিউ
            </h2>
            <div className="border rounded-xl p-4 font-mono text-xs space-y-1 mx-auto"
              style={{
                borderColor: S.border, backgroundColor: "#FAFAFA",
                maxWidth: form.receiptPaperSize === "58mm" ? "220px" : form.receiptPaperSize === "A4" ? "100%" : "300px",
              }}>
              {form.receiptShowLogo && (settings.logoUrl || form.receiptLogo) && (
                <div className="text-center">
                  <img src={form.receiptLogo || settings.logoUrl} alt="Logo"
                    className="mx-auto" style={{ maxHeight: "40px", maxWidth: "80px", objectFit: "contain" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <div className="text-center font-bold">{settings.name}</div>
              {form.receiptHeaderLine1 && <div className="text-center opacity-70">{form.receiptHeaderLine1}</div>}
              {form.receiptHeaderLine2 && <div className="text-center opacity-70">{form.receiptHeaderLine2}</div>}
              {settings.phone && <div className="text-center opacity-70">{settings.phone}</div>}
              <div className="border-t border-dashed border-gray-400 my-1" />
              <div className="flex justify-between"><span>অর্ডার নম্বর</span><span className="font-bold">RES-2026-001</span></div>
              <div className="flex justify-between"><span>তারিখ</span><span>২৯ মে ২০২৬</span></div>
              <div className="border-t border-dashed border-gray-400 my-1" />
              <div className="flex justify-between"><span>ভাত ও ডাল ×2</span><span>৳240.00</span></div>
              <div className="flex justify-between"><span>কোল্ড ড্রিঙ্ক ×1</span><span>৳60.00</span></div>
              <div className="border-t border-dashed border-gray-400 my-1" />
              <div className="flex justify-between"><span>সাব-টোটাল</span><span>৳300.00</span></div>
              {form.receiptShowVat && <div className="flex justify-between opacity-70"><span>VAT (5%)</span><span>৳15.00</span></div>}
              <div className="border-t border-gray-400 my-1" />
              <div className="flex justify-between font-bold"><span>সর্বমোট</span><span>৳315.00</span></div>
              <div className="border-t border-gray-400 my-1" />
              <div className="text-center opacity-60 mt-1">{form.receiptFooter || "ধন্যবাদ! আবার আসবেন।"}</div>
              {form.receiptShowQr && (
                <div className="flex justify-center mt-2 opacity-40">
                  <div className="w-16 h-16 border-2 border-gray-400 rounded flex items-center justify-center text-gray-400 text-xs">QR</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="font-bold text-base" style={{ color: S.text }}>সাধারণ সেটিংস</h2>
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: "restVatPct", label: "VAT (%)", type: "number", placeholder: "0" },
              { key: "restServiceChargePct", label: "সার্ভিস চার্জ (%)", type: "number", placeholder: "0" },
              { key: "restOrderPrefix", label: "অর্ডার প্রিফিক্স", type: "text", placeholder: "RES" },
              { key: "restCurrency", label: "মুদ্রা", type: "text", placeholder: "BDT" },
            ] as { key: keyof ShopSettings; label: string; type: string; placeholder: string }[]).map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>{label}</label>
                <input type={type} value={String(form[key] ?? "")}
                  onChange={e => patch(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POS Tab */}
      {activeTab === "pos" && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="font-bold text-base" style={{ color: S.text }}>POS সেটিংস</h2>
          <div className="space-y-3">
            {([
              { key: "restKotAutoSend", label: "KOT স্বয়ংক্রিয় পাঠান" },
              { key: "restRequireShift", label: "শিফট ছাড়া অর্ডার বন্ধ" },
            ] as { key: keyof ShopSettings; label: string }[]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                <span className="text-sm font-semibold" style={{ color: S.text }}>{label}</span>
                <button onClick={() => patch(key, !form[key])}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{ backgroundColor: form[key] ? S.primary : S.border }}>
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    style={{ left: form[key] ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button onClick={save} disabled={saving}
        className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ backgroundColor: S.primary }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "সংরক্ষণ হচ্ছে…" : "সেটিংস সংরক্ষণ করুন"}
      </button>
    </div>
  );
}
