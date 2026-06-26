"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Trophy, ChevronRight } from "lucide-react";
import { onIdle } from "@/lib/idle";
import { T } from "@/lib/theme";
import Card from "@/components/ui/Card";
import { useDashboardFetch } from "@/hooks/useDashboardFetch";

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
  const [enabled, setEnabled] = useState(false);
  const { data } = useDashboardFetch<GamData>(enabled ? "/api/gamification" : null);

  useEffect(() => {
    return onIdle(() => setEnabled(true));
  }, []);

  if (!data) return null;

  if (data.streak === 0 && data.xp === 0 && data.earnedBadges.length === 0) {
    return (
      <Card className="!py-3 !px-4">
        <p className="text-xs text-center" style={{ color: "var(--c-text-muted)" }}>
          অর্ডার ও কার্যকলাপ শুরু করলে স্ট্রিক ও ব্যাজ এখানে দেখা যাবে
        </p>
      </Card>
    );
  }

  const xpPct = Math.min(100, Math.round((data.xp / data.nextLevelXp) * 100));

  return (
    <div className="space-y-3">
      {/* Compact streak + level + XP row */}
      <Card
        className="flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] !py-3 !px-4"
        onClick={() => router.push("/settings/achievements")}
      >
        {/* Streak */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Flame size={17} style={{ color: data.streak >= 7 ? "var(--accent-warm)" : "var(--c-text-muted)" }} />
          <span className="text-sm font-bold" style={{ color: data.streak >= 7 ? "var(--accent-warm)" : "var(--c-text)" }}>
            {data.streak} দিন
          </span>
        </div>

        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--c-border)" }} />

        {/* Level pill */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ backgroundColor: T.warning.bg, color: T.warning.text }}
        >
          {data.level}
        </span>

        {/* XP bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{data.xp} XP</span>
            <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{data.nextLevelXp} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-bg)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, backgroundColor: "var(--accent-warm)" }}
            />
          </div>
        </div>

        <ChevronRight size={14} style={{ color: "var(--c-text-muted)", flexShrink: 0 }} />
      </Card>

      {/* Weekly leaderboard card */}
      {data.weeklyRank !== null && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.warning.iconBg }}>
                <Trophy size={15} style={{ color: T.warning.iconText }} />
              </div>
              <div>
                <p className="text-xs font-bold font-display" style={{ color: "var(--c-text)" }}>এই সপ্তাহে আপনার rank</p>
                {data.category && (
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{data.category} বিক্রেতাদের মধ্যে</p>
                )}
              </div>
            </div>
            <div
              className="text-2xl font-black font-display"
              style={{ color: data.weeklyRank <= 3 ? "var(--accent-warm)" : "var(--c-text)" }}
            >
              #{data.weeklyRank}
            </div>
          </div>

          {data.topThree.length > 0 && (
            <div className="px-4 pb-4 space-y-1.5">
              {data.topThree.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span style={{ color: i === 0 ? "var(--accent-warm)" : i === 1 ? "#9CA3AF" : "#CD7F32" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                    <span style={{ color: "var(--c-text-muted)" }}>{t.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="px-4 py-2.5 border-t text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity text-center"
            style={{ borderColor: "var(--c-border)", color: "var(--c-primary)" }}
            onClick={() => router.push("/community")}
          >
            পূর্ণ leaderboard দেখুন →
          </div>
        </Card>
      )}
    </div>
  );
}
