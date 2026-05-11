"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, CreditCard, ChevronRight, Zap,
  Copy, Check, Headphones, ChevronDown, ChevronUp,
  Sparkles, Shield, TrendingUp, Users, Star,
  RefreshCw, Calendar, Receipt, Mail, MessageSquare,
  Package, Infinity, FileText, Bell, Layers,
} from "lucide-react";

const S = {
  primary: "var(--c-primary)", primaryLight: "var(--c-primary-light)",
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", textSub: "var(--c-text-sub)", textMuted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

/* ── Inline SVG icons for payment methods ── */
function BkashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#E2136E" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="Arial">bK</text>
    </svg>
  );
}
function NagadIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#F05A28" />
      <path d="M12 28L20 12L28 28H22L20 22L18 28H12Z" fill="white" />
    </svg>
  );
}
function RocketIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#7C3AED" />
      <path d="M20 8c0 0 6 3 6 10v8l-6 6-6-6v-8c0-7 6-10 6-10z" fill="white" fillOpacity=".9"/>
      <circle cx="20" cy="18" r="3" fill="#7C3AED"/>
    </svg>
  );
}
function BankIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#1D4ED8" />
      <rect x="10" y="22" width="4" height="8" fill="white" />
      <rect x="18" y="18" width="4" height="12" fill="white" />
      <rect x="26" y="22" width="4" height="8" fill="white" />
      <polygon points="8,20 20,11 32,20" fill="white" />
    </svg>
  );
}

const METHOD_META: Record<string, { label: string; color: string; bg: string; Icon: React.FC<{ size?: number }> }> = {
  bkash:  { label: "bKash",  color: "#E2136E", bg: "#FDE8F3", Icon: BkashIcon  },
  nagad:  { label: "Nagad",  color: "#F05A28", bg: "#FEF0EB", Icon: NagadIcon  },
  rocket: { label: "Rocket", color: "#7C3AED", bg: "#F5EEFB", Icon: RocketIcon },
  bank:   { label: "Bank",   color: "#1D4ED8", bg: "#EEF2FF", Icon: BankIcon   },
};

const PLAN_META: Record<string, { label: string; color: string; bg: string; gradFrom: string; gradTo: string }> = {
  free:     { label: "Free",     color: "#6B7280", bg: "#F3F4F6", gradFrom: "#4B5563", gradTo: "#9CA3AF" },
  pro:      { label: "Pro",      color: "#0F6E56", bg: "#E1F5EE", gradFrom: "#0F6E56", gradTo: "#14B08A" },
  business: { label: "Business", color: "#D97706", bg: "#FFF3DC", gradFrom: "#B45309", gradTo: "#F59E0B" },
};

const PLAN_FEATURES: Record<string, { icon: React.ReactNode; label: string }[]> = {
  free: [
    { icon: <Package size={12}/>,   label: "৫০টি Order/মাস" },
    { icon: <TrendingUp size={12}/>, label: "Basic Reports" },
    { icon: <Users size={12}/>,      label: "১ Staff Account" },
  ],
  pro: [
    { icon: <Infinity size={12}/>,   label: "Unlimited Orders" },
    { icon: <Shield size={12}/>,     label: "Courier Integration" },
    { icon: <Users size={12}/>,      label: "৩ Staff Accounts" },
    { icon: <TrendingUp size={12}/>, label: "Advanced Reports" },
    { icon: <Bell size={12}/>,       label: "SMS Notification" },
    { icon: <FileText size={12}/>,   label: "Invoice PDF" },
  ],
  business: [
    { icon: <Layers size={12}/>,      label: "সব Pro Features" },
    { icon: <Users size={12}/>,       label: "Unlimited Staff" },
    { icon: <MessageSquare size={12}/>,label: "Facebook Integration" },
    { icon: <Bell size={12}/>,        label: "Bulk SMS & WhatsApp" },
    { icon: <FileText size={12}/>,    label: "Custom Invoice" },
    { icon: <Headphones size={12}/>,  label: "Priority Support" },
  ],
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:  { label: "Pending",  color: "#D97706", bg: "#FEF3C7", icon: <Clock size={11}/>        },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5", icon: <CheckCircle size={11}/>  },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", icon: <XCircle size={11}/>      },
};

