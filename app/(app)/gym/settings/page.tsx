"use client";

import { useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

export default function GymSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    gymName: "", openTime: "06:00", closeTime: "22:00",
    memberPrefix: "GYM", expiryAlertDays: "7",
    autoSmsExpiry: true,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5F3FF" }}>
          <Settings size={20} style={{ color: "#7C3AED" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>জিম সেটিংস</h1>
          <p className="text-sm" style={{ color: S.muted }}>জিমের তথ্য ও কনফিগারেশন</p>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>জিমের সময়সূচি</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>খোলার সময়</label>
            <input className={inputCls} style={inputStyle} type="time" value={form.openTime} onChange={e => setForm(f => ({ ...f, openTime: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বন্ধের সময়</label>
            <input className={inputCls} style={inputStyle} type="time" value={form.closeTime} onChange={e => setForm(f => ({ ...f, closeTime: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>সদস্য নম্বরিং</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সদস্য ID Prefix</label>
            <input className={inputCls} style={inputStyle} value={form.memberPrefix} onChange={e => setForm(f => ({ ...f, memberPrefix: e.target.value }))} />
            <p className="text-[11px] mt-1" style={{ color: S.muted }}>উদাহরণ: GYM-2026-001</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মেয়াদ সতর্কতা (দিন আগে)</label>
            <input className={inputCls} style={inputStyle} type="number" min="1" max="30" value={form.expiryAlertDays} onChange={e => setForm(f => ({ ...f, expiryAlertDays: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>SMS নোটিফিকেশন</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setForm(f => ({ ...f, autoSmsExpiry: !f.autoSmsExpiry }))}
            className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
            style={{ backgroundColor: form.autoSmsExpiry ? "#7C3AED" : "#E5E7EB" }}>
            <div className="absolute w-4 h-4 rounded-full bg-white top-1 transition-all" style={{ left: form.autoSmsExpiry ? "22px" : "4px" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: S.text }}>মেয়াদ শেষের আগে SMS পাঠানো</p>
            <p className="text-xs" style={{ color: S.muted }}>সদস্যদের মেয়াদ শেষের সতর্কতা SMS</p>
          </div>
        </label>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: saved ? "#0F6E56" : "#7C3AED" }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saved ? "সেভ হয়েছে!" : "সেটিংস সেভ করুন"}
      </button>
    </div>
  );
}
