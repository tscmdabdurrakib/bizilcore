"use client";

import { useEffect, useState } from "react";
import { Settings, Loader2, Check, Camera } from "lucide-react";

const PHOTO_COLOR = "#DB2777";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

export default function SettingsBoard() {
  const [settings, setSettings] = useState({
    photoStudioName: "",
    photoBookingPrefix: "PHO",
    photoAutoSms: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/shop", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        setSettings({
          photoStudioName: data.photoStudioName ?? "",
          photoBookingPrefix: data.photoBookingPrefix ?? "PHO",
          photoAutoSms: data.photoAutoSms ?? true,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: S.text }}>ফটোগ্রাফি সেটিংস</h1>
        <p className="text-sm" style={{ color: S.muted }}>স্টুডিও ও অটোমেশন কনফিগার করুন</p>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-2">
          <Camera size={16} style={{ color: PHOTO_COLOR }} />
          <p className="font-semibold text-sm" style={{ color: S.text }}>স্টুডিও তথ্য</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: S.muted }}>স্টুডিও নাম (SMS এ দেখাবে)</label>
          <input
            value={settings.photoStudioName}
            onChange={e => setSettings(s => ({ ...s, photoStudioName: e.target.value }))}
            placeholder="আপনার স্টুডিওর নাম"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold" style={{ color: S.muted }}>বুকিং নম্বর প্রিফিক্স</label>
          <input
            value={settings.photoBookingPrefix}
            onChange={e => setSettings(s => ({ ...s, photoBookingPrefix: e.target.value }))}
            placeholder="PHO"
            maxLength={5}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
          />
          <p className="text-xs" style={{ color: S.muted }}>উদাহরণ: {settings.photoBookingPrefix || "PHO"}-2026-001</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: S.border }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: S.text }}>অটো SMS</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>বুকিং ও ডেলিভারিতে স্বয়ংক্রিয় SMS</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, photoAutoSms: !s.photoAutoSms }))}
            className="w-12 h-6 rounded-full relative transition-colors"
            style={{ backgroundColor: settings.photoAutoSms ? PHOTO_COLOR : S.border }}
          >
            <div
              className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
              style={{ left: settings.photoAutoSms ? "26px" : "2px" }}
            />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: PHOTO_COLOR }}
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Settings size={15} />}
        {saved ? "সেভ হয়েছে!" : "সেটিংস সেভ করুন"}
      </button>
    </div>
  );
}
