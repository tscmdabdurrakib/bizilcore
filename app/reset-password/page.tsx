"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link। অনুগ্রহ করে forgot password page থেকে আবার request করুন।");
    }
  }, [token]);

  function getStrength(): { level: number; label: string; color: string } {
    const len = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [len >= 8, hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (len === 0) return { level: 0, label: "", color: "#E8E6DF" };
    if (score <= 1) return { level: 1, label: "দুর্বল", color: "#E24B4A" };
    if (score === 2) return { level: 2, label: "মাঝারি", color: "#EF9F27" };
    if (score === 3) return { level: 3, label: "ভালো", color: "#0F6E56" };
    return { level: 4, label: "শক্তিশালী", color: "#059669" };
  }

  const strength = getStrength();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড দুটো মিলছে না।");
      return;
    }
    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "কিছু একটা সমস্যা হয়েছে।");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-white font-bold text-xl shadow-md"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5240 100%)" }}
          >
            H
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A18" }}>BizilCore</h1>
        </div>

        <div
          className="rounded-2xl shadow-sm border"
          style={{ backgroundColor: "#ffffff", borderColor: "#E8E6DF" }}
        >
          {success ? (
            /* Success state */
            <div className="p-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "#ECFDF5" }}
              >
                <CheckCircle size={32} style={{ color: "#0F6E56" }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#1A1A18" }}>
                পাসওয়ার্ড পরিবর্তন হয়েছে!
              </h2>
              <p className="text-sm mb-6" style={{ color: "#5A5A56" }}>
                আপনার পাসওয়ার্ড সফলভাবে আপডেট হয়েছে।
                কয়েক সেকেন্ডের মধ্যে login page-এ নিয়ে যাওয়া হবে...
              </p>
              <Link
                href="/login"
                className="inline-block w-full text-center text-white text-sm font-semibold py-3 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #0F6E56 0%, #0A5240 100%)",
                  boxShadow: "0 4px 14px rgba(15,110,86,0.3)",
                }}
              >
                এখনই লগইন করুন
              </Link>
            </div>
          ) : (
            /* Form state */
            <div className="p-8">
              <div className="mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#ECFDF5" }}
                >
                  <Lock size={20} style={{ color: "#0F6E56" }} />
                </div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#1A1A18" }}>
                  নতুন পাসওয়ার্ড সেট করুন
                </h2>
                <p className="text-sm" style={{ color: "#5A5A56" }}>
                  শক্তিশালী পাসওয়ার্ড দিন যা আপনি মনে রাখতে পারবেন।
                </p>
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5 text-sm"
                  style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!token && !error && (
                <div
                  className="rounded-xl px-4 py-3 mb-5 text-sm"
                  style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
                >
                  Invalid reset link।{" "}
                  <Link href="/forgot-password" style={{ color: "#0F6E56" }} className="underline">
                    আবার request করুন।
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1A1A18" }}
                  >
                    নতুন পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      autoComplete="new-password"
                      required
                      disabled={!token}
                      className="w-full pr-10 pl-3 text-sm outline-none transition-colors"
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#8A8A86" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((s) => (
                          <div
                            key={s}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              backgroundColor:
                                s <= strength.level ? strength.color : "#E8E6DF",
                            }}
                          />
                        ))}
                      </div>
                      {strength.label && (
                        <p
                          className="text-xs"
                          style={{ color: strength.color }}
                        >
                          পাসওয়ার্ড শক্তি: {strength.label}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#1A1A18" }}
                  >
                    পাসওয়ার্ড নিশ্চিত করুন
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড আবার লিখুন"
                      autoComplete="new-password"
                      required
                      disabled={!token}
                      className="w-full pr-10 pl-3 text-sm outline-none transition-colors"
                      style={{
                        height: "42px",
                        border: `1px solid ${
                          confirmPassword && confirmPassword !== password
                            ? "#E24B4A"
                            : "#E8E6DF"
                        }`,
                        borderRadius: "10px",
                        color: "#1A1A18",
                        backgroundColor: "#FAFAF8",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor =
                          confirmPassword !== password ? "#E24B4A" : "#0F6E56")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor =
                          confirmPassword && confirmPassword !== password
                            ? "#E24B4A"
                            : "#E8E6DF")
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#8A8A86" }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs mt-1" style={{ color: "#E24B4A" }}>
                      পাসওয়ার্ড দুটো মিলছে না
                    </p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs mt-1" style={{ color: "#0F6E56" }}>
                      ✓ পাসওয়ার্ড মিলেছে
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full text-white text-sm font-semibold py-3 rounded-xl transition-opacity disabled:opacity-60 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #0F6E56 0%, #0A5240 100%)",
                    boxShadow: "0 4px 14px rgba(15,110,86,0.3)",
                  }}
                >
                  {loading ? "পরিবর্তন হচ্ছে..." : "✓ পাসওয়ার্ড পরিবর্তন করুন"}
                </button>
              </form>
            </div>
          )}

          {/* Footer */}
          <div
            className="px-8 py-4 border-t text-center"
            style={{ borderColor: "#E8E6DF" }}
          >
            <p className="text-sm" style={{ color: "#5A5A56" }}>
              মনে পড়ে গেছে?{" "}
              <Link
                href="/login"
                className="font-medium hover:underline"
                style={{ color: "#0F6E56" }}
              >
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#B0AEA8" }}>
          © {new Date().getFullYear()} BizilCore — Bangladeshi Sellers-এর জন্য তৈরি
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F0EDE8" }}>
        <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: "#0F6E56", borderTopColor: "transparent" }} />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
