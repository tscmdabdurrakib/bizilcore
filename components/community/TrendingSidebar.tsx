"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Users, Flame, MessageCircle } from "lucide-react";
import { Card, Badge, StatCard } from "@/components/ui";

interface TrendingPost {
  id:           string;
  content:      string;
  likeCount:    number;
  commentCount: number;
  user:         { id: string; name: string };
}

const CATEGORY_MAP: Record<string, { emoji: string; label: string; variant: "warning" | "info" | "success" | "purple" }> = {
  "[💡টিপস]":  { emoji: "💡", label: "টিপস",   variant: "warning" },
  "[❓প্রশ্ন]": { emoji: "❓", label: "প্রশ্ন",  variant: "info" },
  "[🎉সাফল্য]": { emoji: "🎉", label: "সাফল্য", variant: "success" },
  "[📦পণ্য]":  { emoji: "📦", label: "পণ্য",   variant: "purple" },
};

function getCategory(content: string) {
  const firstLine = content.split("\n")[0] ?? "";
  return CATEGORY_MAP[firstLine] ?? null;
}

function getBody(content: string) {
  const firstLine = content.split("\n")[0] ?? "";
  if (CATEGORY_MAP[firstLine]) return content.slice(firstLine.length).replace(/^\n+/, "");
  return content;
}

const RANK_STYLES = [
  { bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)", color: "#D97706" },
  { bg: "linear-gradient(135deg,#F1F5F9,#E2E8F0)", color: "#64748B" },
  { bg: "linear-gradient(135deg,#FEE2E2,#FECACA)", color: "#DC2626" },
];

export default function TrendingSidebar() {
  const [posts, setPosts]     = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community/posts?trending=1")
      .then((r) => r.json())
      .then((d) => setPosts(d?.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 sticky top-4">
      {/* Community Stats card */}
      <Card padding="none" className="overflow-hidden">
        <div
          className="px-4 py-4"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #10B981 100%)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} color="rgba(255,255,255,0.9)" />
            <span className="text-sm font-bold text-white">BizilCore কমিউনিটি</span>
          </div>
          <p className="text-xs text-white" style={{ opacity: 0.8 }}>
            Bangladeshi sellers-দের জন্য, sellers-দের দ্বারা
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3">
          <StatCard label="সক্রিয় সদস্য" value="১০০০+" accent="green" className="!p-3" />
          <StatCard label="পোস্ট ও টিপস" value="৫০০+" accent="green" className="!p-3" />
        </div>
      </Card>

      {/* Trending posts */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FFF3DC,#FDE68A)" }}
          >
            <Flame size={13} color="#D97706" />
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
            ট্রেন্ডিং পোস্ট
          </span>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 rounded w-4/5" style={{ backgroundColor: "var(--c-bg)" }} />
                  <div className="h-3 rounded w-3/5" style={{ backgroundColor: "var(--c-bg)" }} />
                  <div className="h-2.5 rounded w-2/5" style={{ backgroundColor: "var(--c-bg)" }} />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-1">💬</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>এখনো কোনো পোস্ট নেই</p>
            </div>
          ) : (
            posts.map((p, i) => {
              const cat  = getCategory(p.content);
              const body = getBody(p.content);
              const rank = RANK_STYLES[i] ?? { bg: "var(--c-bg)", color: "var(--c-text-muted)" };
              return (
                <div
                  key={p.id}
                  className="flex items-start gap-2.5 px-2 py-2.5 rounded-xl transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black mt-0.5"
                    style={{ background: rank.bg, color: rank.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {cat && (
                      <Badge variant={cat.variant} className="mb-1 text-[9px]">
                        {cat.emoji} {cat.label}
                      </Badge>
                    )}
                    <p className="text-xs leading-snug mb-1 line-clamp-2" style={{ color: "var(--c-text)" }}>
                      {body}
                    </p>
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/community/profile/${p.user.id}`}
                        className="text-[10px] font-semibold hover:underline truncate max-w-[90px]"
                        style={{ color: "#0F6E56" }}
                      >
                        {p.user.name}
                      </Link>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#E24B4A" }}>
                        <Heart size={9} fill="#E24B4A" />
                        {p.likeCount}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                        <MessageCircle size={9} />
                        {p.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Tips card */}
      <Card>
        <p className="text-xs font-bold mb-2" style={{ color: "var(--c-text)" }}>📌 কমিউনিটি নিয়মাবলী</p>
        <ul className="space-y-1.5">
          {[
            "সবার সাথে সম্মানজনক আচরণ করুন",
            "স্প্যাম বা বিজ্ঞাপন পোস্ট করবেন না",
            "টিপস ও অভিজ্ঞতা শেয়ার করুন",
            "প্রশ্ন করতে দ্বিধা করবেন না",
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-1.5 text-[11px]" style={{ color: "var(--c-text-sub)" }}>
              <span style={{ color: "#0F6E56", marginTop: 1 }}>✓</span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
