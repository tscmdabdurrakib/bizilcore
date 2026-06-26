"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageShell, Card, Input, Button } from "@/components/ui";

const GROUP_OPTIONS = [
  { value: "regular",   label: "Regular — সাধারণ কাস্টমার" },
  { value: "vip",       label: "⭐ VIP — বিশেষ কাস্টমার" },
  { value: "wholesale", label: "🏪 Wholesale — পাইকারি কাস্টমার" },
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", address: "", fbProfile: "", group: "regular" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
    <PageShell
      title="নতুন কাস্টমার"
      breadcrumbs={[{ label: "কাস্টমার", href: "/customers" }, { label: "নতুন" }]}
      className="max-w-xl"
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="নাম *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="কাস্টমারের নাম" required />
          <Input label="ফোন নম্বর" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
          <Input label="ঠিকানা" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="বিস্তারিত ঠিকানা" />
          <Input label="Facebook Profile URL" type="url" value={form.fbProfile} onChange={(e) => setForm((p) => ({ ...p, fbProfile: e.target.value }))} placeholder="https://facebook.com/..." />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--c-text-sub)" }}>Customer Group</label>
            <div className="grid grid-cols-1 gap-2">
              {GROUP_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, group: opt.value }))}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors"
                  style={{
                    backgroundColor: form.group === opt.value ? "var(--c-primary-light)" : "var(--c-surface)",
                    borderColor: form.group === opt.value ? "var(--c-primary)" : "var(--c-border)",
                    color: form.group === opt.value ? "var(--c-primary)" : "var(--c-text-sub)",
                  }}>
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: form.group === opt.value ? "var(--c-primary)" : "#D0CEC8" }}>
                    {form.group === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--c-primary)" }} />}
                  </div>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading} loading={loading} className="w-full">
            {loading ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}
