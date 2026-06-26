"use client";

import Link from "next/link";
import { Store, Crown, GitBranch, ArrowLeftRight, BarChart2, CheckCircle2 } from "lucide-react";

export default function LockedState() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#0F6E56 0%,#10B981 60%,#3B82F6 100%)" }}>
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <Store size={22} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-black">শাখা ব্যবস্থাপনা</h1>
              <p className="text-sm opacity-80">একটি account দিয়ে একাধিক লোকেশন চালান</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEF3C7" }}>
          <Crown size={28} style={{ color: "#D97706" }} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: "var(--c-text)" }}>Business Plan প্রয়োজন</h2>
        <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
          শাখা ব্যবস্থাপনা Business Plan-এ পাওয়া যায়। সর্বোচ্চ ৩টি লোকেশন (মূল শপ + branch) পরিচালনা করুন।
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6 text-left">
          {[
            { icon: GitBranch, label: "একাধিক Branch", desc: "মূল শপের পাশে branch তৈরি করুন" },
            { icon: ArrowLeftRight, label: "Stock Transfer", desc: "Branch-এ পণ্য পাঠান ও ফেরত নিন" },
            { icon: BarChart2, label: "Branch Analytics", desc: "কোন branch-এ কত স্টক আছে দেখুন" },
            { icon: CheckCircle2, label: "এক Dashboard", desc: "সব লোকেশন এক জায়গায়" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3.5 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#D1FAE5" }}>
                <Icon size={15} style={{ color: "#0F6E56" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/settings?tab=subscription"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)" }}
        >
          <Crown size={16} /> Business Plan-এ Upgrade করুন
        </Link>
      </div>
    </div>
  );
}
