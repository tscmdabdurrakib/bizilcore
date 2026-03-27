"use client";

import { useEffect, useState } from "react";
import { Lightbulb, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

interface Tip {
  id: string;
  title: string;
  body: string;
  category: string | null;
  helpful: number;
  notHelpful: number;
  myReaction: "helpful" | "not_helpful" | null;
  createdAt: string;
}

const CATEGORIES = ["সব", "বিক্রয়", "ডেলিভারি", "কাস্টমার", "অ্যাকাউন্টিং", "মার্কেটিং", "সাধারণ"];
const CATEGORY_COLORS: Record<string, string> = {
  "বিক্রয়": "#3B82F6", "ডেলিভারি": "#8B5CF6", "কাস্টমার": "#F59E0B",
  "অ্যাকাউন্টিং": "#10B981", "মার্কেটিং": "#EC4899", "সাধারণ": "#6B7280",
};

export default function CommunityTipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("সব");

  function load(cat: string) {
    setLoading(true);
    const url = cat === "সব" ? "/api/community-tips?limit=50" : `/api/community-tips?limit=50&category=${encodeURIComponent(cat)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setTips(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load("সব"); }, []);

  function changeCategory(cat: string) {
    setActiveCategory(cat);
    load(cat);
  }

  async function react(tipId: string, reaction: "helpful" | "not_helpful") {
    setTips(prev => prev.map(t => {
      if (t.id !== tipId) return t;
      const removing = t.myReaction === reaction;
      const wasOther = t.myReaction !== null && t.myReaction !== reaction;
      return {
        ...t,
        myReaction: removing ? null : reaction,
        helpful: reaction === "helpful"
          ? (removing ? t.helpful - 1 : t.helpful + 1)
          : (wasOther && t.myReaction === "helpful" ? t.helpful - 1 : t.helpful),
        notHelpful: reaction === "not_helpful"
          ? (removing ? t.notHelpful - 1 : t.notHelpful + 1)
          : (wasOther && t.myReaction === "not_helpful" ? t.notHelpful - 1 : t.notHelpful),
      };
    }));
    const res = await fetch("/api/community-tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipId, reaction }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTips(prev => prev.map(t => t.id === tipId ? { ...t, helpful: updated.helpful ?? t.helpful, notHelpful: updated.notHelpful ?? t.notHelpful } : t));
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
          <Lightbulb size={20} style={{ color: "#D97706" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>Community টিপস</h1>
          <p className="text-sm" style={{ color: S.muted }}>Facebook seller-দের অভিজ্ঞতা থেকে শেখা টিপস</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => changeCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === cat ? S.primary : S.surface,
              color: activeCategory === cat ? "#fff" : S.secondary,
              border: `1px solid ${activeCategory === cat ? S.primary : S.border}`,
            }}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
              <div className="h-4 w-24 rounded bg-gray-100 mb-2" />
              <div className="h-5 w-4/5 rounded bg-gray-100 mb-3" />
              <div className="h-3 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : tips.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <Lightbulb size={32} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.text }}>এই ক্যাটাগরিতে এখনো কোনো টিপস নেই</p>
          <p className="text-sm mt-1" style={{ color: S.muted }}>Admin近日নতুন টিপস যোগ করবেন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map(tip => {
            const catColor = CATEGORY_COLORS[tip.category ?? ""] ?? "#6B7280";
            const isExpanded = expanded === tip.id;
            return (
              <div key={tip.id} className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
                <div className="mb-3">
                  {tip.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-2"
                      style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                      {tip.category}
                    </span>
                  )}
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: S.text }}>{tip.title}</h3>
                </div>

                {isExpanded && (
                  <p className="text-sm leading-relaxed mb-4" style={{ color: S.secondary }}>{tip.body}</p>
                )}

                <div className="flex items-center justify-between">
                  <button onClick={() => setExpanded(isExpanded ? null : tip.id)}
                    className="flex items-center gap-1 text-xs font-medium" style={{ color: S.primary }}>
                    {isExpanded ? <><ChevronUp size={13} /> কম দেখুন</> : <><ChevronDown size={13} /> আরো পড়ুন</>}
                  </button>
                  <div className="flex items-center gap-4">
                    <button onClick={() => react(tip.id, "helpful")}
                      className="flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: tip.myReaction === "helpful" ? "#10B981" : S.muted }}>
                      <ThumbsUp size={13} fill={tip.myReaction === "helpful" ? "currentColor" : "none"} />
                      কাজে লেগেছে ({tip.helpful})
                    </button>
                    <button onClick={() => react(tip.id, "not_helpful")}
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: tip.myReaction === "not_helpful" ? "#EF4444" : S.muted }}>
                      <ThumbsDown size={13} fill={tip.myReaction === "not_helpful" ? "currentColor" : "none"} />
                      {tip.notHelpful}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
