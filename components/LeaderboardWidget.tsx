"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

interface LeaderboardEntry { rank: number; isMe: boolean; revenue: number; orders: number; label: string; }
interface LeaderData {
  category: string;
  myRank: number;
  totalSellers: number;
  myRevenue: number;
  top5: LeaderboardEntry[];
}

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#CD7C41"];

export default function LeaderboardWidget() {
  const [data, setData] = useState<LeaderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
      <div className="h-4 w-36 rounded bg-gray-100 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-8 rounded-xl bg-gray-100" />)}
      </div>
    </div>
  );

  if (!data || data.totalSellers < 2) return null;

  const rankLabel = data.myRank <= 3 ? ["🥇", "🥈", "🥉"][data.myRank - 1] : `#${data.myRank}`;

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: "#F59E0B" }} />
          <span className="font-semibold text-sm" style={{ color: S.text }}>সাপ্তাহিক Leaderboard</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: S.bg, color: S.muted }}>{data.category}</span>
      </div>

      {/* My rank highlight */}
      <div className="rounded-xl p-3 mb-4 flex items-center justify-between" style={{ backgroundColor: "#F0FBF6", border: "1px solid #A7F3D0" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: "#0F6E56" }} />
          <span className="text-sm font-medium" style={{ color: "#0F6E56" }}>
            এই সপ্তাহে আপনার rank: <strong>{rankLabel}</strong>
          </span>
        </div>
        <span className="text-xs" style={{ color: "#065F46" }}>
          {data.totalSellers}জনের মধ্যে
        </span>
      </div>

      {/* Top sellers list */}
      <div className="space-y-2">
        {data.top5.map((entry) => (
          <div key={entry.rank} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{
            backgroundColor: entry.isMe ? "#F0FBF6" : S.bg,
            border: entry.isMe ? "1px solid #A7F3D0" : "1px solid transparent",
          }}>
            <div className="w-6 text-center text-sm font-bold flex-shrink-0"
              style={{ color: entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : S.muted }}>
              {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: entry.isMe ? "#0F6E56" : S.text }}>
                {entry.label}
              </p>
              <p className="text-xs" style={{ color: S.muted }}>{entry.orders}টি অর্ডার</p>
            </div>
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: entry.isMe ? "#0F6E56" : S.text }}>
              {formatBDT(entry.revenue)}
            </span>
          </div>
        ))}
      </div>

      {data.myRank > 5 && (
        <p className="text-xs text-center mt-3" style={{ color: S.muted }}>
          আপনি top 5-এ নেই। আরো বিক্রি করুন এবং rank বাড়ান!
        </p>
      )}
    </div>
  );
}
