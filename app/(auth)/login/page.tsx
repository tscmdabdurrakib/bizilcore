"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import BrandLogo from "@/components/BrandLogo";
import { Eye, EyeOff, ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";

const PRIMARY = "#0F6E56";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);

    const result = await loginAction(email, password);
    setLoading(false);

    if (!result.success) {
      if (result.needsVerification) {
        setUnverifiedEmail(email);
      } else {
        showToast("error", result.error || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
      return;
    }

    showToast("success", "সফলভাবে লগইন হয়েছে ✓");
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    if (session?.user?.onboarded) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  }

  async function handleResendOtp() {
    if (!unverifiedEmail || resendingOtp) return;
    setResendingOtp(true);
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    setResendingOtp(false);
    if (res.ok) {
      showToast("success", "Verification code পাঠানো হয়েছে ✓");
      router.push("/signup");
    } else {
      showToast("error", "কোড পাঠানো যায়নি। আবার চেষ্টা করুন।");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F7F6F2" }}>
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-white text-sm font-medium shadow-2xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#0F6E56" : "#DC2626" }}
        >
          {toast.type === "success" ? "✓" : "✗"} {toast.message}
        </div>
      )}

      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #062e20 0%, #0F6E56 55%, #1db88a 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-1/3 -left-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute bottom-0 right-10 w-64 h-64 rounded-full opacity-5" style={{ backgroundColor: "#fff" }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          <BrandLogo size="lg" tone="light" href="/" />

          <div className="flex-1 flex flex-col justify-center mt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}>
              🇧🇩 বাংলাদেশের #১ Business Management Tool
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-4 text-white">
              আপনার ব্যবসাকে<br />
              <span style={{ color: "#7effd4" }}>এক ধাপ এগিয়ে</span> নিন
            </h2>
            <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.7)" }}>
              স্টক, অর্ডার, কাস্টমার — সব এক জায়গায় ম্যানেজ করুন
            </p>

            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: "নিরাপদ ও নির্ভরযোগ্য", desc: "আপনার ডেটা সম্পূর্ণ সুরক্ষিত" },
                { icon: TrendingUp, title: "Real-time Analytics", desc: "যেকোনো সময় ব্যবসার অবস্থা দেখুন" },
                { icon: Users, title: "১০,০০০+ Seller বিশ্বাস করেন", desc: "সারা বাংলাদেশে ব্যবহৃত" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom testimonial */}
          <div className="rounded-2xl p-5 mt-8" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-sm italic mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
              "BizilCore দিয়ে আমার ব্যবসা অনেক সহজ হয়ে গেছে। প্রতিদিন কত টাকা আসছে-যাচ্ছে সব দেখতে পাই।"
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>ফ</div>
              <div>
                <p className="text-xs font-semibold text-white">Fatema Khanom</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>ঢাকা, পোশাক ব্যবসা</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 px-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <BrandLogo size="xl" tone="dark" href="/" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#111" }}>আবার স্বাগতম 👋</h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          {unverifiedEmail && (
            <div className="mb-5 p-4 rounded-2xl border text-sm" style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}>
              <p className="font-semibold mb-1" style={{ color: "#92400E" }}>📧 ইমেইল Verify করা হয়নি</p>
              <p className="text-xs mb-3" style={{ color: "#78350F" }}>
                <span className="font-medium">{unverifiedEmail}</span>-এ verification code পাঠানো হয়নি।
              </p>
              <button onClick={handleResendOtp} disabled={resendingOtp}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "#F59E0B", color: "#fff" }}>
                {resendingOtp ? "পাঠাচ্ছে..." : "✉ Verification Code পাঠান"}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>ইমেইল</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল লিখুন"
                required
                className="w-full px-4 text-sm outline-none transition-all"
                style={{
                  height: "48px",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "12px",
                  color: "#111",
                  backgroundColor: "#FAFAFA",
                }}
                onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  required
                  className="w-full pl-4 pr-11 text-sm outline-none transition-all"
                  style={{
                    height: "48px",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "12px",
                    color: "#111",
                    backgroundColor: "#FAFAFA",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = PRIMARY; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.backgroundColor = "#FAFAFA"; }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: PRIMARY }}>
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60"
              style={{
                background: loading ? PRIMARY : `linear-gradient(135deg, #0F6E56 0%, #0a5240 100%)`,
                boxShadow: "0 4px 20px rgba(15,110,86,0.35)",
                fontSize: "15px",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  লগইন হচ্ছে...
                </span>
              ) : (
                <>লগইন করুন <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#6B7280" }}>
            নতুন account?{" "}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
              বিনামূল্যে শুরু করুন
            </Link>
          </p>

          <p className="text-center text-xs mt-8 pt-6 border-t" style={{ color: "#9CA3AF", borderColor: "#E5E7EB" }}>
            <Link href="/terms" className="hover:underline" style={{ color: "#9CA3AF" }}>শর্তাবলী</Link>
            {" · "}
            <Link href="/privacy" className="hover:underline" style={{ color: "#9CA3AF" }}>গোপনীয়তা নীতি</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
