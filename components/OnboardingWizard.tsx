"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, ChevronRight, CheckCheck } from "lucide-react";
import {
  BUSINESS_TYPE_META, BUSINESS_TYPES, type BusinessType,
  SALES_CHANNEL_META, SALES_CHANNELS, type SalesChannel,
} from "@/lib/modules";

interface Product {
  name: string;
  sellPrice: string;
  stockQty: string;
}

const CATEGORIES = ["পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "অন্যান্য"];

const inputStyle = {
  width: "100%",
  height: "40px",
  border: "1px solid #E8E6DF",
  borderRadius: "8px",
  color: "#1A1A18",
  backgroundColor: "#FFFFFF",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
};

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <img src="/logo.svg" alt="BizilCore" className="w-11 h-11" />
      <span style={{
        fontWeight: 800, fontSize: "1.6rem",
        background: "linear-gradient(120deg, #0A5240 0%, #0F6E56 40%, #1BAA78 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text", letterSpacing: "-0.02em",
      }}>BizilCore</span>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
            style={{
              backgroundColor: step < current ? "#0F6E56" : step === current ? "#0F6E56" : "#E8E6DF",
              color: step <= current ? "#FFFFFF" : "#A8A69E",
            }}
          >
            {step < current ? <CheckCircle size={16} /> : step}
          </div>
          {step < 3 && (
            <div className="w-12 h-0.5" style={{ backgroundColor: step < current ? "#0F6E56" : "#E8E6DF" }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── step numbers ───────────────────────────────────────────────────────────
   0 = business type selection
   1 = sales channel selection  ← NEW
   2 = shop info
   3 = products
   4 = success
*/

export default function OnboardingWizard({ shopName }: { shopName: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [salesChannel, setSalesChannel] = useState<SalesChannel | "">("");

  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  const [form1, setForm1] = useState({ shopName, phone: "", category: "", gender: "" });
  const [products, setProducts] = useState<Product[]>([
    { name: "", sellPrice: "", stockQty: "" },
    { name: "", sellPrice: "", stockQty: "" },
    { name: "", sellPrice: "", stockQty: "" },
  ]);

  function updateProduct(idx: number, field: keyof Product, value: string) {
    setProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError("");
    if (file.size > 300 * 1024) { setLogoError("সর্বোচ্চ ৩০০KB"); return; }
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload/logo", { method: "POST", body: fd });
    const d = await r.json();
    setLogoUploading(false);
    if (r.ok && d.url) setLogoUrl(d.url);
    else setLogoError(d.error ?? "আপলোড ব্যর্থ");
    e.target.value = "";
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "step1",
        ...form1,
        businessType: businessType || "fcommerce",
        salesChannel: salesChannel || "both",
      }),
    });
    setLoading(false);
    if (res.ok) setStep(3);
  }

  async function handleStep2(skip = false) {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "step2",
        products: skip ? [] : products.filter((p) => p.name.trim()),
      }),
    });
    if (res.ok) {
      await update({ onboarded: true });
      setStep(4);
    }
    setLoading(false);
  }

  /* ─── Step 4: Success ─────────────────────────────────────────────────────── */
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10" style={{ backgroundColor: "#F7F6F2" }}>
        <div className="w-full max-w-lg px-4">
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "#E8E6DF" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#E1F5EE" }}>
              <CheckCircle size={40} style={{ color: "#0F6E56" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#1A1A18" }}>আপনার shop ready! 🎉</h2>
            <p className="mb-8" style={{ color: "#5A5A56" }}>আপনার BizilCore শপ সফলভাবে সেটআপ হয়েছে। এখন dashboard এ যান।</p>
            <button onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0F6E56" }}>
              এখন dashboard এ যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Step 0: Business Type Selection ────────────────────────────────────── */
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10 px-4" style={{ backgroundColor: "#F7F6F2" }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-xl font-bold mb-1" style={{ color: "#1A1A18" }}>আপনার ব্যবসার ধরন কী?</h1>
            <p className="text-sm" style={{ color: "#5A5A56" }}>সঠিক features পেতে আপনার ব্যবসার ধরন বেছে নিন</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {BUSINESS_TYPES.map((type) => {
              const meta = BUSINESS_TYPE_META[type];
              const Icon = meta.icon;
              const selected = businessType === type;
              return (
                <button key={type} onClick={() => setBusinessType(type)}
                  className="relative rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:shadow-sm"
                  style={{ borderColor: selected ? "#0F6E56" : "#E8E6DF", backgroundColor: selected ? "#E1F5EE" : "#FFFFFF" }}>
                  {selected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0F6E56" }}>
                      <CheckCheck size={11} color="#fff" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: selected ? `${meta.color}20` : meta.bgColor }}>
                    <Icon size={20} style={{ color: meta.color }} />
                  </div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: "#1A1A18" }}>{meta.label}</p>
                  <p className="text-xs leading-snug" style={{ color: "#5A5A56" }}>{meta.description}</p>
                </button>
              );
            })}
          </div>

          <button onClick={() => setStep(1)} disabled={!businessType}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity"
            style={{ backgroundColor: "#0F6E56", opacity: businessType ? 1 : 0.4, cursor: businessType ? "pointer" : "not-allowed" }}>
            পরবর্তী ধাপ <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ─── Step 1: Sales Channel Selection ───────────────────────────────────── */
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10 px-4" style={{ backgroundColor: "#F7F6F2" }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Logo />
            {/* Show selected business type badge */}
            {businessType && (() => {
              const meta = BUSINESS_TYPE_META[businessType];
              const Icon = meta.icon;
              return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-xs font-semibold"
                  style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                  <Icon size={12} /> {meta.label}
                </div>
              );
            })()}
            <h1 className="text-xl font-bold mb-1" style={{ color: "#1A1A18" }}>আপনি কীভাবে বিক্রি করেন?</h1>
            <p className="text-sm" style={{ color: "#5A5A56" }}>আপনার sales channel বেছে নিন — এটি আপনার features নির্ধারণ করবে</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {SALES_CHANNELS.map((ch) => {
              const meta = SALES_CHANNEL_META[ch];
              const Icon = meta.icon;
              const selected = salesChannel === ch;
              return (
                <button key={ch} onClick={() => setSalesChannel(ch)}
                  className="relative rounded-2xl border-2 p-4 text-left transition-all duration-150 hover:shadow-sm flex items-center gap-4"
                  style={{ borderColor: selected ? meta.color : "#E8E6DF", backgroundColor: selected ? meta.bgColor : "#FFFFFF" }}>
                  {selected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.color }}>
                      <CheckCheck size={11} color="#fff" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selected ? `${meta.color}20` : "#F7F6F2" }}>
                    <Icon size={24} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-0.5" style={{ color: selected ? meta.color : "#1A1A18" }}>{meta.label}</p>
                    <p className="text-xs leading-snug" style={{ color: "#5A5A56" }}>{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)}
              className="px-6 py-3 rounded-xl font-medium text-sm border"
              style={{ borderColor: "#E8E6DF", color: "#5A5A56" }}>
              পেছনে
            </button>
            <button onClick={() => setStep(2)} disabled={!salesChannel}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity"
              style={{ backgroundColor: "#0F6E56", opacity: salesChannel ? 1 : 0.4, cursor: salesChannel ? "pointer" : "not-allowed" }}>
              পরবর্তী ধাপ <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Steps 2 & 3: Shop Info + Products ──────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center py-10" style={{ backgroundColor: "#F7F6F2" }}>
      <div className="w-full max-w-lg px-4">
        <div className="bg-white rounded-2xl border p-8" style={{ borderColor: "#E8E6DF" }}>
          <div className="text-center mb-2">
            <Logo />
            {/* Business type + sales channel badges */}
            <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
              {businessType && (() => {
                const meta = BUSINESS_TYPE_META[businessType];
                const Icon = meta.icon;
                return (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                    <Icon size={11} /> {meta.label}
                  </div>
                );
              })()}
              {salesChannel && (() => {
                const meta = SALES_CHANNEL_META[salesChannel];
                const Icon = meta.icon;
                return (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                    <Icon size={11} /> {meta.label}
                  </div>
                );
              })()}
            </div>
            <p className="text-xs font-semibold" style={{ color: "#A8A69E" }}>ধাপ {step - 1} / ২</p>
          </div>

          <StepIndicator current={step - 1} />

          {/* ── Step 2: Shop Setup ── */}
          {step === 2 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: "#1A1A18" }}>আপনার শপ সেটআপ করুন</h2>
                <p className="text-sm mt-1" style={{ color: "#5A5A56" }}>কয়েকটি তথ্য দিন, শপ প্রস্তুত হয়ে যাবে</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>শপের নাম</label>
                <input type="text" value={form1.shopName}
                  onChange={(e) => setForm1({ ...form1, shopName: e.target.value })}
                  required style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                  onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>ফোন নম্বর</label>
                <input type="tel" value={form1.phone}
                  onChange={(e) => setForm1({ ...form1, phone: e.target.value })}
                  placeholder="01XXXXXXXXX" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                  onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>পণ্য / সেবার ধরন</label>
                <select value={form1.category}
                  onChange={(e) => setForm1({ ...form1, category: e.target.value })}
                  style={{ ...inputStyle, appearance: "auto" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                  onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")}>
                  <option value="">বেছে নিন</option>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A18" }}>আপনি কি?</label>
                <div className="flex gap-3">
                  {["ভাই", "আপু"].map((g) => (
                    <label key={g}
                      className="flex-1 flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-colors"
                      style={{ borderColor: form1.gender === g ? "#0F6E56" : "#E8E6DF", backgroundColor: form1.gender === g ? "#E1F5EE" : "#FFFFFF" }}>
                      <input type="radio" name="gender" value={g} checked={form1.gender === g}
                        onChange={() => setForm1({ ...form1, gender: g })} className="sr-only" />
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: form1.gender === g ? "#0F6E56" : "#E8E6DF" }}>
                        {form1.gender === g && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0F6E56" }} />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#1A1A18" }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>
                  শপের লোগো <span style={{ color: "#A8A69E" }}>(ঐচ্ছিক)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ borderColor: logoUrl ? "transparent" : "#E8E6DF", backgroundColor: logoUrl ? "transparent" : "#F7F6F2" }}>
                    {logoUrl ? <img src={logoUrl} alt="লোগো" className="w-full h-full object-cover rounded-xl" /> : <span className="text-2xl">🏪</span>}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer flex items-center justify-center border-2 border-dashed rounded-xl py-3 text-sm transition-colors"
                      style={{ borderColor: "#E8E6DF", color: "#A8A69E" }}>
                      {logoUploading ? "আপলোড হচ্ছে..." : logoUrl ? "পরিবর্তন করুন" : "ছবি বেছে নিন (JPG, PNG)"}
                      <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                        disabled={logoUploading} onChange={handleLogoUpload} />
                    </label>
                    {logoError && <p className="text-xs mt-1" style={{ color: "#E24B4A" }}>{logoError}</p>}
                    {!logoError && <p className="text-xs mt-1" style={{ color: "#A8A69E" }}>সর্বোচ্চ ৩০০KB</p>}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#0F6E56" }}>
                {loading ? "সেভ হচ্ছে..." : "পরবর্তী ধাপ"}
                {!loading && <ChevronRight size={18} />}
              </button>
            </form>
          )}

          {/* ── Step 3: Add Products ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: "#1A1A18" }}>আপনার প্রথম ৩টি পণ্য যোগ করুন</h2>
                <p className="text-sm mt-1" style={{ color: "#5A5A56" }}>(ঐচ্ছিক) পরেও যোগ করতে পারবেন</p>
              </div>

              <div className="space-y-3">
                {products.map((product, idx) => (
                  <div key={idx} className="rounded-xl border p-4" style={{ borderColor: "#E8E6DF" }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: "#A8A69E" }}>পণ্য {idx + 1}</p>
                    <div className="space-y-2">
                      <input type="text" placeholder="পণ্যের নাম" value={product.name}
                        onChange={(e) => updateProduct(idx, "name", e.target.value)} style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                        onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")} />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="বিক্রয় মূল্য (৳)" value={product.sellPrice}
                          onChange={(e) => updateProduct(idx, "sellPrice", e.target.value)} style={inputStyle}
                          onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                          onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")} />
                        <input type="number" placeholder="স্টক পরিমাণ" value={product.stockQty}
                          onChange={(e) => updateProduct(idx, "stockQty", e.target.value)} style={inputStyle}
                          onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                          onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => handleStep2(false)} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#0F6E56" }}>
                {loading ? "সেভ হচ্ছে..." : "পরবর্তী ধাপ"}
                {!loading && <ChevronRight size={18} />}
              </button>

              <button onClick={() => handleStep2(true)} disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ color: "#5A5A56", border: "1px solid #E8E6DF" }}>
                এখন না, পরে করব
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
