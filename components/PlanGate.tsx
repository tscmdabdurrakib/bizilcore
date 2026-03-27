"use client";

import Link from "next/link";
import { Lock, Crown, Zap, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import type { FeatureName } from "@/lib/features";

interface PlanGateProps {
  feature: FeatureName;
  requiredPlan?: "pro" | "business";
  children: React.ReactNode;
}

const FEATURE_INFO: Record<FeatureName, { label: string; desc: string; icon: string }> = {
  sms:            { label: "SMS Notification",    desc: "গ্রাহকদের স্বয়ংক্রিয় SMS পাঠান — অর্ডার confirm, delivery update সব।", icon: "💬" },
  courier:        { label: "Courier Integration", desc: "Pathao, Steadfast, Paperfly — সব courier এক জায়গা থেকে manage করুন।", icon: "🚚" },
  export:         { label: "Excel / PDF Export",  desc: "অর্ডার, পণ্য, গ্রাহক ডেটা Excel বা PDF-এ export করুন।", icon: "📊" },
  reports:        { label: "Advanced Reports",    desc: "বিক্রয়, লাভ, খরচ, গ্রাহক — সব বিশ্লেষণ এক জায়গায়।", icon: "📈" },
  staff:          { label: "Staff Management",    desc: "টিম মেম্বার যোগ করুন, permission দিন, কাজ assign করুন।", icon: "👥" },
  taskManagement: { label: "Task Management",     desc: "অর্ডার, ডেলিভারি, সাপ্লায়ার — সব কাজ একটি Kanban বোর্ডে ট্র্যাক করুন।", icon: "✅" },
  affiliate:      { label: "Affiliate Program",   desc: "আপনার affiliate link share করুন এবং প্রতি signup-এ commission পান।", icon: "💰" },
  multiShop:      { label: "Multi-Shop",          desc: "একটি account দিয়ে একাধিক শপ manage করুন — Business plan-এ পাওয়া যায়।", icon: "🏪" },
};

export default function PlanGate({ feature, requiredPlan = "pro", children }: PlanGateProps) {
  const { loading, canAccess, plan } = useSubscription();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 rounded-xl" style={{ backgroundColor: "var(--c-border)" }} />
        <div className="h-64 rounded-2xl" style={{ backgroundColor: "var(--c-border)" }} />
      </div>
    );
  }

  if (canAccess(feature)) return <>{children}</>;

  const info = FEATURE_INFO[feature];
  const isPro = requiredPlan === "pro";
  const planColor = isPro ? "#0F6E56" : "#EF9F27";
  const planBg = isPro ? "#E1F5EE" : "#FFF3DC";
  const planLabel = isPro ? "Pro" : "Business";
  const planIcon = isPro ? <Zap size={16} /> : <Crown size={16} />;
  const checkoutUrl = `/checkout?plan=${requiredPlan}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div
        className="w-full max-w-md rounded-3xl border p-8 text-center"
        style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
          style={{ backgroundColor: planBg }}
        >
          {info.icon}
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
          style={{ backgroundColor: planBg, color: planColor }}
        >
          {planIcon}
          {planLabel} Plan Feature
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--c-text)" }}>
          {info.label}
        </h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
          {info.desc}
        </p>

        <div
          className="rounded-2xl p-4 mb-6 text-left space-y-2"
          style={{ backgroundColor: planBg }}
        >
          {(isPro
            ? ["সীমাহীন পণ্য ও অর্ডার", "SMS Notifications", "Courier Integration", "Excel/PDF Export", "৩ জন Staff", "Advanced Reports"]
            : ["Pro-এর সব ফিচার", "সীমাহীন Staff", "Facebook Integration", "Priority Support", "Custom Invoice Branding"]
          ).map((f) => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: planColor }}>
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-xs font-medium" style={{ color: planColor }}>{f}</span>
            </div>
          ))}
        </div>

        <Link
          href={checkoutUrl}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm"
          style={{ backgroundColor: planColor, textDecoration: "none" }}
        >
          {planIcon}
          {planLabel} Plan-এ Upgrade করুন
          <ArrowRight size={15} />
        </Link>

        {plan === "free" && (
          <p className="text-xs mt-3" style={{ color: "var(--c-text-muted)" }}>
            আপনার বর্তমান plan: <span className="font-semibold">Free</span>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Inline lock button for export/action buttons ─── */
export function LockedButton({
  feature,
  label,
  className,
}: {
  feature: FeatureName;
  label: string;
  className?: string;
}) {
  const { canAccess } = useSubscription();
  if (canAccess(feature)) return null;

  return (
    <Link
      href="/checkout?plan=pro"
      title="Upgrade করুন"
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold opacity-60 cursor-not-allowed ${className ?? ""}`}
      style={{ backgroundColor: "var(--c-border)", color: "var(--c-text-muted)", textDecoration: "none" }}
      onClick={(e) => e.preventDefault()}
    >
      <Lock size={12} />
      {label}
    </Link>
  );
}
