"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ShoppingBag,
  Package,
  Truck,
  CreditCard,
  Settings,
  Users,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
  Phone,
  Mail,
  Zap,
  HelpCircle,
  Facebook,
  FileText,
} from "lucide-react";

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#9B9A94",
};

const categories = [
  {
    icon: BookOpen,
    title: "শুরু করার গাইড",
    desc: "নতুন ব্যবহারকারীদের জন্য step-by-step guide",
    color: "#0F6E56",
    bg: "#E1F5EE",
    href: "#getting-started",
    count: "৮টি গাইড",
  },
  {
    icon: ShoppingBag,
    title: "অর্ডার ম্যানেজমেন্ট",
    desc: "অর্ডার নেওয়া, track করা ও manage করা",
    color: "#3B82F6",
    bg: "#EFF6FF",
    href: "#orders",
    count: "১২টি গাইড",
  },
  {
    icon: Package,
    title: "পণ্য ও স্টক",
    desc: "পণ্য যোগ করা, স্টক update ও tracking",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    href: "#inventory",
    count: "১০টি গাইড",
  },
  {
    icon: Truck,
    title: "Courier Integration",
    desc: "Pathao, eCourier সহ courier booking ও tracking",
    color: "#F59E0B",
    bg: "#FFFBEB",
    href: "#courier",
    count: "৬টি গাইড",
  },
  {
    icon: CreditCard,
    title: "Billing ও Payment",
    desc: "Plan upgrade, payment ও invoice সংক্রান্ত",
    color: "#EC4899",
    bg: "#FDF2F8",
    href: "#billing",
    count: "৭টি গাইড",
  },
  {
    icon: Users,
    title: "Team ও Staff",
    desc: "Staff যোগ করা, permission ও role management",
    color: "#14B8A6",
    bg: "#F0FDFA",
    href: "#team",
    count: "৫টি গাইড",
  },
  {
    icon: BarChart3,
    title: "Report ও Analytics",
    desc: "Sales report, profit analysis ও data export",
    color: "#6366F1",
    bg: "#EEF2FF",
    href: "#reports",
    count: "৮টি গাইড",
  },
  {
    icon: Settings,
    title: "Account ও Settings",
    desc: "Profile, security ও notification settings",
    color: "#64748B",
    bg: "#F1F5F9",
    href: "#settings",
    count: "৯টি গাইড",
  },
];

const popularArticles = [
  { title: "কীভাবে প্রথম অর্ডার নেব?", cat: "অর্ডার", time: "৩ মিনিট" },
  { title: "Pathao courier কীভাবে সংযুক্ত করব?", cat: "Courier", time: "৫ মিনিট" },
  { title: "Facebook page থেকে কীভাবে order import করব?", cat: "Integration", time: "৪ মিনিট" },
  { title: "Invoice PDF কীভাবে তৈরি করব?", cat: "অর্ডার", time: "২ মিনিট" },
  { title: "Staff এর permission কীভাবে সেট করব?", cat: "Team", time: "৩ মিনিট" },
  { title: "Monthly sales report কোথায় পাব?", cat: "Report", time: "২ মিনিট" },
  { title: "বিনামূল্যে plan থেকে paid plan-এ কীভাবে upgrade করব?", cat: "Billing", time: "৩ মিনিট" },
  { title: "Low stock alert কীভাবে set করব?", cat: "স্টক", time: "২ মিনিট" },
];

