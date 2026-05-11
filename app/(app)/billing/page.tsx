"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, CreditCard, ChevronRight, Zap,
  Copy, Check, Headphones, ChevronDown, ChevronUp,
  Sparkles, Shield, TrendingUp, Users,
  RefreshCw, Calendar, Receipt, Mail, MessageSquare,
  Package, Infinity, FileText, Bell, Layers,
} from "lucide-react";

/* ─────────────────────────────────────────
   Design-system tokens (CSS vars)
───────────────────────────────────────── */
const S = {
  primary:      "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  primaryText:  "var(--c-primary-text)",
  surface:      "var(--c-surface)",
  border:       "var(--c-border)",
  text:         "var(--c-text)",
  textSub:      "var(--c-text-sub)",
  textMuted:    "var(--c-text-muted)",
  bg:           "var(--c-bg)",

  /* semantic */
  successBg:    "var(--bg-success-soft)",
  successText:  "var(--bg-success-text)",
  warningBg:    "var(--bg-warning-soft)",
  warningText:  "var(--bg-warning-text)",
  warningBorder:"var(--bg-warning-border)",
  dangerBg:     "var(--bg-danger-soft)",
  dangerText:   "var(--bg-danger-text)",
  dangerBorder: "var(--bg-danger-border)",
  purpleBg:     "var(--bg-purple-soft)",
  purpleText:   "var(--bg-purple-text)",
  infoBg:       "var(--bg-info-soft)",
  infoText:     "var(--bg-info-text)",

  /* icon tints */
  iconAmberBg:  "var(--icon-amber-bg)",
  iconAmberText:"var(--icon-amber-text)",
  iconPurpleBg: "var(--icon-purple-bg)",
  iconPurpleText:"var(--icon-purple-text)",
  iconGreenBg:  "var(--icon-green-bg)",
  iconGreenText:"var(--icon-green-text)",
  iconBlueBg:   "var(--icon-blue-bg)",
  iconBlueText: "var(--icon-blue-text)",
  iconRedBg:    "var(--icon-red-bg)",
  iconRedText:  "var(--icon-red-text)",
};

/* ─────────────────────────────────────────
   Plan palette  (gradient is hardcoded —
   must look great on screen; uses the
   app's exact primary green for Pro)
───────────────────────────────────────── */
const PLAN_META = {
  free: {
    label: "Free",
    gradFrom: "#1F2937", gradTo: "#6B7280",   /* cool slate */
    chipBg: "rgba(255,255,255,0.15)", chipText: "rgba(255,255,255,0.90)",
    cardBg: "#F3F4F6", cardText: "#374151",
    checkColor: "#6B7280",
    icon: <Sparkles size={36} color="white" strokeWidth={1.5}/>,
  },
  pro: {
    label: "Pro",
    gradFrom: "#064E3B", gradTo: "#0F6E56",   /* app primary emerald */
    chipBg: "rgba(255,255,255,0.18)", chipText: "rgba(255,255,255,0.95)",
    cardBg: "#E1F5EE", cardText: "#065F46",
    checkColor: "#0F6E56",
    icon: <Zap size={36} color="white" strokeWidth={1.5}/>,
  },
  business: {
    label: "Business",
    gradFrom: "#2D1B69", gradTo: "#6D28D9",   /* deep violet — premium */
    chipBg: "rgba(255,255,255,0.18)", chipText: "rgba(255,255,255,0.95)",
    cardBg: "#EDE9FE", cardText: "#5B21B6",
    checkColor: "#7C3AED",
    icon: <Crown size={36} color="white" strokeWidth={1.5}/>,
  },
} as const;
type PlanKey = keyof typeof PLAN_META;