const FAQ = [
  { q: "Payment করার পর কতক্ষণে Plan activate হয়?",   a: "সাধারণত ১২–২৪ ঘণ্টার মধ্যে। Manual verification শেষ হলে SMS-এ জানানো হবে।" },
  { q: "কোন payment method গুলো accept করা হয়?",       a: "bKash, Nagad, Rocket (DBBL) এবং Bank Transfer। সব ক্ষেত্রে Transaction ID দিতে হবে।" },
  { q: "Renew করলে কি বাকি দিনগুলো যোগ হয়?",           a: "হ্যাঁ! বর্তমান মেয়াদ শেষ হওয়ার পরে নতুন মেয়াদ শুরু হবে।" },
  { q: "Upgrade করলে কি extra পয়সা লাগে?",             a: "বাকি মেয়াদের আনুপাতিক credit পাবেন। Checkout-এ সঠিক হিসাব দেখা যাবে।" },
  { q: "Refund পাওয়া যাবে?",                            a: "Digital service হওয়ায় সাধারণত refund দেওয়া হয় না। বিশেষ ক্ষেত্রে support-এ যোগাযোগ করুন।" },
];

interface Payment {
  id: string; plan: string; months: number; amount: number;
  method: string; transactionId: string | null; senderPhone: string | null;
  status: string; adminNote: string | null; createdAt: string;
}
interface Subscription { plan: string; status: string; endDate: string | null; }
interface PricingConfig {
  planKey: string; monthlyPrice: number;
  discountEnabled: boolean; discountPercent: number; discountLabel: string;
}

