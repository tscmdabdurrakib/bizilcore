"use client";
import { useState } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";

export interface TipData {
  id:          string;
  title:       string;
  body:        string;
  category:    string | null;
  helpful:     number;
  notHelpful:  number;
  myReaction:  "helpful" | "not_helpful" | null;
  createdAt:   string;
}

const CAT_COLORS: Record<string, string> = {
  বিক্রয়:      "#3B82F6",
  ডেলিভারি:     "#8B5CF6",
  কাস্টমার:     "#F59E0B",
  অ্যাকাউন্টিং: "#10B981",
  মার্কেটিং:    "#EC4899",
  সাধারণ:       "#6B7280",
};

function BizilBadge() {
  return (
    <span
      title="BizilCore অফিশিয়াল টিপস"
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        background: "linear-gradient(135deg, #4F46E5 0%, #0F6E56 100%)",
        color: "#fff", borderRadius: 9999,
        padding: "2px 8px", fontSize: 10, fontWeight: 800,
        letterSpacing: "0.02em", flexShrink: 0,
        boxShadow: "0 1px 4px rgba(79,70,229,0.3)",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
        <path d="M5 1L6.2 3.7L9 4.1L7 6L7.5 9L5 7.6L2.5 9L3 6L1 4.1L3.8 3.7L5 1Z" fill="white"/>
      </svg>
      BizilCore
    </span>
  );
}

function BizilAvatar() {
  return (
    <div
      style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #4F46E5 0%, #0F6E56 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(79,70,229,0.35)",
      }}
    >
      <span style={{ color: "white", fontSize: 14, fontWeight: 900, letterSpacing: "-0.5px" }}>BC</span>
    </div>
  );
}

export default function TipCard({
  tip: initialTip,
}: {
  tip: TipData;
}) {
  const [tip, setTip]       = useState<TipData>(initialTip);
  const [expanded, setExpanded] = useState(false);

  const catColor = CAT_COLORS[tip.category ?? ""] ?? "#6B7280";
  const isLong   = tip.body.length > 280;
  const display  = isLong && !expanded ? tip.body.slice(0, 280) + "…" : tip.body;

  const react = async (reaction: "helpful" | "not_helpful") => {
    const removing = tip.myReaction === reaction;
    const wasOther = tip.myReaction !== null && tip.myReaction !== reaction;

    setTip((prev) => ({
      ...prev,
      myReaction: removing ? null : reaction,
      helpful: reaction === "helpful"
        ? removing ? prev.helpful - 1 : prev.helpful + 1
        : wasOther && prev.myReaction === "helpful" ? prev.helpful - 1 : prev.helpful,
      notHelpful: reaction === "not_helpful"
        ? removing ? prev.notHelpful - 1 : prev.notHelpful + 1
        : wasOther && prev.myReaction === "not_helpful" ? prev.notHelpful - 1 : prev.notHelpful,
    }));

    const res = await fetch("/api/community-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipId: tip.id, reaction }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTip((prev) => ({ ...prev, helpful: updated.helpful ?? prev.helpful, notHelpful: updated.notHelpful ?? prev.notHelpful }));
    }
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
      style={{
        borderColor: "#C7D2FE",
        backgroundColor: "var(--c-surface)",
        boxShadow: "0 1px 6px rgba(79,70,229,0.07)",
      }}
    >
      {/* Gradient top bar */}
      <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #4F46E5, #0F6E56)" }} />

      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <BizilAvatar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-bold text-sm" style={{ color: "var(--c-text)" }}>BizilCore অফিশিয়াল</span>
            <BizilBadge />
            {tip.category && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${catColor}18`, color: catColor, border: `1px solid ${catColor}40` }}
              >
                {tip.category}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Team BizilCore · অফিশিয়াল টিপস</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-1">
        {/* Official label strip */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl mb-2.5"
          style={{ backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE" }}
        >
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L6.2 3.7L9 4.1L7 6L7.5 9L5 7.6L2.5 9L3 6L1 4.1L3.8 3.7L5 1Z" fill="#4F46E5"/>
          </svg>
          <span className="text-[10px] font-bold" style={{ color: "#4F46E5" }}>BizilCore Team কর্তৃক প্রকাশিত অফিশিয়াল টিপস</span>
        </div>

        <h3 className="font-bold text-sm mb-1.5 leading-snug" style={{ color: "var(--c-text)" }}>
          💡 {tip.title}
        </h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--c-text-sub)" }}>
          {display}
        </p>
        {isLong && (
          <button onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold mt-1 flex items-center gap-0.5" style={{ color: "#4F46E5" }}>
            {expanded ? <><ChevronUp size={12} /> কম দেখুন</> : <><ChevronDown size={12} /> আরো পড়ুন</>}
          </button>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-t mt-2" style={{ borderColor: "#E0E7FF" }}>
        <button
          onClick={() => react("helpful")}
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: tip.myReaction === "helpful" ? "#0F6E56" : "var(--c-text-muted)" }}
        >
          <ThumbsUp size={14} fill={tip.myReaction === "helpful" ? "currentColor" : "none"} />
          কাজে লেগেছে
          {tip.helpful > 0 && (
            <span
              className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: tip.myReaction === "helpful" ? "#D1FAE5" : "var(--c-bg)", color: tip.myReaction === "helpful" ? "#0F6E56" : "var(--c-text-muted)" }}
            >
              {tip.helpful}
            </span>
          )}
        </button>
        <button
          onClick={() => react("not_helpful")}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: tip.myReaction === "not_helpful" ? "#EF4444" : "var(--c-text-muted)" }}
        >
          <ThumbsDown size={13} fill={tip.myReaction === "not_helpful" ? "currentColor" : "none"} />
          {tip.notHelpful > 0 && tip.notHelpful}
        </button>
        <span className="ml-auto text-[10px]" style={{ color: "var(--c-text-muted)" }}>
          {new Date(tip.createdAt).toLocaleDateString("bn-BD")}
        </span>
      </div>
    </div>
  );
}
