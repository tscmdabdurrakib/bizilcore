"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Users, RefreshCw, Search, X, MessageCircle, Flame, BookOpen, HelpCircle, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";
import PostCard, { type PostData } from "@/components/community/PostCard";
import CreatePost from "@/components/community/CreatePost";
import TrendingSidebar from "@/components/community/TrendingSidebar";

const TABS = [
  { key: "all",      label: "সব পোস্ট",  icon: MessageCircle },
  { key: "mine",     label: "আমার",       icon: BookOpen      },
  { key: "tips",     label: "টিপস",       icon: Trophy        },
  { key: "question", label: "প্রশ্ন",     icon: HelpCircle    },
  { key: "success",  label: "সাফল্য",     icon: Flame         },
];

const CATEGORY_FILTERS: Record<string, string> = {
  tips:     "[💡টিপস]",
  question: "[❓প্রশ্ন]",
  success:  "[🎉সাফল্য]",
};

function PostSkeleton() {
  return (
    <div
      className="rounded-2xl border p-4 animate-pulse"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full" style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded-full w-28" style={{ backgroundColor: "var(--c-bg)" }} />
          <div className="h-2.5 rounded-full w-20" style={{ backgroundColor: "var(--c-bg)" }} />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 rounded-full w-full"  style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-3 rounded-full w-4/5"   style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-3 rounded-full w-3/5"   style={{ backgroundColor: "var(--c-bg)" }} />
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
  const [posts, setPosts]        = useState<PostData[]>([]);
  const [cursor, setCursor]      = useState<string | null>(null);
  const [loading, setLoading]    = useState(true);
  const [loadingMore, setMore]   = useState(false);
  const [hasMore, setHasMore]    = useState(false);
  const [tab, setTab]            = useState("all");
  const [search, setSearch]      = useState("");
  const [showSearch, setShowSrch]= useState(false);
  const cursorRef  = useRef<string | null>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  const doFetch = useCallback(async (reset: boolean, currentTab: string) => {
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
  }, []);

  useEffect(() => {
    cursorRef.current = null;
    setCursor(null);
    setLoading(true);
    doFetch(true, tab).finally(() => setLoading(false));
    const timer = setInterval(() => { doFetch(true, tab); }, 30_000);
    return () => clearInterval(timer);
  }, [tab, doFetch]);

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

  const handlePostCreated = (post: PostData) => setPosts((prev) => [post, ...prev]);
  const handleDelete = (id: string) => setPosts((prev) => prev.filter((p) => p.id !== id));

  const userName = session?.user?.name ?? "আমি";
  const userId   = session?.user?.id ?? "";

  const catFilter = CATEGORY_FILTERS[tab];
  const visiblePosts = posts.filter((p) => {
    const matchesCat  = catFilter ? p.content.startsWith(catFilter) : true;
    const matchSearch = !search.trim() || p.content.toLowerCase().includes(search.toLowerCase()) || p.user.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-2xl p-5 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #0F6E56 0%, #10B981 60%, #3B82F6 100%)" }}
      >
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Users size={18} color="white" />
              </div>
              <h1 className="text-xl font-black text-white">কমিউনিটি</h1>
            </div>
            <p className="text-sm text-white" style={{ opacity: 0.85 }}>
              অভিজ্ঞতা, টিপস ও প্রশ্ন শেয়ার করুন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowSrch((v) => !v); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            >
              <Search size={14} />
              <span className="hidden sm:inline">খুঁজুন</span>
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পোস্ট বা সদস্য খুঁজুন…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                borderColor: search ? "#0F6E56" : "var(--c-border)",
                backgroundColor: "var(--c-surface)",
                color: "var(--c-text)",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => { setShowSrch(false); setSearch(""); }}
            className="px-3 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)", backgroundColor: "var(--c-surface)" }}
          >
            বাতিল
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => {
          const Icon   = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: active ? "#0F6E56" : "var(--c-surface)",
                color:           active ? "#fff"    : "var(--c-text-sub)",
                borderColor:     active ? "#0F6E56" : "var(--c-border)",
                boxShadow:       active ? "0 2px 8px rgba(15,110,86,0.2)" : "none",
              }}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-[1fr_290px] gap-5">
        {/* Feed */}
        <div className="space-y-4 min-w-0">
          {(tab === "all" || tab === "mine") && session && (
            <CreatePost userName={userName} onPostCreated={handlePostCreated} />
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
            >
              <div className="text-4xl mb-3">
                {tab === "mine"     ? "📝" :
                 tab === "tips"     ? "💡" :
                 tab === "question" ? "❓" :
                 tab === "success"  ? "🎉" : "💬"}
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--c-text)" }}>
                {search
                  ? `"${search}" — কোনো ফলাফল পাওয়া যায়নি`
                  : tab === "mine"
                    ? "আপনি এখনো কোনো পোস্ট করেননি"
                    : tab === "tips"
                      ? "এখনো কোনো টিপস শেয়ার হয়নি"
                      : tab === "question"
                        ? "এখনো কোনো প্রশ্ন নেই"
                        : tab === "success"
                          ? "এখনো কোনো সাফল্যের গল্প নেই"
                          : "কোনো পোস্ট নেই"
                }
              </p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                {search ? "অন্য কীওয়ার্ড দিয়ে খুঁজুন" : "প্রথম পোস্টটি করুন এবং কমিউনিটিতে আলোচনা শুরু করুন!"}
              </p>
            </div>
          ) : (
            <>
              {search && (
                <p className="text-xs px-1" style={{ color: "var(--c-text-muted)" }}>
                  "{search}" — {visiblePosts.length}টি ফলাফল
                </p>
              )}
              {visiblePosts.map((p) => (
                <PostCard key={p.id} post={p} currentUserId={userId} onDelete={handleDelete} />
              ))}
              {hasMore && !catFilter && !search && (
                <div className="text-center pt-2">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
                    style={{ borderColor: "#0F6E56", color: "#0F6E56", backgroundColor: "#D1FAE5" }}
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        লোড হচ্ছে…
                      </span>
                    ) : "আরো দেখুন ↓"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:block">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}
