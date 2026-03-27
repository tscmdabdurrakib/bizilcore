"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await loginAction(email, password);

    setLoading(false);

    if (!result.success) {
      showToast("error", result.error || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F6F2" }}>
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: "#E8E6DF" }}>
          <div className="flex justify-end mb-2">
            <Link href="/" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#8A8A86" }}>
              ← হোমপেজ
            </Link>
          </div>
          <div className="text-center mb-8">
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
            <h1 className="text-xl font-semibold" style={{ color: "#1A1A18" }}>
              আবার স্বাগতম
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#5A5A56" }}>
              আপনার অ্যাকাউন্টে লগইন করুন
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>
                ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল লিখুন"
                required
                className="w-full px-3 text-sm outline-none transition-colors"
                style={{
                  height: "38px",
                  border: "1px solid #E8E6DF",
                  borderRadius: "8px",
                  color: "#1A1A18",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1A1A18" }}>
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড লিখুন"
                required
                className="w-full px-3 text-sm outline-none transition-colors"
                style={{
                  height: "38px",
                  border: "1px solid #E8E6DF",
                  borderRadius: "8px",
                  color: "#1A1A18",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                onBlur={(e) => (e.target.style.borderColor = "#E8E6DF")}
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm hover:underline"
                style={{ color: "#0F6E56" }}
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white text-sm font-medium py-2.5 rounded-lg transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#0F6E56", borderRadius: "8px" }}
            >
              {loading ? "লগইন হচ্ছে..." : "লগইন করুন"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#5A5A56" }}>
            নতুন account?{" "}
            <Link href="/signup" className="font-medium hover:underline" style={{ color: "#0F6E56" }}>
              সাইনআপ করুন
            </Link>
          </p>

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
