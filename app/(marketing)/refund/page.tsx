import Link from "next/link";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileText,
  CreditCard,
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

export default function RefundPage() {
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
            <ShieldCheck size={12} />
            আমরা আপনার সন্তুষ্টি নিশ্চিত করি
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            রিফান্ড নীতি
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            BizilCore-এ আপনার সন্তুষ্টি আমাদের সর্বোচ্চ অগ্রাধিকার।
            আমাদের refund policy সহজ, স্বচ্ছ এবং সম্পূর্ণ fair।
          </p>
          <p className="text-sm text-white/50 mt-4">সর্বশেষ আপডেট: মার্চ ২০২৫</p>
        </div>
      </section>

      {/* ── QUICK SUMMARY ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: RefreshCw,
              title: "৩০ দিনের গ্যারান্টি",
              desc: "যেকোনো paid plan-এ ৩০ দিনের মধ্যে সম্পূর্ণ রিফান্ড পাবেন।",
              color: "#0F6E56",
              bg: "#E1F5EE",
            },
            {
              icon: Clock,
              title: "৫-৭ কার্যদিবস",
              desc: "Refund approve হওয়ার পর ৫-৭ কার্যদিবসের মধ্যে আপনার account-এ আসবে।",
              color: "#3B82F6",
              bg: "#EFF6FF",
            },
            {
              icon: CreditCard,
              title: "সরাসরি আপনার account-এ",
              desc: "bKash, Nagad বা যে method-এ payment করেছেন, সেখানেই refund যাবে।",
              color: "#8B5CF6",
              bg: "#F5F3FF",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl p-6 border shadow-sm"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: item.bg }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: C.text }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border p-5 sticky top-24" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <p className="font-semibold text-sm mb-4" style={{ color: C.text }}>বিষয়বস্তু</p>
              <div className="space-y-1">
                {[
                  { label: "কখন রিফান্ড পাবেন", href: "#eligible" },
                  { label: "কখন রিফান্ড পাবেন না", href: "#ineligible" },
                  { label: "রিফান্ড প্রক্রিয়া", href: "#process" },
                  { label: "রিফান্ডের পরিমাণ", href: "#amount" },
                  { label: "বিশেষ ক্ষেত্র", href: "#special" },
                  { label: "যোগাযোগ করুন", href: "#contact" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: C.textSub }}
                  >
                    <ArrowRight size={13} style={{ color: C.primary }} />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="md:col-span-2 space-y-8">

            {/* Eligible */}
            <div id="eligible" className="rounded-2xl border p-7" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
                  <CheckCircle size={20} style={{ color: "#059669" }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: C.text }}>কখন রিফান্ড পাবেন</h2>
              </div>
              <div className="space-y-3">
                {[
                  { title: "৩০ দিনের মানি-ব্যাক গ্যারান্টি", desc: "যেকোনো paid plan subscribe করার ৩০ দিনের মধ্যে যদি আপনি সন্তুষ্ট না হন, কোনো প্রশ্ন ছাড়াই সম্পূর্ণ রিফান্ড পাবেন।" },
                  { title: "Technical সমস্যার কারণে service না পেলে", desc: "যদি আমাদের technical issue-র কারণে আপনি paid features ব্যবহার করতে না পারেন, সেই সময়ের proportionate রিফান্ড পাবেন।" },
                  { title: "Duplicate payment", desc: "ভুলবশত দুইবার payment হলে বা একই plan দুইবার charge হলে সম্পূর্ণ রিফান্ড পাবেন।" },
                  { title: "Plan downgrade", desc: "Monthly plan থেকে lower plan-এ downgrade করলে পরবর্তী billing cycle থেকে নতুন rate apply হবে।" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: "#F0FBF6" }}>
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#059669" }} />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{item.title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ineligible */}
            <div id="ineligible" className="rounded-2xl border p-7" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
                  <XCircle size={20} style={{ color: "#DC2626" }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: C.text }}>কখন রিফান্ড পাবেন না</h2>
              </div>
              <div className="space-y-3">
                {[
                  { title: "৩০ দিন পার হওয়ার পর", desc: "subscription শুরুর ৩০ দিন পরে refund request গ্রহণযোগ্য নয়, যদি না technical issue-র কারণে service affected হয়।" },
                  { title: "Free plan-এর জন্য", desc: "Free plan-এ কোনো charge নেই, তাই refund-এর প্রশ্ন নেই।" },
                  { title: "Policy violation-এর কারণে account বন্ধ", desc: "আমাদের Terms of Service লঙ্ঘনের কারণে account suspend হলে কোনো refund দেওয়া হবে না।" },
                  { title: "ব্যবহারকারীর ভুলের কারণে data হারালে", desc: "নিজে ভুলে data delete করলে বা ভুল operation করলে সেই কারণে refund প্রযোজ্য নয়।" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: "#FFF5F5" }}>
                    <XCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: C.text }}>{item.title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process */}
            <div id="process" className="rounded-2xl border p-7" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.primaryLight }}>
                  <FileText size={20} style={{ color: C.primary }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: C.text }}>রিফান্ড প্রক্রিয়া</h2>
              </div>
              <div className="space-y-4">
                {[
                  { step: "০১", title: "Request পাঠান", desc: "support@bizilcore.com-এ ইমেইল করুন অথবা live chat-এ message করুন। Subject লিখুন: 'Refund Request'।" },
                  { step: "০২", title: "তথ্য দিন", desc: "আপনার account-এর email, payment details এবং refund কেন চান তার সংক্ষিপ্ত কারণ জানান।" },
                  { step: "০৩", title: "Review (২৪-৪৮ ঘণ্টা)", desc: "আমাদের team আপনার request review করবে এবং confirmation ইমেইল পাঠাবে।" },
                  { step: "০৪", title: "Refund প্রক্রিয়া (৫-৭ কার্যদিবস)", desc: "Approve হওয়ার পর আপনার original payment method-এ টাকা ফেরত পাঠানো হবে।" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ backgroundColor: C.primaryLight, color: C.primary }}
                    >
                      {item.step}
                    </div>
                    <div className="flex-1 pb-4 border-b last:border-0" style={{ borderColor: C.border }}>
                      <p className="font-semibold text-sm mb-1" style={{ color: C.text }}>{item.title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div id="amount" className="rounded-2xl border p-7" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
                  <CreditCard size={20} style={{ color: "#D97706" }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: C.text }}>রিফান্ডের পরিমাণ</h2>
              </div>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: C.border }}>
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: C.bg }}>
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: C.text }}>পরিস্থিতি</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: C.text }}>রিফান্ড পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { situation: "৩০ দিনের মধ্যে request (মানি-ব্যাক গ্যারান্টি)", amount: "১০০% সম্পূর্ণ রিফান্ড" },
                      { situation: "Technical issue-র কারণে service না পাওয়া", amount: "Proportionate রিফান্ড" },
                      { situation: "Duplicate payment", amount: "১০০% সম্পূর্ণ রিফান্ড" },
                      { situation: "Annual plan থেকে early cancellation", amount: "অব্যবহৃত মাসের proportionate রিফান্ড" },
                    ].map((row, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: C.border }}>
                        <td className="px-4 py-3" style={{ color: C.textSub }}>{row.situation}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: C.primary }}>{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Special Cases */}
            <div id="special" className="rounded-2xl border p-7" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
                  <AlertCircle size={20} style={{ color: "#3B82F6" }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: C.text }}>বিশেষ ক্ষেত্র</h2>
              </div>
              <div className="space-y-4" style={{ color: C.textSub }}>
                <div className="p-4 rounded-xl" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#1D4ED8" }}>Annual Plan থেকে cancellation</p>
                  <p className="text-sm leading-relaxed">
                    Annual plan subscribe করে ৩০ দিনের পরে cancel করলে, অবশিষ্ট মাসের টাকা proportionately refund করা হবে।
                    তবে একটি processing fee (৳২৫০) কাটা হতে পারে।
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: "#FFF7ED", border: "1px solid #FED7AA" }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#C2410C" }}>Promotional offer দিয়ে কেনা plan</p>
                  <p className="text-sm leading-relaxed">
                    Special discount বা promotional price-এ কেনা plan-এ মানি-ব্যাক গ্যারান্টি প্রযোজ্য, তবে refund amount
                    actual paid amount-এর উপর নির্ভর করবে।
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: "#F0FBF6", border: "1px solid #BBF7D0" }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#166534" }}>বিশেষ পরিস্থিতি</p>
                  <p className="text-sm leading-relaxed">
                    প্রাকৃতিক দুর্যোগ, অসুস্থতা বা অন্য কোনো বিশেষ পরিস্থিতিতে আমরা case-by-case ভিত্তিতে বিষয়টি
                    বিবেচনা করি। আমাদের সাথে যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div id="contact" className="rounded-2xl p-7" style={{ background: `linear-gradient(135deg, #072E20 0%, #0A5240 50%, #0F6E56 100%)` }}>
              <h2 className="text-xl font-bold text-white mb-2">রিফান্ড সংক্রান্ত সাহায্য দরকার?</h2>
              <p className="text-white/70 text-sm mb-6">আমাদের support team সবসময় প্রস্তুত। দ্রুত সাহায্য পেতে নিচের যেকোনো উপায়ে যোগাযোগ করুন।</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="mailto:support@bizilcore.com"
                  className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/15"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    <Mail size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">ইমেইল</p>
                    <p className="text-sm font-semibold text-white">support@bizilcore.com</p>
                  </div>
                </a>
                <a
                  href="tel:+8801700000000"
                  className="flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/15"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                    <Phone size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">ফোন (শনি–বৃহস্পতি)</p>
                    <p className="text-sm font-semibold text-white">+880 1700-000000</p>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="font-semibold mb-2" style={{ color: C.text }}>আরো প্রশ্ন আছে?</p>
          <p className="text-sm mb-5" style={{ color: C.textSub }}>আমাদের সাহায্য কেন্দ্রে বিস্তারিত উত্তর পাবেন।</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: C.primary }}
            >
              সাহায্য কেন্দ্র <ArrowRight size={14} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border"
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