const PLAN_FEATURES: Record<PlanKey, { icon: React.ReactNode; label: string }[]> = {
  free: [
    { icon: <Package size={12}/>,    label: "৫০টি Order/মাস" },
    { icon: <TrendingUp size={12}/>, label: "Basic Reports"  },
    { icon: <Users size={12}/>,      label: "১ Staff Account" },
  ],
  pro: [
    { icon: <Infinity size={12}/>,   label: "Unlimited Orders"     },
    { icon: <Shield size={12}/>,     label: "Courier Integration"  },
    { icon: <Users size={12}/>,      label: "৩ Staff Accounts"     },
    { icon: <TrendingUp size={12}/>, label: "Advanced Reports"     },
    { icon: <Bell size={12}/>,       label: "SMS Notification"     },
    { icon: <FileText size={12}/>,   label: "Invoice PDF"          },
  ],
  business: [
    { icon: <Layers size={12}/>,       label: "সব Pro Features"       },
    { icon: <Users size={12}/>,        label: "Unlimited Staff"       },
    { icon: <MessageSquare size={12}/>,label: "Facebook Integration"  },
    { icon: <Bell size={12}/>,         label: "Bulk SMS & WhatsApp"   },
    { icon: <FileText size={12}/>,     label: "Custom Invoice"        },
    { icon: <Headphones size={12}/>,   label: "Priority Support"      },
  ],
};

/* status badges use semantic CSS tokens */
const STATUS_META = {
  pending:  { label: "Pending",  bg: "var(--status-pending-bg)",   text: "var(--status-pending-text)",   icon: <Clock size={11}/>       },
  approved: { label: "Approved", bg: "var(--bg-success-soft)",     text: "var(--bg-success-text)",       icon: <CheckCircle size={11}/> },
  rejected: { label: "Rejected", bg: "var(--bg-danger-soft)",      text: "var(--bg-danger-text)",        icon: <XCircle size={11}/>     },
};

/* payment-method brand colours (kept faithful to real brands) */
const METHOD_META = {
  bkash:  { label: "bKash",  color: "#C3115D", bg: "#FDE8F3" },
  nagad:  { label: "Nagad",  color: "#E04F24", bg: "#FEF0EB" },
  rocket: { label: "Rocket", color: "#6D28D9", bg: "var(--icon-purple-bg)" },
  bank:   { label: "Bank",   color: "#1D4ED8", bg: "var(--icon-blue-bg)"   },
};

