"use client";

import { GitBranch, ArrowLeftRight, Boxes, Plus, X } from "lucide-react";

interface Props {
  onCreateBranch: () => void;
  onDismiss: () => void;
}

export default function OnboardingWelcome({ onCreateBranch, onDismiss }: Props) {
  return (
    <div className="rounded-2xl border p-5 relative overflow-hidden"
      style={{ borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" }}>
      <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-lg" style={{ color: "#059669" }}><X size={14} /></button>
      <h3 className="text-sm font-black mb-1" style={{ color: "#065F46" }}>আপনার ব্যবসার আরেকটি লোকেশন আছে?</h3>
      <p className="text-xs mb-4" style={{ color: "#047857" }}>Branch তৈরি করে স্টক পাঠান — ৩ মিনিটেই শুরু করুন।</p>
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        {[
          { icon: GitBranch, step: "১", text: "Branch তৈরি করুন" },
          { icon: ArrowLeftRight, step: "২", text: "স্টক Transfer করুন" },
          { icon: Boxes, step: "৩", text: "Branch স্টক দেখুন" },
        ].map(({ icon: Icon, step, text }) => (
          <div key={step} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/70">
            <span className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#0F6E56" }}>{step}</span>
            <Icon size={13} style={{ color: "#0F6E56" }} />
            <span className="text-[10px] font-semibold" style={{ color: "#065F46" }}>{text}</span>
          </div>
        ))}
      </div>
      <button onClick={onCreateBranch}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold"
        style={{ background: "linear-gradient(135deg,#0F6E56,#10B981)" }}>
        <Plus size={14} /> প্রথম Branch তৈরি করুন
      </button>
    </div>
  );
}
