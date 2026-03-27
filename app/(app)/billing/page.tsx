"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, Smartphone, CreditCard, ChevronRight,
} from "lucide-react";

const S = {
  primary: "var(--c-primary)", primaryLight: "var(--c-primary-light)",
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", textSub: "var(--c-text-sub)", textMuted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

const PLAN_STYLE: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  free:     { label: "Free",     color: "#6B7280", bg: "#F3F4F6", icon: "🎁" },
  pro:      { label: "Pro",      color: "#0F6E56", bg: "#E1F5EE", icon: "⚡" },
  business: { label: "Business", color: "#EF9F27", bg: "#FFF3DC", icon: "👑" },
};

const METHOD_ICONS: Record<string, string> = {
  bkash: "📱", nagad: "💳", rocket: "🚀", bank: "🏦",
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; icon: React.FC<{ size: number }> }> = {
  pending:  { label: "Pending",  color: "#D97706", bg: "#FEF3C7", icon: (p) => <Clock {...p} /> },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5", icon: (p) => <CheckCircle {...p} /> },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", icon: (p) => <XCircle {...p} /> },
};

interface Payment {
  id: string;
  plan: string;
  months: number;
  amount: number;
  method: string;
  transactionId: string | null;
  senderPhone: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

interface Subscription {
  plan: string;
  status: string;
  endDate: string | null;
}

interface PricingConfig {
  planKey: string;
  monthlyPrice: number;
  discountEnabled: boolean;
  discountPercent: number;
  discountLabel: string;
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => {
        setSub(d.subscription);
        setPayments(d.payments || []);
        setDaysLeft(d.daysLeft);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data: PricingConfig[]) => setPricingConfigs(data))
      .catch(() => {});
  }, []);

  function getDisplayPrice(planKey: string): string {
    const cfg = pricingConfigs.find((c) => c.planKey === planKey);
    if (!cfg || cfg.monthlyPrice === 0) return "বিনামূল্যে";
    const base = cfg.monthlyPrice;
    const effective = cfg.discountEnabled && cfg.discountPercent > 0
      ? Math.round(base * (1 - cfg.discountPercent / 100))
      : base;
    return `৳${effective}/মাস`;
  }

  const planStyle = PLAN_STYLE[sub?.plan ?? "free"] ?? PLAN_STYLE.free;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-2xl" style={{ backgroundColor: S.border }} />
        <div className="h-64 rounded-2xl" style={{ backgroundColor: S.border }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
          <Crown size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>Billing ও Subscription</h1>
          <p className="text-xs" style={{ color: S.textMuted }}>আপনার plan এবং payment history দেখুন</p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div
        className="rounded-2xl border p-6"
        style={{ backgroundColor: S.surface, borderColor: S.border }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: planStyle.bg }}
            >
              {planStyle.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: planStyle.bg, color: planStyle.color }}
                >
                  {planStyle.label} Plan
                </span>
                {sub?.status === "expired" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Expired</span>
                )}
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: S.text }}>
                {getDisplayPrice(sub?.plan ?? "free")}
              </p>
              {sub?.endDate && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={13} style={{ color: S.textMuted }} />
                  <span className="text-xs" style={{ color: S.textMuted }}>
                    মেয়াদ শেষ: {new Date(sub.endDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                    {daysLeft !== null && (
                      <span style={{ color: daysLeft < 7 ? "#DC2626" : S.textSub }} className="ml-1 font-semibold">
                        ({daysLeft} দিন বাকি)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:text-right">
            {sub?.plan === "free" ? (
              <Link
                href="/checkout?plan=pro"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "var(--c-primary)", textDecoration: "none" }}
              >
                <Crown size={15} />
                Pro-তে Upgrade করুন
                <ArrowUpRight size={14} />
              </Link>
            ) : (
              <Link
                href="/checkout?plan=pro"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: S.border, color: S.textSub, textDecoration: "none" }}
              >
                Renew করুন
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade prompt for free users */}
      {sub?.plan === "free" && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { plan: "pro", label: "Pro", color: "#0F6E56", bg: "#E1F5EE", icon: "⚡", features: ["Courier Integration", "Staff (৩ জন)", "Advanced Reports"] },
            { plan: "business", label: "Business", color: "#EF9F27", bg: "#FFF3DC", icon: "👑", features: ["Unlimited Staff", "Facebook Integration", "Priority Support"] },
          ].map((p) => (
            <div
              key={p.plan}
              className="rounded-2xl border p-5"
              style={{ backgroundColor: S.surface, borderColor: S.border }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: S.text }}>{p.label} Plan</p>
                  <p className="text-xs" style={{ color: p.color }}>{getDisplayPrice(p.plan)}</p>
                </div>
              </div>
              <div className="space-y-1 mb-4">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle size={12} color={p.color} />
                    <span className="text-xs" style={{ color: S.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href={`/checkout?plan=${p.plan}`}
                className="block text-center py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: p.color, textDecoration: "none" }}
              >
                Upgrade করুন
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Payment History */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="px-5 py-4 border-b" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: S.text }}>
              Payment History ({payments.length})
            </h3>
            <Link
              href="/checkout?plan=pro"
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "var(--c-primary)", textDecoration: "none" }}
            >
              নতুন Payment <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center" style={{ backgroundColor: S.surface }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)" }}>
              <CreditCard size={28} color="#D97706" />
            </div>
            <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো Payment History নেই</p>
            <p className="text-xs mt-1.5 mb-4" style={{ color: S.textMuted }}>প্রথম payment করুন এবং plan upgrade করুন</p>
            <Link
              href="/checkout?plan=pro"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--c-primary)", textDecoration: "none" }}
            >
              <Crown size={14} /> Pro-তে Upgrade করুন
            </Link>
          </div>
        ) : (
          <div style={{ backgroundColor: S.surface }}>
            {payments.map((p, i) => {
              const statusStyle = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
              const StatusIcon = statusStyle.icon;
              const planStyle = PLAN_STYLE[p.plan] ?? PLAN_STYLE.free;
              return (
                <div
                  key={p.id}
                  className="px-5 py-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: planStyle.bg }}
                    >
                      {METHOD_ICONS[p.method] ?? "💰"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: S.text }}>
                          {planStyle.label} Plan
                        </p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: planStyle.bg, color: planStyle.color }}>
                          {p.months} মাস
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.textMuted }}>
                        {p.method.toUpperCase()}
                        {p.transactionId && ` · TrxID: ${p.transactionId}`}
                        {p.senderPhone && ` · ${p.senderPhone}`}
                        {" · "}{new Date(p.createdAt).toLocaleDateString("bn-BD")}
                      </p>
                      {p.adminNote && (
                        <p className="text-xs mt-0.5" style={{ color: p.status === "rejected" ? "#DC2626" : S.textSub }}>
                          📝 {p.adminNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg font-bold" style={{ color: S.text }}>৳{p.amount.toLocaleString("bn-BD")}</span>
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      <StatusIcon size={12} />
                      {statusStyle.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending notice */}
      {payments.some((p) => p.status === "pending") && (
        <div
          className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }}
        >
          <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92600A" }}>Payment Verification চলছে</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              আপনার payment verify করা হচ্ছে। সাধারণত ১২-২৪ ঘণ্টার মধ্যে plan activate হয়।
              কোনো সমস্যায় support@bizilcore.com-এ যোগাযোগ করুন।
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