/* SVG arc ring for days-left */
function RingProgress({ pct, color, size = 80, track = "#E5E7EB", strokeWidth = 7 }: {
  pct: number; color: string; size?: number; track?: string; strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={`${circ * Math.min(pct / 100, 1)} ${circ}`}
        style={{ transition: "stroke-dasharray 1.2s ease" }} />
    </svg>
  );
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscription").then(r => r.json()).then(d => {
      setSub(d.subscription); setPayments(d.payments || []); setDaysLeft(d.daysLeft); setLoading(false);
    }).catch(() => setLoading(false));
    fetch("/api/pricing").then(r => r.json()).then((d: PricingConfig[]) => setPricingConfigs(d)).catch(() => {});
  }, []);

  function getPrice(planKey: string) {
    const cfg = pricingConfigs.find(c => c.planKey === planKey);
    if (!cfg || cfg.monthlyPrice === 0) return null;
    const base = cfg.monthlyPrice;
    const eff = cfg.discountEnabled && cfg.discountPercent > 0 ? Math.round(base * (1 - cfg.discountPercent / 100)) : base;
    return { eff, base, hasDiscount: cfg.discountEnabled && cfg.discountPercent > 0, label: cfg.discountLabel };
  }

  function copyTx(id: string, tx: string) {
    navigator.clipboard.writeText(tx).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
  }

  const planKey = sub?.plan ?? "free";
  const pm = PLAN_META[planKey] ?? PLAN_META.free;
  const features = PLAN_FEATURES[planKey] ?? [];
  const isExpired = sub?.status === "expired";
  const isFree = planKey === "free";
  const priceData = getPrice(planKey);

  /* days progress */
  const totalDays = (() => {
    if (!sub?.endDate || daysLeft === null) return null;
    const msLeft = new Date(sub.endDate).getTime() - Date.now();
    const approxTotal = Math.round(msLeft / 86400000) + (daysLeft ?? 0);
    return approxTotal > 0 ? approxTotal : null;
  })();
  const ringPct = totalDays && daysLeft ? Math.round((daysLeft / totalDays) * 100) : 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && !isFree && !isExpired;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-52 rounded-3xl" style={{ background: S.border }} />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-96 rounded-3xl" style={{ background: S.border }} />
          <div className="h-96 rounded-3xl" style={{ background: S.border }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════════════════════
          HERO — full-width plan status card
      ══════════════════════════════════════════════════ */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${pm.gradFrom} 0%, ${pm.gradTo} 100%)`, boxShadow: `0 8px 32px ${pm.color}30` }}>
        <div className="p-7 relative overflow-hidden">
          {/* decorative blobs */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-10" style={{ background: "white" }} />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            {/* Left: ring + plan info */}
            <div className="flex items-center gap-6">
              {/* Ring */}
              {!isFree && daysLeft !== null ? (
                <div className="relative flex-shrink-0">
                  <RingProgress pct={ringPct} color="rgba(255,255,255,0.95)" track="rgba(255,255,255,0.25)" size={96} strokeWidth={8} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-black leading-none">{daysLeft}</span>
                    <span className="text-[10px] font-semibold opacity-80 tracking-wide">দিন বাকি</span>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
                  {planKey === "business" ? <Crown size={36} color="white" strokeWidth={1.5} />
                    : planKey === "pro" ? <Zap size={36} color="white" strokeWidth={1.5} />
                    : <Sparkles size={36} color="white" strokeWidth={1.5} />}
                </div>
              )}

              {/* Text */}
              <div className="text-white">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.22)" }}>
                    {pm.label} Plan
                  </span>
                  {isExpired && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500">Expired</span>
                  )}
                </div>
                <p className="text-3xl font-black mt-1">
                  {priceData ? `৳${priceData.eff}` : "বিনামূল্যে"}
                  {priceData && <span className="text-lg font-medium opacity-70 ml-1">/মাস</span>}
                </p>
                {sub?.endDate && !isExpired && (
                  <p className="text-sm opacity-80 mt-1.5 flex items-center gap-1.5">
                    <Calendar size={13} />
                    মেয়াদ: {new Date(sub.endDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                    {isUrgent && <span className="font-bold text-yellow-200 ml-1">— শেষ হচ্ছে!</span>}
                  </p>
                )}
                {isExpired && <p className="text-sm opacity-80 mt-1">Plan মেয়াদ শেষ হয়ে গেছে</p>}
                {isFree && <p className="text-sm opacity-70 mt-1">Upgrade করে আরো সুবিধা পান</p>}
              </div>
            </div>

            {/* Right: feature chips + CTAs */}
            <div className="flex flex-col gap-4 lg:items-end">
              {/* Feature chips */}
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.95)" }}>
                    {f.icon} {f.label}
                  </span>
                ))}
              </div>
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {isFree || isExpired ? (
                  <Link href="/checkout?plan=pro"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.95)", color: pm.color, textDecoration: "none" }}>
                    <Crown size={14} /> Upgrade করুন <ArrowUpRight size={13} />
                  </Link>
                ) : (
                  <>
                    <Link href="/checkout?plan=pro"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold"
                      style={{ background: "rgba(255,255,255,0.95)", color: pm.color, textDecoration: "none" }}>
                      <RefreshCw size={13} /> Renew করুন
                    </Link>
                    {planKey === "pro" && (
                      <Link href="/checkout?plan=business"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold"
                        style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.95)", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.35)" }}>
                        <ArrowUpRight size={13} /> Business Upgrade
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Urgent alert ── */}
      {isUrgent && (
        <div className="rounded-2xl border flex items-center justify-between gap-4 px-5 py-4"
          style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFEDD5" }}>
              <AlertCircle size={18} color="#C2410C" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#C2410C" }}>মাত্র {daysLeft} দিন বাকি!</p>
              <p className="text-xs" style={{ color: "#9A3412" }}>Plan মেয়াদ শেষ হওয়ার আগেই Renew করুন।</p>
            </div>
          </div>
          <Link href="/checkout?plan=pro"
            className="flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap"
            style={{ background: "#EA580C", textDecoration: "none" }}>
            এখনই Renew
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TWO-COLUMN BODY
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT (2/3): Upgrade + Payment History ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upgrade cards — only for free users */}
          {isFree && (
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: S.text }}>Plan Upgrade করুন</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    plan: "pro", icon: <Zap size={20} color="white" />,
                    features: [
                      { icon: <Infinity size={12}/>, label: "Unlimited Orders ও Products" },
                      { icon: <Shield size={12}/>,   label: "Courier Integration" },
                      { icon: <Users size={12}/>,    label: "৩ Staff Accounts" },
                      { icon: <TrendingUp size={12}/>,label: "Advanced Reports" },
                      { icon: <Bell size={12}/>,     label: "SMS Notification" },
                      { icon: <FileText size={12}/>, label: "Invoice PDF" },
                    ],
                    badge: null,
                  },
                  {
                    plan: "business", icon: <Crown size={20} color="white" />,
                    features: [
                      { icon: <Layers size={12}/>,        label: "সব Pro Features" },
                      { icon: <Users size={12}/>,          label: "Unlimited Staff" },
                      { icon: <MessageSquare size={12}/>,  label: "Facebook Integration" },
                      { icon: <Bell size={12}/>,           label: "Bulk SMS & WhatsApp" },
                      { icon: <FileText size={12}/>,       label: "Custom Invoice" },
                      { icon: <Headphones size={12}/>,     label: "Priority Support" },
                    ],
                    badge: "সবচেয়ে জনপ্রিয়",
                  },
                ].map(p => {
                  const pd = getPrice(p.plan);
                  const ppm = PLAN_META[p.plan];
                  return (
                    <div key={p.plan} className="rounded-2xl overflow-hidden border"
                      style={{ borderColor: p.badge ? ppm.color : S.border }}>
                      {/* Card header */}
                      <div className="p-5 relative"
                        style={{ background: `linear-gradient(135deg, ${ppm.gradFrom}, ${ppm.gradTo})` }}>
                        {p.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full text-white"
                            style={{ background: "rgba(0,0,0,0.25)" }}>{p.badge}</span>
                        )}
                        <div className="flex items-center gap-3 text-white">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(255,255,255,0.2)" }}>
                            {p.icon}
                          </div>
                          <div>
                            <p className="font-black">{ppm.label} Plan</p>
                            {pd ? (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-black">৳{pd.eff}</span>
                                <span className="text-xs opacity-75">/মাস</span>
                                {pd.hasDiscount && <span className="text-xs line-through opacity-50">৳{pd.base}</span>}
                              </div>
                            ) : <p className="text-lg font-black">বিনামূল্যে</p>}
                          </div>
                        </div>
                      </div>
                      {/* Features + CTA */}
                      <div className="p-5" style={{ background: S.surface }}>
                        <div className="space-y-2.5 mb-5">
                          {p.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle size={13} color={ppm.color} />
                              <span className="text-xs" style={{ color: S.textSub }}>{f.label}</span>
                            </div>
                          ))}
                        </div>
                        <Link href={`/checkout?plan=${p.plan}`}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold"
                          style={{ background: `linear-gradient(135deg,${ppm.gradFrom},${ppm.gradTo})`, textDecoration: "none" }}>
                          Upgrade করুন <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: S.surface, borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#EEF2FF" }}>
                  <Receipt size={16} color="#4F46E5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>Payment History</h3>
                  <p className="text-xs" style={{ color: S.textMuted }}>{payments.length}টি transaction</p>
                </div>
              </div>
              <Link href="/checkout?plan=pro"
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
                style={{ background: "var(--c-primary-light)", color: "var(--c-primary)", textDecoration: "none" }}>
                <CreditCard size={12} /> নতুন Payment
              </Link>
            </div>

            {payments.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4" style={{ background: S.surface }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
                  <CreditCard size={28} color="#D97706" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: S.text }}>কোনো Payment নেই</p>
                  <p className="text-xs mt-1" style={{ color: S.textMuted }}>প্রথম payment করে plan upgrade করুন</p>
                </div>
                <Link href="/checkout?plan=pro"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--c-primary)", textDecoration: "none" }}>
                  <Crown size={13} /> Pro-তে Upgrade করুন
                </Link>
              </div>
            ) : (
              <div style={{ background: S.surface }}>
                {payments.map((p, i) => {
                  const sm = STATUS_META[p.status] ?? STATUS_META.pending;
                  const pmeta = PLAN_META[p.plan] ?? PLAN_META.free;
                  const mm = METHOD_META[p.method] ?? METHOD_META.bank;
                  const MethodIcon = mm.Icon;
                  const isOpen = expandedPayment === p.id;
                  return (
                    <div key={p.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                      <button
                        onClick={() => setExpandedPayment(isOpen ? null : p.id)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 transition-colors"
                        style={{ background: isOpen ? S.bg : "transparent" }}>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <MethodIcon size={40} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold" style={{ color: S.text }}>
                                {pmeta.label} Plan
                              </p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: pmeta.bg, color: pmeta.color }}>
                                {p.months} মাস
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: S.textMuted }}>
                              {mm.label}
                              {p.transactionId && ` · ${p.transactionId.slice(0, 12)}…`}
                              {" · "}{new Date(p.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-base font-black" style={{ color: S.text }}>
                              ৳{p.amount.toLocaleString("bn-BD")}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: sm.bg, color: sm.color }}>
                              {sm.icon} {sm.label}
                            </span>
                          </div>
                          <div style={{ color: S.textMuted }}>
                            {isOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-5" style={{ borderTop: `1px dashed ${S.border}`, background: S.bg }}>
                          <div className="mt-4 rounded-2xl border p-5 space-y-4" style={{ borderColor: S.border, background: S.surface }}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: S.textMuted }}>Plan</p>
                                <p className="text-sm font-bold" style={{ color: pmeta.color }}>{pmeta.label}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: S.textMuted }}>Duration</p>
                                <p className="text-sm font-bold" style={{ color: S.text }}>{p.months} মাস</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: S.textMuted }}>Method</p>
                                <p className="text-sm font-bold" style={{ color: mm.color }}>{mm.label}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: S.textMuted }}>Amount</p>
                                <p className="text-sm font-bold" style={{ color: S.text }}>৳{p.amount.toLocaleString()}</p>
                              </div>
                            </div>

                            {p.transactionId && (
                              <div className="rounded-xl border p-3.5 flex items-center justify-between gap-3"
                                style={{ borderColor: S.border, background: S.bg }}>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: S.textMuted }}>Transaction ID</p>
                                  <p className="text-sm font-mono font-bold" style={{ color: S.text }}>{p.transactionId}</p>
                                </div>
                                <button
                                  onClick={() => p.transactionId && copyTx(p.id, p.transactionId)}
                                  className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                                  style={{ background: copiedId === p.id ? "#ECFDF5" : S.surface, borderColor: copiedId === p.id ? "#6EE7B7" : S.border }}>
                                  {copiedId === p.id ? <Check size={14} color="#059669"/> : <Copy size={14} style={{ color: S.textMuted }}/>}
                                </button>
                              </div>
                            )}

                            {p.senderPhone && (
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: S.textMuted }}>Sender Phone</p>
                                <p className="text-sm font-medium" style={{ color: S.text }}>{p.senderPhone}</p>
                              </div>
                            )}

                            {p.adminNote && (
                              <div className="rounded-xl p-3.5"
                                style={{ background: p.status === "rejected" ? "#FEF2F2" : "#FFFBEB", borderLeft: `3px solid ${sm.color}` }}>
                                <p className="text-xs font-bold mb-0.5" style={{ color: sm.color }}>Admin Note</p>
                                <p className="text-xs" style={{ color: S.textSub }}>{p.adminNote}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending notice */}
          {payments.some(p => p.status === "pending") && (
            <div className="rounded-2xl border p-5 flex items-start gap-4"
              style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEF3C7" }}>
                <Clock size={16} color="#D97706" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#92600A" }}>Payment Verification চলছে</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#B45309" }}>
                  আপনার payment verify করা হচ্ছে। সাধারণত ১২–২৪ ঘণ্টার মধ্যে plan activate হয়।
                  কোনো সমস্যায়{" "}
                  <a href="mailto:support@bizilcore.com" style={{ color: "#D97706", fontWeight: 700 }}>support@bizilcore.com</a>
                  -এ যোগাযোগ করুন।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT (1/3): Sidebar ── */}
        <div className="space-y-5">

          {/* Quick actions */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, background: S.surface }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <p className="font-bold text-sm" style={{ color: S.text }}>Quick Actions</p>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { href: "/checkout?plan=pro",      icon: <RefreshCw size={15}/>,   label: "Plan Renew করুন",    color: "#0F6E56", bg: "#E1F5EE" },
                { href: "/checkout?plan=business", icon: <Crown size={15}/>,        label: "Business Upgrade",   color: "#D97706", bg: "#FFF3DC" },
                { href: "/support",                icon: <Headphones size={15}/>,   label: "Support Ticket",     color: "#4F46E5", bg: "#EEF2FF" },
              ].map((a, i) => (
                <Link key={i} href={a.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: a.bg, textDecoration: "none" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: a.color }}>{a.icon}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: a.color }}>{a.label}</span>
                  <ChevronRight size={12} style={{ color: a.color, marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Support card */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, background: S.surface }}>
            <div className="p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
                <Headphones size={18} color="white" />
              </div>
              <p className="font-bold text-sm" style={{ color: S.text }}>সাহায্য দরকার?</p>
              <p className="text-xs mt-1 mb-4 leading-relaxed" style={{ color: S.textMuted }}>
                আমাদের support team সপ্তাহে ৭ দিন আপনার পাশে আছে।
              </p>
              <div className="space-y-2">
                <Link href="/support"
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold"
                  style={{ background: "#EEF2FF", color: "#4F46E5", textDecoration: "none" }}>
                  <MessageSquare size={13}/> Support Ticket খুলুন
                </Link>
                <a href="mailto:support@bizilcore.com"
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold"
                  style={{ background: S.bg, color: S.textSub, textDecoration: "none" }}>
                  <Mail size={13}/> support@bizilcore.com
                </a>
              </div>
            </div>
          </div>

          {/* Payment methods accepted */}
          <div className="rounded-2xl border p-5" style={{ borderColor: S.border, background: S.surface }}>
            <p className="font-bold text-sm mb-3" style={{ color: S.text }}>গৃহীত Payment Methods</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { Icon: BkashIcon,  label: "bKash",  color: "#E2136E" },
                { Icon: NagadIcon,  label: "Nagad",  color: "#F05A28" },
                { Icon: RocketIcon, label: "Rocket", color: "#7C3AED" },
                { Icon: BankIcon,   label: "Bank",   color: "#1D4ED8" },
              ].map(({ Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                  style={{ borderColor: S.border }}>
                  <Icon size={28} />
                  <span className="text-xs font-bold" style={{ color }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, background: S.surface }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
              <p className="font-bold text-sm" style={{ color: S.text }}>সাধারণ প্রশ্ন</p>
            </div>
            <div>
              {FAQ.map((item, i) => (
                <div key={i} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-2 hover:opacity-75 transition-opacity">
                    <span className="text-xs font-semibold leading-snug" style={{ color: S.text }}>{item.q}</span>
                    {openFaq === i
                      ? <ChevronUp size={13} style={{ color: S.textMuted, flexShrink: 0, marginTop: 1 }}/>
                      : <ChevronDown size={13} style={{ color: S.textMuted, flexShrink: 0, marginTop: 1 }}/>}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-xs leading-relaxed" style={{ color: S.textSub }}>{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
