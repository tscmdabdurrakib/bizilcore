"use client";

import { useEffect, useState } from "react";
import { Image, Loader2, Facebook, Instagram, MessageCircle } from "lucide-react";
import { PageShell, Card, Button, Input, SectionTitle } from "@/components/ui";

interface ShopData {
  storeBannerUrl: string | null;
  storeTagline: string | null;
  storeAbout: string | null;
  storeSocialFB: string | null;
  storeSocialIG: string | null;
  storeSocialWA: string | null;
  logoUrl: string | null;
  name: string;
}

export default function StoreAppearancePage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeBannerUrl: "",
    storeTagline: "",
    storeAbout: "",
    storeSocialFB: "",
    storeSocialIG: "",
    storeSocialWA: "",
    logoUrl: "",
  });
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);
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
        setForm({
          storeBannerUrl: d.storeBannerUrl ?? "",
          storeTagline: d.storeTagline ?? "",
          storeAbout: d.storeAbout ?? "",
          storeSocialFB: d.storeSocialFB ?? "",
          storeSocialIG: d.storeSocialIG ?? "",
          storeSocialWA: d.storeSocialWA ?? "",
          logoUrl: d.logoUrl ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function uploadImage(file: File, field: "banner" | "logo") {
    setUploading(field);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/store/upload-image", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok && d.url) {
        if (field === "banner") setForm(f => ({ ...f, storeBannerUrl: d.url }));
        else setForm(f => ({ ...f, logoUrl: d.url }));
        showToast("success", "আপলোড সফল ✓");
      } else {
        showToast("error", "আপলোড করা যায়নি");
      }
    } catch {
      showToast("error", "আপলোড করা যায়নি");
    }
    setUploading(null);
  }

  async function handleSave() {
    setSaving(true);
    const r = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeBannerUrl: form.storeBannerUrl || null,
        storeTagline: form.storeTagline || null,
        storeAbout: form.storeAbout || null,
        storeSocialFB: form.storeSocialFB || null,
        storeSocialIG: form.storeSocialIG || null,
        storeSocialWA: form.storeSocialWA || null,
        logoUrl: form.logoUrl || null,
      }),
    });
    setSaving(false);
    if (r.ok) showToast("success", "সেভ হয়েছে ✓");
    else showToast("error", "সেভ করা যায়নি");
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
      title="লুক ও ফিল"
      subtitle="স্টোরের ব্যানার, লোগো ও তথ্য সেট করুন"
      className="max-w-2xl"
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <Card className="space-y-5">
        <SectionTitle title="ব্যানার ছবি" className="mb-0" />
        {form.storeBannerUrl ? (
          <div className="relative rounded-xl overflow-hidden h-36 border" style={{ borderColor: "var(--c-border)" }}>
            <img src={form.storeBannerUrl} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <label className="cursor-pointer">
                <Button variant="secondary" size="sm">পরিবর্তন করুন</Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "banner"); }} />
              </label>
            </div>
          </div>
        ) : (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center gap-2" style={{ borderColor: "var(--c-border)" }}>
              {uploading === "banner" ? (
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
              ) : (
                <>
                  <Image size={24} style={{ color: "var(--c-text-muted)" }} />
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>ব্যানার ছবি আপলোড করুন (১৬:৯ আদর্শ)</p>
                </>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "banner"); }} />
          </label>
        )}

        <div>
          <SectionTitle title="স্টোর লোগো" className="mb-3" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface-raised)" }}>
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold" style={{ color: "var(--c-text-muted)" }}>{shop?.name?.[0]?.toUpperCase() ?? "S"}</span>
              )}
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm">{uploading === "logo" ? "আপলোড হচ্ছে..." : "লোগো আপলোড"}</Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo"); }} />
            </label>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="স্টোরের তথ্য" className="mb-0" />
        <Input
          label="ট্যাগলাইন"
          value={form.storeTagline}
          onChange={e => setForm(f => ({ ...f, storeTagline: e.target.value }))}
          placeholder="যেমন: সেরা মানের পণ্য, সেরা দামে"
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-sub)" }}>আমাদের সম্পর্কে</label>
          <textarea
            value={form.storeAbout}
            onChange={e => setForm(f => ({ ...f, storeAbout: e.target.value }))}
            placeholder="আপনার স্টোর সম্পর্কে কিছু লিখুন..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--c-primary)]/20 focus:border-[var(--c-primary)]"
            style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)", color: "var(--c-text)" }}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle title="সোশ্যাল মিডিয়া" className="mb-0" />
        {[
          { key: "storeSocialFB", icon: Facebook, placeholder: "Facebook Page URL", label: "Facebook" },
          { key: "storeSocialIG", icon: Instagram, placeholder: "Instagram Profile URL", label: "Instagram" },
          { key: "storeSocialWA", icon: MessageCircle, placeholder: "WhatsApp নম্বর (01XXXXXXXXX)", label: "WhatsApp" },
        ].map(({ key, icon: Icon, placeholder, label }) => (
          <div key={key} className="flex items-center gap-3">
            <Icon size={18} style={{ color: "var(--c-text-muted)", flexShrink: 0 }} />
            <Input
              label={label}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="flex-1"
            />
          </div>
        ))}
      </Card>

      <Button onClick={handleSave} disabled={saving} loading={saving} className="w-full" size="lg">
        {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
      </Button>
    </PageShell>
  );
}
