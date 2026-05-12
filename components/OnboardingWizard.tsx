"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, ChevronRight, Check, ArrowLeft, Sparkles, Store, Upload } from "lucide-react";
import BrandLogo from "./BrandLogo";
import {
  BUSINESS_TYPE_META, BUSINESS_TYPES, type BusinessType,
  SALES_CHANNEL_META, SALES_CHANNELS, type SalesChannel,
} from "@/lib/modules";

const PRIMARY = "#0F6E56";

interface Product {
  name: string;
  sellPrice: string;
  stockQty: string;
}

const CATEGORIES = ["পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "অন্যান্য"];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div
            className="h-1.5 rounded-full flex-1 transition-all duration-500"
            style={{ backgroundColor: i < step ? PRIMARY : "#E5E7EB" }}
          />
        </div>
      ))}
    </div>
  );
}

function StepBadge({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{
              backgroundColor: i < current ? PRIMARY : i === current ? PRIMARY : "#E5E7EB",
              color: i <= current ? "#fff" : "#9CA3AF",
              transform: i === current ? "scale(1.15)" : "scale(1)",
            }}>
            {i < current ? <Check size={12} /> : i + 1}
          </div>
        ))}
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full"
        style={{ backgroundColor: "#E1F5EE", color: PRIMARY }}>
        {label}
      </span>
    </div>
  );
}

