"use client";
import { useState, useEffect } from "react";
import { Check, X, ArrowRight, CheckCircle2, Shield, Zap, Star, HelpCircle, Tag } from "lucide-react";
import Link from "next/link";

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#A8A69E",
};

interface PricingConfig {
  planKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  discountEnabled: boolean;
  discountPercent: number;
  discountLabel: string;
}

const PLAN_STATIC = [
  {
    key: "free",
    name: "Free",
    period: "চিরকালের জন্য",
    highlight: false,
    badge: null,
    description: "ছোট ব্যবসার জন্য শুরু করতে",
    features: [
      "৫০টি পণ্য",
      "১০০টি অর্ডার/মাস",
      "বেসিক রিপোর্ট",
      "১টি শপ",
      "Low Stock Alert",
      "Email সাপোর্ট",
      "Mobile Friendly",
      "Activity Log",
    ],
    missing: [
      "Courier Integration",
      "Invoice PDF",
      "Staff Management",
      "Advanced Analytics",
      "Excel Export",
      "Bulk WhatsApp",
      "Facebook Integration",
    ],
    cta: "বিনামূল্যে শুরু করুন",
    href: "/signup",
  },
  {
    key: "pro",
    name: "Pro",
    period: "প্রতি মাস",
    highlight: true,
    badge: "সবচেয়ে জনপ্রিয়",
    description: "Growing business এর জন্য",
    features: [
      "সীমাহীন পণ্য",
      "সীমাহীন অর্ডার",
      "১টি শপ",
      "Advanced Analytics",
      "Courier Integration (১২টি)",
      "Invoice PDF",
      "Excel Export",
      "Low Stock Alert",
      "Return Management",
      "Bulk WhatsApp Message",
      "Task Management (Kanban)",
      "Priority সাপোর্ট",
      "Activity Log",
    ],
    missing: [
      "Multiple শপ",
      "Staff Management",
      "Role Permission",
    ],
    cta: "Pro শুরু করুন",
    href: "/checkout?plan=pro",
  },
  {
    key: "business",
    name: "Business",
    period: "প্রতি মাস",
    highlight: false,
    badge: "সব ফিচার",
    description: "বড় ব্যবসা ও টিমের জন্য",
    features: [
      "সব Pro ফিচার",
      "৩টি শপ",
      "Staff Management",
      "Role-based Permission",
      "Multi-user (৫ জন)",
      "Multiple Facebook Page",
      "পাবলিক Catalog পেজ",
      "পণ্যের ছবি যোগ (URL)",
      "eCourier API Credentials",
      "Dedicated সাপোর্ট",
      "Custom Branding",
      "Priority Onboarding",
    ],
    missing: [],
    cta: "Business শুরু করুন",
    href: "/checkout?plan=business",
  },
];

