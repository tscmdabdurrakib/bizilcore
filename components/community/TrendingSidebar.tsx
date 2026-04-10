"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Heart } from "lucide-react";

interface TrendingPost {
  id:        string;
  content:   string;
  likeCount: number;
  user:      { id: string; name: string };
}

export default function TrendingSidebar() {
  const [posts, setPosts]     = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community/posts?trending=1")
      .then((r) => r.json())
      .then((d) => { setPosts(d?.posts ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="rounded-2xl border overflow-hidden sticky top-4"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "var(--c-border)" }}
      >
        <TrendingUp size={15} style={{ color: "#0F6E56" }} />
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
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "var(--c-text-muted)" }}>
            এখনো কোনো পোস্ট নেই
          </p>
        ) : (
          posts.map((p, i) => (
            <div
              key={p.id}
              className="flex items-start gap-2.5 px-2 py-2.5 rounded-xl"
            >
              <span
                className="text-xs font-bold w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: i === 0 ? "#FFF3DC" : "var(--c-bg)",
                  color:           i === 0 ? "#EF9F27" : "var(--c-text-muted)",
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs leading-snug mb-1 line-clamp-2"
                  style={{ color: "var(--c-text)" }}
                >
                  {p.content}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/community/profile/${p.user.id}`}
                    className="text-[11px] font-medium hover:underline truncate"
                    style={{ color: "#0F6E56" }}
                  >
                    {p.user.name}
                  </Link>
                  <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "#E24B4A" }}>
                    <Heart size={10} fill="#E24B4A" />
                    {p.likeCount}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
