"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Crown, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, CreditCard, ChevronRight, Zap,
  Copy, Check, Headphones, ChevronDown, ChevronUp,
  Sparkles, Shield, TrendingUp, Users, Star,
  RefreshCw, Calendar, Receipt,
} from "lucide-react";

const S = {
  primary: "var(--c-primary)", primaryLight: "var(--c-primary-light)",
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", textSub: "var(--c-text-sub)", textMuted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

const PLAN_META: Record<string, { label: string; color: string; bg: string; gradient: string; icon: React.ReactNode; ringColor: string }> = {
  free:     { label: "Free",     color: "#6B7280", bg: "#F3F4F6", gradient: "linear-gradient(135deg,#6B7280,#9CA3AF)", icon: <Sparkles size={20}/>, ringColor: "#9CA3AF" },
  pro:      { label: "Pro",      color: "#0F6E56", bg: "#E1F5EE", gradient: "linear-gradient(135deg,#0F6E56,#14B08A)", icon: <Zap size={20}/>,      ringColor: "#0F6E56" },
  business: { label: "Business", color: "#D97706", bg: "#FFF3DC", gradient: "linear-gradient(135deg,#D97706,#F59E0B)", icon: <Crown size={20}/>,    ringColor: "#F59E0B" },
};

const PLAN_FEATURES: Record<string, { icon: React.ReactNode; label: string }[]> = {
  free: [
    { icon: <Receipt size={13}/>,   label: "৫০টি Order/মাস" },
    { icon: <TrendingUp size={13}/>, label: "Basic Reports" },
    { icon: <Users size={13}/>,      label: "১ Staff Account" },
  ],
  pro: [
    { icon: <Receipt size={13}/>,    label: "Unlimited Orders" },
    { icon: <Shield size={13}/>,     label: "Courier Integration" },
    { icon: <Users size={13}/>,      label: "৩ Staff Accounts" },
    { icon: <TrendingUp size={13}/>, label: "Advanced Reports" },
    { icon: <CreditCard size={13}/>, label: "SMS Notification" },
    { icon: <Star size={13}/>,       label: "Invoice PDF" },
  ],
  business: [
    { icon: <Receipt size={13}/>,    label: "সব Pro Features" },
    { icon: <Users size={13}/>,      label: "Unlimited Staff" },
    { icon: <Sparkles size={13}/>,   label: "Facebook Integration" },
    { icon: <Zap size={13}/>,        label: "Bulk SMS & WhatsApp" },
    { icon: <Star size={13}/>,       label: "Custom Invoice" },
    { icon: <Headphones size={13}/>, label: "Priority Support" },
  ],
};

const METHOD_META: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  bkash:  { label: "bKash",       color: "#E2136E", bg: "#FDE8F3", textColor: "#9D0B4A" },
  nagad:  { label: "Nagad",       color: "#F05A28", bg: "#FEF0EB", textColor: "#A83D1B" },
  rocket: { label: "Rocket",      color: "#7C3AED", bg: "#F5EEFB", textColor: "#5B21B6" },
  bank:   { label: "Bank",        color: "#1D4ED8", bg: "#EEF2FF", textColor: "#1E40AF" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:  { label: "Pending",  color: "#D97706", bg: "#FEF3C7", icon: <Clock size={12}/>        },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5", icon: <CheckCircle size={12}/>  },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2", icon: <XCircle size={12}/>      },
};

