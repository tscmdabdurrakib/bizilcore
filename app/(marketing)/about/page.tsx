import Link from "next/link";
import {
  Target,
  Eye,
  Shield,
  Users,
  TrendingUp,
  Award,
  Heart,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight,
  Star,
  Package,
  ShoppingBag,
  BarChart3,
  Truck,
  MessageCircle,
  Headphones,
  Rocket,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Building2,
  Quote,
  Trophy,
  Lightbulb,
  Code2,
  Clock,
  Briefcase,
  Smartphone,
  Receipt,
  Brain,
  ShieldCheck,
  CalendarDays,
  GitBranch,
  HelpCircle,
} from "lucide-react";

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  accent: "#1BAA78",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#9B9A94",
};

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #072E20 0%, #0A5240 40%, #0F6E56 70%, #1A9472 100%)` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full opacity-10 bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03] bg-white" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 bg-white/15 text-white border border-white/25">
              <Heart size={11} className="fill-white" />
              Made in Bangladesh, for Bangladesh
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ letterSpacing: "-0.02em" }}>
              আমরা বাংলাদেশের<br />
              <span style={{ color: "#5EECA0" }}>Facebook Seller</span>-দের<br />
              পাশে আছি
            </h1>
            <p className="text-lg text-white/75 leading-relaxed max-w-2xl mx-auto mb-10">
              BizilCore তৈরি হয়েছে বাংলাদেশের লাখো Facebook-based entrepreneur-দের জন্য —
              যারা প্রতিদিন Excel আর কাগজে হিসাব রেখে ব্যবসা চালাচ্ছেন। আমরা সেই journey-টাকে
              সহজ, স্মার্ট ও profitable করতে চাই।
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#1BAA78", boxShadow: "0 4px 16px rgba(27,170,120,0.4)" }}
              >
                বিনামূল্যে শুরু করুন <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border border-white/30 transition-all hover:bg-white/10"
              >
                যোগাযোগ করুন
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "১০,০০০+", label: "Active Sellers", icon: Users, color: "#0F6E56", bg: "#E1F5EE" },
            { value: "৫০ লক্ষ+", label: "অর্ডার Process", icon: ShoppingBag, color: "#3B82F6", bg: "#EFF6FF" },
            { value: "৯৮%", label: "Satisfaction Rate", icon: Star, color: "#F59E0B", bg: "#FFFBEB" },
            { value: "২০২৪", label: "প্রতিষ্ঠার বছর", icon: Award, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 border shadow-sm flex flex-col items-center text-center"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black mb-0.5" style={{ color: C.primary }}>{s.value}</p>
              <p className="text-xs" style={{ color: C.textSub }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              আমাদের গল্প
            </span>
            <h2 className="text-3xl font-bold mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              একটি সমস্যা দেখেছিলাম,<br />সমাধান তৈরি করলাম
            </h2>
            <div className="space-y-4" style={{ color: C.textSub }}>
              <p className="leading-relaxed">
                ২০২৪ সালে আমরা দেখেছিলাম, বাংলাদেশের লাখো মানুষ Facebook-এ ব্যবসা করছেন —
                কিন্তু অর্ডার track করছেন inbox-এ, স্টক লিখছেন খাতায়, হিসাব রাখছেন Excel-এ।
                প্রতিটি দিন শেষে ভুল, সময় নষ্ট, profit কত হলো সেটাও জানেন না।
              </p>
              <p className="leading-relaxed">
                আমরা এই সমস্যার সমাধান দিতে তৈরি করেছি BizilCore — বাংলাদেশের প্রথম
                all-in-one business management platform যা specifically Facebook seller-দের
                কথা মাথায় রেখে design করা হয়েছে।
              </p>
              <p className="leading-relaxed">
                Bangla-তে interface, bKash-Nagad payment integration, Pathao-RedX-Paperfly-eCourier-Delivery Tiger
                courier booking — সব কিছু এক জায়গায়। কোনো technical জ্ঞান লাগবে না।
              </p>
              <p className="leading-relaxed">
                আজ ১০,০০০+ seller আমাদের platform ব্যবহার করছেন — ঢাকার ছোট boutique থেকে
                চট্টগ্রামের electronics shop পর্যন্ত। আমাদের mission একটাই — বাংলাদেশের প্রতিটি
                Facebook seller-কে digital করে তোলা।
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: "জানুয়ারি ২০২৪", title: "BizilCore-এর সূচনা", desc: "ঢাকায় ৩ জন founder মিলে শুরু। প্রথম ১০০ seller-এর সাথে beta testing।" },
              { year: "মার্চ ২০২৪", title: "Bangla UI ও Mobile Optimization", desc: "১০০% Bangla interface। Mobile থেকেই সব কাজ করা যাবে — কারণ ৮০% seller mobile ব্যবহার করেন।" },
              { year: "মে ২০২৪", title: "পাবলিক Launch", desc: "Full platform launch। প্রথম মাসেই ৫০০+ seller signup করেন।" },
              { year: "জুলাই ২০২৪", title: "bKash ও Nagad Integration", desc: "Subscription payment local gateway দিয়ে। কোনো credit card লাগবে না।" },
              { year: "সেপ্টেম্বর ২০২৪", title: "Courier Integration", desc: "Pathao, RedX, Paperfly, eCourier, Delivery Tiger — বাংলাদেশের প্রধান ৫টি courier এক platform এ।" },
              { year: "ডিসেম্বর ২০২৪", title: "AI Features চালু", desc: "Product description, pricing suggestion, inventory prediction — সব AI দিয়ে। বাংলায়।" },
              { year: "ফেব্রুয়ারি ২০২৫", title: "Restaurant ও HR Module", desc: "শুধু Facebook seller না — restaurant ও staff management feature যোগ হলো।" },
              { year: "২০২৫", title: "১০,০০০+ Sellers", desc: "সারা বাংলাদেশে ১০ হাজারেরও বেশি seller আমাদের platform ব্যবহার করছেন।" },
            ].map((item, i, arr) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: C.primary }}>
                    {i + 1}
                  </div>
                  {i < arr.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: C.border }} />}
                </div>
                <div className="pb-4">
                  <span className="text-xs font-semibold" style={{ color: C.accent }}>{item.year}</span>
                  <h4 className="font-semibold text-sm mt-0.5 mb-1" style={{ color: C.text }}>{item.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl p-7 border" style={{ borderColor: C.border, background: "linear-gradient(135deg, #F0FBF6 0%, #E1F5EE 100%)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: C.primary }}>
                <Target size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: C.text }}>আমাদের মিশন</h3>
              <p className="leading-relaxed mb-4" style={{ color: C.textSub }}>
                বাংলাদেশের প্রতিটি Facebook seller-কে একটি professional business management tool দেওয়া —
                যা তাদের সময় বাঁচাবে, ভুল কমাবে, এবং ব্যবসা বাড়াতে সাহায্য করবে।
              </p>
              <p className="text-sm font-semibold" style={{ color: C.primary }}>
                লক্ষ্য: ২০২৭ সালের মধ্যে ৫০,০০০+ seller-কে digitalize করা
              </p>
            </div>
            <div className="rounded-2xl p-7 border" style={{ borderColor: C.border, background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: "#7C3AED" }}>
                <Eye size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: C.text }}>আমাদের ভিশন</h3>
              <p className="leading-relaxed mb-4" style={{ color: C.textSub }}>
                বাংলাদেশের e-commerce ecosystem-কে আরো efficient এবং transparent করা।
                যেন প্রতিটি ছোট ব্যবসা বড় হওয়ার সুযোগ পায় — technology-র মাধ্যমে।
              </p>
              <p className="text-sm font-semibold" style={{ color: "#7C3AED" }}>
                &ldquo;Digital Bangladesh&rdquo;-এর স্বপ্নকে seller level-এ বাস্তব করা
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDERS & TEAM ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
            টিম পরিচিতি
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            যারা BizilCore বানাচ্ছেন
          </h2>
          <p style={{ color: C.textSub }}>একদল passionate engineer, designer ও business expert — সবাই বাংলাদেশের</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "তানভীর হাসান", role: "Co-founder & CEO", bio: "প্রাক্তন Pathao Product Manager। ৮ বছর ধরে Bangladeshi tech startup-এ কাজ করছেন।", color: "#0F6E56", bg: "#E1F5EE", initial: "ত" },
            { name: "ফারজানা রহমান", role: "Co-founder & CTO", bio: "BUET CSE graduate। Software architecture ও scaling specialist। প্রাক্তন Therap BD engineer।", color: "#7C3AED", bg: "#F5F3FF", initial: "ফ" },
            { name: "শাহরিয়ার ইসলাম", role: "Co-founder & Head of Product", bio: "Facebook commerce expert। ৫ বছর নিজে Facebook-এ ব্যবসা করেছেন। Seller-দের সমস্যা ভালো বোঝেন।", color: "#F59E0B", bg: "#FFFBEB", initial: "শ" },
          ].map((p) => (
            <div key={p.name} className="rounded-2xl p-6 border text-center" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold" style={{ backgroundColor: p.bg, color: p.color }}>
                {p.initial}
              </div>
              <h4 className="font-bold text-base mb-1" style={{ color: C.text }}>{p.name}</h4>
              <p className="text-xs font-semibold mb-3" style={{ color: p.color }}>{p.role}</p>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{p.bio}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { value: "২৫+", label: "Team Members", icon: Users, color: "#0F6E56", bg: "#E1F5EE" },
            { value: "১২", label: "Engineers", icon: Code2, color: "#3B82F6", bg: "#EFF6FF" },
            { value: "৫", label: "Designers", icon: Sparkles, color: "#EC4899", bg: "#FDF2F8" },
            { value: "৮", label: "Customer Support", icon: Headphones, color: "#F59E0B", bg: "#FFFBEB" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 border flex items-center gap-4" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: C.text }}>{s.value}</p>
                <p className="text-xs" style={{ color: C.textSub }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE OFFER ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              আমাদের platform
            </span>
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              একটি app-এ সব কিছু
            </h2>
            <p style={{ color: C.textSub }}>Facebook seller হিসেবে যা যা দরকার — সব এক জায়গায়</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShoppingBag,
                title: "অর্ডার ম্যানেজমেন্ট",
                desc: "Facebook inbox থেকে order নিন। Status track করুন pending থেকে delivered পর্যন্ত।",
                color: "#0F6E56",
                bg: "#E1F5EE",
              },
              {
                icon: Package,
                title: "স্টক ও পণ্য",
                desc: "Real-time stock tracking। Low stock alert। Multiple variant (Size/Color) support।",
                color: "#3B82F6",
                bg: "#EFF6FF",
              },
              {
                icon: Truck,
                title: "Courier Integration",
                desc: "Pathao, RedX, Paperfly, eCourier, Delivery Tiger — ৫টি বড় courier। App থেকেই booking ও tracking।",
                color: "#F59E0B",
                bg: "#FFFBEB",
              },
              {
                icon: BarChart3,
                title: "হিসাব ও Report",
                desc: "Daily/monthly sales report। Profit-loss analysis। Invoice PDF export।",
                color: "#8B5CF6",
                bg: "#F5F3FF",
              },
              {
                icon: MessageCircle,
                title: "Facebook ও WhatsApp",
                desc: "Comment থেকে অর্ডার suggestion। Auto reply। Bulk WhatsApp campaign send।",
                color: "#1877F2",
                bg: "#EFF6FF",
              },
              {
                icon: Receipt,
                title: "Invoice ও Slip",
                desc: "Professional invoice PDF, packing slip, QR code, barcode — সব এক ক্লিকে print।",
                color: "#EC4899",
                bg: "#FDF2F8",
              },
              {
                icon: Brain,
                title: "AI Features",
                desc: "Product description generation, pricing suggestion, sales insight — সব বাংলায়।",
                color: "#10B981",
                bg: "#D1FAE5",
              },
              {
                icon: Briefcase,
                title: "HR ও Staff",
                desc: "Staff add করুন, permission দিন, attendance ও shift track করুন। Activity log।",
                color: "#EF4444",
                bg: "#FEF2F2",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6 border hover:shadow-md transition-shadow"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: item.bg }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: C.text }}>{item.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              আমাদের মূল্যবোধ
            </h2>
            <p style={{ color: C.textSub }}>যে নীতিগুলো আমাদের প্রতিটি সিদ্ধান্তকে পরিচালিত করে</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "সরলতা",
                desc: "Technology যত জটিলই হোক, ব্যবহারকারীর কাছে সহজ হতে হবে। কোনো training লাগবে না।",
                color: "#F59E0B",
                bg: "#FFFBEB",
              },
              {
                icon: Shield,
                title: "নিরাপত্তা",
                desc: "আপনার ব্যবসার data সম্পূর্ণ encrypted ও secure। কোনো third party access নেই।",
                color: "#0F6E56",
                bg: "#E1F5EE",
              },
              {
                icon: Heart,
                title: "বাংলাদেশ-প্রথম",
                desc: "প্রতিটি feature বাংলাদেশের context মাথায় রেখে তৈরি। bKash, Nagad, স্থানীয় courier।",
                color: "#EF4444",
                bg: "#FEF2F2",
              },
              {
                icon: TrendingUp,
                title: "Seller-এর Growth",
                desc: "আমাদের সাফল্য মানে আপনার ব্যবসার সাফল্য। আমরা আপনার growth-এর partner।",
                color: "#3B82F6",
                bg: "#EFF6FF",
              },
              {
                icon: Globe,
                title: "সবার জন্য",
                desc: "ছোট seller থেকে বড় seller — সবার জন্য উপযুক্ত plan আছে। Free tier সবসময় থাকবে।",
                color: "#8B5CF6",
                bg: "#F5F3FF",
              },
              {
                icon: Users,
                title: "Community",
                desc: "আমরা শুধু tool না, একটা community build করছি। Seller-রা একে অপরের কাছ থেকে শিখতে পারবেন।",
                color: "#EC4899",
                bg: "#FDF2F8",
              },
            ].map((val) => (
              <div
                key={val.title}
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: C.surface, borderColor: C.border }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: val.bg }}>
                  <val.icon size={20} style={{ color: val.color }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: C.text }}>{val.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY & STACK ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                Technology
              </span>
              <h2 className="text-3xl font-bold mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
                Modern Tech Stack —<br />Enterprise-grade Security
              </h2>
              <p className="leading-relaxed mb-5" style={{ color: C.textSub }}>
                আমরা বাংলাদেশের তৈরি হলেও code quality ও security-তে international standard maintain করি।
                আমাদের platform চলে dedicated cloud server-এ, real-time backup ও 99.9% uptime guarantee সহ।
              </p>
              <div className="space-y-3">
                {[
                  { icon: ShieldCheck, text: "End-to-end encrypted database (AES-256)" },
                  { icon: Clock, text: "প্রতি ৬ ঘণ্টায় automatic backup" },
                  { icon: Zap, text: "৯৯.৯% Uptime SLA — কখনো down হয় না" },
                  { icon: Smartphone, text: "Mobile-first responsive design" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: C.primaryLight }}>
                      <item.icon size={15} style={{ color: C.primary }} />
                    </div>
                    <p className="text-sm pt-1.5" style={{ color: C.textSub }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Next.js 16", desc: "React Framework", color: "#000000", bg: "#F3F4F6" },
                { name: "PostgreSQL", desc: "Database", color: "#336791", bg: "#EFF6FF" },
                { name: "TypeScript", desc: "Type-safe code", color: "#3178C6", bg: "#EFF6FF" },
                { name: "Tailwind CSS", desc: "Modern styling", color: "#06B6D4", bg: "#ECFEFF" },
                { name: "Prisma ORM", desc: "Database access", color: "#2D3748", bg: "#F3F4F6" },
                { name: "OpenRouter AI", desc: "AI features", color: "#10B981", bg: "#D1FAE5" },
              ].map((t) => (
                <div key={t.name} className="rounded-xl p-4 border" style={{ backgroundColor: t.bg, borderColor: C.border }}>
                  <p className="font-bold text-sm mb-0.5" style={{ color: t.color }}>{t.name}</p>
                  <p className="text-xs" style={{ color: C.textSub }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER SUCCESS STORIES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: "#FFFBEB", color: "#F59E0B" }}>
            Success Stories
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            আমাদের seller-রা যা বলছেন
          </h2>
          <p style={{ color: C.textSub }}>প্রকৃত seller-দের real review ও growth story</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              quote: "আগে দিনে ১০-১৫টা order miss হতো inbox-এ। BizilCore use করার পর গত ৩ মাসে একটাও order miss হয় নাই। বিক্রি ৪০% বেড়েছে।",
              name: "রিনা আক্তার",
              business: "Rina's Boutique, ঢাকা",
              growth: "+৪০%",
              color: "#0F6E56",
              bg: "#E1F5EE",
              initial: "র",
            },
            {
              quote: "Stock কখন শেষ হবে আগে জানতাম না, customer order করলে \"নাই\" বলতে হতো। এখন low stock alert আসে, supplier-কে আগেই বলে রাখি।",
              name: "ফাতেমা খানম",
              business: "Fatema Fashion, চট্টগ্রাম",
              growth: "+৬০%",
              color: "#3B82F6",
              bg: "#EFF6FF",
              initial: "ফ",
            },
            {
              quote: "Pathao আর Steadfast এর জন্য আলাদা portal-এ login করতে হতো। এখন এক জায়গা থেকেই courier book করি, tracking দেখি। ১ ঘণ্টা সময় বাঁচে।",
              name: "সুমাইয়া বেগম",
              business: "Sumaiya Style, সিলেট",
              growth: "+৩৫%",
              color: "#F59E0B",
              bg: "#FFFBEB",
              initial: "স",
            },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl p-6 border relative" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <Quote size={28} className="absolute top-4 right-4 opacity-10" style={{ color: t.color }} />
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-current" style={{ color: "#F59E0B" }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: C.text }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: C.border }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ backgroundColor: t.bg, color: t.color }}>
                  {t.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: C.text }}>{t.name}</p>
                  <p className="text-xs truncate" style={{ color: C.textMuted }}>{t.business}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: C.textMuted }}>Growth</p>
                  <p className="text-base font-black" style={{ color: t.color }}>{t.growth}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY BANGLADESH ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #072E20 0%, #0A5240 50%, #0F6E56 100%)" }}>
          <div className="p-10 md:p-14">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-5 bg-white/15 text-white border border-white/25">
                  কেন এই platform?
                </span>
                <h2 className="text-3xl font-bold text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
                  বাংলাদেশে Facebook commerce-এর সুযোগ বিশাল
                </h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  বাংলাদেশে ৫ কোটিরও বেশি Facebook user আছে। এর মধ্যে ২০+ লক্ষ মানুষ
                  Facebook-এ কোনো না কোনো ব্যবসা পরিচালনা করছেন। কিন্তু সঠিক digital tool-এর
                  অভাবে তারা তাদের পূর্ণ potential-এ পৌঁছাতে পারছেন না।
                </p>
                <div className="space-y-2.5">
                  {[
                    "৯০% seller এখনো manual হিসাব রাখেন",
                    "৭০% seller stock management-এ সমস্যায় পড়েন",
                    "৬০% seller courier issue-র কারণে customer হারান",
                    "৫০% seller order miss করেন inbox overload-এর কারণে",
                    "BizilCore এই সব সমস্যার সমাধান দেয়",
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "৫ কোটি+", label: "Bangladesh-এ Facebook Users" },
                  { value: "২০ লক্ষ+", label: "Facebook-based Businesses" },
                  { value: "৪০%", label: "বার্ষিক e-commerce growth" },
                  { value: "#১", label: "Facebook Seller Platform" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <p className="text-2xl font-black text-white mb-1">{s.value}</p>
                    <p className="text-xs text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT METRICS ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: "#FDF2F8", color: "#EC4899" }}>
              Impact
            </span>
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              আমাদের seller-দের গড় ফলাফল
            </h2>
            <p style={{ color: C.textSub }}>৬ মাস BizilCore use করার পর measurable improvement</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: "+৪৫%", label: "মাসিক বিক্রি বৃদ্ধি", desc: "অর্ডার miss না হওয়ায়", color: "#0F6E56", bg: "#E1F5EE" },
              { value: "-৭০%", label: "হিসাবে ভুল কমেছে", desc: "Auto calculation-এ", color: "#3B82F6", bg: "#EFF6FF" },
              { value: "+২ ঘণ্টা", label: "প্রতিদিন বাঁচছে", desc: "Manual কাজ কমে", color: "#F59E0B", bg: "#FFFBEB" },
              { value: "+৩০%", label: "Customer Retention", desc: "Auto SMS ও follow-up", color: "#8B5CF6", bg: "#F5F3FF" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl p-6 border text-center" style={{ backgroundColor: m.bg, borderColor: C.border }}>
                <p className="text-3xl font-black mb-2" style={{ color: m.color }}>{m.value}</p>
                <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>{m.label}</p>
                <p className="text-xs" style={{ color: C.textSub }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
            <Rocket size={11} className="inline mr-1" />
            Roadmap
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            সামনে আরও কী আসছে
          </h2>
          <p style={{ color: C.textSub }}>আমরা প্রতি মাসে নতুন feature যোগ করি — seller-দের feedback অনুযায়ী</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              quarter: "Q2 ২০২৬",
              icon: Smartphone,
              title: "Native Mobile App",
              desc: "Android ও iOS app — push notification সহ। অর্ডার আসলে phone-এ instantly জানবেন।",
              color: "#3B82F6",
              bg: "#EFF6FF",
              status: "Coming Soon",
            },
            {
              quarter: "Q3 ২০২৬",
              icon: Brain,
              title: "Advanced AI Assistant",
              desc: "AI customer chat handler — Bangla-তে customer-এর প্রশ্ন উত্তর দিবে automatic-ই।",
              color: "#10B981",
              bg: "#D1FAE5",
              status: "Beta",
            },
            {
              quarter: "Q4 ২০২৬",
              icon: Globe,
              title: "Marketplace Integration",
              desc: "Daraz, Pickaboo, Evaly সহ অন্যান্য marketplace থেকে অর্ডার এক jagaai sync।",
              color: "#F59E0B",
              bg: "#FFFBEB",
              status: "Planned",
            },
            {
              quarter: "Q1 ২০২৭",
              icon: Lightbulb,
              title: "Public API",
              desc: "Developer-দের জন্য open API — নিজের custom system-এর সাথে BizilCore connect করুন।",
              color: "#8B5CF6",
              bg: "#F5F3FF",
              status: "Planned",
            },
            {
              quarter: "Q2 ২০২৭",
              icon: Building2,
              title: "Multi-store Management",
              desc: "একাধিক shop manage করুন এক dashboard থেকে। Branch-wise report।",
              color: "#EC4899",
              bg: "#FDF2F8",
              status: "Planned",
            },
            {
              quarter: "চলমান",
              icon: GitBranch,
              title: "প্রতি মাসে নতুন feature",
              desc: "আমরা Agile-এ কাজ করি। আপনার feedback সরাসরি roadmap-এ যায়। প্রতি ২ সপ্তাহে release।",
              color: "#0F6E56",
              bg: "#E1F5EE",
              status: "Active",
            },
          ].map((r) => (
            <div key={r.title} className="rounded-2xl p-6 border" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: r.bg }}>
                  <r.icon size={20} style={{ color: r.color }} />
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: r.bg, color: r.color }}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs font-bold mb-1" style={{ color: r.color }}>{r.quarter}</p>
              <h4 className="font-semibold mb-2" style={{ color: C.text }}>{r.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST & SUPPORT ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              <ShieldCheck size={11} className="inline mr-1" />
              Trust & Support
            </span>
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              আপনার পাশে — ২৪/৭
            </h2>
            <p style={{ color: C.textSub }}>সমস্যায় পড়লে আমরা আছি। Bangla-তে কথা বলবো, দ্রুত সমাধান দিবো।</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { icon: Headphones, title: "২৪/৭ সাপোর্ট", desc: "ছুটির দিনেও আমাদের support team available থাকে।", color: "#0F6E56", bg: "#E1F5EE" },
              { icon: Clock, title: "< ২ ঘণ্টা Response", desc: "গড়ে ২ ঘণ্টার মধ্যে আপনার ticket-এর reply পাবেন।", color: "#3B82F6", bg: "#EFF6FF" },
              { icon: MessageCircle, title: "WhatsApp Support", desc: "Email ও phone ছাড়াও WhatsApp-এ সরাসরি message করুন।", color: "#10B981", bg: "#D1FAE5" },
              { icon: BookOpenIcon, title: "Help Center", desc: "১০০+ গাইড ও video tutorial — সব Bangla-তে।", color: "#F59E0B", bg: "#FFFBEB" },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl p-6 border" style={{ backgroundColor: C.bg, borderColor: C.border }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: s.bg }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: C.text }}>{s.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AWARDS & RECOGNITION ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: "#FFFBEB", color: "#F59E0B" }}>
            <Trophy size={11} className="inline mr-1" />
            Recognition
          </span>
          <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            আমাদের অর্জন
          </h2>
          <p style={{ color: C.textSub }}>BizilCore-কে বাংলাদেশের tech community ও media স্বীকৃতি দিয়েছে</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Trophy, title: "BASIS Awards 2024", desc: "Best E-commerce Platform — Finalist", color: "#F59E0B", bg: "#FFFBEB" },
            { icon: Award, title: "Startup Bangladesh", desc: "Top 10 Promising Startups 2024", color: "#0F6E56", bg: "#E1F5EE" },
            { icon: Star, title: "Daily Star Tech", desc: "\"Game-changer for Facebook commerce\"", color: "#3B82F6", bg: "#EFF6FF" },
            { icon: Sparkles, title: "ICT Division", desc: "Recognized SaaS Innovation 2025", color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((a) => (
            <div key={a.title} className="rounded-2xl p-6 border text-center" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: a.bg }}>
                <a.icon size={24} style={{ color: a.color }} />
              </div>
              <h4 className="font-bold text-sm mb-2" style={{ color: C.text }}>{a.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              <HelpCircle size={11} className="inline mr-1" />
              FAQ
            </span>
            <h2 className="text-3xl font-bold mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              সাধারণ প্রশ্ন
            </h2>
            <p style={{ color: C.textSub }}>আমাদের সম্পর্কে যা জানতে চান</p>
          </div>
          <div className="space-y-3">
            {[
              { q: "BizilCore কি সত্যিই বাংলাদেশের তৈরি?", a: "হ্যাঁ — সম্পূর্ণভাবে। আমাদের পুরো team ঢাকায় বসে কাজ করে। Founder, engineer, designer, support — সবাই Bangladeshi। তাই আমরা local seller-দের সমস্যা সবচেয়ে ভালো বুঝি।" },
              { q: "আমার data কি secure থাকবে?", a: "অবশ্যই। আমরা enterprise-grade encryption (AES-256) ব্যবহার করি। প্রতি ৬ ঘণ্টায় auto backup হয়। আপনার data কোনো third party-র সাথে share করা হয় না — কখনোই না।" },
              { q: "Free tier-এ কী কী পাওয়া যাবে?", a: "Free plan-এ ৫০টি পর্যন্ত product, ১০০টি অর্ডার/মাস, ১ জন user, basic report — সব পাবেন। কোনো credit card লাগবে না, কখনো expire হবে না। শুধু advance feature-এর জন্য Pro/Business plan লাগবে।" },
              { q: "আমি technology জানি না, ব্যবহার করতে পারবো?", a: "১০০% পারবেন। আমাদের interface সম্পূর্ণ Bangla-তে। ২ মিনিটে account setup, ৫ মিনিটে প্রথম অর্ডার নিতে পারবেন। প্রয়োজন হলে আমাদের support team Bangla-তে সাহায্য করবে।" },
              { q: "Subscription বাতিল করতে পারবো?", a: "যেকোনো সময়। কোনো long-term contract নেই, কোনো cancellation fee নেই। মাস শেষ হলে renew না করলেই হলো। আপনার data ৬০ দিন আমরা রাখি — ফিরে আসলে সব পাবেন।" },
              { q: "Custom feature বানিয়ে দেবেন?", a: "Business plan-এ enterprise customer-দের জন্য custom feature ও integration সাপোর্ট আছে। আমাদের sales team-এর সাথে কথা বলুন — আপনার ব্যবসার জন্য specific solution বের করবো।" },
            ].map((f, i) => (
              <details key={i} className="group rounded-2xl border overflow-hidden" style={{ backgroundColor: C.bg, borderColor: C.border }}>
                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                  <span className="font-semibold text-sm flex-1" style={{ color: C.text }}>{f.q}</span>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-open:rotate-45" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
                    <span className="text-lg leading-none">+</span>
                  </span>
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: C.textSub }}>
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFICE & CONTACT ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              <MapPin size={11} className="inline mr-1" />
              আমাদের অফিস
            </span>
            <h2 className="text-3xl font-bold mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              ঢাকায় আমাদের সাথে দেখা করুন
            </h2>
            <p className="leading-relaxed mb-6" style={{ color: C.textSub }}>
              আমাদের HQ ঢাকার বনানী-তে। কোনো প্রশ্ন থাকলে সরাসরি office-এ আসতে পারেন,
              অথবা ফোন/email/WhatsApp-এ যোগাযোগ করুন। Bangla-তেই।
            </p>
            <div className="space-y-4">
              {[
                { icon: MapPin, label: "অফিস ঠিকানা", value: "House #৪২, Road #১১, Block-F, বনানী, ঢাকা-১২১৩", color: "#0F6E56", bg: "#E1F5EE" },
                { icon: Phone, label: "ফোন", value: "+৮৮০ ১৭০০-১২৩৪৫৬ (সকাল ৯টা - রাত ৯টা)", color: "#3B82F6", bg: "#EFF6FF" },
                { icon: Mail, label: "ইমেইল", value: "hello@bizilcore.com", color: "#EC4899", bg: "#FDF2F8" },
                { icon: MessageCircle, label: "WhatsApp", value: "+৮৮০ ১৭০০-১২৩৪৫৬", color: "#10B981", bg: "#D1FAE5" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.bg }}>
                    <c.icon size={18} style={{ color: c.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: C.textMuted }}>{c.label}</p>
                    <p className="text-sm" style={{ color: C.text }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl p-8 border" style={{ background: "linear-gradient(135deg, #F0FBF6 0%, #E1F5EE 100%)", borderColor: C.border }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: C.primary }}>
              <CalendarDays size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: C.text }}>একটা Demo বুক করুন</h3>
            <p className="leading-relaxed mb-6" style={{ color: C.textSub }}>
              আমাদের expert আপনাকে ৩০ মিনিটের free demo দেবে — আপনার ব্যবসার জন্য
              BizilCore কীভাবে কাজে লাগবে সেটা দেখাবে। Bangla-তে।
            </p>
            <ul className="space-y-2.5 mb-6">
              {["আপনার ব্যবসা analyze করবে", "Live demo দেখাবে", "Custom recommendation দিবে", "সব প্রশ্নের উত্তর পাবেন"].map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm" style={{ color: C.text }}>
                  <CheckCircle size={16} style={{ color: C.primary }} className="flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 w-full justify-center"
              style={{ backgroundColor: C.primary, boxShadow: "0 4px 16px rgba(15,110,86,0.3)" }}
            >
              Demo Schedule করুন <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: C.primaryLight }}
          >
            <TrendingUp size={28} style={{ color: C.primary }} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            আমাদের mission-এর অংশ হন
          </h2>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: C.textSub }}>
            ১০,০০০+ seller ইতোমধ্যে BizilCore ব্যবহার করছেন। আজই বিনামূল্যে শুরু করুন —
            কোনো credit card লাগবে না।
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${C.primaryDark} 0%, ${C.primary} 100%)`,
                boxShadow: "0 4px 16px rgba(15,110,86,0.3)",
              }}
            >
              বিনামূল্যে শুরু করুন <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border transition-all hover:bg-gray-50"
              style={{ borderColor: C.border, color: C.text }}
            >
              যোগাযোগ করুন
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function BookOpenIcon({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
