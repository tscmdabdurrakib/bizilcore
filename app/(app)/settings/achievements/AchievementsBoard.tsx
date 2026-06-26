"use client";

import { useEffect, useState } from "react";
import { Flame, Lock, ChevronRight, Star } from "lucide-react";
import { Card, Badge, SectionTitle } from "@/components/ui";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
  primary: "var(--c-primary)",
};

const LEVEL_ORDER = ["নতুন বিক্রেতা", "সক্রিয় বিক্রেতা", "দক্ষ বিক্রেতা", "অভিজ্ঞ বিক্রেতা", "শীর্ষ বিক্রেতা"];
const LEVEL_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  "নতুন বিক্রেতা":  { bg: "#F3F4F6", text: "#374151", bar: "#9CA3AF" },
  "সক্রিয় বিক্রেতা": { bg: "#DBEAFE", text: "#1E40AF", bar: "#3B82F6" },
  "দক্ষ বিক্রেতা":   { bg: "#D1FAE5", text: "#065F46", bar: "#10B981" },
  "অভিজ্ঞ বিক্রেতা":  { bg: "#FEF3C7", text: "#92400E", bar: "#F59E0B" },
  "শীর্ষ বিক্রেতা": { bg: "#FDE8FF", text: "#6B21A8", bar: "#A855F7" },
};

const HINT: Record<string, string> = {
  first_login:      "প্রথমবার লগইন করুন",
  profile_complete: "Shop profile সম্পূর্ণ করুন",
  first_product:    "প্রথম পণ্য যোগ করুন",
  first_sale:       "প্রথম অর্ডার তৈরি করুন",
  orders_10:        "১০টি অর্ডার সম্পন্ন করুন",
  orders_100:       "১০০টি অর্ডার সম্পন্ন করুন",
  orders_1000:      "১০০০টি অর্ডার সম্পন্ন করুন",
  revenue_50k:      "মোট বিক্রি ৳৫০,০০০ পার করুন",
  revenue_1lakh:    "মোট বিক্রি ৳১,০০,০০০ পার করুন",
  streak_7:         "টানা ৭ দিন লগইন করুন",
  streak_30:        "টানা ৩০ দিন লগইন করুন",
  first_referral:   "একজনকে refer করুন",
  referrals_5:      "৫ জনকে refer করুন",
  pro_upgrade:      "Pro plan এ upgrade করুন",
};

interface BadgeData {
  key: string;
  title: string;
  desc: string;
  icon: string;
  xp: number;
  earned: boolean;
  earnedAt: string | null;
}

interface GamData {
  streak: number;
  xp: number;
  level: string;
  nextLevelXp: number;
  allBadges: BadgeData[];
}

export default function AchievementsBoard() {
  const [data, setData] = useState<GamData | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: S.border, borderTopColor: S.primary }} />
      </div>
    );
  }

  const levelIdx = LEVEL_ORDER.indexOf(data.level);
  const levelColor = LEVEL_COLORS[data.level] ?? LEVEL_COLORS["নতুন বিক্রেতা"];
  const xpPct = Math.min(100, Math.round((data.xp / data.nextLevelXp) * 100));
  const earnedCount = data.allBadges.filter(b => b.earned).length;

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Level badge */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: levelColor.bg }}
            >
              <Star size={28} style={{ color: levelColor.bar }} fill={levelColor.bar} />
            </div>
            <div>
              <Badge variant="info">{data.level}</Badge>
              <p className="text-xs mt-1" style={{ color: S.muted }}>
                {data.xp} XP · পরের level এর জন্য আরো {Math.max(0, data.nextLevelXp - data.xp)} XP দরকার
              </p>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0" style={{ backgroundColor: data.streak >= 7 ? "#FFF8E7" : S.bg }}>
            <Flame size={20} style={{ color: data.streak >= 7 ? "#F59E0B" : S.muted }} />
            <div>
              <p className="font-bold text-sm" style={{ color: data.streak >= 7 ? "#92400E" : S.text }}>
                🔥 {data.streak} দিন টানা active আছেন!
              </p>
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: S.muted }}>
            <span>{data.xp} XP</span>
            <span>
              {levelIdx < LEVEL_ORDER.length - 1 ? `${LEVEL_ORDER[levelIdx + 1]} — ${data.nextLevelXp} XP` : "সর্বোচ্চ স্তর 🎉"}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: S.bg }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%`, backgroundColor: levelColor.bar }}
            />
          </div>
        </div>

        {/* Level steps */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto">
          {LEVEL_ORDER.map((lv, i) => {
            const done = i <= levelIdx;
            const c = LEVEL_COLORS[lv];
            return (
              <div key={lv} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: done ? c.bg : S.bg, color: done ? c.text : S.muted }}
                >
                  {lv}
                </div>
                {i < LEVEL_ORDER.length - 1 && (
                  <ChevronRight size={12} style={{ color: S.muted }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div>
        <SectionTitle title="পদক সংগ্রহ" className="mb-3" />
        <p className="text-xs -mt-2 mb-3" style={{ color: S.muted }}>{earnedCount}/{data.allBadges.length} অর্জিত</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.allBadges.map(badge => (
            <div
              key={badge.key}
              onMouseEnter={() => !badge.earned && setHoveredKey(badge.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
            <Card
              padding="md"
              className={`relative flex flex-col items-center text-center ${badge.earned ? "border-[#10B981]" : ""} ${!badge.earned ? "opacity-70" : ""}`}
            >
              {badge.earned ? (
                <>
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: S.text }}>{badge.title}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{badge.desc}</p>
                  <Badge variant="success">+{badge.xp} XP</Badge>
                  {badge.earnedAt && (
                    <p className="text-xs mt-1" style={{ color: S.muted }}>
                      {new Date(badge.earnedAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                  {/* Earned checkmark */}
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#10B981" }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2 grayscale opacity-40">
                    <Lock size={28} style={{ color: S.muted }} />
                  </div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: S.muted }}>{badge.title}</p>
                  <p className="text-xs" style={{ color: S.muted }}>???</p>

                  {/* Hover hint */}
                  {hoveredKey === badge.key && (
                    <div
                      className="absolute inset-0 rounded-2xl flex items-center justify-center p-3 z-10"
                      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
                    >
                      <p className="text-xs text-white text-center font-medium">
                        {HINT[badge.key] ?? "শর্ত পূরণ করুন"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
