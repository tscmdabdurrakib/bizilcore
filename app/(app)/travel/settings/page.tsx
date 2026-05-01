"use client";

import { useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};
const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

export default function TravelSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    agencyName: "",
    agencyPhone: "",
    agencyAddress: "",
    bookingPrefix: "TRV",
    visaPrefix: "VISA",
    autoSms: true,
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
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#ECFEFF" }}>
          <Settings size={20} style={{ color: "#0891B2" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>ট্রাভেল সেটিংস</h1>
          <p className="text-sm" style={{ color: S.muted }}>এজেন্সির তথ্য ও কনফিগারেশন</p>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>এজেন্সির তথ্য</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>এজেন্সির নাম</label>
            <input className={inputCls} style={inputStyle} value={form.agencyName} onChange={e => setForm(f => ({ ...f, agencyName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন</label>
            <input className={inputCls} style={inputStyle} value={form.agencyPhone} onChange={e => setForm(f => ({ ...f, agencyPhone: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ঠিকানা</label>
            <input className={inputCls} style={inputStyle} value={form.agencyAddress} onChange={e => setForm(f => ({ ...f, agencyAddress: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>নম্বরিং</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বুকিং নম্বর Prefix</label>
            <input className={inputCls} style={inputStyle} value={form.bookingPrefix} onChange={e => setForm(f => ({ ...f, bookingPrefix: e.target.value }))} />
            <p className="text-[11px] mt-1" style={{ color: S.muted }}>উদাহরণ: TRV-2026-001</p>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ভিসা নম্বর Prefix</label>
            <input className={inputCls} style={inputStyle} value={form.visaPrefix} onChange={e => setForm(f => ({ ...f, visaPrefix: e.target.value }))} />
            <p className="text-[11px] mt-1" style={{ color: S.muted }}>উদাহরণ: VISA-2026-001</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>SMS সেটিং</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm(f => ({ ...f, autoSms: !f.autoSms }))}
            className="w-10 h-6 rounded-full relative transition-colors cursor-pointer"
            style={{ backgroundColor: form.autoSms ? "#0891B2" : "#E5E7EB" }}
          >
            <div className="absolute w-4 h-4 rounded-full bg-white top-1 transition-all" style={{ left: form.autoSms ? "22px" : "4px" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: S.text }}>বুকিং নিশ্চিত হলে SMS পাঠানো</p>
            <p className="text-xs" style={{ color: S.muted }}>ক্লায়েন্টকে স্বয়ংক্রিয় SMS পাঠান</p>
          </div>
        </label>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
        style={{ backgroundColor: saved ? "#0F6E56" : "#0891B2" }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saved ? "সেভ হয়েছে!" : "সেটিংস সেভ করুন"}
      </button>
    </div>
  );
}
