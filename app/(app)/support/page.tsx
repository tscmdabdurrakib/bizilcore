"use client";

import { useState } from "react";
import {
  Headphones,
  Mail,
  MessageSquare,
  Phone,
  Send,
  CheckCircle,
  ChevronRight,
  Clock,
  HelpCircle,
  ExternalLink,
  Zap,
  Shield,
  BookOpen,
  Facebook,
} from "lucide-react";
import Link from "next/link";

const topics = [
  "সাধারণ প্রশ্ন",
  "Technical সমস্যা",
  "Billing ও Payment",
  "Feature Request",
  "Courier Integration",
  "Staff Management",
  "অন্যান্য",
];

export default function SupportPage() {
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
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("সমস্যা হয়েছে। একটু পরে চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>
          সাপোর্ট ও সাহায্য
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-sub)" }}>
          যেকোনো সমস্যায় আমরা আছি। সাধারণত ৬ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।
        </p>
      </div>

      {/* Quick channels */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Mail,
            title: "ইমেইল সাপোর্ট",
            desc: "support@bizilcore.com",
            sub: "সবচেয়ে দ্রুত",
            href: "mailto:support@bizilcore.com",
            color: "#2563EB",
            bg: "#EFF6FF",
          },
          {
            icon: Phone,
            title: "ফোন সাপোর্ট",
            desc: "+880 1700-000000",
            sub: "সকাল ৯টা–রাত ৯টা",
            href: "tel:+8801700000000",
            color: "#059669",
            bg: "#ECFDF5",
          },
          {
            icon: Facebook,
            title: "Facebook Messenger",
            desc: "BizilCore Official",
            sub: "Live chat",
            href: "https://facebook.com",
            color: "#1877F2",
            bg: "#EFF6FF",
          },
          {
            icon: Clock,
            title: "সাপোর্ট সময়",
            desc: "শনি–বৃহস্পতি",
            sub: "সকাল ৯টা–রাত ৯টা",
            href: null,
            color: "#7C3AED",
            bg: "#F5F3FF",
          },
        ].map((ch) => {
          const content = (
            <div
              className="rounded-2xl border p-4 flex items-start gap-3"
              style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ch.bg }}>
                <ch.icon size={18} style={{ color: ch.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>{ch.title}</p>
                <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{ch.desc}</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{ch.sub}</p>
              </div>
            </div>
          );
          return ch.href ? (
            <a key={ch.title} href={ch.href} target="_blank" rel="noreferrer" className="hover:scale-[1.01] transition-transform">
              {content}
            </a>
          ) : (
            <div key={ch.title}>{content}</div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid md:grid-cols-5 gap-6">

        {/* Left: quick help + status */}
        <div className="md:col-span-2 space-y-4">

          {/* Quick links */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--c-text)" }}>
              <Zap size={14} style={{ color: "#0F6E56" }} />
              দ্রুত সাহায্য
            </p>
            <div className="space-y-0.5">
              {[
                { label: "পণ্য কীভাবে যোগ করব?", href: "/inventory/new" },
                { label: "অর্ডার কীভাবে তৈরি করব?", href: "/orders/new" },
                { label: "Courier বুকিং কীভাবে দেব?", href: "/delivery" },
                { label: "Staff কীভাবে যোগ করব?", href: "/settings" },
                { label: "Report কীভাবে দেখব?", href: "/reports" },
                { label: "Invoice কীভাবে print করব?", href: "/orders" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <span className="text-sm" style={{ color: "var(--c-text-sub)" }}>{item.label}</span>
                  <ChevronRight size={13} style={{ color: "var(--c-text-muted)" }} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Service status */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--c-text)" }}>
              <Shield size={14} style={{ color: "#0F6E56" }} />
              System Status
            </p>
            <div className="space-y-2.5">
              {[
                { name: "App", status: "চলছে", ok: true },
                { name: "Database", status: "চলছে", ok: true },
                { name: "Courier API", status: "চলছে", ok: true },
                { name: "Payment Gateway", status: "চলছে", ok: true },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--c-text-sub)" }}>{s.name}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      backgroundColor: s.ok ? "#ECFDF5" : "#FEF2F2",
                      color: s.ok ? "#059669" : "#DC2626",
                    }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-green-500" : "bg-red-500"}`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Docs */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--c-text)" }}>
              <BookOpen size={14} style={{ color: "#0F6E56" }} />
              Useful Links
            </p>
            <div className="space-y-2">
              {[
                { label: "সব ফিচার দেখুন", href: "/features", external: true },
                { label: "Pricing ও Plan", href: "/pricing", external: true },
                { label: "Public Contact Page", href: "/contact", external: true },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : "_self"}
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  style={{ color: "#0F6E56" }}
                >
                  <ExternalLink size={13} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Contact form */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border" style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--c-border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E1F5EE" }}>
                <MessageSquare size={15} style={{ color: "#0F6E56" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>সাপোর্ট টিকেট খুলুন</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>৬ ঘণ্টার মধ্যে উত্তর পাবেন</p>
              </div>
            </div>

            <div className="p-6">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#E1F5EE" }}>
                    <CheckCircle size={26} style={{ color: "#0F6E56" }} />
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--c-text)" }}>বার্তা পাঠানো হয়েছে!</h3>
                  <p className="text-sm mb-5" style={{ color: "var(--c-text-sub)" }}>
                    আমাদের সাপোর্ট টিম শীঘ্রই যোগাযোগ করবে।
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", topic: "সাধারণ প্রশ্ন", message: "" });
                    }}
                    className="text-sm font-medium px-4 py-2 rounded-xl border transition-colors hover:bg-gray-50"
                    style={{ borderColor: "var(--c-border)", color: "var(--c-text)" }}
                  >
                    আরো একটি বার্তা পাঠান
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 rounded-xl p-3 bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                          নাম <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="name"
                          type="text"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="আপনার নাম"
                          required
                          className={inputClass}
                          style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
                          onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                          onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
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
                          style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
                          onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                          onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                        বিষয়
                      </label>
                      <select
                        name="topic"
                        value={form.topic}
                        onChange={handleChange}
                        className={inputClass}
                        style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)", height: "42px", cursor: "pointer" }}
                        onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
                      >
                        {topics.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                        বার্তা <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="আপনার সমস্যা বা প্রশ্ন বিস্তারিত লিখুন..."
                        required
                        rows={5}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none resize-none transition-all"
                        style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
                        onFocus={(e) => (e.target.style.borderColor = "#0F6E56")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--c-border)")}
                      />
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "#E1F5EE" }}>
                      <HelpCircle size={14} style={{ color: "#0F6E56" }} className="flex-shrink-0" />
                      <p className="text-xs" style={{ color: "#0A5240" }}>
                        যত বেশি detail দেবেন, তত দ্রুত সাহায্য করতে পারব।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60 hover:opacity-90"
                      style={{ backgroundColor: "#0F6E56" }}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          পাঠানো হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          টিকেট পাঠান
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
