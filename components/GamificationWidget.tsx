"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Star } from "lucide-react";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

const BADGE_EMOJI: Record<string, string> = {
  "first_order": "🎉",
  "streak_7": "🔥",
  "streak_30": "🏆",
  "orders_10": "⭐",
  "orders_50": "💫",
  "orders_100": "👑",
  "orders_500": "🚀",
};

interface GamificationData {
  streak: number;
  totalOrders: number;
  badges: string[];
}

export default function GamificationWidget() {
  const [data, setData] = useState<GamificationData | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {});
  }, []);

  if (!data || (data.streak === 0 && data.badges.length === 0)) return null;

  return (
    <div className="rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF3E0" }}>
          <Trophy size={17} style={{ color: "#F59E0B" }} />
        </div>
        <h3 className="font-bold text-sm" style={{ color: S.text }}>আপনার অর্জন</h3>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Streak */}
        {data.streak > 0 && (
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: data.streak >= 7 ? "#FFF8E7" : S.bg }}>
            <Flame size={22} style={{ color: data.streak >= 7 ? "#F59E0B" : S.muted }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: S.text }}>{data.streak} দিনের Streak</p>
              <p className="text-xs" style={{ color: S.muted }}>
                {data.streak >= 30 ? "অসাধারণ! এক মাস ধরে লগইন করছেন" :
                  data.streak >= 7 ? "দুর্দান্ত! সাত দিন ধরে active আছেন" :
                    "প্রতিদিন login করলে streak বাড়বে"}
              </p>
            </div>
          </div>
        )}

        {/* Badges */}
        {data.badges.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>অর্জিত Badge</p>
            <div className="flex flex-wrap gap-2">
              {data.badges.map(badge => (
                <div key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium" style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                  <span>{BADGE_EMOJI[badge] ?? <Star size={12} />}</span>
                  <span>{
                    badge === "first_order" ? "প্রথম অর্ডার" :
                    badge === "streak_7" ? "৭ দিনের Streak" :
                    badge === "streak_30" ? "৩০ দিনের Streak" :
                    badge === "orders_10" ? "১০টি অর্ডার" :
                    badge === "orders_50" ? "৫০টি অর্ডার" :
                    badge === "orders_100" ? "১০০টি অর্ডার" :
                    badge === "orders_500" ? "৫০০টি অর্ডার" : badge
                  }</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs" style={{ color: S.muted }}>
          মোট অর্ডার: <strong style={{ color: S.text }}>{data.totalOrders}টি</strong>
        </p>
      </div>
    </div>
  );
}
