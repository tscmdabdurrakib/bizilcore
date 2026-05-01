"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Trophy, ChevronRight } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

interface GamData {
  streak: number;
  xp: number;
  level: string;
  nextLevelXp: number;
  weeklyRank: number | null;
  topThree: Array<{ label: string; orders: number }>;
  category: string | null;
  earnedBadges: Array<{ key: string; title: string; icon: string }>;
}

export default function GamificationWidget() {
  const router = useRouter();
  const [data, setData] = useState<GamData | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return null;
  if (data.streak === 0 && data.xp === 0 && data.earnedBadges.length === 0) return null;

  const xpPct = Math.min(100, Math.round((data.xp / data.nextLevelXp) * 100));

  return (
    <div className="space-y-3">
      {/* Compact streak + level + XP row */}
      <div
        className="rounded-2xl border px-4 py-3 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ backgroundColor: S.surface, borderColor: S.border }}
        onClick={() => router.push("/settings/achievements")}
      >
        {/* Streak */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Flame size={17} style={{ color: data.streak >= 7 ? "#F59E0B" : S.muted }} />
          <span className="text-sm font-bold" style={{ color: data.streak >= 7 ? "#F59E0B" : S.text }}>
            {data.streak} দিন
          </span>
        </div>

        <div className="w-px h-5 shrink-0" style={{ backgroundColor: S.border }} />

        {/* Level pill */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
        >
          {data.level}
        </span>

        {/* XP bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: S.muted }}>{data.xp} XP</span>
            <span className="text-xs" style={{ color: S.muted }}>{data.nextLevelXp} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: S.bg }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, backgroundColor: "#F59E0B" }}
            />
          </div>
        </div>

        <ChevronRight size={14} style={{ color: S.muted, flexShrink: 0 }} />
      </div>

      {/* Weekly leaderboard card */}
      {data.weeklyRank !== null && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: S.surface, borderColor: S.border }}
        >
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                <Trophy size={15} style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: S.text }}>এই সপ্তাহে আপনার rank</p>
                {data.category && (
                  <p className="text-xs" style={{ color: S.muted }}>{data.category} বিক্রেতাদের মধ্যে</p>
                )}
              </div>
            </div>
            <div
              className="text-2xl font-black"
              style={{ color: data.weeklyRank <= 3 ? "#F59E0B" : S.text }}
            >
              #{data.weeklyRank}
            </div>
          </div>

          {data.topThree.length > 0 && (
            <div className="px-4 pb-4 space-y-1.5">
              {data.topThree.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span style={{ color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : "#CD7F32" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                    <span style={{ color: S.muted }}>{t.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="px-4 py-2.5 border-t text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity text-center"
            style={{ borderColor: S.border, color: S.primary }}
            onClick={() => router.push("/community")}
          >
            পূর্ণ leaderboard দেখুন →
          </div>
        </div>
      )}
    </div>
  );
}
