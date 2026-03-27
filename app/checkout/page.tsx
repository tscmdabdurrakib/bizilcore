"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, AlertCircle,
  Copy, ChevronRight, Shield, Clock, Crown, Tag, X,
} from "lucide-react";

const S = {
  primary: "#0F6E56", primaryDark: "#0A5240", primaryLight: "#E1F5EE",
  bg: "#F7F6F2", surface: "#FFFFFF", border: "#E8E6DF",
  text: "#1A1A18", textSub: "#5A5A56", textMuted: "#A8A69E",
};

const PLANS = {
  pro: {
    label: "Pro Plan",
    color: "#0F6E56",
    bg: "#E1F5EE",
    features: ["অসীমিত Orders", "অসীমিত Products", "Courier Integration", "Staff (৩ জন)", "SMS Notification", "Advanced Reports"],
  },
  business: {
    label: "Business Plan",
    color: "#EF9F27",
    bg: "#FFF3DC",
    features: ["সব Pro Features", "অসীমিত Staff", "Facebook Integration", "Priority Support", "Custom Invoice", "Bulk SMS"],
  },
};

const DURATION_DISCOUNT: Record<number, number> = { 1: 1.0, 3: 0.95, 6: 0.90, 12: 1.0 };

interface PricingConfig {
  planKey: string;
  monthlyPrice: number;
  discountEnabled: boolean;
  discountPercent: number;
  discountLabel: string;
}

const METHODS = [
  { id: "bkash", label: "bKash", number: "01800-000000", color: "#E2136E", bg: "#FDE8F3", icon: "📱" },
  { id: "nagad", label: "Nagad", number: "01800-000000", color: "#F05A28", bg: "#FEF0EB", icon: "💳" },
  { id: "rocket", label: "Rocket (DBBL)", number: "01800-000000", color: "#8B1EC4", bg: "#F5EEFB", icon: "🚀" },
];

