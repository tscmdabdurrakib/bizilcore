"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

const STAR_LABELS: Record<number, string> = {
  1: "খুব খারাপ",
  2: "খারাপ",
  3: "ঠিক আছে",
  4: "ভালো",
  5: "অসাধারণ!",
};

const PLAY_STORE_URL = "https://play.google.com/store"; // placeholder; admin can update later

type Step = "rate" | "thanks_high" | "thanks_low" | "done";

export default function ReviewModal({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [improvementNote, setImprovementNote] = useState("");
  const [step, setStep] = useState<Step>("rate");
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body }),
      });
      if (!res.ok && res.status !== 409) {
        // soft-fail
      }
      setStep(rating >= 4 ? "thanks_high" : "thanks_low");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitImprovement() {
    if (!improvementNote.trim()) {
      setStep("done");
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ improvementNote }),
      });
    } finally {
      setSubmitting(false);
      setStep("done");
      onClose();
    }
  }

  function dismissForLater() {
    try {
      const next = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      localStorage.setItem("review_dismissed_until", String(next));
    } catch {
      /* ignore */
    }
    onClose();
  }

  if (step === "done") return null;

  const display = hover ?? rating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--c-surface, #fff)", color: "var(--c-text, #111)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--c-border, #eee)" }}>
          <h2 className="text-lg font-semibold">
            {step === "rate" && "BizilCore কেমন লাগছে?"}
            {step === "thanks_high" && "ধন্যবাদ! 🙏"}
            {step === "thanks_low" && "আপনার মতামত পেয়েছি"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg hover:bg-black/5">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {step === "rate" && (
            <>
              <div className="flex items-center justify-between gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = display !== null && n <= display;
                  return (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => setRating(n)}
                      className="p-2 rounded-lg transition-transform hover:scale-110"
                      aria-label={`${n} star`}
                    >
                      <Star
                        size={36}
                        fill={active ? "#F5B400" : "transparent"}
                        stroke={active ? "#F5B400" : "#9CA3AF"}
                        strokeWidth={1.5}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-center text-sm font-medium min-h-[20px] mb-4" style={{ color: "var(--c-text-sub, #555)" }}>
                {display ? `${display}★ ${STAR_LABELS[display]}` : "একটি স্টার বেছে নিন"}
              </div>

              {rating !== null && (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="আপনার মতামত লিখুন (ঐচ্ছিক)..."
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#0F6E56]"
                  style={{ borderColor: "var(--c-border, #ddd)", background: "var(--c-bg, #fff)", color: "var(--c-text, #111)" }}
                />
              )}

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={dismissForLater}
                  className="text-sm underline"
                  style={{ color: "var(--c-text-muted, #777)" }}
                >
                  এখন না
                </button>
                <button
                  onClick={submitReview}
                  disabled={!rating || submitting}
                  className="px-5 py-2 rounded-xl font-medium text-white disabled:opacity-50"
                  style={{ background: "#0F6E56" }}
                >
                  {submitting ? "পাঠাচ্ছে..." : "Submit করুন"}
                </button>
              </div>
            </>
          )}

          {step === "thanks_high" && (
            <>
              <p className="mb-2 text-base">ধন্যবাদ! আপনার মতামত আমাদের অনুপ্রাণিত করে।</p>
              <p className="mb-5 text-sm" style={{ color: "var(--c-text-sub, #555)" }}>
                Google Play এ ৫ স্টার দিয়ে আমাদের সাহায্য করতে পারেন 🙏
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => { setStep("done"); onClose(); }}
                  className="text-sm px-3 py-2"
                  style={{ color: "var(--c-text-muted, #777)" }}
                >
                  Skip
                </button>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { setStep("done"); onClose(); }}
                  className="px-5 py-2 rounded-xl font-medium text-white"
                  style={{ background: "#0F6E56" }}
                >
                  Google Play এ যান
                </a>
              </div>
            </>
          )}

          {step === "thanks_low" && (
            <>
              <p className="mb-3 text-sm" style={{ color: "var(--c-text-sub, #555)" }}>
                কী উন্নত করলে ভালো হতো?
              </p>
              <textarea
                value={improvementNote}
                onChange={(e) => setImprovementNote(e.target.value)}
                placeholder="আপনার পরামর্শ লিখুন..."
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[#0F6E56]"
                style={{ borderColor: "var(--c-border, #ddd)", background: "var(--c-bg, #fff)", color: "var(--c-text, #111)" }}
              />
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => { setStep("done"); onClose(); }}
                  className="text-sm px-3 py-2"
                  style={{ color: "var(--c-text-muted, #777)" }}
                >
                  Skip
                </button>
                <button
                  onClick={submitImprovement}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-medium text-white disabled:opacity-50"
                  style={{ background: "#0F6E56" }}
                >
                  পাঠান
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