const FAQ = [
  { q: "Payment করার পর কতক্ষণে Plan activate হয়?", a: "সাধারণত ১২-২৪ ঘণ্টার মধ্যে। Manual verification শেষ হলে আপনাকে SMS জানানো হবে।" },
  { q: "কোন payment method গুলো accept করা হয়?", a: "bKash, Nagad, Rocket (DBBL) এবং Bank Transfer। সব ক্ষেত্রে Transaction ID দিতে হবে।" },
  { q: "Renew করলে কি বাকি দিনগুলো যোগ হয়?", a: "হ্যাঁ! আপনার বর্তমান plan-এর মেয়াদ শেষ হওয়ার পরে নতুন মেয়াদ যোগ হবে।" },
  { q: "Upgrade করলে কি extra পয়সা লাগে?", a: "Upgrade-এ বাকি মেয়াদের আনুপাতিক credit পাবেন। Checkout-এ সঠিক হিসাব দেখা যাবে।" },
  { q: "Refund পাওয়া যাবে?", a: "Digital service হওয়ায় সাধারণত refund দেওয়া হয় না। তবে বিশেষ ক্ষেত্রে support@bizilcore.com-এ যোগাযোগ করুন।" },
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

function CircleProgress({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
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
    if (!cfg || cfg.monthlyPrice === 0) return "বিনামূল্যে";
    const base = cfg.monthlyPrice;
    const eff = cfg.discountEnabled && cfg.discountPercent > 0 ? Math.round(base * (1 - cfg.discountPercent / 100)) : base;
    const hasDiscount = cfg.discountEnabled && cfg.discountPercent > 0;
    return { eff, base, hasDiscount, label: cfg.discountLabel };
  }

  function copyTxId(id: string, txId: string) {
    navigator.clipboard.writeText(txId).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); });
  }

  const planMeta = PLAN_META[sub?.plan ?? "free"] ?? PLAN_META.free;
  const features = PLAN_FEATURES[sub?.plan ?? "free"] ?? [];
  const isExpired = sub?.status === "expired";
  const isFree = !sub || sub.plan === "free";
  const totalDays = (() => {
    if (!sub?.endDate) return null;
    const end = new Date(sub.endDate);
    const now = new Date();
    const total = Math.round((end.getTime() - now.getTime() + (daysLeft ?? 0) * 86400000) / 86400000);
    return total;
  })();
  const pct = totalDays && daysLeft ? Math.round((daysLeft / totalDays) * 100) : 0;
  const urgentDays = daysLeft !== null && daysLeft <= 7 && !isFree;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 rounded-3xl" style={{ backgroundColor: S.border }} />
        <div className="h-32 rounded-3xl" style={{ backgroundColor: S.border }} />
        <div className="h-64 rounded-3xl" style={{ backgroundColor: S.border }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Hero Plan Card ── */}
      <div className="rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 text-white relative" style={{ background: planMeta.gradient }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Circle progress ring */}
              {!isFree && daysLeft !== null ? (
                <div className="relative flex-shrink-0">
                  <CircleProgress pct={pct} color="white" size={76} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black leading-none">{daysLeft}</span>
                    <span className="text-[9px] font-semibold opacity-80">দিন</span>
                  </div>
                </div>
              ) : (
                <div className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-white">{planMeta.icon}</div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
                    style={{ background: "rgba(255,255,255,0.25)" }}>
                    {planMeta.label} Plan
                  </span>
                  {isExpired && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 font-bold">Expired</span>
                  )}
                </div>
                <p className="text-2xl font-black">
                  {typeof getPrice(sub?.plan ?? "free") === "object"
                    ? `৳${(getPrice(sub?.plan ?? "free") as { eff: number }).eff}/মাস`
                    : "বিনামূল্যে"}
                </p>
                {sub?.endDate && !isExpired && (
                  <p className="text-xs opacity-80 mt-0.5">
                    <Calendar size={11} className="inline mr-1" />
                    মেয়াদ: {new Date(sub.endDate).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                    {urgentDays && <span className="ml-1 font-bold text-yellow-200">— মেয়াদ শেষ হচ্ছে!</span>}
                  </p>
                )}
                {isExpired && <p className="text-xs text-red-200 mt-0.5 font-semibold">Plan মেয়াদ শেষ হয়ে গেছে</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {(isFree || isExpired) ? (
                <Link href="/checkout?plan=pro"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.95)", color: planMeta.color, textDecoration: "none" }}>
                  <Crown size={14} /> Upgrade করুন <ArrowUpRight size={13} />
                </Link>
              ) : (
                <Link href="/checkout?plan=pro"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#fff", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.4)" }}>
                  <RefreshCw size={13} /> Renew করুন
                </Link>
              )}
              <Link href="/support"
                className="flex items-center justify-center gap-1.5 text-xs opacity-75 hover:opacity-100"
                style={{ color: "#fff", textDecoration: "none" }}>
                <Headphones size={12} /> সাপোর্ট
              </Link>
            </div>
          </div>
        </div>

        {/* Feature chips bar */}
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ background: S.surface, borderTop: `1px solid ${S.border}` }}>
          {features.map((f, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: planMeta.bg, color: planMeta.color }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Urgent Renew Banner ── */}
      {urgentDays && (
        <div className="rounded-2xl border p-4 flex items-center justify-between gap-3"
          style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FED7AA" }}>
              <AlertCircle size={18} color="#C2410C" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#C2410C" }}>মাত্র {daysLeft} দিন বাকি!</p>
              <p className="text-xs" style={{ color: "#9A3412" }}>Plan মেয়াদ শেষ হওয়ার আগেই Renew করুন, সার্ভিস বিঘ্নিত হবে না।</p>
            </div>
          </div>
          <Link href="/checkout?plan=pro"
            className="flex-shrink-0 text-xs font-bold px-4 py-2 rounded-xl text-white"
            style={{ background: "#EA580C", textDecoration: "none" }}>
            এখনই Renew
          </Link>
        </div>
      )}

      {/* ── Upgrade Plans (free users) ── */}
      {isFree && (
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: S.text }}>Plan Upgrade করুন</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                plan: "pro", label: "Pro", color: "#0F6E56", bg: "#E1F5EE", grad: "linear-gradient(135deg,#0F6E56,#14B08A)",
                features: ["অসীমিত Orders ও Products", "Courier Integration", "৩ Staff Accounts", "Advanced Reports", "SMS Notification", "Invoice PDF"],
                badge: null,
              },
              {
                plan: "business", label: "Business", color: "#D97706", bg: "#FFF3DC", grad: "linear-gradient(135deg,#D97706,#F59E0B)",
                features: ["সব Pro Features", "Unlimited Staff", "Facebook Integration", "Bulk SMS & WhatsApp", "Custom Invoice", "Priority Support"],
                badge: "সবচেয়ে জনপ্রিয়",
              },
            ].map(p => {
              const priceData = getPrice(p.plan);
              return (
                <div key={p.plan} className="rounded-2xl border overflow-hidden relative"
                  style={{ borderColor: p.badge ? p.color : S.border }}>
                  {p.badge && (
                    <div className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full text-white"
                      style={{ background: p.color }}>
                      {p.badge}
                    </div>
                  )}
                  <div className="p-4 text-white" style={{ background: p.grad }}>
                    <p className="font-black text-lg">{p.label} Plan</p>
                    {typeof priceData === "object" ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black">৳{priceData.eff}</span>
                        <span className="text-xs opacity-80">/মাস</span>
                        {priceData.hasDiscount && (
                          <span className="text-xs line-through opacity-60">৳{priceData.base}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-2xl font-black">বিনামূল্যে</p>
                    )}
                  </div>
                  <div className="p-4" style={{ background: S.surface }}>
                    <div className="space-y-2 mb-4">
                      {p.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle size={13} color={p.color} />
                          <span className="text-xs" style={{ color: S.textSub }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={`/checkout?plan=${p.plan}`}
                      className="block text-center py-2.5 rounded-xl text-white text-sm font-bold"
                      style={{ background: p.color, textDecoration: "none" }}>
                      {p.plan === "pro" ? "⚡ " : "👑 "}Upgrade করুন
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Payment History ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: S.surface, borderBottom: `1px solid ${S.border}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
              <Receipt size={15} color="#4F46E5" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>Payment History</h3>
              <p className="text-xs" style={{ color: S.textMuted }}>{payments.length}টি transaction</p>
            </div>
          </div>
          <Link href="/checkout?plan=pro"
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: "var(--c-primary-light)", color: "var(--c-primary)", textDecoration: "none" }}>
            <CreditCard size={12} /> নতুন Payment
          </Link>
        </div>

        {payments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3" style={{ background: S.surface }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
              <CreditCard size={28} color="#D97706" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm" style={{ color: S.text }}>কোনো Payment History নেই</p>
              <p className="text-xs mt-1" style={{ color: S.textMuted }}>প্রথম payment করুন এবং plan upgrade করুন</p>
            </div>
            <Link href="/checkout?plan=pro"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "var(--c-primary)", textDecoration: "none" }}>
              <Crown size={14} /> Pro-তে Upgrade করুন
            </Link>
          </div>
        ) : (
          <div style={{ background: S.surface }}>
            {payments.map((p, i) => {
              const sm = STATUS_META[p.status] ?? STATUS_META.pending;
              const pm = PLAN_META[p.plan] ?? PLAN_META.free;
              const mm = METHOD_META[p.method];
              const isExpanded = expandedPayment === p.id;
              return (
                <div key={p.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                  <button
                    onClick={() => setExpandedPayment(isExpanded ? null : p.id)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:opacity-90 transition-opacity">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background: mm?.bg ?? "#F3F4F6" }}>
                        {p.method === "bkash" ? "📱" : p.method === "nagad" ? "🧡" : p.method === "rocket" ? "🚀" : "🏦"}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: S.text }}>
                            {pm.label} Plan — {p.months} মাস
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: mm?.bg ?? "#F3F4F6", color: mm?.textColor ?? "#6B7280" }}>
                            {mm?.label ?? p.method.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: S.textMuted }}>
                          {new Date(p.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-base font-black" style={{ color: S.text }}>৳{p.amount.toLocaleString("bn-BD")}</p>
                        <span className="flex items-center gap-1 justify-end text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: sm.bg, color: sm.color }}>
                          {sm.icon} {sm.label}
                        </span>
                      </div>
                      <div style={{ color: S.textMuted }}>
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4" style={{ borderTop: `1px dashed ${S.border}` }}>
                      <div className="mt-3 rounded-xl p-4 space-y-2.5" style={{ background: S.bg }}>
                        {p.transactionId && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: S.textMuted }}>Transaction ID</p>
                              <p className="text-sm font-mono font-bold" style={{ color: S.text }}>{p.transactionId}</p>
                            </div>
                            <button
                              onClick={() => p.transactionId && copyTxId(p.id, p.transactionId)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                              style={{ background: copiedId === p.id ? "#ECFDF5" : S.surface, border: `1px solid ${S.border}` }}>
                              {copiedId === p.id ? <Check size={14} color="#059669"/> : <Copy size={14} style={{ color: S.textMuted }}/>}
                            </button>
                          </div>
                        )}
                        {p.senderPhone && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: S.textMuted }}>Sender Phone</p>
                            <p className="text-sm font-medium" style={{ color: S.text }}>{p.senderPhone}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: S.textMuted }}>Plan</p>
                            <p className="text-sm font-semibold" style={{ color: pm.color }}>{pm.label}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: S.textMuted }}>Duration</p>
                            <p className="text-sm font-semibold" style={{ color: S.text }}>{p.months} মাস</p>
                          </div>
                        </div>
                        {p.adminNote && (
                          <div className="rounded-lg p-2.5" style={{ background: p.status === "rejected" ? "#FEF2F2" : "#FFFBEB", borderLeft: `3px solid ${sm.color}` }}>
                            <p className="text-xs font-semibold" style={{ color: sm.color }}>Admin Note</p>
                            <p className="text-xs mt-0.5" style={{ color: S.textSub }}>{p.adminNote}</p>
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

      {/* ── Pending verification notice ── */}
      {payments.some(p => p.status === "pending") && (
        <div className="rounded-2xl border p-4 flex items-start gap-3"
          style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEF3C7" }}>
            <Clock size={16} color="#D97706" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#92600A" }}>Payment Verification চলছে</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              আপনার payment verify করা হচ্ছে। সাধারণত ১২–২৪ ঘণ্টার মধ্যে plan activate হয়।
              কোনো সমস্যায়{" "}
              <a href="mailto:support@bizilcore.com" style={{ color: "#D97706", fontWeight: 700 }}>support@bizilcore.com</a>
              -এ যোগাযোগ করুন।
            </p>
          </div>
        </div>
      )}

      {/* ── Bottom row: Support + FAQ ── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Support card */}
        <div className="sm:col-span-1 rounded-2xl border p-5 flex flex-col justify-between"
          style={{ background: S.surface, borderColor: S.border }}>
          <div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
              <Headphones size={18} color="#fff" />
            </div>
            <p className="font-bold text-sm" style={{ color: S.text }}>সাহায্য দরকার?</p>
            <p className="text-xs mt-1" style={{ color: S.textMuted }}>আমাদের support team সবসময় আপনার পাশে।</p>
          </div>
          <div className="mt-4 space-y-2">
            <Link href="/support"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold"
              style={{ background: "#EEF2FF", color: "#4F46E5", textDecoration: "none" }}>
              Support Ticket <ChevronRight size={13}/>
            </Link>
            <a href="mailto:support@bizilcore.com"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold"
              style={{ background: S.bg, color: S.textSub, textDecoration: "none" }}>
              Email করুন <ChevronRight size={13}/>
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="sm:col-span-2 rounded-2xl border overflow-hidden"
          style={{ background: S.surface, borderColor: S.border }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
            <p className="font-bold text-sm" style={{ color: S.text }}>সাধারণ প্রশ্ন</p>
          </div>
          <div>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 hover:opacity-80 transition-opacity">
                  <span className="text-xs font-semibold" style={{ color: S.text }}>{item.q}</span>
                  {openFaq === i ? <ChevronUp size={14} style={{ color: S.textMuted, flexShrink: 0 }}/> : <ChevronDown size={14} style={{ color: S.textMuted, flexShrink: 0 }}/>}
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
  );
}
