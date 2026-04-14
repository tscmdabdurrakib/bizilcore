"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ChevronRight, ArrowLeft } from "lucide-react";
import { useStoreCustomer } from "@/lib/store/store-customer";

export default function StoreSignInPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const redirect = searchParams.get("redirect") || `/store/${slug}`;

  const { setCustomer, customer } = useStoreCustomer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) router.replace(redirect);
  }, [customer, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/store/customer/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopSlug: slug, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCustomer(data.customer);
      router.push(redirect);
    } catch {
      setError("সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden lg:flex w-1/2 bg-black flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-black text-sm">B</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">SHOP.CO</span>
          </div>
          <h1 className="text-white font-extrabold text-4xl leading-tight mb-4">
            FIND CLOTHES THAT MATCHES YOUR STYLE
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            সাইন ইন করুন এবং আপনার পছন্দের পণ্য কিনুন, অর্ডার ট্র্যাক করুন।
          </p>
          <div className="mt-10 flex items-center gap-8 justify-center">
            <div className="text-center">
              <p className="text-white font-black text-2xl">200+</p>
              <p className="text-gray-500 text-xs">Brands</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-white font-black text-2xl">2,000+</p>
              <p className="text-gray-500 text-xs">Products</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-white font-black text-2xl">30,000+</p>
              <p className="text-gray-500 text-xs">Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16">

        {/* Back link */}
        <div className="w-full max-w-md mb-6">
          <Link href={`/store/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition-colors">
            <ArrowLeft size={14} />
            স্টোরে ফিরুন
          </Link>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-extrabold text-3xl text-black tracking-tight mb-1">
              স্বাগতম! 👋
            </h2>
            <p className="text-gray-500 text-sm">
              আপনার অ্যাকাউন্টে সাইন ইন করুন
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-full py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google দিয়ে সাইন ইন করুন
            <span className="text-xs text-gray-400">(শীঘ্রই আসছে)</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">অথবা</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-1.5">
                ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="আপনার ইমেইল লিখুন"
                className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-black">
                  পাসওয়ার্ড
                </label>
                <Link href={`/store/${slug}/auth/forgot`}
                  className="text-xs text-gray-500 hover:text-black transition-colors">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-black transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-3.5 rounded-full text-sm hover:bg-gray-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>সাইন ইন করুন <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            অ্যাকাউন্ট নেই?{" "}
            <Link href={`/store/${slug}/auth/signup${redirect !== `/store/${slug}` ? `?redirect=${redirect}` : ""}`}
              className="text-black font-semibold hover:underline">
              নতুন অ্যাকাউন্ট খুলুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
