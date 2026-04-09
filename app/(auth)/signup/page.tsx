"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PRIMARY = "#0F6E56";
const inputStyle = {
  height: "42px",
  border: "1px solid #E8E6DF",
  borderRadius: "10px",
  color: "#1A1A18",
  width: "100%",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#fff",
  transition: "border-color 0.15s",
};

/* ── Password strength helpers ── */
function getStrengthScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

const STRENGTH_LABELS = ["", "দুর্বল", "মোটামুটি", "ভালো", "শক্তিশালী"];
const STRENGTH_COLORS = ["", "#E53E3E", "#DD6B20", "#D69E2E", "#1BAA78"];
const STRENGTH_TIPS: Record<number, string> = {
  1: "আরও লম্বা পাসওয়ার্ড দিন",
  2: "বড় হাতের অক্ষর বা সংখ্যা যোগ করুন",
  3: "বিশেষ চিহ্ন (@, #, !) যোগ করুন",
  4: "চমৎকার! পাসওয়ার্ডটি শক্তিশালী",
};

function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [show, setShow] = useState(false);
  const score = getStrengthScore(value);
  const showMeter = value.length > 0;

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>
        পাসওয়ার্ড
      </label>

      {/* Input + eye toggle */}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name="password"
          value={value}
          onChange={onChange}
          placeholder="কমপক্ষে ৮ অক্ষর"
          required
          minLength={8}
          style={{ ...inputStyle, paddingRight: "40px" }}
          onFocus={e => (e.target.style.borderColor = PRIMARY)}
          onBlur={e => (e.target.style.borderColor = "#E8E6DF")}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Strength meter */}
      {showMeter && (
        <div className="mt-2 space-y-1.5">
          {/* 4 bars */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: score >= i ? STRENGTH_COLORS[score] : "#E8E6DF",
                }}
              />
            ))}
          </div>
          {/* Label + tip */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: STRENGTH_COLORS[score] }}>
              {STRENGTH_LABELS[score]}
            </span>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              {STRENGTH_TIPS[score]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  // affiliateSlug is hidden — from ?aff= param (affiliate tracking, not referral reward)
  // referralCode is visible — from ?ref= param (referral reward: 1 month Pro free)
  const [form, setForm] = useState({ name: "", email: "", password: "", shopName: "", referralCode: "", affiliateSlug: "", agreed: false });
  const [referralValid, setReferralValid] = useState<null | boolean>(null);
  const [referralMsg, setReferralMsg] = useState("");
  const [checkingRef, setCheckingRef] = useState(false);

  // Declare validateReferral BEFORE the useEffect that depends on it
  const validateReferral = useCallback(async (code: string) => {
    if (!code) { setReferralValid(null); setReferralMsg(""); return; }
    setCheckingRef(true);
    const res = await fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await res.json();
    setCheckingRef(false);
    setReferralValid(data.valid);
    setReferralMsg(data.message ?? "");
  }, []);

  useEffect(() => {
    const aff = searchParams.get("aff");   // affiliate slug — hidden tracking
    const ref = searchParams.get("ref");   // referral code — show in field + validate
    if (aff) setForm(p => ({ ...p, affiliateSlug: aff }));
    if (ref) {
      const code = ref.toUpperCase();
      setForm(p => ({ ...p, referralCode: code }));
      validateReferral(code);              // auto-validate so user sees green checkmark
    }
  }, [searchParams, validateReferral]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agreed) { showToast("error", "Terms & Privacy Policy মেনে নেওয়া আবশ্যক"); return; }
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password, shopName: form.shopName, referralCode: form.referralCode || undefined, affiliateSlug: form.affiliateSlug || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { showToast("error", data.error ?? "কিছু একটা সমস্যা হয়েছে।"); return; }

    // Existing unverified account — resent OTP, move to step 2
    if (data.needsVerification) {
      showToast("success", "নতুন Verification code পাঠানো হয়েছে ✓");
      setResendCooldown(60);
      setStep(2);
      return;
    }

    showToast("success", "Verification code পাঠানো হয়েছে ✓");
    setResendCooldown(60);
    setStep(2);
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { showToast("error", "৬ ডিজিটের কোড দিন"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, otp: code }),
    });
    const data = await res.json();
    if (!res.ok) { setLoading(false); showToast("error", data.error ?? "কোড সঠিক নয়।"); return; }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    showToast("success", "ইমেইল verified! স্বাগতম 🎉");
    setTimeout(() => router.push("/onboarding"), 800);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    });
    setResending(false);
    if (res.ok) {
      showToast("success", "নতুন কোড পাঠানো হয়েছে ✓");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      showToast("error", "কোড পাঠানো যায়নি। আবার চেষ্টা করুন।");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ backgroundColor: "#F7F6F2" }}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg max-w-xs"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: "#E8E6DF" }}>

          {/* Logo + Title */}
          <div className="text-center mb-7">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/logo.svg" alt="BizilCore" className="w-9 h-9" />
              <span
                className="text-2xl"
                style={{
                  fontWeight: 800,
                  background: "linear-gradient(120deg, #0A5240 0%, #0F6E56 40%, #1BAA78 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                BizilCore
              </span>
            </div>
            {step === 1 ? (
              <>
                <h1 className="text-2xl font-semibold" style={{ color: "#1A1A18" }}>বিনামূল্যে শুরু করুন</h1>
                <p className="mt-1 text-sm" style={{ color: "#5A5A56" }}>আজই আপনার ব্যবসা শুরু করুন</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold" style={{ color: "#1A1A18" }}>ইমেইল Verify করুন</h1>
                <p className="mt-1 text-sm" style={{ color: "#5A5A56" }}>
                  <span style={{ color: PRIMARY, fontWeight: 600 }}>{form.email}</span>-এ ৬ ডিজিটের কোড পাঠানো হয়েছে
                </p>
              </>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 h-1.5 rounded-full transition-all" style={{ backgroundColor: step >= s ? PRIMARY : "#E8E6DF" }} />
            ))}
          </div>

          {/* ── STEP 1: Registration Form ── */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              {[{ label: "আপনার নাম", name: "name", type: "text", placeholder: "পূর্ণ নাম লিখুন" },{ label: "ইমেইল", name: "email", type: "email", placeholder: "আপনার ইমেইল লিখুন" }].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name as keyof typeof form] as string | number}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = PRIMARY)}
                    onBlur={e => (e.target.style.borderColor = "#E8E6DF")}
                  />
                </div>
              ))}

              {/* Password field with strength meter */}
              <PasswordField value={form.password} onChange={handleChange} />

              {[{ label: "শপের নাম", name: "shopName", type: "text", placeholder: "আপনার শপের নাম লিখুন" }].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name as keyof typeof form] as string | number}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = PRIMARY)}
                    onBlur={e => (e.target.style.borderColor = "#E8E6DF")}
                  />
                </div>
              ))}

              {/* Referral code field */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>
                  Referral কোড <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(ঐচ্ছিক)</span>
                  {form.affiliateSlug && (
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E6F7F1", color: "#0F6E56" }}>
                      🔗 Affiliate Link
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="referralCode"
                    value={form.referralCode}
                    onChange={e => { handleChange(e); setReferralValid(null); setReferralMsg(""); }}
                    placeholder="যেমন: RINA50"
                    style={{ ...inputStyle, textTransform: "uppercase" }}
                    onFocus={e => (e.target.style.borderColor = PRIMARY)}
                    onBlur={e => { e.target.style.borderColor = "#E8E6DF"; if (form.referralCode) validateReferral(form.referralCode); }}
                  />
                  <button type="button" onClick={() => validateReferral(form.referralCode)}
                    className="px-4 rounded-xl text-sm font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: PRIMARY, height: "42px", opacity: checkingRef ? 0.7 : 1 }}>
                    {checkingRef ? "..." : "চেক"}
                  </button>
                </div>
                {referralMsg && (
                  <p className="text-xs mt-1.5 font-medium" style={{ color: referralValid ? "#1BAA78" : "#E24B4A" }}>
                    {referralValid ? "✓ " : "✗ "}{referralMsg}
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded accent-primary" />
                <span className="text-sm" style={{ color: "#5A5A56" }}>
                  আমি{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2 hover:opacity-80" style={{ color: PRIMARY }}>শর্তাবলী</a>
                  {" "}এবং{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2 hover:opacity-80" style={{ color: PRIMARY }}>গোপনীয়তা নীতি</a>
                  {" "}মেনে নিচ্ছি
                </span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full text-white text-sm font-medium py-2.5 rounded-xl transition-opacity disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}>
                {loading ? "তৈরি হচ্ছে..." : "পরবর্তী →"}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {/* OTP boxes */}
              <div>
                <label className="block text-sm font-medium mb-3 text-center" style={{ color: "#1A1A18" }}>Verification Code</label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all"
                      style={{
                        borderColor: digit ? PRIMARY : "#E8E6DF",
                        color: PRIMARY,
                        backgroundColor: digit ? "#F0FBF7" : "#fff",
                      }}
                      onFocus={e => (e.target.style.borderColor = PRIMARY)}
                      onBlur={e => (e.target.style.borderColor = digit ? PRIMARY : "#E8E6DF")}
                    />
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#F0FBF7", color: "#0F6E56" }}>
                📧 ইমেইল চেক করুন — spam/promotions folder-ও দেখুন
              </div>

              <button type="submit" disabled={loading || otp.join("").length < 6}
                className="w-full text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}>
                {loading ? "যাচাই হচ্ছে..." : "✅ Verify করুন"}
              </button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm" style={{ color: "#5A5A56" }}>কোড পাননি?{" "}
                  {resendCooldown > 0 ? (
                    <span style={{ color: "#9CA3AF" }}>{resendCooldown}s পর আবার পাঠান</span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={resending}
                      className="font-medium hover:underline disabled:opacity-60"
                      style={{ color: PRIMARY }}>
                      {resending ? "পাঠাচ্ছে..." : "আবার পাঠান"}
                    </button>
                  )}
                </p>
              </div>

              <button type="button" onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); }}
                className="w-full text-sm py-2 rounded-xl border"
                style={{ color: "#5A5A56", borderColor: "#E8E6DF" }}>
                ← পেছনে যান
              </button>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm mt-6" style={{ color: "#5A5A56" }}>
              ইতিমধ্যে account আছে?{" "}
              <Link href="/login" className="font-medium hover:underline" style={{ color: PRIMARY }}>লগইন করুন</Link>
            </p>
          )}

          <p className="text-center text-xs mt-5 pt-5 border-t" style={{ color: "#B0AEA8", borderColor: "#F0EDE8" }}>
            <Link href="/terms" className="hover:underline hover:opacity-80" style={{ color: "#B0AEA8" }}>শর্তাবলী</Link>
            {" · "}
            <Link href="/privacy" className="hover:underline hover:opacity-80" style={{ color: "#B0AEA8" }}>গোপনীয়তা নীতি</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#0F6E56" }} /></div>}>
      <SignupContent />
    </Suspense>
  );
}
