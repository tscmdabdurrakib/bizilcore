"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Mail, ArrowRight } from "lucide-react";

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
};

function VerifyEmailContent() {
  const params = useSearchParams();
  const success = params.get("success");
  const error = params.get("error");

  type StateConfig = {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    desc: string;
    action: { href: string; label: string; variant: "primary" | "outline" };
    extra?: React.ReactNode;
  };

  const state: StateConfig = (() => {
    if (success === "true") {
      return {
        icon: <CheckCircle size={36} color="#0F6E56" />,
        iconBg: C.primaryLight,
        title: "ইমেইল Verify হয়েছে! ✅",
        desc: "আপনার ইমেইল সফলভাবে verified হয়েছে। এখন BizilCore-এর সব features ব্যবহার করতে পারবেন।",
        action: { href: "/dashboard", label: "Dashboard-এ যান", variant: "primary" },
      };
    }
    if (success === "already") {
      return {
        icon: <CheckCircle size={36} color="#0F6E56" />,
        iconBg: C.primaryLight,
        title: "আগেই Verified হয়েছে",
        desc: "আপনার ইমেইল ইতিমধ্যেই verified আছে। Dashboard ব্যবহার করুন।",
        action: { href: "/dashboard", label: "Dashboard-এ যান", variant: "primary" },
      };
    }
    if (error === "expired") {
      return {
        icon: <Clock size={36} color="#D97706" />,
        iconBg: "#FEF3C7",
        title: "Link Expire হয়ে গেছে ⏰",
        desc: "Verification link-টির মেয়াদ শেষ হয়ে গেছে (২৪ ঘণ্টা)। Login করুন এবং settings থেকে নতুন verification email পাঠান।",
        action: { href: "/login", label: "Login করুন", variant: "primary" },
      };
    }
    return {
      icon: <XCircle size={36} color="#DC2626" />,
      iconBg: "#FEF2F2",
      title: "Invalid Link ❌",
      desc: "Verification link-টি সঠিক নয় অথবা ইতিমধ্যে ব্যবহার করা হয়েছে। Login করুন অথবা আবার চেষ্টা করুন।",
      action: { href: "/login", label: "Login করুন", variant: "primary" },
    };
  })();

  return (
    <div
      style={{ backgroundColor: C.bg, minHeight: "100vh" }}
      className="flex items-center justify-center px-4 py-12"
    >
      <div
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        }}
        className="p-8 text-center"
      >
        {/* Logo */}
        <div className="mb-6">
          <div
            style={{
              background: `linear-gradient(135deg, #0F6E56 0%, #0A5240 100%)`,
              borderRadius: 12,
              padding: "8px 18px",
              display: "inline-block",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>
              BizilCore
            </span>
          </div>
        </div>

        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: state.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
          }}
        >
          {state.icon}
        </div>

        {/* Title */}
        <h1
          style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 10 }}
        >
          {state.title}
        </h1>

        {/* Description */}
        <p
          style={{ color: C.textSub, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}
        >
          {state.desc}
        </p>

        {/* CTA */}
        <Link
          href={state.action.href}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "13px 20px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
            background:
              state.action.variant === "primary"
                ? `linear-gradient(135deg, #0F6E56 0%, #0A5240 100%)`
                : "transparent",
            color: state.action.variant === "primary" ? "#fff" : C.primary,
            border:
              state.action.variant === "outline"
                ? `1px solid ${C.primary}`
                : "none",
          }}
        >
          {state.action.label}
          <ArrowRight size={15} />
        </Link>

        {/* Back to login */}
        <div className="mt-5">
          <Link
            href="/login"
            style={{ color: C.textSub, fontSize: 13, textDecoration: "none" }}
            className="hover:underline"
          >
            ← Login পেজে ফিরুন
          </Link>
        </div>

        {/* Contact note */}
        <div
          style={{
            marginTop: 24,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 18,
          }}
        >
          <div className="flex items-center justify-center gap-1.5" style={{ color: C.textSub }}>
            <Mail size={13} />
            <span style={{ fontSize: 12 }}>
              সমস্যা হলে:{" "}
              <a
                href="mailto:support@bizilcore.com"
                style={{ color: C.primary, fontWeight: 600 }}
              >
                support@bizilcore.com
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ minHeight: "100vh", backgroundColor: "#F7F6F2" }}
          className="flex items-center justify-center"
        >
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#0F6E56" }} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