const comparisonSections = [
  {
    title: "স্টক ও পণ্য",
    rows: [
      { label: "পণ্য সংখ্যা", free: "৫০টি", pro: "সীমাহীন", business: "সীমাহীন" },
      { label: "Product Variant", free: true, pro: true, business: true },
      { label: "SKU ও Barcode", free: true, pro: true, business: true },
      { label: "Low Stock Alert", free: true, pro: true, business: true },
      { label: "CSV Bulk Import", free: false, pro: true, business: true },
    ],
  },
  {
    title: "অর্ডার ও ফিনান্স",
    rows: [
      { label: "মাসিক অর্ডার", free: "১০০টি", pro: "সীমাহীন", business: "সীমাহীন" },
      { label: "Invoice PDF", free: false, pro: true, business: true },
      { label: "Return Management", free: true, pro: true, business: true },
      { label: "P&L Report", free: "বেসিক", pro: "Advanced", business: "Advanced" },
      { label: "Excel Export", free: false, pro: true, business: true },
    ],
  },
  {
    title: "কুরিয়ার ও ইন্টিগ্রেশন",
    rows: [
      { label: "Courier Integration", free: false, pro: true, business: true },
      { label: "Supported Couriers", free: "—", pro: "১২টি", business: "১২টি" },
      { label: "Facebook Integration", free: false, pro: "১টি Page", business: "Multiple Page" },
      { label: "Bulk WhatsApp", free: false, pro: true, business: true },
    ],
  },
  {
    title: "টিম ও অ্যাডমিন",
    rows: [
      { label: "শপ সংখ্যা", free: "১টি", pro: "১টি", business: "৩টি" },
      { label: "Staff Member", free: false, pro: false, business: "৫ জন" },
      { label: "Role Permission", free: false, pro: false, business: true },
      { label: "Activity Log", free: true, pro: true, business: true },
    ],
  },
  {
    title: "টাস্ক ম্যানেজমেন্ট",
    rows: [
      { label: "টাস্ক ম্যানেজমেন্ট", free: false, pro: true, business: true },
      { label: "কানবান বোর্ড", free: false, pro: true, business: true },
      { label: "লিস্ট ও ক্যালেন্ডার ভিউ", free: false, pro: true, business: true },
      { label: "স্মার্ট অটো-টাস্ক", free: false, pro: true, business: true },
      { label: "টাস্ক রিমাইন্ডার", free: false, pro: true, business: true },
      { label: "টিম টাস্ক অ্যাসাইন", free: false, pro: true, business: true },
    ],
  },
  {
    title: "Business Exclusive ফিচার",
    rows: [
      { label: "পাবলিক Catalog পেজ", free: false, pro: false, business: true },
      { label: "পণ্যের ছবি (URL input)", free: false, pro: false, business: true },
      { label: "eCourier API Credentials", free: false, pro: false, business: true },
      { label: "Multiple শপ", free: "১টি", pro: "১টি", business: "৩টি" },
    ],
  },
  {
    title: "সাপোর্ট",
    rows: [
      { label: "সাপোর্ট ধরন", free: "Email", pro: "Priority", business: "Dedicated" },
      { label: "Response Time", free: "২৪-৪৮ ঘণ্টা", pro: "৬-১২ ঘণ্টা", business: "২-৪ ঘণ্টা" },
      { label: "Onboarding Help", free: false, pro: false, business: true },
    ],
  },
];

const faqs = [
  {
    q: "Free plan এ কি credit card লাগে?",
    a: "না, Free plan সম্পূর্ণ বিনামূল্যে এবং চিরকালের জন্য। কোনো credit card বা payment information দিতে হবে না।",
  },
  {
    q: "আমি কি যেকোনো সময় upgrade বা downgrade করতে পারব?",
    a: "হ্যাঁ, যেকোনো সময় আপনার plan পরিবর্তন করতে পারবেন। Upgrade করলে সাথে সাথে নতুন ফিচার পাবেন।",
  },
  {
    q: "Payment কীভাবে করতে হবে?",
    a: "বাংলাদেশের সব major payment method সাপোর্ট করা হয় — bKash, Nagad, Rocket এবং Bank Transfer।",
  },
  {
    q: "Yearly plan এ কতটুকু সাশ্রয় হবে?",
    a: "Yearly plan এ আপনি প্রায় ১৭% সাশ্রয় করবেন। Pro এর ক্ষেত্রে মাসিক ৳৩৪ এবং Business এ ৳১২০ সাশ্রয়।",
  },
  {
    q: "Business plan এ কতজন staff থাকতে পারবে?",
    a: "Business plan এ সর্বোচ্চ ৫ জন staff member যোগ করতে পারবেন। আরো বেশি দরকার হলে আমাদের সাথে যোগাযোগ করুন।",
  },
  {
    q: "Free plan থেকে Pro তে upgrade করলে কি data হারিয়ে যাবে?",
    a: "না, সব data সুরক্ষিত থাকবে। Upgrade করলে শুধু নতুন ফিচার unlock হবে, কোনো data মুছে যাবে না।",
  },
];

