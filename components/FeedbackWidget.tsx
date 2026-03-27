"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCirclePlus, X, Bug, Lightbulb, Star, MessageSquare, Send, Loader2, CheckCircle2 } from "lucide-react";

const TYPES = [
  { key: "bug",        label: "সমস্যা",    emoji: "🐛", icon: Bug,        color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  { key: "suggestion", label: "পরামর্শ",   emoji: "💡", icon: Lightbulb,  color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { key: "compliment", label: "প্রশংসা",   emoji: "🌟", icon: Star,       color: "#0F6E56", bg: "#F0FBF6", border: "#A7F3D0" },
  { key: "other",      label: "অন্যান্য",  emoji: "💬", icon: MessageSquare, color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
] as const;

type FeedbackType = typeof TYPES[number]["key"];

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const selected = TYPES.find(t => t.key === type)!;

  async function submit() {
    if (!message.trim()) return;
    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message: message.trim(), pageUrl: pathname }),
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setMessage("");
      setType("bug");
    }, 2200);
  }

  return (
    <>
      {/* Trigger Button — TopBar এ ব্যবহার করার জন্য */}
      <button
        onClick={() => setOpen(true)}
        title="Feedback পাঠান"
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 hover:scale-[1.03]"
        style={{
          background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(15,110,86,0.25)",
        }}
      >
        <MessageCirclePlus size={14} strokeWidth={2.2} />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Modal */}
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
            style={{ backgroundColor: "#fff" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
            >
              <div>
                <p className="text-white font-bold text-base leading-tight">Feedback পাঠান</p>
                <p className="text-white/60 text-xs mt-0.5">আপনার মতামত আমাদের উন্নত করতে সাহায্য করে</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {done ? (
                /* Success state */
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0FBF6" }}>
                    <CheckCircle2 size={28} color="#0F6E56" strokeWidth={2} />
                  </div>
                  <p className="font-bold text-base" style={{ color: "#0F6E56" }}>ধন্যবাদ!</p>
                  <p className="text-sm text-center" style={{ color: "#6B7280" }}>আপনার feedback পেয়েছি। শীঘ্রই দেখব।</p>
                </div>
              ) : (
                <>
                  {/* Current page info */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#F3F4F6" }}>
                    <span className="text-xs" style={{ color: "#6B7280" }}>পেজ:</span>
                    <span className="text-xs font-mono font-medium truncate" style={{ color: "#374151" }}>{pathname}</span>
                  </div>

                  {/* Type selector */}
                  <div>
                    <p className="text-xs font-semibold mb-2.5" style={{ color: "#374151" }}>Feedback এর ধরন</p>
                    <div className="grid grid-cols-4 gap-2">
                      {TYPES.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setType(t.key)}
                          className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl border-2 transition-all active:scale-95"
                          style={{
                            backgroundColor: type === t.key ? t.bg : "#F9FAFB",
                            borderColor: type === t.key ? t.border : "#E5E7EB",
                          }}
                        >
                          <span className="text-lg">{t.emoji}</span>
                          <span className="text-[10px] font-semibold leading-tight text-center" style={{ color: type === t.key ? t.color : "#9CA3AF" }}>
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#374151" }}>
                      {type === "bug" ? "সমস্যাটা বিস্তারিত বলুন" :
                       type === "suggestion" ? "আপনার পরামর্শ বলুন" :
                       type === "compliment" ? "কোন বিষয়টা ভালো লেগেছে?" : "আপনার বার্তা লিখুন"}
                    </p>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={
                        type === "bug" ? "কী সমস্যা হচ্ছে? কোথায় হচ্ছে? কীভাবে হচ্ছে?" :
                        type === "suggestion" ? "কী যোগ করলে আরও ভালো হতো?" :
                        type === "compliment" ? "কী ভালো লেগেছে বলুন..." :
                        "আপনার মতামত লিখুন..."
                      }
                      rows={4}
                      className="w-full px-3.5 py-3 rounded-2xl border text-sm outline-none resize-none leading-relaxed transition-all"
                      style={{
                        borderColor: message ? selected.border : "#E5E7EB",
                        backgroundColor: message ? selected.bg : "#F9FAFB",
                        color: "#111827",
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = selected.border; e.currentTarget.style.backgroundColor = selected.bg; }}
                      onBlur={e => { if (!message) { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.backgroundColor = "#F9FAFB"; } }}
                    />
                    <p className="text-xs mt-1 text-right" style={{ color: message.length > 500 ? "#EF4444" : "#9CA3AF" }}>
                      {message.length}/500
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={submit}
                    disabled={submitting || !message.trim() || message.length > 500}
                    className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
                  >
                    {submitting ? <><Loader2 size={15} className="animate-spin" /> পাঠাচ্ছে...</> : <><Send size={15} /> Feedback পাঠান</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