const MONTHS = [
  { value: 1, label: "১ মাস", badge: null },
  { value: 3, label: "৩ মাস", badge: "৫% ছাড়" },
  { value: 6, label: "৬ মাস", badge: "১০% ছাড়" },
  { value: 12, label: "১২ মাস", badge: "সেরা মূল্য" },
];

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const planParam = (params.get("plan") ?? "pro") as keyof typeof PLANS;
  const plan = PLANS[planParam] ?? PLANS.pro;
  const planKey = PLANS[planParam] ? planParam : "pro";

  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [method, setMethod] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [txId, setTxId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data: PricingConfig[]) => setPricingConfigs(data))
      .catch(() => {});
  }, []);

  function getMonthlyBase(key: string): number {
    const cfg = pricingConfigs.find((c) => c.planKey === key);
    if (!cfg) return key === "business" ? 699 : 199;
    const base = cfg.monthlyPrice;
    return cfg.discountEnabled && cfg.discountPercent > 0
      ? Math.round(base * (1 - cfg.discountPercent / 100))
      : base;
  }

  function getPriceForDuration(key: string, m: number): number {
    const base = getMonthlyBase(key);
    const mult = DURATION_DISCOUNT[m] ?? 1.0;
    return Math.round(base * m * mult);
  }

  function getDiscountLabel(key: string): string | null {
    const cfg = pricingConfigs.find((c) => c.planKey === key);
    if (!cfg?.discountEnabled || !cfg.discountPercent) return null;
    return cfg.discountLabel || `${cfg.discountPercent}% ছাড়`;
  }

  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoResult, setPromoResult] = useState<{
    code: string; discountType: string; discountValue: number;
    discountAmount: number; originalAmount: number; finalAmount: number;
    description: string | null; isPartialDiscount?: boolean; baseMonthLabel?: string | null;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/checkout?plan=${planKey}`);
    }
  }, [status, router, planKey]);

  useEffect(() => {
    setPromoResult(null);
    setPromoInput("");
    setPromoError("");
  }, [months, planKey]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: S.bg }} className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: S.primary }} />
      </div>
    );
  }

  const baseAmount = getPriceForDuration(planKey, months);
  const amount = promoResult ? promoResult.finalAmount : baseAmount;
  const selectedMethod = METHODS.find((m) => m.id === method);

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), amount: baseAmount, plan: planKey, months }),
      });
      const data = await res.json();
      if (!res.ok) { setPromoError(data.error || "সমস্যা হয়েছে"); return; }
      setPromoResult(data);
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setPromoResult(null);
    setPromoInput("");
    setPromoError("");
  }

  function copyNumber() {
    if (selectedMethod) {
      navigator.clipboard.writeText(selectedMethod.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txId.trim()) { setError("Transaction ID দিন"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey, months, amount, method,
          transactionId: txId.trim(), senderPhone: senderPhone.trim(),
          promoCode: promoResult?.code ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "সমস্যা হয়েছে"); setSubmitting(false); return; }
      setDone(true);
    } catch {
      setError("Network সমস্যা। আবার চেষ্টা করুন।");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: S.bg }} className="flex items-center justify-center px-4 py-12">
        <div style={{ backgroundColor: S.surface, borderRadius: 20, border: `1px solid ${S.border}`, maxWidth: 480, width: "100%", padding: 40 }} className="text-center">
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: S.primaryLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={40} color={S.primary} />
          </div>
          <h2 style={{ color: S.text, fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Payment Submission সম্পন্ন!</h2>
          <p style={{ color: S.textSub, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            আপনার payment request পাঠানো হয়েছে। Admin verification-এর পর সাধারণত <strong style={{ color: S.text }}>১২-২৪ ঘণ্টার মধ্যে</strong> আপনার plan activate হবে।
          </p>
          <div style={{ backgroundColor: S.bg, borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
            {[
              ["Plan", plan.label],
              ["Duration", `${months} মাস`],
              ...(promoResult ? [
                ["মূল মূল্য", `৳${promoResult.originalAmount}`],
                ["Promo Discount", `-৳${promoResult.discountAmount} (${promoResult.code})`],
              ] : []),
              ["Amount", `৳${amount}`],
              ["Method", selectedMethod?.label ?? method],
              ["Transaction ID", txId],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1">
                <span style={{ color: S.textMuted }}>{k}</span>
                <span style={{ color: S.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <Link href="/billing" style={{ display: "block", padding: "13px 20px", borderRadius: 12, backgroundColor: S.primary, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Billing History দেখুন
          </Link>
          <Link href="/dashboard" style={{ display: "block", padding: "11px 20px", borderRadius: 12, border: `1px solid ${S.border}`, color: S.textSub, textDecoration: "none", fontSize: 14 }}>
            Dashboard-এ যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg }}>
      {/* Header */}
      <div style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/pricing" style={{ display: "flex", alignItems: "center", gap: 6, color: S.textSub, textDecoration: "none", fontSize: 13 }}>
            <ArrowLeft size={16} />
            ফিরে যান
          </Link>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: S.primary }}>BizilCore</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: S.textMuted }}>
            <Shield size={13} />
            Secure Checkout
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }} className="grid md:grid-cols-5 gap-6">

        {/* Left — Steps */}
        <div className="md:col-span-3 space-y-4">

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { n: 1, label: "Plan ও Duration" },
              { n: 2, label: "Payment Method" },
              { n: 3, label: "Transaction" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && <div style={{ width: 28, height: 1, backgroundColor: step > i ? S.primary : S.border }} />}
                <div className="flex items-center gap-1.5">
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    backgroundColor: step >= s.n ? S.primary : S.border,
                    color: step >= s.n ? "#fff" : S.textMuted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span style={{ fontSize: 12, color: step >= s.n ? S.text : S.textMuted, fontWeight: step === s.n ? 600 : 400 }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* STEP 1: Plan + Duration */}
          {step === 1 && (
            <div style={{ backgroundColor: S.surface, borderRadius: 16, border: `1px solid ${S.border}`, padding: 24 }}>
              <h3 style={{ color: S.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Plan ও Duration বেছে নিন</h3>

              {/* Plan toggle */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS.pro][]).map(([key, p]) => {
                  const discLabel = getDiscountLabel(key);
                  return (
                  <Link
                    key={key}
                    href={`/checkout?plan=${key}`}
                    style={{
                      padding: "14px 16px", borderRadius: 12, textDecoration: "none",
                      border: `2px solid ${planKey === key ? p.color : S.border}`,
                      backgroundColor: planKey === key ? p.bg : S.surface,
                    }}
                  >
                    <div style={{ color: p.color, fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                    <div style={{ color: S.textSub, fontSize: 11, marginTop: 2 }}>৳{getMonthlyBase(key)}/মাস থেকে</div>
                    {discLabel && <div style={{ color: "#059669", fontSize: 10, marginTop: 2, fontWeight: 600 }}>{discLabel}</div>}
                  </Link>
                );})}
              </div>

              {/* Duration */}
              <p style={{ color: S.text, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>মেয়াদ বেছে নিন</p>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {MONTHS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMonths(m.value as 1 | 3 | 6 | 12)}
                    style={{
                      padding: "12px 14px", borderRadius: 12, textAlign: "left",
                      border: `2px solid ${months === m.value ? S.primary : S.border}`,
                      backgroundColor: months === m.value ? S.primaryLight : S.surface,
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 13, fontWeight: 600, color: months === m.value ? S.primary : S.text }}>
                        {m.label}
                      </span>
                      {m.badge && (
                        <span style={{ fontSize: 10, backgroundColor: "#DCFCE7", color: "#166534", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>৳{getPriceForDuration(planKey, m.value)}</div>
                  </button>
                ))}
              </div>

              {/* Promo Code Section */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: S.text, fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Tag size={14} color={S.primary} /> Promo Code আছে?
                </p>

                {promoResult ? (
                  <div style={{ backgroundColor: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle size={16} color="#059669" />
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, color: "#065F46" }}>{promoResult.code}</span>
                        <span style={{ fontSize: 12, backgroundColor: "#059669", color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                          {promoResult.discountType === "PERCENT" ? `${promoResult.discountValue}% ছাড়` : `৳${promoResult.discountValue} ছাড়`}
                        </span>
                      </div>
                      {promoResult.description && <p style={{ fontSize: 12, color: "#065F46", marginTop: 4, marginLeft: 24 }}>{promoResult.description}</p>}
                      <p style={{ fontSize: 13, color: "#065F46", marginTop: 6, marginLeft: 24, fontWeight: 700 }}>
                        ৳{promoResult.originalAmount} → ৳{promoResult.finalAmount}
                        <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>(৳{promoResult.discountAmount} সাশ্রয়)</span>
                      </p>
                      {promoResult.isPartialDiscount && promoResult.baseMonthLabel && (
                        <p style={{ fontSize: 11, color: "#065F46", marginTop: 4, marginLeft: 24, opacity: 0.8 }}>
                          ℹ️ এই code {promoResult.baseMonthLabel}-এর ভিত্তিতে discount দেয়
                        </p>
                      )}
                    </div>
                    <button onClick={removePromo} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", padding: 4 }}>
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                        placeholder="PROMO CODE লিখুন"
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${promoError ? "#FCA5A5" : S.border}`, fontSize: 13, outline: "none", backgroundColor: S.surface, color: S.text, fontFamily: "monospace", letterSpacing: 1, boxSizing: "border-box" }}
                      />
                      <button
                        onClick={applyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        style={{ padding: "10px 16px", borderRadius: 10, backgroundColor: promoInput.trim() ? S.primary : S.border, color: "#fff", border: "none", cursor: promoInput.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", opacity: promoLoading ? 0.7 : 1 }}
                      >
                        {promoLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {promoError && (
                      <p style={{ color: "#DC2626", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertCircle size={12} /> {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: S.primary, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
              >
                পরের ধাপ <ChevronRight size={15} style={{ display: "inline" }} />
              </button>
            </div>
          )}

          {/* STEP 2: Payment Method */}
          {step === 2 && (
            <div style={{ backgroundColor: S.surface, borderRadius: 16, border: `1px solid ${S.border}`, padding: 24 }}>
              <h3 style={{ color: S.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Payment Method বেছে নিন</h3>
              <div className="space-y-3 mb-6">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: 12, textAlign: "left",
                      border: `2px solid ${method === m.id ? m.color : S.border}`,
                      backgroundColor: method === m.id ? m.bg : S.surface,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: method === m.id ? m.color : S.text }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: S.textMuted }}>Send money to: {m.number}</div>
                    </div>
                    {method === m.id && (
                      <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", backgroundColor: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle size={12} color="#fff" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: "transparent", color: S.textSub, fontSize: 14, cursor: "pointer" }}>
                  আগের ধাপ
                </button>
                <button
                  onClick={() => { if (!method) return; setStep(3); }}
                  disabled={!method}
                  style={{ flex: 2, padding: "12px", borderRadius: 12, backgroundColor: method ? S.primary : S.border, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: method ? "pointer" : "not-allowed" }}
                >
                  পরের ধাপ <ChevronRight size={15} style={{ display: "inline" }} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Transaction ID */}
          {step === 3 && selectedMethod && (
            <div style={{ backgroundColor: S.surface, borderRadius: 16, border: `1px solid ${S.border}`, padding: 24 }}>
              <h3 style={{ color: S.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                {selectedMethod.label}-এ Payment পাঠান
              </h3>

              {/* Payment instruction */}
              <div style={{ backgroundColor: selectedMethod.bg, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ color: S.textSub, fontSize: 12, marginBottom: 8 }}>মোট পরিমাণ পাঠান</p>
                <p style={{ color: S.text, fontSize: 26, fontWeight: 800 }}>৳{amount}</p>
                <p style={{ color: S.textSub, fontSize: 12, marginTop: 4 }}>{plan.label} — {months} মাস</p>
              </div>

              {/* Number to send */}
              <div style={{ border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ color: S.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                  যে নম্বরে পাঠাবেন ({selectedMethod.label})
                </p>
                <div className="flex items-center justify-between">
                  <p style={{ color: S.text, fontSize: 20, fontWeight: 800, letterSpacing: "0.5px" }}>
                    {selectedMethod.number}
                  </p>
                  <button
                    onClick={copyNumber}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, backgroundColor: copied ? S.primaryLight : S.bg, border: `1px solid ${copied ? S.primary : S.border}`, cursor: "pointer", fontSize: 12, color: copied ? S.primary : S.textSub }}
                  >
                    <Copy size={13} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div style={{ marginTop: 10, backgroundColor: "#FFF3DC", borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ color: "#92600A", fontSize: 12 }}>
                    ⚠️ <strong>{selectedMethod.label}</strong> Send Money ব্যবহার করুন।  "Personal" নয়।
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div style={{ backgroundColor: S.bg, borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <p style={{ color: S.text, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Payment করার পদ্ধতি:</p>
                {[
                  `আপনার ${selectedMethod.label} App খুলুন`,
                  `"Send Money" তে যান`,
                  `${selectedMethod.number} নম্বরে ৳${amount} পাঠান`,
                  "Transaction ID টি copy করুন",
                  "নিচের form-এ Transaction ID দিন",
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: S.primaryLight, color: S.primary, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {i + 1}
                    </span>
                    <span style={{ color: S.textSub, fontSize: 12 }}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.text, marginBottom: 6 }}>
                    Transaction ID / TrxID <span style={{ color: "#E24B4A" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="যেমন: 8N7G2K3M4P (বড় হাতে)"
                    required
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${S.border}`, fontSize: 13, outline: "none", fontFamily: "monospace", backgroundColor: S.surface, color: S.text, boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = S.primary)}
                    onBlur={(e) => (e.target.style.borderColor = S.border)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: S.text, marginBottom: 6 }}>
                    আপনার {selectedMethod.label} নম্বর
                    <span style={{ color: S.textMuted, fontWeight: 400 }}> (ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${S.border}`, fontSize: 13, outline: "none", backgroundColor: S.surface, color: S.text, boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = S.primary)}
                    onBlur={(e) => (e.target.style.borderColor = S.border)}
                  />
                </div>

                {error && (
                  <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: "#DC2626" }}>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: "transparent", color: S.textSub, fontSize: 14, cursor: "pointer" }}>
                    আগের ধাপ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ flex: 2, padding: "12px", borderRadius: 12, backgroundColor: S.primary, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />পাঠানো হচ্ছে...</>
                    ) : "✅ Payment Submit করুন"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right — Summary */}
        <div className="md:col-span-2">
          <div style={{ backgroundColor: S.surface, borderRadius: 16, border: `1px solid ${S.border}`, padding: 22, position: "sticky", top: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <Crown size={16} style={{ color: plan.color }} />
              <h3 style={{ color: S.text, fontSize: 14, fontWeight: 700 }}>{plan.label}</h3>
            </div>

            {/* Price */}
            <div style={{ backgroundColor: plan.bg, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ color: S.textMuted, fontSize: 12 }}>{months} মাসের জন্য</p>
              {promoResult ? (
                <>
                  <p style={{ color: S.textMuted, fontSize: 14, textDecoration: "line-through" }}>৳{promoResult.originalAmount}</p>
                  <p style={{ color: plan.color, fontSize: 28, fontWeight: 800 }}>৳{promoResult.finalAmount}</p>
                  <p style={{ color: "#059669", fontSize: 12, fontWeight: 600 }}>৳{promoResult.discountAmount} সাশ্রয় হচ্ছে!</p>
                </>
              ) : (
                <>
                  <p style={{ color: plan.color, fontSize: 28, fontWeight: 800 }}>৳{amount}</p>
                  <p style={{ color: S.textMuted, fontSize: 11 }}>≈ ৳{Math.round(amount / months)}/মাস</p>
                </>
              )}
            </div>

            {promoResult && (
              <div style={{ backgroundColor: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 10, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Tag size={13} color="#059669" />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#065F46", fontFamily: "monospace" }}>{promoResult.code}</span>
                  <span style={{ fontSize: 11, color: "#065F46", marginLeft: 6 }}>
                    {promoResult.discountType === "PERCENT" ? `${promoResult.discountValue}% ছাড়` : `৳${promoResult.discountValue} ছাড়`}
                  </span>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2 mb-4">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle size={14} color={S.primary} />
                  <span style={{ fontSize: 12, color: S.textSub }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 14 }}>
              <div className="flex items-center gap-1.5" style={{ color: S.textMuted, fontSize: 11 }}>
                <Clock size={12} />
                <span>Verification: ১২-২৪ ঘণ্টা</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5" style={{ color: S.textMuted, fontSize: 11 }}>
                <Shield size={12} />
                <span>১০০% Secure ও Verified</span>
              </div>
            </div>

            {session?.user && (
              <div style={{ marginTop: 14, backgroundColor: S.bg, borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: S.textMuted }}>Logged in as</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{session.user.name}</p>
                <p style={{ fontSize: 11, color: S.textMuted }}>{session.user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#F7F6F2" }} className="flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#0F6E56" }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
