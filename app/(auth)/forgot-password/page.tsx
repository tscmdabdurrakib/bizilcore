"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, Lock, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const PRIMARY = "#0F6E56";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F7F6F2" }}>
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #062e20 0%, #0F6E56 55%, #1db88a 100%)" }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          <BrandLogo size="lg" tone="light" href="/" />

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <Lock size={28} className="text-white" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              পাসওয়ার্ড<br />
              <span style={{ color: "#7effd4" }}>রিসেট করুন</span>
            </h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              চিন্তা নেই! আমরা আপনাকে একটি reset link পাঠাব।
            </p>

            <div className="space-y-4">
              {[
                { icon: ShieldCheck, text: "নিরাপদ ও এনক্রিপ্টেড লিঙ্ক" },
                { icon: Mail, text: "মাত্র কয়েক সেকেন্ডে ইমেইলে আসবে" },
                { icon: CheckCircle, text: "লিঙ্ক ১ ঘণ্টা পর্যন্ত বৈধ থাকবে" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    <Icon size={15} className="text-white" />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 mt-8" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
              © {new Date().getFullYear()} BizilCore — বাংলাদেশের #১ Seller Tool
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <BrandLogo size="xl" tone="dark" href="/" />
          </div>

          {submitted ? (
            /* ── Success State ── */
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "linear-gradient(135deg, #E1F5EE, #A7F3D0)" }}>
                <CheckCircle size={36} style={{ color: PRIMARY }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#111" }}>Email পাঠানো হয়েছে!</h2>
              <p className="text-sm mb-1" style={{ color: "#6B7280" }}>
                আমরা{" "}
                <span className="font-semibold" style={{ color: "#111" }}>{email}</span>{" "}
                -এ একটি পাসওয়ার্ড রিসেট link পাঠিয়েছি।
              </p>
              <p className="text-sm mb-8" style={{ color: "#6B7280" }}>
                আপনার inbox দেখুন। না পেলে spam folder চেক করুন।
              </p>

              <div className="rounded-2xl p-4 mb-8 text-left"
                style={{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#92600A" }}>⏰ মনে রাখুন</p>
                <p className="text-xs" style={{ color: "#B07A2A" }}>
                  এই link ১ ঘণ্টার মধ্যে expire হবে। এরপর আবার request করতে হবে।
                </p>
              </div>

              <button onClick={() => { setSubmitted(false); setEmail(""); }}
                className="text-sm font-semibold hover:underline" style={{ color: PRIMARY }}>
                অন্য email দিয়ে চেষ্টা করুন
              </button>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "#111" }}>পাসওয়ার্ড ভুলে গেছেন?</h1>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  আপনার ইমেইল দিন, আমরা একটি reset link পাঠাব।
                </p>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 mb-5 text-sm flex items-center gap-2"
                  style={{ backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>
                  <span>✗</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                    ইমেইল ঠিকানা
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                    <input
                      type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="আপনার Gmail / email লিখুন"
                      required
                      className="w-full pl-11 pr-4 text-sm outline-none transition-all"
                      style={{
                        height: "48px", border: "1.5px solid #E5E7EB",
                        borderRadius: "12px", color: "#111", backgroundColor: "#FAFAFA",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)`,
                    boxShadow: "0 4px 20px rgba(15,110,86,0.35)",
                    fontSize: "15px",
                  }}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      পাঠানো হচ্ছে...
                    </span>
                  ) : <>🔐 Reset Link পাঠান</>}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t" style={{ borderColor: "#E5E7EB" }}>
                <Link href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                  style={{ color: PRIMARY }}>
                  <ArrowLeft size={15} />
                  লগইন পেজে ফিরে যান
                </Link>
              </div>

              <p className="text-center text-xs mt-6" style={{ color: "#9CA3AF" }}>
                © {new Date().getFullYear()} BizilCore —{" "}
                <Link href="/terms" className="hover:underline" style={{ color: "#9CA3AF" }}>শর্তাবলী</Link>
                {" · "}
                <Link href="/privacy" className="hover:underline" style={{ color: "#9CA3AF" }}>গোপনীয়তা নীতি</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
