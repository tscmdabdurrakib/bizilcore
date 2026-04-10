"use client";
import { useEffect, useState, useRef } from "react";
import { Users, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import PostCard, { type PostData } from "@/components/community/PostCard";
import CreatePost from "@/components/community/CreatePost";
import TrendingSidebar from "@/components/community/TrendingSidebar";

const TABS = [
  { key: "all",  label: "সব পোস্ট" },
  { key: "mine", label: "আমার পোস্ট" },
];

function PostSkeleton() {
  return (
    <div
      className="rounded-2xl border p-4 animate-pulse"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 rounded w-32" style={{ backgroundColor: "var(--c-bg)" }} />
          <div className="h-2.5 rounded w-20" style={{ backgroundColor: "var(--c-bg)" }} />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 rounded w-full"  style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-3 rounded w-4/5"   style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-3 rounded w-3/5"   style={{ backgroundColor: "var(--c-bg)" }} />
      </div>
      <div className="flex gap-3">
        <div className="h-8 rounded-xl w-16" style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-8 rounded-xl w-24" style={{ backgroundColor: "var(--c-bg)" }} />
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { data: session } = useSession();
  const [posts, setPosts]      = useState<PostData[]>([]);
  const [cursor, setCursor]    = useState<string | null>(null);
  const [loading, setLoading]  = useState(true);
  const [loadingMore, setMore] = useState(false);
  const [hasMore, setHasMore]  = useState(false);
  const [tab, setTab]          = useState("all");
  const cursorRef = useRef<string | null>(null);

  const doFetch = async (reset: boolean, currentTab: string) => {
    const cursorParam = !reset && cursorRef.current ? `&cursor=${cursorRef.current}` : "";
    const mineParam   = currentTab === "mine" ? "&mine=1" : "";
    const res  = await fetch(`/api/community/posts?${mineParam}${cursorParam}`);
    const data = await res.json();

    if (reset) {
      setPosts(data.posts ?? []);
    } else {
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    }

    cursorRef.current = data.nextCursor ?? null;
    setCursor(data.nextCursor ?? null);
    setHasMore(!!data.nextCursor);
  };

  useEffect(() => {
    cursorRef.current = null;
    setCursor(null);
    setLoading(true);
    doFetch(true, tab).finally(() => setLoading(false));
  }, [tab]);

  const loadMore = async () => {
    setMore(true);
    await doFetch(false, tab);
    setMore(false);
  };

  const refresh = () => {
    cursorRef.current = null;
    setCursor(null);
    setLoading(true);
    doFetch(true, tab).finally(() => setLoading(false));
  };

  const handlePostCreated = (post: PostData) => {
    setPosts((prev) => [post, ...prev]);
  };

  const userName = session?.user?.name ?? "আমি";
  const userId   = session?.user?.id ?? "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#E1F5EE" }}
          >
            <Users size={18} style={{ color: "#0F6E56" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--c-text)" }}>কমিউনিটি</h1>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              অভিজ্ঞতা, টিপস ও প্রশ্ন শেয়ার করুন
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
          style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          রিফ্রেশ
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
            style={{
              backgroundColor: tab === t.key ? "#0F6E56" : "var(--c-surface)",
              color:           tab === t.key ? "#fff"    : "var(--c-text-sub)",
              borderColor:     tab === t.key ? "#0F6E56" : "var(--c-border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Feed */}
        <div className="space-y-4">
          {/* Create post (all tab only) */}
          {tab === "all" && session && (
            <CreatePost userName={userName} onPostCreated={handlePostCreated} />
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
            >
              <div className="text-5xl mb-4">💬</div>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--c-text)" }}>
                {tab === "mine" ? "আপনি এখনো কোনো পোস্ট করেননি" : "কোনো পোস্ট নেই"}
              </p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                প্রথম পোস্টটি করুন এবং কমিউনিটিতে আলোচনা শুরু করুন!
              </p>
            </div>
          ) : (
            <>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} currentUserId={userId} />
              ))}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
                    style={{ borderColor: "#0F6E56", color: "#0F6E56", backgroundColor: "#E1F5EE" }}
                  >
                    {loadingMore ? "লোড হচ্ছে…" : "আরো দেখুন"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trending Sidebar — desktop only */}
        <div className="hidden lg:block">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}