function calcPrice(base: number, discountEnabled: boolean, discountPercent: number): number {
  if (!discountEnabled || discountPercent <= 0) return base;
  return Math.round(base * (1 - discountPercent / 100));
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [pricing, setPricing] = useState<PricingConfig[]>([]);

  useEffect(() => {
    fetch("/api/pricing").then(r => r.json()).then(setPricing).catch(() => {});
  }, []);

  function getPricing(planKey: string): PricingConfig {
    return pricing.find(p => p.planKey === planKey) || {
      planKey,
      monthlyPrice: planKey === "pro" ? 199 : planKey === "business" ? 699 : 0,
      yearlyPrice:  planKey === "pro" ? 165 : planKey === "business" ? 579 : 0,
      discountEnabled: false,
      discountPercent: 0,
      discountLabel: "",
    };
  }

  const anyDiscount = pricing.some(p => p.discountEnabled && p.discountPercent > 0);

  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #072E20 0%, #0A5240 40%, #0F6E56 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-10 bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.03] bg-white" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 bg-white/15 text-white border border-white/25">
            <Zap size={11} />
            প্রাইসিং
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            সহজ ও সাশ্রয়ী মূল্য
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mx-auto mb-3">
            আপনার ব্যবসার মাপ অনুযায়ী বেছে নিন। Free দিয়ে শুরু করুন, যখন দরকার upgrade করুন।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/60 mb-8">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> কোনো credit card লাগবে না</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> যেকোনো সময় cancel করুন</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> ৩০ দিনের money-back গ্যারান্টি</span>
          </div>

          {anyDiscount && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold" style={{ backgroundColor: "#FCD34D", color: "#78350F" }}>
              <Tag size={14} />
              বিশেষ অফার চলছে! এখনই সুযোগ নিন।
            </div>
          )}

          {/* Toggle */}
          <div className="inline-flex items-center gap-2 rounded-2xl p-1.5" style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <button
              onClick={() => setIsYearly(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: !isYearly ? C.surface : "transparent",
                color: !isYearly ? C.primary : "rgba(255,255,255,0.7)",
              }}
            >
              মাসিক
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
              style={{
                backgroundColor: isYearly ? C.surface : "transparent",
                color: isYearly ? C.primary : "rgba(255,255,255,0.7)",
              }}
            >
              বার্ষিক
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#FCD34D", color: "#78350F" }}>
                ১৭% ছাড়
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            {PLAN_STATIC.map((plan) => {
              const pc = getPricing(plan.key);
              const basePrice   = isYearly ? pc.yearlyPrice   : pc.monthlyPrice;
              const finalPrice  = calcPrice(basePrice, pc.discountEnabled, pc.discountPercent);
              const hasDiscount = pc.discountEnabled && pc.discountPercent > 0 && basePrice > 0;

              return (
                <div
                  key={plan.key}
                  className="rounded-2xl p-7 border relative overflow-hidden flex flex-col"
                  style={{
                    backgroundColor: plan.highlight ? C.primary : C.surface,
                    borderColor: plan.highlight ? C.primary : C.border,
                    boxShadow: plan.highlight ? "0 20px 60px rgba(15,110,86,0.25)" : undefined,
                    transform: plan.highlight ? "scale(1.02)" : undefined,
                  }}
                >
                  {plan.badge && (
                    <span
                      className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: plan.highlight ? "#fff" : C.primaryLight,
                        color: C.primary,
                      }}
                    >
                      {plan.badge}
                    </span>
                  )}

                  {hasDiscount && pc.discountLabel && (
                    <div
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mb-3 w-fit"
                      style={{ backgroundColor: "#FCD34D", color: "#78350F" }}
                    >
                      <Tag size={10} />
                      {pc.discountLabel}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="text-xs font-bold mb-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : C.textMuted }}>
                      {plan.name.toUpperCase()}
                    </p>
                    <p className="text-sm mb-3" style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : C.textSub }}>
                      {plan.description}
                    </p>

                    {hasDiscount ? (
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg line-through opacity-50" style={{ color: plan.highlight ? "#fff" : C.textMuted }}>
                            ৳{basePrice}
                          </span>
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                            -{pc.discountPercent}%
                          </span>
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-bold" style={{ color: plan.highlight ? "#fff" : C.text }}>
                            ৳{finalPrice}
                          </span>
                          <span className="text-sm mb-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : C.textMuted }}>
                            /মাস
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-end gap-1 mb-0.5">
                        <span className="text-4xl font-bold" style={{ color: plan.highlight ? "#fff" : C.text }}>
                          {finalPrice === 0 ? "বিনামূল্যে" : `৳${finalPrice}`}
                        </span>
                        {finalPrice > 0 && (
                          <span className="text-sm mb-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : C.textMuted }}>
                            /মাস
                          </span>
                        )}
                      </div>
                    )}

                    {isYearly && pc.monthlyPrice > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: plan.highlight ? "rgba(255,255,255,0.5)" : C.textMuted }}>
                        বার্ষিক বিলিং — ৳{finalPrice * 12}/বছর
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={15}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: plan.highlight ? "#fff" : C.primary }}
                        />
                        <span className="text-sm" style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : C.textSub }}>
                          {f}
                        </span>
                      </div>
                    ))}
                    {plan.missing.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 opacity-40">
                        <X
                          size={15}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: plan.highlight ? "#fff" : C.textMuted }}
                        />
                        <span className="text-sm" style={{ color: plan.highlight ? "#fff" : C.textMuted }}>
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={plan.href}
                    className="block text-center py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: plan.highlight ? "#fff" : C.primary,
                      color: plan.highlight ? C.primary : "#fff",
                    }}
                  >
                    {plan.cta} <ArrowRight size={15} />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm" style={{ color: C.textSub }}>
            {[
              { icon: Shield, text: "নিরাপদ Payment (bKash/Nagad)" },
              { icon: Zap,    text: "যেকোনো সময় Cancel করুন" },
              { icon: Star,   text: "৯৮% Customer Satisfaction" },
            ].map((t) => (
              <div key={t.text} className="flex items-center gap-2">
                <t.icon size={15} style={{ color: C.primary }} />
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>বিস্তারিত তুলনা</h2>
            <p style={{ color: C.textSub }}>কোন প্ল্যানে কী কী পাবেন</p>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
            <div className="grid grid-cols-4 border-b" style={{ backgroundColor: C.primary, borderColor: C.border }}>
              <div className="px-5 py-4 text-sm font-semibold text-white">ফিচার</div>
              {["Free", "Pro", "Business"].map((p) => (
                <div key={p} className="px-5 py-4 text-sm font-semibold text-center text-white">{p}</div>
              ))}
            </div>

            {comparisonSections.map((section, si) => (
              <div key={section.title}>
                <div className="px-5 py-2.5 border-b" style={{ backgroundColor: C.primaryLight, borderColor: C.border }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.primary }}>
                    {section.title}
                  </p>
                </div>
                {section.rows.map((row, i) => {
                  const globalIdx = si * 10 + i;
                  return (
                    <div
                      key={row.label}
                      className="grid grid-cols-4 border-b"
                      style={{ borderColor: C.border, backgroundColor: globalIdx % 2 === 0 ? C.surface : C.bg }}
                    >
                      <div className="px-5 py-3.5 text-sm" style={{ color: C.textSub }}>{row.label}</div>
                      {[row.free, row.pro, row.business].map((val, j) => (
                        <div key={j} className="px-5 py-3.5 flex justify-center items-center">
                          {val === true ? (
                            <Check size={17} style={{ color: C.primary }} />
                          ) : val === false ? (
                            <X size={17} style={{ color: C.textMuted }} />
                          ) : (
                            <span className="text-sm text-center" style={{ color: C.text }}>{val}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: C.bg }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>প্রাইসিং সম্পর্কে প্রশ্ন?</h2>
            <p style={{ color: C.textSub }}>সাধারণ প্রশ্নের উত্তর</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border p-5" style={{ backgroundColor: C.surface, borderColor: C.border }}>
                <div className="flex items-start gap-3">
                  <HelpCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: C.primary }} />
                  <div>
                    <p className="font-semibold text-sm mb-1.5" style={{ color: C.text }}>{faq.q}</p>
                    <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { quote: "Pro plan নিয়েছি, ব্যবসা সহজ হয়ে গেছে। Courier booking এখন ২ সেকেন্ডের কাজ।", name: "Karim Enterprise", loc: "ঢাকা" },
              { quote: "Free plan দিয়ে শুরু করেছিলাম, এখন Business plan এ আছি। দাম একদম সাশ্রয়ী।", name: "Mitu Boutique", loc: "চট্টগ্রাম" },
              { quote: "Staff কে আলাদা access দিতে পেরে অনেক সুবিধা হয়েছে। Business plan এর value অনেক।", name: "Rahman Traders", loc: "সিলেট" },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl p-5 border" style={{ backgroundColor: C.bg, borderColor: C.border }}>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.textSub }}>&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: C.primary }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: C.text }}>{t.name}</p>
                    <p className="text-xs" style={{ color: C.textMuted }}>{t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 60%, #1A9472 100%)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">আজই বিনামূল্যে শুরু করুন</h2>
          <p className="text-white/80 mb-8 text-lg">
            Free plan এ শুরু করুন। Credit card লাগবে না। যখন দরকার upgrade করুন।
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "#fff", color: C.primary }}
          >
            বিনামূল্যে শুরু করুন <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
