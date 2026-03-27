"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle,
  ChevronRight,
  Facebook,
  HelpCircle,
  Headphones,
  Zap,
} from "lucide-react";
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

const topics = [
  "সাধারণ প্রশ্ন",
  "Technical সমস্যা",
  "Billing ও Payment",
  "Feature Request",
  "Partnership",
  "অন্যান্য",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "সাধারণ প্রশ্ন",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all";
  const inputStyle = (focused?: boolean) => ({
    border: `1px solid ${focused ? C.primary : C.border}`,
    backgroundColor: C.surface,
    color: C.text,
  });

  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* Hero */}
      <section
        style={{ background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 60%, #1A9472 100%)` }}
        className="relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 bg-white/20 text-white border border-white/30">
            <Headphones size={12} />
            সাপোর্ট টিম সবসময় প্রস্তুত
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            যোগাযোগ করুন
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            যেকোনো প্রশ্ন, সমস্যা বা পরামর্শের জন্য আমরা সবসময় আছি। সাধারণত ৬ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।
          </p>
        </div>
      </section>

      {/* Quick contact cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Mail,
              label: "ইমেইল",
              value: "support@bizilcore.com",
              sub: "সবচেয়ে দ্রুত",
              href: "mailto:support@bizilcore.com",
              color: "#2563EB",
              bg: "#EFF6FF",
            },
            {
              icon: Phone,
              label: "ফোন",
              value: "+880 1700-000000",
              sub: "সকাল ৯টা – রাত ৯টা",
              href: "tel:+8801700000000",
              color: "#059669",
              bg: "#ECFDF5",
            },
            {
              icon: Facebook,
              label: "Facebook",
              value: "BizilCore Official",
              sub: "Messenger এ চ্যাট",
              href: "https://facebook.com",
              color: "#1877F2",
              bg: "#EFF6FF",
            },
            {
              icon: Clock,
              label: "Support সময়",
              value: "শনি–বৃহস্পতি",
              sub: "সকাল ৯টা – রাত ৯টা",
              href: null,
              color: "#7C3AED",
              bg: "#F5F3FF",
            },
          ].map((item) => {
            const card = (
              <div
                className="rounded-2xl p-4 border flex items-start gap-3 shadow-sm"
                style={{ backgroundColor: C.surface, borderColor: C.border }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: C.textMuted }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold leading-tight break-words" style={{ color: C.text }}>
                    {item.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{item.sub}</p>
                </div>
              </div>
            );

            return item.href ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="hover:scale-[1.02] transition-transform">
                {card}
              </a>
            ) : (
              <div key={item.label}>{card}</div>
            );
          })}
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8">

          {/* Left sidebar */}
          <div className="md:col-span-2 space-y-5">

            {/* Quick help */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <p className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                <Zap size={15} style={{ color: C.primary }} />
                দ্রুত সাহায্য
              </p>
              <div className="space-y-1">
                {[
                  { label: "কীভাবে শুরু করব?", href: "/features" },
                  { label: "Pricing ও Plan", href: "/pricing" },
                  { label: "Courier Integration কীভাবে?", href: "/features#courier" },
                  { label: "Staff যোগ করব কীভাবে?", href: "/features#system" },
                  { label: "Invoice PDF কোথায়?", href: "/features#orders" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                    style={{ borderColor: C.border }}
                  >
                    <span className="text-sm" style={{ color: C.textSub }}>{item.label}</span>
                    <ChevronRight size={14} style={{ color: C.textMuted }} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Support hours */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <p className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                <Clock size={15} style={{ color: C.primary }} />
                সাপোর্ট সময়সূচী
              </p>
              <div className="space-y-2.5">
                {[
                  { day: "শনিবার – বৃহস্পতিবার", time: "সকাল ৯টা – রাত ৯টা", active: true },
                  { day: "শুক্রবার", time: "বিকাল ৩টা – রাত ৯টা", active: true },
                  { day: "সরকারি ছুটির দিন", time: "সীমিত সাপোর্ট", active: false },
                ].map((s) => (
                  <div key={s.day} className="flex items-start justify-between">
                    <span className="text-sm" style={{ color: C.textSub }}>{s.day}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: s.active ? C.primaryLight : "#FEF2F2",
                        color: s.active ? C.primary : "#DC2626",
                      }}
                    >
                      {s.time}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-4 rounded-xl p-3 flex items-start gap-2"
                style={{ backgroundColor: C.primaryLight }}
              >
                <HelpCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: C.primary }} />
                <p className="text-xs" style={{ color: C.primaryDark }}>
                  Emergency support এর জন্য ইমেইল করুন — ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হবে।
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: C.surface, borderColor: C.border }}>
              <p className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: C.text }}>
                <MapPin size={15} style={{ color: C.primary }} />
                আমাদের অবস্থান
              </p>
              <div
                className="rounded-xl h-28 flex items-center justify-center mb-3"
                style={{ backgroundColor: C.primaryLight }}
              >
                <div className="text-center">
                  <MapPin size={24} style={{ color: C.primary }} className="mx-auto mb-1" />
                  <p className="text-xs font-medium" style={{ color: C.primary }}>ঢাকা, বাংলাদেশ</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: C.textSub }}>
                ঢাকা, বাংলাদেশ
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-3">
            <div
              className="rounded-2xl border p-7"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: C.primaryLight }}
                  >
                    <CheckCircle size={30} style={{ color: C.primary }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>
                    বার্তা পাঠানো হয়েছে!
                  </h3>
                  <p className="text-sm mb-6" style={{ color: C.textSub }}>
                    আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব। সাধারণত ৬ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", topic: "সাধারণ প্রশ্ন", message: "" });
                    }}
                    className="text-sm font-medium px-5 py-2.5 rounded-xl border transition-colors hover:bg-gray-50"
                    style={{ borderColor: C.border, color: C.text }}
                  >
                    আরো একটি বার্তা পাঠান
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: C.primaryLight }}
                    >
                      <MessageSquare size={18} style={{ color: C.primary }} />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg" style={{ color: C.text }}>
                        বার্তা পাঠান
                      </h2>
                      <p className="text-xs" style={{ color: C.textMuted }}>
                        সব field পূরণ করুন। ৬ ঘণ্টার মধ্যে উত্তর পাবেন।
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-xl p-3 bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>
                          আপনার নাম <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="name"
                          type="text"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="নাম লিখুন"
                          required
                          className={inputClass}
                          style={inputStyle()}
                          onFocus={(e) => (e.target.style.borderColor = C.primary)}
                          onBlur={(e) => (e.target.style.borderColor = C.border)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>
                          ফোন নম্বর
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+880 1XXXXXXXXX"
                          className={inputClass}
                          style={inputStyle()}
                          onFocus={(e) => (e.target.style.borderColor = C.primary)}
                          onBlur={(e) => (e.target.style.borderColor = C.border)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>
                        ইমেইল <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        required
                        className={inputClass}
                        style={inputStyle()}
                        onFocus={(e) => (e.target.style.borderColor = C.primary)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>
                        বিষয় <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="topic"
                        value={form.topic}
                        onChange={handleChange}
                        className={inputClass}
                        style={{ ...inputStyle(), height: "42px", cursor: "pointer" }}
                        onFocus={(e) => (e.target.style.borderColor = C.primary)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      >
                        {topics.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>
                        মেসেজ <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="আপনার প্রশ্ন বা সমস্যা বিস্তারিত লিখুন..."
                        required
                        rows={5}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none resize-none transition-all"
                        style={{
                          border: `1px solid ${C.border}`,
                          backgroundColor: C.surface,
                          color: C.text,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = C.primary)}
                        onBlur={(e) => (e.target.style.borderColor = C.border)}
                      />
                      <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                        {form.message.length}/500 characters
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
                      style={{ backgroundColor: C.primary }}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          পাঠানো হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          বার্তা পাঠান
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section style={{ backgroundColor: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>সাধারণ প্রশ্নের উত্তর</h2>
            <p className="text-sm" style={{ color: C.textSub }}>বেশিরভাগ উত্তর এখানে পাবেন</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Free plan এ কতদিন ব্যবহার করা যাবে?", a: "চিরকালের জন্য বিনামূল্যে — কোনো time limit নেই।" },
              { q: "bKash দিয়ে payment করা যাবে?", a: "হ্যাঁ, bKash, Nagad ও Rocket সব সাপোর্ট করা হয়।" },
              { q: "Data কি secure?", a: "সব data encrypted ও secure। কোনো third party এর সাথে share হয় না।" },
              { q: "কোনো technical সমস্যায় কত সময়ে সাহায্য পাব?", a: "Priority support এ ৬ ঘণ্টার মধ্যে, Free plan এ ২৪ ঘণ্টার মধ্যে।" },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl p-5 border"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                <p className="font-semibold text-sm mb-1.5" style={{ color: C.text }}>{faq.q}</p>
                <p className="text-sm" style={{ color: C.textSub }}>{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/pricing"
              className="text-sm font-medium hover:underline"
              style={{ color: C.primary }}
            >
              আরো প্রশ্ন আছে? সব FAQ দেখুন →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
