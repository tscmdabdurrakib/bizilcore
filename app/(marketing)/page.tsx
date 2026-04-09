import Link from "next/link";
import FAQAccordion from "@/components/FAQAccordion";
import { prisma } from "@/lib/prisma";
import {
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Bell,
  TrendingUp,
  Shield,
  Truck,
  FileText,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap,
  MessageSquare,
  Download,
  UserCheck,
  Globe,
} from "lucide-react";

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  primaryMid: "#1A9472",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#A8A69E",
};

const DEFAULT_PRICING = {
  free:     { monthlyPrice: 0 },
  pro:      { monthlyPrice: 299 },
  business: { monthlyPrice: 699 },
};

export default async function HomePage() {
  let pricingMap = DEFAULT_PRICING;
  try {
    const configs = await prisma.pricingConfig.findMany();
    if (configs.length > 0) {
      const map: Record<string, { monthlyPrice: number }> = {};
      for (const c of configs) map[c.planKey] = { monthlyPrice: c.monthlyPrice };
      pricingMap = { ...DEFAULT_PRICING, ...map };
    }
  } catch {}
  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 50%, #1A9472 100%)`,
        }}
        className="relative overflow-hidden"
      >
        {/* decorative circles */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            {/* Left */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 bg-white/20 text-white border border-white/30">
                <Zap size={12} />
                বাংলাদেশের #১ Facebook Seller Tool
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
                Facebook এ বেচেন?{" "}
                <span className="text-green-300">হিসাব রাখুন</span>{" "}
                সহজে
              </h1>
              <p className="text-lg md:text-xl mb-8 leading-relaxed text-white/80">
                স্টক, অর্ডার, কাস্টমার, কুরিয়ার — সব এক জায়গায়।
                বাংলাদেশের ১০,০০০+ seller এর বিশ্বাসের সঙ্গী।
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white font-semibold text-base transition-all hover:bg-green-50 shadow-lg"
                  style={{ color: C.primary }}
                >
                  বিনামূল্যে শুরু করুন
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium border border-white/40 text-white hover:bg-white/10 transition-all"
                >
                  সব ফিচার দেখুন
                </Link>
              </div>
              <div className="flex flex-wrap gap-5 text-white/80 text-sm">
                {["কোনো credit card লাগবে না", "২ মিনিটে setup", "যেকোনো device এ চলে"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-green-300" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white">
              {/* Browser bar */}
              <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ backgroundColor: "#F0F0EE", borderColor: C.border }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="ml-2 flex-1 text-center">
                  <span className="text-xs px-3 py-0.5 rounded bg-white border text-gray-400" style={{ borderColor: C.border }}>
                    app.bizilcore.com
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3" style={{ backgroundColor: C.bg }}>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "মোট অর্ডার", value: "৩৪৭", change: "+১২%" },
                    { label: "আজকের বিক্রি", value: "৳২৪,৫০০", change: "+৮%" },
                    { label: "স্টক আইটেম", value: "১৮৯", change: "+৩" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-3 bg-white border" style={{ borderColor: C.border }}>
                      <p className="text-xs mb-0.5" style={{ color: C.textMuted }}>{s.label}</p>
                      <p className="text-base font-bold" style={{ color: C.text }}>{s.value}</p>
                      <p className="text-xs font-medium text-green-600">{s.change}</p>
                    </div>
                  ))}
                </div>

                {/* Order list */}
                <div className="rounded-xl bg-white border p-3" style={{ borderColor: C.border }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: C.textMuted }}>সাম্প্রতিক অর্ডার</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "Rina Akter", amount: "৳১,২৫০", status: "delivered", color: "#DCF5EA", tc: "#1D9E75" },
                      { name: "Fatema Khanom", amount: "৳৮৮০", status: "shipped", color: "#E1F5EE", tc: C.primary },
                      { name: "Sumaiya Begum", amount: "৳২,১০০", status: "confirmed", color: "#FFF3DC", tc: "#EF9F27" },
                      { name: "Rashida Islam", amount: "৳৫৬০", status: "pending", color: "#FEE2E2", tc: "#EF4444" },
                    ].map((o) => (
                      <div key={o.name} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{ backgroundColor: C.bg }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: C.primary }}>
                            {o.name[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium" style={{ color: C.text }}>{o.name}</p>
                            <p className="text-xs" style={{ color: C.textMuted }}>{o.amount}</p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: o.color, color: o.tc }}>
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low stock alert */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                  <Bell size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Low Stock Alert</p>
                    <p className="text-xs text-amber-700">৩টি পণ্যের স্টক ৫ এর নিচে নেমেছে</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section className="border-b" style={{ backgroundColor: C.surface, borderColor: C.border }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "১০,০০০+", label: "Active Seller" },
              { value: "৫০ লাখ+", label: "অর্ডার প্রসেস হয়েছে" },
              { value: "৯৮%", label: "Customer Satisfaction" },
              { value: "১২টি", label: "Courier Integration" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold mb-1" style={{ color: C.primary }}>{s.value}</p>
                <p className="text-sm" style={{ color: C.textSub }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROBLEM SECTION
      ══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
            আপনার সমস্যা আমরা বুঝি
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: C.text }}>
            Facebook বিক্রেতাদের সবচেয়ে বড় মাথাব্যথা
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: C.textSub }}>
            হাজারো seller এর সমস্যা শুনে BizilCore তৈরি
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="rounded-2xl p-7 border" style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}>
            <p className="font-bold text-base mb-5 text-red-700">😩 BizilCore ছাড়া</p>
            <div className="space-y-3">
              {[
                "Excel এ হিসাব রাখতে রাখতে ক্লান্ত, তবুও ভুল হয়",
                "স্টক শেষ হয়ে গেছে জানলেন customer অর্ডার দেওয়ার পর",
                "কার কত বাকি আছে মনে থাকে না",
                "কুরিয়ার বুকিং দিতে আলাদা app খুলতে হয়",
                "মাস শেষে লাভ না ক্ষতি বুঝতেই পারেন না",
                "Staff কী করছে কোনো ধারণা নেই",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span className="text-red-400 text-lg leading-5 flex-shrink-0">✗</span>
                  <p className="text-sm" style={{ color: "#991B1B" }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
          {/* After */}
          <div className="rounded-2xl p-7 border" style={{ backgroundColor: C.primaryLight, borderColor: "#A7F3D0" }}>
            <p className="font-bold text-base mb-5" style={{ color: C.primaryDark }}>✨ BizilCore দিয়ে</p>
            <div className="space-y-3">
              {[
                "সব হিসাব auto — স্টক, বাকি, লাভ সব real-time",
                "Low stock হলে সাথে সাথে notification পাবেন",
                "প্রতিটি customer এর বাকি ও ইতিহাস এক ক্লিকে",
                "১২টি Courier সরাসরি app থেকে বুক করুন",
                "মাসিক P&L রিপোর্ট automatic তৈরি হবে",
                "নিজস্ব পাবলিক Catalog পেজে পণ্য showcase করুন",
                "Staff এর প্রতিটি কাজ activity log এ দেখুন",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: C.primary }} />
                  <p className="text-sm" style={{ color: C.primaryDark }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CORE FEATURES
      ══════════════════════════════════════════ */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              মূল ফিচার
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: C.text }}>
              ব্যবসা চালাতে যা দরকার, সব এক জায়গায়
            </h2>
            <p style={{ color: C.textSub }}>
              একটি app-এই সব — আলাদা কোনো tool লাগবে না
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Package,
                title: "স্মার্ট স্টক ম্যানেজমেন্ট",
                desc: "Size, Color সহ variant ট্র্যাক করুন। SKU, Barcode সাপোর্ট। Auto low-stock alert। CSV দিয়ে bulk import।",
                badge: "সবচেয়ে জনপ্রিয়",
              },
              {
                icon: ShoppingCart,
                title: "অর্ডার ম্যানেজমেন্ট",
                desc: "Pending থেকে Delivered পর্যন্ত track করুন। COD ও advance payment, invoice PDF, return management।",
                badge: null,
              },
              {
                icon: Users,
                title: "কাস্টমার ম্যানেজমেন্ট",
                desc: "প্রতিটি customer এর বাকি, ইতিহাস এক জায়গায়। Bulk WhatsApp message পাঠান। Customer অনুযায়ী report।",
                badge: null,
              },
              {
                icon: Truck,
                title: "কুরিয়ার ইন্টিগ্রেশন",
                desc: "Pathao, eCourier, Steadfast, RedX, Sundarban, Paperfly, CarryBee, Delivery Tiger, Karatoa, Janani, Sheba, SA Paribahan — সরাসরি app থেকে booking ও tracking।",
                badge: "১২টি Courier",
              },
              {
                icon: BarChart3,
                title: "ফিনান্স ও রিপোর্ট",
                desc: "Daily cashbook, P&L report, মাসিক revenue analytics। Excel export করুন যেকোনো সময়।",
                badge: null,
              },
              {
                icon: UserCheck,
                title: "Staff ম্যানেজমেন্ট",
                desc: "Multiple staff add করুন। Role-based permission দিন। Activity log এ দেখুন কে কী করেছে।",
                badge: null,
              },
              {
                icon: MessageSquare,
                title: "Facebook ইন্টিগ্রেশন",
                desc: "Multiple Facebook Page connect করুন। Comment থেকে automatic order suggestion পান।",
                badge: null,
              },
              {
                icon: FileText,
                title: "Invoice ও PDF",
                desc: "প্রফেশনাল invoice auto generate হবে। Customer কে পাঠান বা print করুন।",
                badge: null,
              },
              {
                icon: TrendingUp,
                title: "Sales Analytics",
                desc: "কোন পণ্য সবচেয়ে বেশি বিক্রি, কোন customer বেশি কেনেন — বিস্তারিত analytics।",
                badge: null,
              },
              {
                icon: Globe,
                title: "পাবলিক Catalog পেজ",
                desc: "নিজস্ব URL এ ecommerce পেজ তৈরি করুন। QR কোড শেয়ার করুন। WhatsApp এ লিঙ্ক দিন।",
                badge: "Business Only",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 border relative"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                {f.badge && (
                  <span
                    className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: C.primaryLight, color: C.primary }}
                  >
                    {f.badge}
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: C.primaryLight }}>
                  <f.icon size={20} style={{ color: C.primary }} />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: C.text }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
              style={{ color: C.primary }}
            >
              সব ফিচার বিস্তারিত দেখুন <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COURIER INTEGRATIONS
      ══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
            সব বড় কুরিয়ার সরাসরি সংযুক্ত
          </h2>
          <p className="text-sm" style={{ color: C.textSub }}>
            App ছাড়াই বুকিং দিন, track করুন
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {([
            { name: "Pathao", logo: "/couriers/pathao.png" as string | null, color: "" },
            { name: "eCourier", logo: "/couriers/ecourier.png" as string | null, color: "" },
            { name: "RedX", logo: "/couriers/redx.png?v=2" as string | null, color: "" },
            { name: "Sundarban", logo: "/couriers/sundarban.png" as string | null, color: "" },
            { name: "Steadfast", logo: "/couriers/steadfast.png" as string | null, color: "#6B35FF" },
            { name: "Paperfly", logo: "/couriers/paperfly.png" as string | null, color: "" },
            { name: "CarryBee", logo: "/couriers/carrybee.svg" as string | null, color: "" },
            { name: "Delivery Tiger", logo: "/couriers/delivery_tiger.svg" as string | null, color: "" },
            { name: "Karatoa KCS", logo: "/couriers/karatoa.svg" as string | null, color: "" },
            { name: "Janani Express", logo: "/couriers/janani.svg" as string | null, color: "" },
            { name: "Sheba Delivery", logo: "/couriers/sheba.svg" as string | null, color: "" },
            { name: "SA Paribahan", logo: "/couriers/sa_paribahan.svg" as string | null, color: "" },
          ]).map((c) => (
            <div
              key={c.name}
              className="rounded-2xl p-4 border text-center flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
              style={{ backgroundColor: "#FFFFFF", borderColor: C.border, minHeight: "96px" }}
            >
              {c.logo ? (
                <img
                  src={c.logo}
                  alt={c.name}
                  style={{ width: "56px", height: "44px", objectFit: "contain" }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name[0]}
                </div>
              )}
              <p className="text-xs font-semibold" style={{ color: C.text }}>{c.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              শুরু করা সহজ
            </span>
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text }}>মাত্র ৩টি ধাপে শুরু করুন</h2>
            <p style={{ color: C.textSub }}>কোনো technical জ্ঞান লাগবে না</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5" style={{ backgroundColor: C.border }} />
            {[
              {
                num: "১",
                title: "সাইনআপ করুন",
                desc: "২ মিনিটে account খুলুন। কোনো credit card, কোনো technical setup লাগবে না।",
                icon: UserCheck,
              },
              {
                num: "২",
                title: "পণ্য ও স্টক যোগ করুন",
                desc: "ছবি, দাম, variant দিন। CSV দিয়ে বাল্ক import করুন। স্টক track শুরু।",
                icon: Package,
              },
              {
                num: "৩",
                title: "অর্ডার manage করুন",
                desc: "Facebook থেকে order এখানে এনে track করুন। কুরিয়ার বুক করুন এক ক্লিকে।",
                icon: ShoppingCart,
              },
            ].map((step) => (
              <div key={step.num} className="text-center relative z-10">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md"
                  style={{ backgroundColor: C.primary }}
                >
                  <step.icon size={30} className="text-white" />
                </div>
                <div
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white mb-3"
                  style={{ backgroundColor: C.primaryDark }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: C.text }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
            Seller রিভিউ
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.text }}>তারা বলছেন</h2>
          <p style={{ color: C.textSub }}>১০,০০০+ সন্তুষ্ট seller দের অভিজ্ঞতা</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "আগে Excel এ হিসাব রাখতাম, ভুল হত অনেক। BizilCore দিয়ে সব automatic। প্রতি মাসে ২০+ ঘণ্টা সময় বাঁচছে!",
              name: "Rina Boutique",
              location: "ঢাকা",
              type: "ফ্যাশন ব্যবসা",
              rating: 5,
            },
            {
              quote: "স্টক শেষ হলে আগেই alert পাই, আর কোনো order miss হয় না। Pathao booking সরাসরি করতে পারি — অসাধারণ।",
              name: "Fatema Fashion House",
              location: "চট্টগ্রাম",
              type: "পোশাক বিক্রেতা",
              rating: 5,
            },
            {
              quote: "কাস্টমারের বাকি হিসাব এখন automatically track হয়। আর staff কে আলাদা access দিয়েছি — ব্যবসা সহজ হয়েছে।",
              name: "Sumaiya Crafts",
              location: "সিলেট",
              type: "হস্তশিল্প বিক্রেতা",
              rating: 5,
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: C.textSub }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: C.primary }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{t.name}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>
                    {t.type} · {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING PREVIEW
      ══════════════════════════════════════════ */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
            প্রাইসিং
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.text }}>সহজ ও সাশ্রয়ী মূল্য</h2>
          <p className="mb-12" style={{ color: C.textSub }}>
            আপনার ব্যবসার মাপ অনুযায়ী বেছে নিন। যেকোনো সময় পরিবর্তন করুন।
          </p>
          <div className="grid md:grid-cols-3 gap-5 text-left">
            {/* Free */}
            <div className="rounded-2xl border p-6" style={{ borderColor: C.border }}>
              <p className="text-xs font-bold mb-2" style={{ color: C.textMuted }}>FREE</p>
              <p className="text-4xl font-bold mb-1" style={{ color: C.text }}>৳{pricingMap.free.monthlyPrice}</p>
              <p className="text-xs mb-6" style={{ color: C.textMuted }}>চিরকালের জন্য</p>
              <div className="space-y-2.5 mb-6">
                {["৫০টি পণ্য", "১০০টি অর্ডার/মাস", "বেসিক রিপোর্ট", "১টি শপ"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: C.primary }} />
                    <span className="text-sm" style={{ color: C.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: C.border, color: C.text }}
              >
                বিনামূল্যে শুরু করুন
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{ backgroundColor: C.primary }}>
              <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 rounded-full bg-white" style={{ color: C.primary }}>
                জনপ্রিয়
              </span>
              <p className="text-xs font-bold mb-2 text-white/70">PRO</p>
              <p className="text-4xl font-bold mb-1 text-white">৳{pricingMap.pro.monthlyPrice}</p>
              <p className="text-xs mb-6 text-white/60">প্রতি মাস</p>
              <div className="space-y-2.5 mb-6">
                {["সীমাহীন পণ্য ও অর্ডার", "Advanced Analytics", "Courier Integration", "Invoice PDF", "Priority সাপোর্ট"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-white" />
                    <span className="text-sm text-white/90">{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-green-50 transition-colors"
                style={{ color: C.primary }}
              >
                Pro শুরু করুন
              </Link>
            </div>

            {/* Business */}
            <div className="rounded-2xl border p-6" style={{ borderColor: C.border }}>
              <p className="text-xs font-bold mb-2" style={{ color: C.textMuted }}>BUSINESS</p>
              <p className="text-4xl font-bold mb-1" style={{ color: C.text }}>৳{pricingMap.business.monthlyPrice}</p>
              <p className="text-xs mb-6" style={{ color: C.textMuted }}>প্রতি মাস</p>
              <div className="space-y-2.5 mb-6">
                {["সব Pro ফিচার", "৩টি শপ", "Multi-user (৫ জন)", "Staff Management", "Dedicated সাপোর্ট"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: C.primary }} />
                    <span className="text-sm" style={{ color: C.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: C.border, color: C.text }}
              >
                Business শুরু করুন
              </Link>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 mt-8 text-sm font-medium hover:underline"
            style={{ color: C.primary }}
          >
            সম্পূর্ণ প্রাইসিং ও তুলনা দেখুন <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRUST & SECURITY
      ══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="rounded-2xl p-8 border" style={{ backgroundColor: C.surface, borderColor: C.border }}>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Shield, title: "নিরাপদ ডেটা", desc: "সব তথ্য encrypted ও সুরক্ষিত" },
              { icon: Zap, title: "Real-time Sync", desc: "যেকোনো device এ instant update" },
              { icon: Download, title: "Offline Support", desc: "Internet ছাড়াও কাজ চলে" },
              { icon: Bell, title: "24/7 সাপোর্ট", desc: "যেকোনো সমস্যায় আমরা আছি" },
            ].map((t) => (
              <div key={t.title} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: C.primaryLight }}>
                  <t.icon size={22} style={{ color: C.primary }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>{t.title}</p>
                <p className="text-xs" style={{ color: C.textSub }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text }}>
              সাধারণ প্রশ্নোত্তর
            </h2>
            <p style={{ color: C.textSub }}>
              কোনো প্রশ্ন থাকলে{" "}
              <Link href="/contact" className="underline" style={{ color: C.primary }}>
                যোগাযোগ করুন
              </Link>
            </p>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 60%, #1A9472 100%)`,
        }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 text-white">
            আজই শুরু করুন — বিনামূল্যে
          </h2>
          <p className="mb-10 text-white/80 text-lg max-w-xl mx-auto">
            ১০,০০০+ seller ইতিমধ্যে ব্যবহার করছেন। কোনো credit card লাগবে না। ২ মিনিটে setup।
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white font-semibold text-lg transition-all hover:bg-green-50 shadow-xl"
              style={{ color: C.primary }}
            >
              বিনামূল্যে সাইনআপ করুন
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border border-white/40 text-white hover:bg-white/10 transition-all"
            >
              প্ল্যান দেখুন
            </Link>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            Free plan চিরকালের জন্য বিনামূল্যে। Upgrade করুন যখন দরকার।
          </p>
        </div>
      </section>
    </div>
  );
}
