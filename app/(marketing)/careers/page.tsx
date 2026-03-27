import Link from "next/link";
import {
  MapPin,
  Clock,
  Users,
  Heart,
  Zap,
  TrendingUp,
  Coffee,
  Laptop,
  Shield,
  ArrowRight,
  Briefcase,
  Code2,
  BarChart3,
  Headphones,
  Megaphone,
  ChevronRight,
  Star,
  Globe,
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

const openings = [
  {
    title: "Full Stack Developer",
    dept: "Engineering",
    type: "Full-time",
    location: "ঢাকা (Hybrid)",
    desc: "Next.js, TypeScript, PostgreSQL দিয়ে BizilCore-এর core platform develop করবেন।",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
    icon: Code2,
    color: "#3B82F6",
    bg: "#EFF6FF",
    urgent: true,
  },
  {
    title: "Product Designer (UI/UX)",
    dept: "Design",
    type: "Full-time",
    location: "ঢাকা (Hybrid)",
    desc: "বাংলাদেশি seller-দের জন্য intuitive এবং beautiful interface design করবেন।",
    tags: ["Figma", "UI/UX", "Bangla Typography", "Mobile Design"],
    icon: Laptop,
    color: "#8B5CF6",
    bg: "#F5F3FF",
    urgent: false,
  },
  {
    title: "Customer Success Manager",
    dept: "Support",
    type: "Full-time",
    location: "ঢাকা",
    desc: "Seller-দের onboard করতে, তাদের সমস্যা সমাধান করতে এবং satisfaction নিশ্চিত করতে সাহায্য করবেন।",
    tags: ["Customer Support", "Bangla Communication", "Problem Solving"],
    icon: Headphones,
    color: "#0F6E56",
    bg: "#E1F5EE",
    urgent: true,
  },
  {
    title: "Growth & Marketing Manager",
    dept: "Marketing",
    type: "Full-time",
    location: "ঢাকা (Remote-friendly)",
    desc: "Facebook, digital marketing ও content strategy দিয়ে BizilCore-এর user base বাড়াবেন।",
    tags: ["Digital Marketing", "Facebook Ads", "Content Strategy", "SEO"],
    icon: Megaphone,
    color: "#EC4899",
    bg: "#FDF2F8",
    urgent: false,
  },
  {
    title: "Data Analyst",
    dept: "Analytics",
    type: "Full-time",
    location: "ঢাকা (Remote-friendly)",
    desc: "User behavior analyze করে product decisions নিতে সাহায্য করবেন। SQL, Python experience থাকলে ভালো।",
    tags: ["SQL", "Python", "Data Visualization", "Analytics"],
    icon: BarChart3,
    color: "#F59E0B",
    bg: "#FFFBEB",
    urgent: false,
  },
  {
    title: "Business Development Executive",
    dept: "Sales",
    type: "Full-time",
    location: "ঢাকা ও চট্টগ্রাম",
    desc: "নতুন seller দের BizilCore-এ আনতে, partnerships তৈরি করতে এবং sales target অর্জন করতে কাজ করবেন।",
    tags: ["B2B Sales", "Partnership", "Networking", "Bangla"],
    icon: Briefcase,
    color: "#14B8A6",
    bg: "#F0FDFA",
    urgent: true,
  },
];

const perks = [
  { icon: Coffee, title: "Flexible Hours", desc: "কাজের সময় নিজেই ঠিক করুন। Output-based culture।", color: "#F59E0B", bg: "#FFFBEB" },
  { icon: Laptop, title: "Remote-friendly", desc: "বেশিরভাগ position remote বা hybrid। ঘরে বসেও কাজ করা যাবে।", color: "#3B82F6", bg: "#EFF6FF" },
  { icon: TrendingUp, title: "দ্রুত growth", desc: "Early-stage startup। এখন যোগ দিলে দ্রুত career grow করার সুযোগ।", color: "#0F6E56", bg: "#E1F5EE" },
  { icon: Heart, title: "Health Coverage", desc: "সকল full-time employee-দের জন্য health insurance।", color: "#EF4444", bg: "#FEF2F2" },
  { icon: Users, title: "Great Team", desc: "Talented, passionate এবং collaborative team। সবাই সবাইকে সাহায্য করে।", color: "#8B5CF6", bg: "#F5F3FF" },
  { icon: Globe, title: "Impact", desc: "আপনার কাজ সরাসরি লাখো Bangladeshi seller-এর জীবন প্রভাবিত করবে।", color: "#EC4899", bg: "#FDF2F8" },
  { icon: Shield, title: "Job Security", desc: "Funded startup। Competitive salary এবং long-term stability।", color: "#14B8A6", bg: "#F0FDFA" },
  { icon: Star, title: "Equity / ESOP", desc: "Senior roles-এ equity অফার করা হয়। Company-র সাফল্যে share করুন।", color: "#6366F1", bg: "#EEF2FF" },
];

const values = [
  { title: "Seller-First", desc: "প্রতিটি সিদ্ধান্তে seller-এর benefit আগে চিন্তা করি।" },
  { title: "Radical Transparency", desc: "সব কিছু openly communicate করি। কোনো hidden agenda নেই।" },
  { title: "Bias for Action", desc: "Perfect-এর জন্য অপেক্ষা না করে দ্রুত কাজ করি।" },
  { title: "Learn Constantly", desc: "ভুল থেকে শেখা এবং নিজেকে improve করা আমাদের culture।" },
];

export default function CareersPage() {
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white/15 text-white border border-white/25">
            <Zap size={12} />
            আমরা hiring করছি
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
            বাংলাদেশের সেরা<br />
            <span style={{ color: "#5EECA0" }}>Tech Startup</span>-এ যোগ দিন
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            আমরা এমন মানুষ খুঁজছি যারা বাংলাদেশের Facebook seller-দের জীবন পরিবর্তন করতে
            passionate। আপনি কি সেই team-এর অংশ হতে চান?
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#openings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#1BAA78", boxShadow: "0 4px 16px rgba(27,170,120,0.4)" }}
            >
              Open Positions দেখুন <ArrowRight size={15} />
            </a>
            <a
              href="mailto:careers@bizilcore.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-all"
            >
              CV পাঠান
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "১৫+", label: "Team Member", icon: Users, color: "#0F6E56", bg: "#E1F5EE" },
            { value: "৬টি", label: "Open Position", icon: Briefcase, color: "#3B82F6", bg: "#EFF6FF" },
            { value: "ঢাকা", label: "HQ Location", icon: MapPin, color: "#F59E0B", bg: "#FFFBEB" },
            { value: "Hybrid", label: "Work Culture", icon: Laptop, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 border shadow-sm flex flex-col items-center text-center" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black mb-0.5" style={{ color: C.primary }}>{s.value}</p>
              <p className="text-xs" style={{ color: C.textSub }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CULTURE / VALUES ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
              আমাদের সংস্কৃতি
            </span>
            <h2 className="text-3xl font-bold mb-4" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              আমরা কোন ধরনের workplace তৈরি করছি?
            </h2>
            <p className="leading-relaxed mb-6" style={{ color: C.textSub }}>
              BizilCore-এ আমরা এমন একটি environment তৈরি করতে চাই যেখানে প্রতিটি team member
              তাদের সেরা কাজ করতে পারেন। আমরা বিশ্বাস করি যে happy team = happy sellers।
            </p>
            <div className="space-y-3">
              {values.map((v, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ backgroundColor: C.primary }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>{v.title}</p>
                    <p className="text-sm" style={{ color: C.textSub }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {perks.slice(0, 4).map((perk) => (
              <div key={perk.title} className="rounded-2xl p-5 border" style={{ backgroundColor: C.surface, borderColor: C.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: perk.bg }}>
                  <perk.icon size={18} style={{ color: perk.color }} />
                </div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: C.text }}>{perk.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERKS ── */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>Benefits ও সুযোগ-সুবিধা</h2>
            <p className="text-sm" style={{ color: C.textSub }}>আমরা আমাদের team-এর যত্ন নিই</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {perks.map((perk) => (
              <div key={perk.title} className="rounded-2xl p-5 text-center" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: perk.bg }}>
                  <perk.icon size={20} style={{ color: perk.color }} />
                </div>
                <h4 className="font-semibold text-sm mb-1" style={{ color: C.text }}>{perk.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPEN POSITIONS ── */}
      <section id="openings" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: C.text }}>Open Positions</h2>
            <p className="text-sm mt-1" style={{ color: C.textSub }}>{openings.length}টি position এখন available</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: C.primaryLight, color: C.primary }}>
            {openings.filter(o => o.urgent).length}টি urgent opening
          </span>
        </div>
        <div className="space-y-4">
          {openings.map((job, i) => (
            <div
              key={i}
              className="rounded-2xl border p-6 hover:shadow-md transition-shadow"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: job.bg }}>
                  <job.icon size={22} style={{ color: job.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-lg" style={{ color: C.text }}>{job.title}</h3>
                    {job.urgent && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mb-3 text-xs" style={{ color: C.textMuted }}>
                    <span className="flex items-center gap-1"><Briefcase size={11} /> {job.dept}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {job.type}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: C.textSub }}>{job.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: C.bg, color: C.textSub, border: `1px solid ${C.border}` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={`mailto:careers@bizilcore.com?subject=Application: ${job.title}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: C.primary }}
                >
                  Apply করুন <ChevronRight size={15} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OPEN APPLICATION ── */}
      <section style={{ background: `linear-gradient(135deg, #072E20 0%, #0A5240 50%, #0F6E56 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <Star size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            আপনার position দেখছেন না?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            আমরা সবসময় talented মানুষদের খুঁজছি। আপনার CV পাঠান — আমরা দেখব কীভাবে একসাথে
            কাজ করা যায়।
          </p>
          <a
            href="mailto:careers@bizilcore.com?subject=Open Application"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#1BAA78", boxShadow: "0 4px 16px rgba(27,170,120,0.4)" }}
          >
            careers@bizilcore.com-এ CV পাঠান <ArrowRight size={15} />
          </a>
          <p className="text-white/50 text-xs mt-4">আমরা ৪৮ ঘণ্টার মধ্যে সাড়া দিই</p>
        </div>
      </section>

    </div>
  );
}
