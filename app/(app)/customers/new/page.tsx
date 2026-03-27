"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`, borderRadius: "8px",
  color: "var(--c-text)", backgroundColor: "var(--c-surface)", padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

const GROUP_OPTIONS = [
  { value: "regular",   label: "Regular — সাধারণ কাস্টমার" },
  { value: "vip",       label: "⭐ VIP — বিশেষ কাস্টমার" },
  { value: "wholesale", label: "🏪 Wholesale — পাইকারি কাস্টমার" },
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", address: "", fbProfile: "", group: "regular" });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)" };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const r = await fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (r.ok) { showToast("success", "কাস্টমার সফলভাবে সেভ হয়েছে ✓"); setTimeout(() => router.push("/customers"), 1000); }
    else showToast("error", "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
  }

  return (
    <div className="max-w-xl mx-auto">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft size={20} style={{ color: S.secondary }} /></Link>
        <h2 className="font-semibold text-lg" style={{ color: S.text }}>নতুন কাস্টমার</h2>
      </div>
      <form onSubmit={handleSubmit} className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        {[
          { field: "name", label: "নাম *", placeholder: "কাস্টমারের নাম", type: "text", required: true },
          { field: "phone", label: "ফোন নম্বর", placeholder: "01XXXXXXXXX", type: "tel", required: false },
          { field: "address", label: "ঠিকানা", placeholder: "বিস্তারিত ঠিকানা", type: "text", required: false },
          { field: "fbProfile", label: "Facebook Profile URL", placeholder: "https://facebook.com/...", type: "url", required: false },
        ].map((f) => (
          <div key={f.field}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>{f.label}</label>
            <input type={f.type} value={(form as Record<string, string>)[f.field]}
              onChange={(e) => setForm((p) => ({ ...p, [f.field]: e.target.value }))}
              placeholder={f.placeholder} required={f.required}
              style={inp(focused === f.field)}
              onFocus={() => setFocused(f.field)} onBlur={() => setFocused(null)} />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>Customer Group</label>
          <div className="grid grid-cols-1 gap-2">
            {GROUP_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, group: opt.value }))}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors"
                style={{
                  backgroundColor: form.group === opt.value ? "var(--c-primary-light)" : S.surface,
                  borderColor: form.group === opt.value ? "var(--c-primary)" : S.border,
                  color: form.group === opt.value ? "var(--c-primary)" : S.secondary,
                }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: form.group === opt.value ? "var(--c-primary)" : "#D0CEC8" }}>
                  {form.group === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--c-primary)" }} />}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: S.primary }}>
          {loading ? "সেভ হচ্ছে..." : "সেভ করুন"}
        </button>
      </form>
    </div>
  );
}
