import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Package, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--c-bg, #F8FAF9)" }}
    >
      {/* Background decorative elements */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ backgroundColor: "#0F6E56" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ backgroundColor: "#0F6E56" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.02]"
          style={{ backgroundColor: "#0F6E56" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <img src="/logo.svg" alt="BizilCore" className="w-9 h-9" />
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.15rem",
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

        {/* 404 Display */}
        <div className="relative mb-8">
          <p
            className="text-[120px] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, #0F6E56 30%, #13A67E 70%, #0A5442 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-4px",
            }}
          >
            404
          </p>
          {/* Floating badge */}
          <div
            className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg"
            style={{ backgroundColor: "#FFF3DC" }}
          >
            😅
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--c-text, #1A1A1A)" }}>
          পেজটি পাওয়া যাচ্ছে না
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--c-text-muted, #6B7280)" }}>
          আপনি যে পেজটি খুঁজছেন সেটি সরানো হয়েছে, নাম পরিবর্তন করা হয়েছে, অথবা সাময়িকভাবে পাওয়া যাচ্ছে না।
        </p>

        {/* Quick links */}
        <div className="w-full space-y-2.5 mb-8">
          {[
            { href: "/dashboard",  icon: LayoutDashboard, label: "ড্যাশবোর্ডে যান",   sub: "আপনার overview দেখুন",          color: "#0F6E56", bg: "#ECFDF5" },
            { href: "/orders",     icon: ShoppingBag,     label: "অর্ডার দেখুন",        sub: "সব অর্ডার ম্যানেজ করুন",        color: "#3B82F6", bg: "#EFF6FF" },
            { href: "/inventory",  icon: Package,         label: "পণ্য ও স্টক দেখুন",   sub: "আপনার পণ্যের তালিকা",           color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor: "var(--c-surface, #FFFFFF)",
                borderColor: "var(--c-border, #E5E7EB)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.bg }}
              >
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--c-text, #1A1A1A)" }}>
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: "var(--c-text-muted, #6B7280)" }}>
                  {item.sub}
                </p>
              </div>
              <ArrowLeft
                size={16}
                className="flex-shrink-0 rotate-180"
                style={{ color: "var(--c-text-muted, #9CA3AF)" }}
              />
            </Link>
          ))}
        </div>

        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)",
            boxShadow: "0 4px 14px rgba(15, 110, 86, 0.35)",
          }}
        >
          <Home size={16} />
          হোমে ফিরে যান
        </Link>

        {/* Footer note */}
        <p className="mt-8 text-xs" style={{ color: "var(--c-text-muted, #9CA3AF)" }}>
          BizilCore — বাংলাদেশি ফেসবুক বিক্রেতাদের জন্য
        </p>
      </div>
    </div>
  );
}
