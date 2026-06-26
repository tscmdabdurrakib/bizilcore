"use client";

import { useEffect, useState } from "react";
import { Lightbulb, ThumbsUp, ThumbsDown, ChevronRight } from "lucide-react";
import { onIdle } from "@/lib/idle";
import { T } from "@/lib/theme";
import { useDashboardFetch } from "@/hooks/useDashboardFetch";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

interface Tip {
  id: string;
  title: string;
  body: string;
  category: string | null;
  helpful: number;
  notHelpful: number;
  myReaction: "helpful" | "not_helpful" | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "বিক্রয়": "var(--bg-info-text)", "ডেলিভারি": "var(--bg-purple-text)", "কাস্টমার": "var(--accent-warm)",
  "অ্যাকাউন্টিং": "var(--c-primary)", "মার্কেটিং": "var(--bg-danger-text)", "সাধারণ": "var(--c-text-muted)",
};

export default function CommunityTipsWidget() {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const { data, isLoading: loading } = useDashboardFetch<Tip[] | { tips: Tip[] }>(
    enabled ? "/api/community-tips?limit=3" : null,
  );

  useEffect(() => {
    return onIdle(() => setEnabled(true));
  }, []);

  useEffect(() => {
    const fetched = Array.isArray(data) ? data : (data?.tips ?? []);
    if (fetched.length > 0) setTips(fetched);
  }, [data]);

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

  if (loading) return null;

  if (tips.length === 0) {
    return (
      <div className="rounded-2xl border px-5 py-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2">
          <Lightbulb size={16} style={{ color: T.warning.iconText }} />
          <p className="text-xs" style={{ color: S.muted }}>এখনো কোনো কমিউনিটি টিপস নেই</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.warning.iconBg }}>
            <Lightbulb size={17} style={{ color: T.warning.iconText }} />
          </div>
          <h3 className="font-bold text-sm" style={{ color: S.text }}>Community টিপস</h3>
        </div>
        <a href="/community-tips" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: S.primary }}>
          সব দেখুন <ChevronRight size={13} />
        </a>
      </div>

      <div className="divide-y" style={{ borderColor: S.border }}>
        {tips.map(tip => {
          const catColor = CATEGORY_COLORS[tip.category ?? ""] ?? "var(--c-text-muted)";
          return (
            <div key={tip.id} className="px-5 py-4">
              <div className="mb-2">
                {tip.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-1.5 border"
                    style={{ backgroundColor: "var(--c-bg)", color: catColor, borderColor: "var(--c-border)" }}>
                    {tip.category}
                  </span>
                )}
                <p className="font-semibold text-sm leading-tight" style={{ color: S.text }}>{tip.title}</p>
              </div>

              {expanded === tip.id && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: S.secondary }}>{tip.body}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                <button onClick={() => setExpanded(expanded === tip.id ? null : tip.id)}
                  className="text-xs font-medium" style={{ color: S.primary }}>
                  {expanded === tip.id ? "কম দেখুন ↑" : "আরো পড়ুন →"}
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => react(tip.id, "helpful")} className="flex items-center gap-1 text-xs"
                    style={{ color: tip.myReaction === "helpful" ? "var(--c-primary)" : S.muted }}>
                    <ThumbsUp size={12} fill={tip.myReaction === "helpful" ? "currentColor" : "none"} /> {tip.helpful}
                  </button>
                  <button onClick={() => react(tip.id, "not_helpful")} className="flex items-center gap-1 text-xs"
                    style={{ color: tip.myReaction === "not_helpful" ? T.danger.text : S.muted }}>
                    <ThumbsDown size={12} fill={tip.myReaction === "not_helpful" ? "currentColor" : "none"} /> {tip.notHelpful}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