/* ── SVG payment method icons (brand-accurate minimal) ── */
function BkashIcon({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#C3115D"/>
      <circle cx="20" cy="20" r="9" fill="white" fillOpacity=".15"/>
      <text x="20" y="24" textAnchor="middle" fill="white" fontSize="12" fontWeight="800" fontFamily="Arial, sans-serif">bK</text>
    </svg>
  );
}
function NagadIcon({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#E04F24"/>
      <polygon points="20,9 30,30 24,30 20,20 16,30 10,30" fill="white"/>
    </svg>
  );
}
function RocketMethodIcon({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#6D28D9"/>
      <path d="M20 9 C20 9 27 13 27 21 L27 27 L20 31 L13 27 L13 21 C13 13 20 9 20 9Z" fill="white" fillOpacity=".2" stroke="white" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="3.5" fill="white"/>
    </svg>
  );
}
function BankMethodIcon({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#1D4ED8"/>
      <rect x="11" y="23" width="4" height="8" rx="1" fill="white"/>
      <rect x="18" y="19" width="4" height="12" rx="1" fill="white"/>
      <rect x="25" y="23" width="4" height="8" rx="1" fill="white"/>
      <path d="M9 21 L20 12 L31 21" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

const METHOD_ICONS: Record<string, (s: number) => React.ReactNode> = {
  bkash:  (s) => <BkashIcon s={s}/>,
  nagad:  (s) => <NagadIcon s={s}/>,
  rocket: (s) => <RocketMethodIcon s={s}/>,
  bank:   (s) => <BankMethodIcon s={s}/>,
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
interface PricingConfig { planKey: string; monthlyPrice: number; discountEnabled: boolean; discountPercent: number; discountLabel: string; }

function RingProgress({ pct, size = 88, strokeWidth = 7 }: { pct: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.90)" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={`${circ * Math.min(pct/100,1)} ${circ}`}
        style={{ transition: "stroke-dasharray 1.2s ease" }}/>
    </svg>
  );
}

/* ─────────────────────────────────────────
   Page component
───────────────────────────────────────── */
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

  function getPrice(key: string) {
    const cfg = pricingConfigs.find(c => c.planKey === key);
    if (!cfg || cfg.monthlyPrice === 0) return null;
    const base = cfg.monthlyPrice;
    const eff = cfg.discountEnabled && cfg.discountPercent > 0 ? Math.round(base * (1 - cfg.discountPercent / 100)) : base;
    return { eff, base, hasDiscount: cfg.discountEnabled && cfg.discountPercent > 0 };
  }

  function copyTx(id: string, tx: string) {
    navigator.clipboard.writeText(tx).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2200); });
  }

  const planKey = (sub?.plan ?? "free") as PlanKey;
  const pm      = PLAN_META[planKey] ?? PLAN_META.free;
  const feats   = PLAN_FEATURES[planKey] ?? [];
  const isExpired = sub?.status === "expired";
  const isFree    = planKey === "free";
  const priceData = getPrice(planKey);

  const totalDays = (() => {
    if (!sub?.endDate || daysLeft === null) return null;
    const msLeft = new Date(sub.endDate).getTime() - Date.now();
    const t = Math.round(msLeft / 86400000) + daysLeft;
    return t > 0 ? t : null;
  })();
  const ringPct  = totalDays && daysLeft ? Math.round((daysLeft / totalDays) * 100) : 0;
  const isUrgent = daysLeft !== null && daysLeft <= 7 && !isFree && !isExpired;

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-52 rounded-3xl" style={{ background: S.border }}/>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 h-96 rounded-3xl" style={{ background: S.border }}/>
          <div className="h-96 rounded-3xl" style={{ background: S.border }}/>
        </div>
      </div>
    );
  }

  /* ───── Hero card ───────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* HERO ────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${pm.gradFrom} 0%, ${pm.gradTo} 100%)`,
                 boxShadow: `0 12px 40px ${pm.gradTo}40` }}>
        <div className="p-7 relative overflow-hidden">
          {/* decorative rings */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}/>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}/>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            {/* Ring + plan info */}
            <div className="flex items-center gap-6">
              {!isFree && daysLeft !== null ? (
                <div className="relative flex-shrink-0">
                  <RingProgress pct={ringPct} size={92}/>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-black leading-none">{daysLeft}</span>
                    <span className="text-[10px] font-semibold opacity-75 tracking-wide mt-0.5">দিন বাকি</span>
                  </div>
                </div>
              ) : (
                <div className="w-[92px] h-[92px] rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  {pm.icon}
                </div>
              )}

              <div className="text-white">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.15)", letterSpacing: "0.12em" }}>
                    {pm.label} Plan
                  </span>
                  {isExpired && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: S.dangerBg, color: S.dangerText }}>
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-3xl font-black">
                  {priceData ? (
                    <>৳{priceData.eff}<span className="text-base font-medium opacity-60 ml-1">/মাস</span>
                    {priceData.hasDiscount && <span className="text-sm line-through opacity-40 ml-2">৳{priceData.base}</span>}</>
                  ) : "বিনামূল্যে"}
                </p>
                {sub?.endDate && !isExpired && (
                  <p className="text-sm opacity-75 mt-1.5 flex items-center gap-1.5">
                    <Calendar size={12}/>
                    মেয়াদ শেষ: {new Date(sub.endDate).toLocaleDateString("bn-BD", { year:"numeric", month:"long", day:"numeric" })}
                    {isUrgent && <span className="font-bold opacity-100 text-yellow-300 ml-1">— শেষ হচ্ছে!</span>}
                  </p>
                )}
                {isFree && <p className="text-sm opacity-60 mt-1">Upgrade করলে আরো সুবিধা পাবেন</p>}
                {isExpired && <p className="text-sm opacity-75 mt-1">Plan মেয়াদ শেষ হয়ে গেছে</p>}
              </div>
            </div>

            {/* Feature chips + CTAs */}
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {feats.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ background: pm.chipBg, color: pm.chipText }}>
                    {f.icon} {f.label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {isFree || isExpired ? (
                  <Link href="/checkout?plan=pro"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.95)", color: pm.gradTo, textDecoration:"none" }}>
                    <Crown size={14}/> Upgrade করুন <ArrowUpRight size={13}/>
                  </Link>
                ) : (
                  <>
                    <Link href="/checkout?plan=pro"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold"
                      style={{ background: "rgba(255,255,255,0.95)", color: pm.gradFrom, textDecoration:"none" }}>
                      <RefreshCw size={13}/> Renew করুন
                    </Link>
                    {planKey === "pro" && (
                      <Link href="/checkout?plan=business"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold"
                        style={{ background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.90)",
                                 border:"1.5px solid rgba(255,255,255,0.28)", textDecoration:"none" }}>
                        <ArrowUpRight size={13}/> Business Upgrade
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent banner ──────────────────────────── */}
      {isUrgent && (
        <div className="rounded-2xl border flex items-center justify-between gap-4 px-5 py-4"
          style={{ background: "var(--priority-high-bg)", borderColor: "var(--priority-high-text)22" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--icon-orange-bg)" }}>
              <AlertCircle size={18} style={{ color: "var(--icon-orange-text)" }}/>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--priority-high-text)" }}>মাত্র {daysLeft} দিন বাকি!</p>
              <p className="text-xs" style={{ color: "var(--icon-orange-text)" }}>মেয়াদ শেষ হওয়ার আগেই Renew করুন, সার্ভিস বিঘ্নিত হবে না।</p>
            </div>
          </div>
          <Link href="/checkout?plan=pro"
            className="flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold text-white whitespace-nowrap"
            style={{ background: "var(--priority-high-text)", textDecoration:"none" }}>
            এখনই Renew
          </Link>
        </div>
      )}

      {/* TWO-COLUMN BODY ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upgrade cards (free only) */}
          {isFree && (
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: S.text }}>Plan Upgrade করুন</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {(["pro","business"] as PlanKey[]).map(pk => {
                  const p  = PLAN_META[pk];
                  const pd = getPrice(pk);
                  const pf = PLAN_FEATURES[pk];
                  const isPop = pk === "business";
                  return (
                    <div key={pk} className="rounded-2xl overflow-hidden border"
                      style={{ borderColor: isPop ? p.gradTo : S.border }}>
                      <div className="p-5 relative"
                        style={{ background: `linear-gradient(135deg,${p.gradFrom},${p.gradTo})` }}>
                        {isPop && (
                          <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full"
                            style={{ background:"rgba(255,255,255,0.18)", color:"rgba(255,255,255,0.95)" }}>
                            সবচেয়ে জনপ্রিয়
                          </span>
                        )}
                        <div className="flex items-center gap-3 text-white">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background:"rgba(255,255,255,0.15)" }}>
                            {p.icon && React.isValidElement(p.icon)
                              ? React.cloneElement(p.icon as React.ReactElement<{size?:number}>, { size: 18 })
                              : p.icon}
                          </div>
                          <div>
                            <p className="font-black">{p.label} Plan</p>
                            {pd ? (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-black">৳{pd.eff}</span>
                                <span className="text-xs opacity-70">/মাস</span>
                                {pd.hasDiscount && <span className="text-xs line-through opacity-40">৳{pd.base}</span>}
                              </div>
                            ) : <p className="text-xl font-black">বিনামূল্যে</p>}
                          </div>
                        </div>
                      </div>
                      <div className="p-5" style={{ background: S.surface }}>
                        <div className="space-y-2.5 mb-5">
                          {pf.map((f,i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle size={13} style={{ color: p.checkColor, flexShrink:0 }}/>
                              <span className="text-xs" style={{ color: S.textSub }}>{f.label}</span>
                            </div>
                          ))}
                        </div>
                        <Link href={`/checkout?plan=${pk}`}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold"
                          style={{ background:`linear-gradient(135deg,${p.gradFrom},${p.gradTo})`, textDecoration:"none" }}>
                          Upgrade করুন <ArrowUpRight size={13}/>
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
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: S.surface, borderBottom:`1px solid ${S.border}` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: S.iconBlueBg }}>
                  <Receipt size={16} style={{ color: S.iconBlueText }}/>
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>Payment History</h3>
                  <p className="text-xs" style={{ color: S.textMuted }}>{payments.length}টি transaction</p>
                </div>
              </div>
              <Link href="/checkout?plan=pro"
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl"
                style={{ background: S.primaryLight, color: S.primary, textDecoration:"none" }}>
                <CreditCard size={12}/> নতুন Payment
              </Link>
            </div>

            {payments.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4" style={{ background: S.surface }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: S.iconAmberBg }}>
                  <CreditCard size={26} style={{ color: S.iconAmberText }} strokeWidth={1.5}/>
                </div>
                <div className="text-center">
                  <p className="font-bold" style={{ color: S.text }}>কোনো Payment নেই</p>
                  <p className="text-xs mt-1" style={{ color: S.textMuted }}>প্রথম payment করে plan upgrade করুন</p>
                </div>
                <Link href="/checkout?plan=pro"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background:`linear-gradient(135deg,${PLAN_META.pro.gradFrom},${PLAN_META.pro.gradTo})`, textDecoration:"none" }}>
                  <Crown size={13}/> Pro-তে Upgrade করুন
                </Link>
              </div>
            ) : (
              <div style={{ background: S.surface }}>
                {payments.map((p, i) => {
                  const sm   = STATUS_META[p.status] ?? STATUS_META.pending;
                  const pmPl = PLAN_META[(p.plan as PlanKey)] ?? PLAN_META.free;
                  const mm   = METHOD_META[p.method] ?? METHOD_META.bank;
                  const MIcon= METHOD_ICONS[p.method] ?? METHOD_ICONS.bank;
                  const isOpen = expandedPayment === p.id;
                  return (
                    <div key={p.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                      <button
                        onClick={() => setExpandedPayment(isOpen ? null : p.id)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 transition-colors hover:opacity-90"
                        style={{ background: isOpen ? S.bg : "transparent" }}>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">{MIcon(36)}</div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold" style={{ color: S.text }}>{pmPl.label} Plan</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: pmPl.cardBg, color: pmPl.cardText }}>
                                {p.months} মাস
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: S.textMuted }}>
                              {mm.label}{p.transactionId && ` · ${p.transactionId.slice(0,14)}…`}
                              {" · "}{new Date(p.createdAt).toLocaleDateString("bn-BD",{ year:"numeric", month:"short", day:"numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-base font-black" style={{ color: S.text }}>৳{p.amount.toLocaleString("bn-BD")}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: sm.bg, color: sm.text }}>
                              {sm.icon} {sm.label}
                            </span>
                          </div>
                          <span style={{ color: S.textMuted }}>{isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-5" style={{ background: S.bg, borderTop:`1px dashed ${S.border}` }}>
                          <div className="mt-4 rounded-2xl border p-5 space-y-4"
                            style={{ background: S.surface, borderColor: S.border }}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {[
                                { label:"Plan",     val: pmPl.label, valColor: pmPl.checkColor },
                                { label:"Duration", val: `${p.months} মাস` },
                                { label:"Method",   val: mm.label, valColor: mm.color },
                                { label:"Amount",   val: `৳${p.amount.toLocaleString()}` },
                              ].map(item => (
                                <div key={item.label}>
                                  <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: S.textMuted }}>{item.label}</p>
                                  <p className="text-sm font-bold" style={{ color: item.valColor ?? S.text }}>{item.val}</p>
                                </div>
                              ))}
                            </div>

                            {p.transactionId && (
                              <div className="rounded-xl border p-3.5 flex items-center justify-between gap-3"
                                style={{ background: S.bg, borderColor: S.border }}>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: S.textMuted }}>Transaction ID</p>
                                  <p className="text-sm font-mono font-bold" style={{ color: S.text }}>{p.transactionId}</p>
                                </div>
                                <button onClick={() => p.transactionId && copyTx(p.id, p.transactionId)}
                                  className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors"
                                  style={{ background: copiedId===p.id ? S.successBg : S.surface, borderColor: copiedId===p.id ? "var(--bg-success-border)" : S.border }}>
                                  {copiedId===p.id ? <Check size={14} style={{ color: S.successText }}/> : <Copy size={14} style={{ color: S.textMuted }}/>}
                                </button>
                              </div>
                            )}
                            {p.senderPhone && (
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: S.textMuted }}>Sender Phone</p>
                                <p className="text-sm font-semibold" style={{ color: S.text }}>{p.senderPhone}</p>
                              </div>
                            )}
                            {p.adminNote && (
                              <div className="rounded-xl p-3.5"
                                style={{ background: p.status==="rejected" ? S.dangerBg : S.warningBg, borderLeft:`3px solid ${p.status==="rejected" ? S.dangerText : S.warningText}` }}>
                                <p className="text-xs font-bold mb-0.5" style={{ color: p.status==="rejected" ? S.dangerText : S.warningText }}>Admin Note</p>
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
              style={{ background: S.warningBg, borderColor: S.warningBorder }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: S.iconAmberBg }}>
                <Clock size={16} style={{ color: S.iconAmberText }}/>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: S.iconAmberText }}>Payment Verification চলছে</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: S.textSub }}>
                  আপনার payment verify করা হচ্ছে। সাধারণত ১২–২৪ ঘণ্টার মধ্যে plan activate হয়।
                  কোনো সমস্যায় {" "}
                  <a href="mailto:support@bizilcore.com" style={{ color: S.warningText, fontWeight:700 }}>support@bizilcore.com</a>
                  -এ যোগাযোগ করুন।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">

          {/* Quick actions */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: S.surface, borderColor: S.border }}>
            <div className="px-5 py-4" style={{ borderBottom:`1px solid ${S.border}` }}>
              <p className="font-bold text-sm" style={{ color: S.text }}>Quick Actions</p>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { href:"/checkout?plan=pro",      icon:<RefreshCw size={14}/>,  label:"Plan Renew করুন",   bg: S.primaryLight,   color: S.primary      },
                { href:"/checkout?plan=business", icon:<Crown size={14}/>,       label:"Business Upgrade",  bg: S.iconPurpleBg,   color: S.iconPurpleText},
                { href:"/support",                icon:<Headphones size={14}/>,  label:"Support Ticket",    bg: S.iconBlueBg,     color: S.iconBlueText  },
              ].map((a, i) => (
                <Link key={i} href={a.href}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: a.bg, textDecoration:"none" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:"rgba(255,255,255,0.65)" }}>
                    <span style={{ color: a.color }}>{a.icon}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: a.color }}>{a.label}</span>
                  <ChevronRight size={12} style={{ color: a.color, marginLeft:"auto" }}/>
                </Link>
              ))}
            </div>
          </div>

          {/* Support card */}
          <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `linear-gradient(135deg,${PLAN_META.business.gradFrom},${PLAN_META.business.gradTo})` }}>
              <Headphones size={18} color="white"/>
            </div>
            <p className="font-bold text-sm" style={{ color: S.text }}>সাহায্য দরকার?</p>
            <p className="text-xs mt-1 mb-4 leading-relaxed" style={{ color: S.textMuted }}>
              আমাদের support team সপ্তাহে ৭ দিন আপনার পাশে।
            </p>
            <div className="space-y-2">
              <Link href="/support"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold"
                style={{ background: S.iconBlueBg, color: S.iconBlueText, textDecoration:"none" }}>
                <MessageSquare size={13}/> Support Ticket খুলুন
              </Link>
              <a href="mailto:support@bizilcore.com"
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold"
                style={{ background: S.bg, color: S.textSub, textDecoration:"none" }}>
                <Mail size={13}/> support@bizilcore.com
              </a>
            </div>
          </div>

          {/* Accepted payment methods */}
          <div className="rounded-2xl border p-5" style={{ background: S.surface, borderColor: S.border }}>
            <p className="font-bold text-sm mb-3" style={{ color: S.text }}>গৃহীত Payment Methods</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(["bkash","nagad","rocket","bank"] as const).map(k => {
                const m = METHOD_META[k];
                const Icon = METHOD_ICONS[k];
                return (
                  <div key={k} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
                    style={{ background: m.bg, borderColor: S.border }}>
                    {Icon(26)}
                    <span className="text-xs font-bold" style={{ color: m.color }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: S.surface, borderColor: S.border }}>
            <div className="px-5 py-4" style={{ borderBottom:`1px solid ${S.border}` }}>
              <p className="font-bold text-sm" style={{ color: S.text }}>সাধারণ প্রশ্ন</p>
            </div>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-2 hover:opacity-75 transition-opacity">
                  <span className="text-xs font-semibold leading-snug" style={{ color: S.text }}>{item.q}</span>
                  {openFaq===i
                    ? <ChevronUp size={13} style={{ color: S.textMuted, flexShrink:0, marginTop:1 }}/>
                    : <ChevronDown size={13} style={{ color: S.textMuted, flexShrink:0, marginTop:1 }}/>}
                </button>
                {openFaq===i && (
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
  );
}

import React from "react";