const inputCls = "w-full px-4 text-sm outline-none transition-all";
const inputStyle = {
  height: "48px",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  color: "#111",
  backgroundColor: "#FAFAFA",
};

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
        salesChannel: salesChannel || (businessType === "fcommerce" ? "online" : "both"),
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

  /* ── Step 4: Success ── */
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(145deg, #f0fdf9 0%, #F7F6F2 60%)" }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border p-10 text-center shadow-xl" style={{ borderColor: "#E5E7EB" }}>
            <div className="relative mx-auto mb-6" style={{ width: 88, height: 88 }}>
              <div className="w-22 h-22 rounded-full flex items-center justify-center"
                style={{ width: 88, height: 88, background: "linear-gradient(135deg, #E1F5EE, #A7F3D0)" }}>
                <CheckCircle size={42} style={{ color: PRIMARY }} />
              </div>
              <div className="absolute -top-1 -right-1 text-2xl">🎉</div>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#111" }}>আপনার Shop Ready!</h2>
            <p className="mb-8" style={{ color: "#6B7280" }}>
              BizilCore শপ সফলভাবে সেটআপ হয়েছে। এখন সব ফিচার ব্যবহার করতে পারবেন।
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { emoji: "📦", label: "স্টক ট্র্যাকিং" },
                { emoji: "📋", label: "অর্ডার ম্যানেজ" },
                { emoji: "📊", label: "রিপোর্ট" },
              ].map(({ emoji, label }) => (
                <div key={label} className="rounded-xl py-3 px-2 text-center"
                  style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <p className="text-xl mb-1">{emoji}</p>
                  <p className="text-xs font-medium" style={{ color: "#6B7280" }}>{label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/dashboard")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all"
              style={{ background: `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)`, boxShadow: "0 4px 20px rgba(15,110,86,0.35)", fontSize: "15px" }}>
              Dashboard এ যান <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 0: Business Type ── */
  if (step === 0) {
    return (
      <div className="min-h-screen flex" style={{ background: "linear-gradient(145deg, #f0fdf9 0%, #F7F6F2 60%)" }}>
        {/* Side accent */}
        <div className="hidden lg:flex w-10 flex-col items-center py-8"
          style={{ background: "linear-gradient(180deg, #0F6E56 0%, #1db88a 100%)" }}>
          <div className="w-6 h-6 rounded-full bg-white/20 mb-4 flex items-center justify-center">
            <Store size={12} className="text-white" />
          </div>
          <div className="flex-1 w-0.5 bg-white/20 rounded-full mx-auto" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4">
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="text-center mb-10">
              <BrandLogo size="lg" tone="dark" href={null} />
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mt-4 mb-4 text-xs font-semibold"
                style={{ backgroundColor: "#E1F5EE", color: PRIMARY }}>
                <Sparkles size={12} /> ধাপ ১ / ৩
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: "#111" }}>আপনার ব্যবসার ধরন কী?</h1>
              <p className="text-sm" style={{ color: "#6B7280" }}>সঠিক features পেতে আপনার ব্যবসার ধরন বেছে নিন</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {BUSINESS_TYPES.map((type) => {
                const meta = BUSINESS_TYPE_META[type];
                const Icon = meta.icon;
                const selected = businessType === type;
                return (
                  <button key={type} onClick={() => setBusinessType(type)}
                    className="relative rounded-2xl border-2 p-5 text-left transition-all duration-150 group"
                    style={{
                      borderColor: selected ? meta.color : "#E5E7EB",
                      backgroundColor: selected ? `${meta.color}12` : "#fff",
                      boxShadow: selected ? `0 4px 16px ${meta.color}25` : "0 1px 3px rgba(0,0,0,0.05)",
                    }}>
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: meta.color }}>
                        <Check size={11} color="#fff" />
                      </div>
                    )}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all"
                      style={{ backgroundColor: selected ? `${meta.color}20` : "#F3F4F6" }}>
                      <Icon size={22} style={{ color: selected ? meta.color : "#6B7280" }} />
                    </div>
                    <p className="font-semibold text-sm mb-0.5" style={{ color: selected ? meta.color : "#111" }}>
                      {meta.label}
                    </p>
                    <p className="text-xs leading-snug" style={{ color: "#9CA3AF" }}>{meta.description}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (businessType === "fcommerce") {
                  setSalesChannel("online");
                  setStep(2);
                } else {
                  setStep(1);
                }
              }}
              disabled={!businessType}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold text-base transition-all disabled:opacity-40"
              style={{
                background: businessType ? `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)` : "#9CA3AF",
                boxShadow: businessType ? "0 4px 20px rgba(15,110,86,0.35)" : "none",
                cursor: businessType ? "pointer" : "not-allowed",
              }}>
              পরবর্তী ধাপ <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 1: Sales Channel ── */
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center py-10 px-4"
        style={{ background: "linear-gradient(145deg, #f0fdf9 0%, #F7F6F2 60%)" }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <BrandLogo size="lg" tone="dark" href={null} />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mt-4 mb-4 text-xs font-semibold"
              style={{ backgroundColor: "#E1F5EE", color: PRIMARY }}>
              <Sparkles size={12} /> ধাপ ১ / ৩ — Sales Channel
            </div>

            {businessType && (() => {
              const meta = BUSINESS_TYPE_META[businessType];
              const Icon = meta.icon;
              return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3 text-xs font-semibold block"
                  style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                  <Icon size={12} /> {meta.label} বেছে নিয়েছেন
                </div>
              );
            })()}

            <h1 className="text-2xl font-bold mb-1" style={{ color: "#111" }}>আপনি কীভাবে বিক্রি করেন?</h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>আপনার sales channel বেছে নিন</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {SALES_CHANNELS.map((ch) => {
              const meta = SALES_CHANNEL_META[ch];
              const Icon = meta.icon;
              const selected = salesChannel === ch;
              return (
                <button key={ch} onClick={() => setSalesChannel(ch)}
                  className="relative rounded-2xl border-2 p-5 text-left transition-all duration-150 flex items-center gap-4"
                  style={{
                    borderColor: selected ? meta.color : "#E5E7EB",
                    backgroundColor: selected ? `${meta.color}10` : "#fff",
                    boxShadow: selected ? `0 4px 16px ${meta.color}25` : "0 1px 3px rgba(0,0,0,0.05)",
                  }}>
                  {selected && (
                    <div className="absolute top-3.5 right-4 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: meta.color }}>
                      <Check size={11} color="#fff" />
                    </div>
                  )}
                  <div className="w-13 h-13 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ width: 52, height: 52, backgroundColor: selected ? `${meta.color}20` : "#F3F4F6" }}>
                    <Icon size={24} style={{ color: selected ? meta.color : "#6B7280" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-0.5" style={{ color: selected ? meta.color : "#111" }}>{meta.label}</p>
                    <p className="text-xs leading-snug" style={{ color: "#9CA3AF" }}>{meta.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)}
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl font-medium text-sm border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
              <ArrowLeft size={15} /> পেছনে
            </button>
            <button onClick={() => setStep(2)} disabled={!salesChannel}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all disabled:opacity-40"
              style={{
                background: salesChannel ? `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)` : "#9CA3AF",
                boxShadow: salesChannel ? "0 4px 20px rgba(15,110,86,0.35)" : "none",
                cursor: salesChannel ? "pointer" : "not-allowed",
              }}>
              পরবর্তী ধাপ <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Steps 2 & 3: Shop Info + Products ── */
  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(145deg, #f0fdf9 0%, #F7F6F2 60%)" }}>
      {/* Side panel for larger screens */}
      <div className="hidden lg:flex lg:w-80 flex-col p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #062e20 0%, #0F6E56 100%)" }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative z-10 flex flex-col h-full">
          <BrandLogo size="md" tone="light" href={null} />

          <div className="mt-10 space-y-6 flex-1">
            {[
              { n: 1, label: "ব্যবসার ধরন", done: true },
              { n: 2, label: "শপ সেটআপ", done: step === 3 },
              { n: 3, label: "প্রথম পণ্য", done: false },
            ].map(({ n, label, done }) => {
              const active = n === (step === 2 ? 2 : 3);
              return (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      backgroundColor: done ? "rgba(255,255,255,0.9)" : active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                      color: done ? PRIMARY : "rgba(255,255,255,0.8)",
                    }}>
                    {done ? <Check size={14} /> : n}
                  </div>
                  <div>
                    <p className="text-sm font-semibold"
                      style={{ color: active ? "#fff" : done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
                      {label}
                    </p>
                    {active && <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>এখন করছেন</p>}
                    {done && <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>সম্পন্ন ✓</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              💡 সব তথ্য পরে settings থেকে পরিবর্তন করা যাবে
            </p>
          </div>
        </div>
      </div>

      {/* Main form area */}
      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="text-center mb-6 lg:hidden">
            <BrandLogo size="lg" tone="dark" href={null} />
          </div>

          {/* Selection badges */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {businessType && (() => {
              const meta = BUSINESS_TYPE_META[businessType];
              const Icon = meta.icon;
              return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                  <Icon size={11} /> {meta.label}
                </div>
              );
            })()}
            {salesChannel && (() => {
              const meta = SALES_CHANNEL_META[salesChannel];
              const Icon = meta.icon;
              return (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                  <Icon size={11} /> {meta.label}
                </div>
              );
            })()}
          </div>

          <StepBadge
            current={step - 2}
            total={2}
            label={step === 2 ? "শপ তথ্য দিন" : "প্রথম পণ্য যোগ করুন"}
          />
          <ProgressBar step={step - 1} total={2} />

          {/* ── Step 2: Shop Info ── */}
          {step === 2 && (
            <div className="bg-white rounded-3xl border p-8 shadow-xl" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#111" }}>আপনার শপ সেটআপ করুন</h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>কয়েকটি তথ্য দিন, শপ প্রস্তুত হয়ে যাবে</p>

              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>শপের নাম</label>
                  <input type="text" value={form1.shopName}
                    onChange={(e) => setForm1({ ...form1, shopName: e.target.value })}
                    required className={inputCls} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>ফোন নম্বর</label>
                  <input type="tel" value={form1.phone}
                    onChange={(e) => setForm1({ ...form1, phone: e.target.value })}
                    placeholder="01XXXXXXXXX" className={inputCls} style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }} />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>পণ্য / সেবার ধরন</label>
                  <select value={form1.category}
                    onChange={(e) => setForm1({ ...form1, category: e.target.value })}
                    className={inputCls} style={{ ...inputStyle, appearance: "auto" as "auto" }}
                    onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }}>
                    <option value="">বেছে নিন</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>আপনি কি?</label>
                  <div className="flex gap-3">
                    {["ভাই", "আপু"].map((g) => (
                      <label key={g}
                        className="flex-1 flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all"
                        style={{
                          borderColor: form1.gender === g ? PRIMARY : "#E5E7EB",
                          backgroundColor: form1.gender === g ? "#E1F5EE" : "#FAFAFA",
                        }}>
                        <input type="radio" name="gender" value={g} checked={form1.gender === g}
                          onChange={() => setForm1({ ...form1, gender: g })} className="sr-only" />
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: form1.gender === g ? PRIMARY : "#D1D5DB" }}>
                          {form1.gender === g && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIMARY }} />}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: form1.gender === g ? PRIMARY : "#374151" }}>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Logo upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                    শপের লোগো{" "}
                    <span className="font-normal" style={{ color: "#9CA3AF" }}>(ঐচ্ছিক)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all"
                      style={{
                        borderColor: logoUrl ? "transparent" : "#E5E7EB",
                        backgroundColor: logoUrl ? "transparent" : "#F9FAFB",
                      }}>
                      {logoUrl
                        ? <img src={logoUrl} alt="লোগো" className="w-full h-full object-cover rounded-2xl" />
                        : <Store size={22} style={{ color: "#9CA3AF" }} />}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 text-sm transition-all hover:border-green-400 hover:bg-green-50"
                        style={{ borderColor: "#D1D5DB", color: "#9CA3AF" }}>
                        <Upload size={15} />
                        {logoUploading ? "আপলোড হচ্ছে..." : logoUrl ? "পরিবর্তন করুন" : "ছবি বেছে নিন"}
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                          disabled={logoUploading} onChange={handleLogoUpload} />
                      </label>
                      {logoError
                        ? <p className="text-xs mt-1.5" style={{ color: "#DC2626" }}>{logoError}</p>
                        : <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>JPG, PNG — সর্বোচ্চ ৩০০KB</p>}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold transition-all disabled:opacity-60 mt-2"
                  style={{ background: `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)`, boxShadow: "0 4px 20px rgba(15,110,86,0.35)", fontSize: "15px" }}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      সেভ হচ্ছে...
                    </span>
                  ) : <>পরবর্তী ধাপ <ChevronRight size={18} /></>}
                </button>
              </form>
            </div>
          )}

          {/* ── Step 3: Products ── */}
          {step === 3 && (
            <div className="bg-white rounded-3xl border p-8 shadow-xl" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#111" }}>আপনার প্রথম ৩টি পণ্য যোগ করুন</h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>ঐচ্ছিক — পরেও যোগ করতে পারবেন</p>

              <div className="space-y-3 mb-5">
                {products.map((product, idx) => (
                  <div key={idx} className="rounded-2xl border p-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFAFA" }}>
                    <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: "#9CA3AF" }}>পণ্য {idx + 1}</p>
                    <div className="space-y-2.5">
                      <input type="text" placeholder="পণ্যের নাম" value={product.name}
                        onChange={(e) => updateProduct(idx, "name", e.target.value)}
                        className={inputCls} style={{ ...inputStyle, height: "44px" }}
                        onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }} />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="বিক্রয় মূল্য (৳)" value={product.sellPrice}
                          onChange={(e) => updateProduct(idx, "sellPrice", e.target.value)}
                          className={inputCls} style={{ ...inputStyle, height: "44px" }}
                          onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                          onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }} />
                        <input type="number" placeholder="স্টক পরিমাণ" value={product.stockQty}
                          onChange={(e) => updateProduct(idx, "stockQty", e.target.value)}
                          className={inputCls} style={{ ...inputStyle, height: "44px" }}
                          onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                          onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => handleStep2(false)} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold disabled:opacity-60 transition-all mb-3"
                style={{ background: `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)`, boxShadow: "0 4px 20px rgba(15,110,86,0.35)", fontSize: "15px" }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    সেভ হচ্ছে...
                  </span>
                ) : <>সম্পন্ন করুন <CheckCircle size={17} /></>}
              </button>

              <button onClick={() => handleStep2(true)} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50 border"
                style={{ color: "#6B7280", borderColor: "#E5E7EB" }}>
                এখন না, পরে করব
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
