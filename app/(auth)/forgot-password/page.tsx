"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F0EDE8" }}
    >
      <div className="w-full max-w-md px-4">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
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

        <div
          className="rounded-2xl shadow-sm border"
          style={{ backgroundColor: "#ffffff", borderColor: "#E8E6DF" }}
        >
          {submitted ? (
            /* Success state */
            <div className="p-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "#ECFDF5" }}
              >
                <CheckCircle size={32} style={{ color: "#0F6E56" }} />
              </div>
              <h2 className="text-xl font-bold mb-3" style={{ color: "#1A1A18" }}>
                Email পাঠানো হয়েছে!
              </h2>
              <p className="text-sm mb-2" style={{ color: "#5A5A56" }}>
                আমরা{" "}
                <span className="font-semibold" style={{ color: "#1A1A18" }}>
                  {email}
                </span>{" "}
                -এ একটি পাসওয়ার্ড রিসেট link পাঠিয়েছি।
              </p>
              <p className="text-sm mb-6" style={{ color: "#5A5A56" }}>
                আপনার inbox দেখুন। Email না পেলে spam folder চেক করুন।
              </p>

              <div
                className="rounded-xl p-4 mb-6 text-left"
                style={{ backgroundColor: "#FFF3DC", borderLeft: "4px solid #EF9F27" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "#92600A" }}>
                  ⏰ মনে রাখুন
                </p>
                <p className="text-xs" style={{ color: "#B07A2A" }}>
                  এই link ১ ঘণ্টার মধ্যে expire হবে। এরপর আবার request করতে হবে।
                </p>
              </div>

              <button
                onClick={() => { setSubmitted(false); setEmail(""); }}
                className="text-sm hover:underline"
                style={{ color: "#0F6E56" }}
              >
                অন্য email দিয়ে চেষ্টা করুন
              </button>
            </div>
          ) : (
            /* Form state */
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A18" }}>
                  পাসওয়ার্ড ভুলে গেছেন?
                </h2>
                <p className="text-sm" style={{ color: "#5A5A56" }}>
                  আপনার email দিন, আমরা একটি reset link পাঠাব।
                </p>
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 mb-5 text-sm"
                  style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1A1A18" }}
                  >
                    ইমেইল ঠিকানা
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#8A8A86" }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="আপনার Gmail / email লিখুন"
                      required
                      className="w-full pl-9 pr-3 text-sm outline-none transition-colors"
                      style={{
                        height: "42px",
                        border: "1px solid #E8E6DF",
                        borderRadius: "10px",
                        color: "#1A1A18",
                        backgroundColor: "#FAFAF8",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                      onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-opacity disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #0F6E56 0%, #0A5240 100%)",
                    boxShadow: "0 4px 14px rgba(15,110,86,0.3)",
                  }}
                >
                  {loading ? "পাঠানো হচ্ছে..." : "🔐  Reset Link পাঠান"}
                </button>
              </form>
            </div>
          )}

          {/* Back to login */}
          <div
            className="px-8 py-4 border-t text-center"
            style={{ borderColor: "#E8E6DF" }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              style={{ color: "#0F6E56" }}
            >
              <ArrowLeft size={14} />
              লগইন পেজে ফিরে যান
            </Link>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#B0AEA8" }}>
          © {new Date().getFullYear()} BizilCore —{" "}
          <Link href="/terms" className="hover:underline" style={{ color: "#B0AEA8" }}>শর্তাবলী</Link>
          {" · "}
          <Link href="/privacy" className="hover:underline" style={{ color: "#B0AEA8" }}>গোপনীয়তা নীতি</Link>
        </p>
      </div>
    </div>
  );
}