const faqs = [
  {
    q: "BizilCore ব্যবহার করতে কি technical জ্ঞান লাগে?",
    a: "না, কোনো technical জ্ঞান লাগে না। BizilCore সম্পূর্ণ বাংলায় এবং অত্যন্ত সহজে ব্যবহারযোগ্য। যে কেউ smartphone বা computer থেকে সহজেই ব্যবহার করতে পারবেন।",
  },
  {
    q: "Free plan-এ কোন কোন feature পাব?",
    a: "Free plan-এ ৫০টি পণ্য, ১০০টি মাসিক অর্ডার, basic stock management, invoice PDF এবং ১টি courier integration পাবেন। Upgrade করলে আরো অনেক feature unlock হবে।",
  },
  {
    q: "আমার data কি সুরক্ষিত?",
    a: "হ্যাঁ, আপনার সব data encrypted ও সুরক্ষিত। আমরা SSL encryption ব্যবহার করি এবং নিয়মিত backup নেওয়া হয়। কোনো third party-র সাথে আপনার data share করা হয় না।",
  },
  {
    q: "Mobile-এ ব্যবহার করা যাবে?",
    a: "হ্যাঁ, BizilCore সম্পূর্ণ mobile-friendly। Android এবং iOS দুটোতেই browser থেকে ব্যবহার করা যাবে। Near future-এ dedicated app আসবে।",
  },
  {
    q: "একসাথে কতজন staff যোগ করতে পারব?",
    a: "Free plan-এ ১ জন, Basic plan-এ ৩ জন, Pro plan-এ ১০ জন এবং Enterprise plan-এ unlimited staff যোগ করা যাবে।",
  },
  {
    q: "bKash/Nagad দিয়ে payment করা যাবে?",
    a: "হ্যাঁ, bKash, Nagad এবং Rocket দিয়ে subscription payment করা যাবে। Card payment-ও accept করা হয়।",
  },
  {
    q: "Internet connection ছাড়া কি ব্যবহার করা যাবে?",
    a: "BizilCore cloud-based platform, তাই internet connection প্রয়োজন। তবে আমরা offline mode নিয়ে কাজ করছি যা শীঘ্রই আসবে।",
  },
  {
    q: "Data export করতে পারব?",
    a: "হ্যাঁ, আপনার সব data Excel/CSV format-এ export করতে পারবেন। Orders, products, customers — সব কিছু export করা যাবে।",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #072E20 0%, #0A5240 40%, #0F6E56 100%)` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white/15 text-white border border-white/25">
            <HelpCircle size={12} />
            সাহায্য কেন্দ্র
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            আমরা কীভাবে সাহায্য করতে পারি?
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto mb-8">
            আপনার প্রশ্নের উত্তর খুঁজুন অথবা আমাদের support team-এর সাথে যোগাযোগ করুন।
          </p>
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কী খুঁজছেন লিখুন... (যেমন: courier, invoice, staff)"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            />
          </div>
        </div>
      </section>

      {/* ── QUICK CONTACT ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 mb-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, label: "Live Chat", sub: "এখনই chat করুন", color: "#0F6E56", bg: "#E1F5EE" },
            { icon: Mail, label: "ইমেইল সাপোর্ট", sub: "৬ ঘণ্টার মধ্যে উত্তর", color: "#3B82F6", bg: "#EFF6FF" },
            { icon: Phone, label: "ফোন সাপোর্ট", sub: "সকাল ৯টা – রাত ৯টা", color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-4 border shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: C.text }}>{item.label}</p>
                <p className="text-xs" style={{ color: C.textMuted }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold" style={{ color: C.text }}>বিষয়ভিত্তিক গাইড</h2>
          <p className="text-sm mt-1" style={{ color: C.textSub }}>আপনার প্রয়োজনীয় বিষয় বেছে নিন</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <a
              key={cat.title}
              href={cat.href}
              className="rounded-2xl p-5 border hover:shadow-md transition-all hover:scale-[1.02] group"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: cat.bg }}>
                <cat.icon size={20} style={{ color: cat.color }} />
              </div>
              <h4 className="font-semibold text-sm mb-1 group-hover:underline" style={{ color: C.text }}>{cat.title}</h4>
              <p className="text-xs leading-relaxed mb-2" style={{ color: C.textSub }}>{cat.desc}</p>
              <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.count}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── POPULAR ARTICLES ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: C.text }}>জনপ্রিয় গাইড</h2>
              <p className="text-sm mt-1" style={{ color: C.textSub }}>সবচেয়ে বেশি পড়া articles</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              <Zap size={11} />
              সবচেয়ে পড়া
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {popularArticles.map((article, i) => (
              <a
                key={i}
                href="#"
                className="flex items-center gap-4 p-4 rounded-2xl border hover:shadow-sm transition-all group"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.primaryLight }}>
                  <FileText size={16} style={{ color: C.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold group-hover:underline" style={{ color: C.text }}>{article.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: C.primaryLight, color: C.primary }}>{article.cat}</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>পড়তে {article.time}</span>
                  </div>
                </div>
                <ArrowRight size={15} style={{ color: C.textMuted }} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>সাধারণ প্রশ্নের উত্তর</h2>
          <p style={{ color: C.textSub, fontSize: "0.875rem" }}>সবচেয়ে বেশি জিজ্ঞেস করা প্রশ্নগুলোর উত্তর</p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-semibold pr-4" style={{ color: C.text }}>{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp size={16} style={{ color: C.primary, flexShrink: 0 }} />
                  : <ChevronDown size={16} style={{ color: C.textMuted, flexShrink: 0 }} />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: C.border }}>
                  <p className="text-sm leading-relaxed pt-4" style={{ color: C.textSub }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── STILL NEED HELP ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>এখনো সমাধান পাননি?</h2>
            <p style={{ color: C.textSub, fontSize: "0.875rem" }}>আমাদের team সবসময় সাহায্য করতে প্রস্তুত</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {[
              {
                icon: MessageSquare,
                title: "Live Chat",
                desc: "সরাসরি আমাদের support team-এর সাথে chat করুন।",
                action: "Chat শুরু করুন",
                color: "#0F6E56",
                bg: "#E1F5EE",
                href: "/contact",
              },
              {
                icon: Facebook,
                title: "Facebook Page",
                desc: "আমাদের Facebook page-এ message করুন।",
                action: "Message করুন",
                color: "#1877F2",
                bg: "#EFF6FF",
                href: "https://facebook.com",
              },
              {
                icon: Mail,
                title: "ইমেইল",
                desc: "support@bizilcore.com-এ ইমেইল করুন।",
                action: "ইমেইল পাঠান",
                color: "#8B5CF6",
                bg: "#F5F3FF",
                href: "mailto:support@bizilcore.com",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6 border text-center"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: item.bg }}>
                  <item.icon size={22} style={{ color: item.color }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: C.text }}>{item.title}</h4>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.textSub }}>{item.desc}</p>
                <a
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: item.color }}
                >
                  {item.action} <ArrowRight size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
