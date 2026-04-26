"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

type Step = "score" | "follow_up" | "promoter" | "done";

function colorFor(score: number): string {
  if (score <= 6) return "#DC2626"; // red
  if (score <= 8) return "#F59E0B"; // amber
  return "#16A34A"; // green
}

export default function NPSBanner({ onDismiss }: { onDismiss: () => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<Step>("score");
  const [submitting, setSubmitting] = useState(false);

  function dismiss() {
    try {
      localStorage.setItem("nps_dismissed_at", String(Date.now()));
    } catch {
      /* ignore */
    }
    onDismiss();
  }

  async function pickScore(s: number) {
    setScore(s);
    setSubmitting(true);
    try {
      await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: s }),
      });
    } finally {
      setSubmitting(false);
    }
    if (s >= 9) setStep("promoter");
    else setStep("follow_up");
  }

  async function submitReason() {
    if (!reason.trim()) {
      setStep("done");
      dismiss();
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/nps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
    } finally {
      setSubmitting(false);
      setStep("done");
      dismiss();
    }
  }

  if (step === "done") return null;

  return (
    <div
      className="rounded-2xl border p-4 mb-4 relative"
      style={{
        borderColor: "var(--c-border, #E5E7EB)",
        background: "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Close"
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5"
      >
        <X size={16} />
      </button>

      {step === "score" && (
        <>
          <p className="font-semibold text-base mb-1" style={{ color: "var(--c-text, #111)" }}>
            BizilCore কতটা recommend করবেন বন্ধুকে? (০–১০)
          </p>
          <p className="text-sm mb-3" style={{ color: "var(--c-text-sub, #555)" }}>
            আপনার মতামত আমাদের সাহায্য করবে আরও ভালো হতে।
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 11 }).map((_, n) => (
              <button
                key={n}
                onClick={() => pickScore(n)}
                disabled={submitting}
                className="w-9 h-9 rounded-lg font-semibold text-sm border transition-transform hover:scale-105 disabled:opacity-50"
                style={{
                  background: "white",
                  borderColor: colorFor(n),
                  color: colorFor(n),
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}

      {step === "follow_up" && score !== null && (
        <>
          <p className="font-semibold text-base mb-2" style={{ color: "var(--c-text, #111)" }}>
            {score <= 6
              ? "কী সমস্যা হচ্ছে?"
              : "কী যোগ করলে ১০ দিতেন?"}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="আপনার মতামত..."
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#0F6E56]"
            style={{ borderColor: "var(--c-border, #ddd)", background: "white", color: "var(--c-text, #111)" }}
          />
          <div className="flex items-center justify-end gap-3 mt-3">
            <button onClick={dismiss} className="text-sm" style={{ color: "var(--c-text-muted, #777)" }}>
              Skip
            </button>
            <button
              onClick={submitReason}
              disabled={submitting}
              className="px-4 py-2 rounded-xl font-medium text-white text-sm disabled:opacity-50"
              style={{ background: "#0F6E56" }}
            >
              Submit
            </button>
          </div>
        </>
      )}

      {step === "promoter" && (
        <>
          <p className="font-semibold text-base mb-2" style={{ color: "var(--c-text, #111)" }}>
            ধন্যবাদ! 🎉 বন্ধুকে invite করুন এবং রেফারেল বোনাস পান।
          </p>
          <div className="flex items-center justify-end gap-3 mt-2">
            <button onClick={dismiss} className="text-sm" style={{ color: "var(--c-text-muted, #777)" }}>
              পরে
            </button>
            <Link
              href="/affiliate"
              onClick={dismiss}
              className="px-4 py-2 rounded-xl font-medium text-white text-sm"
              style={{ background: "#0F6E56" }}
            >
              Invite করুন →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
