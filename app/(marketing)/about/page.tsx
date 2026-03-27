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
                Bangla-তে interface, bKash-Nagad payment integration, Pathao-eCourier-Steadfast
                courier booking — সব কিছু এক জায়গায়। কোনো technical জ্ঞান লাগবে না।
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { year: "জানুয়ারি ২০২৪", title: "BizilCore-এর সূচনা", desc: "ঢাকায় ৩ জন founder মিলে শুরু। প্রথম ১০০ seller-এর সাথে beta testing।" },
              { year: "মে ২০২৪", title: "পাবলিক Launch", desc: "Full platform launch। প্রথম মাসেই ৫০০+ seller signup করেন।" },
              { year: "সেপ্টেম্বর ২০২৪", title: "Courier Integration", desc: "Pathao, eCourier, Steadfast সহ মোট ১২টি courier যুক্ত হয়। সব বড় courier এক platform এ।" },
              { year: "২০২৫", title: "১০,০০০+ Sellers", desc: "সারা বাংলাদেশে ১০ হাজারেরও বেশি seller আমাদের platform ব্যবহার করছেন।" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: C.primary }}>
                    {i + 1}
                  </div>
                  {i < 3 && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: C.border }} />}
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

      {/* ── WHAT WE OFFER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
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
              desc: "Real-time stock tracking। Low stock alert। Multiple variant support।",
              color: "#3B82F6",
              bg: "#EFF6FF",
            },
            {
              icon: Truck,
              title: "Courier Integration",
              desc: "Pathao, eCourier, Steadfast সহ ১২টি courier। App থেকেই booking ও tracking।",
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
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6 border hover:shadow-md transition-shadow"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: item.bg }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <h4 className="font-semibold mb-2" style={{ color: C.text }}>{item.title}</h4>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
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
                style={{ backgroundColor: C.bg, borderColor: C.border }}
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
