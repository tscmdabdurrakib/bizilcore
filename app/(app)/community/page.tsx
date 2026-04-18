"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users, RefreshCw, Search, X, MessageCircle,
  Flame, BookOpen, HelpCircle, Trophy, TrendingUp, Clock, Hash,
  Lightbulb,
} from "lucide-react";
import { useSession } from "next-auth/react";
import PostCard, { type PostData } from "@/components/community/PostCard";
import TipCard, { type TipData } from "@/components/community/TipCard";
import CreatePost from "@/components/community/CreatePost";
import TrendingSidebar from "@/components/community/TrendingSidebar";

const TABS = [
  { key: "all",      label: "সব পোস্ট",      icon: MessageCircle },
  { key: "mine",     label: "আমার",            icon: BookOpen      },
  { key: "tips",     label: "টিপস",            icon: Trophy        },
  { key: "question", label: "প্রশ্ন",          icon: HelpCircle    },
  { key: "success",  label: "সাফল্য",          icon: Flame         },
  { key: "teamtips", label: "BizilCore টিপস",  icon: Lightbulb     },
];

const TIPS_CATEGORIES = ["সব", "বিক্রয়", "ডেলিভারি", "কাস্টমার", "অ্যাকাউন্টিং", "মার্কেটিং", "সাধারণ"];

const CATEGORY_FILTERS: Record<string, string> = {
  tips:     "[💡টিপস]",
  question: "[❓প্রশ্ন]",
  success:  "[🎉সাফল্য]",
};

function PostSkeleton() {
  return (
    <div className="rounded-2xl border p-4 animate-pulse" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full" style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded-full w-28" style={{ backgroundColor: "var(--c-bg)" }} />
          <div className="h-2.5 rounded-full w-20" style={{ backgroundColor: "var(--c-bg)" }} />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 rounded-full w-full" style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-3 rounded-full w-4/5"  style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-3 rounded-full w-3/5"  style={{ backgroundColor: "var(--c-bg)" }} />
      </div>
      <div className="flex gap-3">
        <div className="h-8 rounded-xl w-16" style={{ backgroundColor: "var(--c-bg)" }} />
        <div className="h-8 rounded-xl w-24" style={{ backgroundColor: "var(--c-bg)" }} />
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { data: session }  = useSession();
  const searchParams       = useSearchParams();

  const VALID_TABS = ["all", "mine", "tips", "question", "success", "teamtips"];
  const initialTab = VALID_TABS.includes(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "all";

  /* ── Community posts state ── */
  const [posts, setPosts]         = useState<PostData[]>([]);
  const [cursor, setCursor]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setMore]    = useState(false);
  const [hasMore, setHasMore]     = useState(false);

  /* ── BizilCore tips state ── */
  const [tips, setTips]           = useState<TipData[]>([]);
  const [tipsLoading, setTipLoad] = useState(false);
  const [tipsCat, setTipsCat]     = useState("সব");

  /* ── UI state ── */
  const [tab, setTab]             = useState(initialTab);
  const [sort, setSort]           = useState<"new" | "popular">("new");
  const [search, setSearch]       = useState("");
  const [showSearch, setShowSrch] = useState(false);
  const [activeHashtag, setHashtag] = useState<string | null>(null);

  const cursorRef  = useRef<string | null>(null);
  const searchRef  = useRef<HTMLInputElement>(null);
  const isTeamTab  = tab === "teamtips";

  /* ── Load tips ── */
  const loadTips = useCallback((cat: string) => {
    setTipLoad(true);
    const url = cat === "সব"
      ? "/api/community-tips?limit=50"
      : `/api/community-tips?limit=50&category=${encodeURIComponent(cat)}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setTips(Array.isArray(d) ? d : []))
      .finally(() => setTipLoad(false));
  }, []);

  /* ── Load community posts ── */
  const doFetch = useCallback(async (reset: boolean, currentTab: string, currentSort: "new" | "popular") => {
    const cursorParam = !reset && cursorRef.current ? `&cursor=${cursorRef.current}` : "";
    const mineParam   = currentTab === "mine" ? "&mine=1" : "";
    const sortParam   = currentSort === "popular" ? "&sort=popular" : "";
    const res  = await fetch(`/api/community/posts?${mineParam}${sortParam}${cursorParam}`);
    const data = await res.json();
    if (reset) setPosts(data.posts ?? []);
    else setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    cursorRef.current = data.nextCursor ?? null;
    setCursor(data.nextCursor ?? null);
    setHasMore(!!data.nextCursor && currentSort !== "popular");
  }, []);

  useEffect(() => {
    if (isTeamTab) { loadTips("সব"); setTipsCat("সব"); return; }
    cursorRef.current = null;
    setCursor(null);
    setLoading(true);
    doFetch(true, tab, sort).finally(() => setLoading(false));
    const timer = setInterval(() => { doFetch(true, tab, sort); }, 30_000);
    return () => clearInterval(timer);
  }, [tab, sort, doFetch, isTeamTab, loadTips]);

  const loadMore = async () => {
    setMore(true);
    await doFetch(false, tab, sort);
    setMore(false);
  };

  const refresh = () => {
    if (isTeamTab) { loadTips(tipsCat); return; }
    cursorRef.current = null;
    setCursor(null);
    setLoading(true);
    doFetch(true, tab, sort).finally(() => setLoading(false));
  };

  const handlePostCreated = (post: PostData) => setPosts((prev) => [post, ...prev]);
  const handleDelete      = (id: string)     => setPosts((prev) => prev.filter((p) => p.id !== id));

  const handleHashtag = (tag: string) => {
    setActiveHashtag((prev) => (prev === tag ? null : tag));
    setSearch("");
    setShowSrch(false);
  };

  const clearFilters = () => { setSearch(""); setActiveHashtag(null); setShowSrch(false); };

  const handleTabChange = (t: string) => {
    setTab(t);
    setActiveHashtag(null);
    setSearch("");
    setShowSrch(false);
  };

  const handleTipsCat = (cat: string) => {
    setTipsCat(cat);
    loadTips(cat);
  };

  const userName = session?.user?.name ?? "আমি";
  const userId   = session?.user?.id ?? "";

  const catFilter    = CATEGORY_FILTERS[tab];
  const hasActiveFilter = !!search.trim() || !!activeHashtag;

  const visiblePosts = posts.filter((p) => {
    const matchesCat   = catFilter ? p.content.startsWith(catFilter) : true;
    const matchSearch  = !search.trim() || p.content.toLowerCase().includes(search.toLowerCase()) || p.user.name.toLowerCase().includes(search.toLowerCase());
    const matchHashtag = !activeHashtag || p.content.includes(activeHashtag);
    return matchesCat && matchSearch && matchHashtag;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5 overflow-hidden relative" style={{ background: "linear-gradient(135deg,#0F6E56 0%,#10B981 60%,#3B82F6 100%)" }}>
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Users size={18} color="white" />
              </div>
              <h1 className="text-xl font-black text-white">কমিউনিটি</h1>
            </div>
            <p className="text-sm text-white" style={{ opacity: 0.85 }}>অভিজ্ঞতা, টিপস ও প্রশ্ন শেয়ার করুন</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => { setShowSrch((v) => !v); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            >
              <Search size={14} />
              <span className="hidden sm:inline">খুঁজুন</span>
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
            >
              <RefreshCw size={14} className={(loading || tipsLoading) ? "animate-spin" : ""} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
          </div>
        </div>
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* Search bar */}
      {showSearch && !isTeamTab && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveHashtag(null); }}
              placeholder="পোস্ট বা সদস্যের নাম খুঁজুন…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: search ? "#0F6E56" : "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => { setShowSrch(false); setSearch(""); }} className="px-3 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)", backgroundColor: "var(--c-surface)" }}>
            বাতিল
          </button>
        </div>
      )}

      {/* Active hashtag banner */}
      {activeHashtag && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#D1FAE5", border: "1px solid #6EE7B7" }}>
          <Hash size={14} style={{ color: "#0F6E56" }} />
          <span className="text-sm font-bold" style={{ color: "#0F6E56" }}>{activeHashtag}</span>
          <span className="text-xs ml-1" style={{ color: "#047857" }}>দিয়ে ফিল্টার করা হচ্ছে</span>
          <button onClick={() => setActiveHashtag(null)} className="ml-auto" style={{ color: "#0F6E56" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs + Sort in one row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((t) => {
            const Icon   = t.icon;
            const active = tab === t.key;
            const isTeam = t.key === "teamtips";
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background:  active && isTeam ? "linear-gradient(135deg, #4F46E5, #0F6E56)" :
                               active            ? "#0F6E56" : "var(--c-surface)",
                  color:       active ? "#fff" : isTeam ? "#4F46E5" : "var(--c-text-sub)",
                  borderColor: active && isTeam ? "#4F46E5" :
                               active           ? "#0F6E56" :
                               isTeam           ? "#C7D2FE" : "var(--c-border)",
                  boxShadow:   active && isTeam ? "0 2px 8px rgba(79,70,229,0.25)" :
                               active           ? "0 2px 8px rgba(15,110,86,0.2)" : "none",
                }}
              >
                <Icon size={13} />
                {t.label}
                {isTeam && !active && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 13, height: 13, borderRadius: "50%", backgroundColor: "#4F46E5",
                  }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1L6.2 3.7L9 4.1L7 6L7.5 9L5 7.6L2.5 9L3 6L1 4.1L3.8 3.7L5 1Z" fill="white"/>
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort toggle — hidden for team tips */}
        {!isTeamTab && (
          <div className="flex items-center gap-1 p-1 rounded-xl border flex-shrink-0" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
            <button onClick={() => setSort("new")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: sort === "new" ? "#0F6E56" : "transparent", color: sort === "new" ? "white" : "var(--c-text-sub)" }}
            >
              <Clock size={12} /> নতুন
            </button>
            <button onClick={() => setSort("popular")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: sort === "popular" ? "#0F6E56" : "transparent", color: sort === "popular" ? "white" : "var(--c-text-sub)" }}
            >
              <TrendingUp size={12} /> জনপ্রিয়
            </button>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-[1fr_290px] gap-5">
        <div className="space-y-4 min-w-0">

          {/* ── BizilCore টিপস tab ── */}
          {isTeamTab ? (
            <>
              {/* BizilCore header */}
              <div
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #D1FAE5 100%)", border: "1px solid #C7D2FE" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #0F6E56)", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}
                >
                  <span style={{ color: "white", fontSize: 16, fontWeight: 900 }}>BC</span>
                </div>
                <div>
                  <p className="font-black text-sm" style={{ color: "#4F46E5" }}>BizilCore অফিশিয়াল টিপস</p>
                  <p className="text-xs" style={{ color: "#6366F1" }}>আমাদের team-এর সেরা পরামর্শ ও গাইডলাইন</p>
                </div>
              </div>

              {/* Category filter for tips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                {TIPS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleTipsCat(cat)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      backgroundColor: tipsCat === cat ? "#4F46E5" : "var(--c-surface)",
                      color:           tipsCat === cat ? "white"   : "var(--c-text-sub)",
                      borderColor:     tipsCat === cat ? "#4F46E5" : "var(--c-border)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Tips list */}
              {tipsLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>
              ) : tips.length === 0 ? (
                <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "#C7D2FE", backgroundColor: "var(--c-surface)" }}>
                  <div className="text-4xl mb-3">💡</div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--c-text)" }}>
                    {tipsCat === "সব" ? "এখনো কোনো টিপস নেই" : `"${tipsCat}" ক্যাটাগরিতে কোনো টিপস নেই`}
                  </p>
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>শীঘ্রই নতুন টিপস যোগ হবে</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tips.map((tip) => <TipCard key={tip.id} tip={tip} />)}
                </div>
              )}
            </>
          ) : (
            /* ── Regular community posts ── */
            <>
              {(tab === "all" || tab === "mine") && session && !hasActiveFilter && (
                <CreatePost userName={userName} onPostCreated={handlePostCreated} />
              )}

              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <PostSkeleton key={i} />)}</div>
              ) : visiblePosts.length === 0 ? (
                <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                  <div className="text-4xl mb-3">
                    {activeHashtag ? "🔍" :
                     tab === "mine"     ? "📝" :
                     tab === "tips"     ? "💡" :
                     tab === "question" ? "❓" :
                     tab === "success"  ? "🎉" : "💬"}
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--c-text)" }}>
                    {activeHashtag
                      ? `${activeHashtag} — কোনো পোস্ট পাওয়া যায়নি`
                      : search
                        ? `"${search}" — কোনো ফলাফল নেই`
                        : tab === "mine"
                          ? "আপনি এখনো কোনো পোস্ট করেননি"
                          : tab === "tips"
                            ? "এখনো কোনো টিপস শেয়ার হয়নি"
                            : tab === "question"
                              ? "এখনো কোনো প্রশ্ন নেই"
                              : tab === "success"
                                ? "এখনো কোনো সাফল্যের গল্প নেই"
                                : "কোনো পোস্ট নেই"}
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--c-text-muted)" }}>
                    {hasActiveFilter ? "অন্য কীওয়ার্ড দিয়ে খুঁজুন" : "প্রথম পোস্টটি করুন এবং কমিউনিটিতে আলোচনা শুরু করুন!"}
                  </p>
                  {hasActiveFilter && (
                    <button onClick={clearFilters} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#0F6E56" }}>
                      ফিল্টার সরান
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {(search || activeHashtag) && (
                    <div className="flex items-center gap-2 px-1">
                      <p className="text-xs flex-1" style={{ color: "var(--c-text-muted)" }}>
                        {activeHashtag ? activeHashtag : `"${search}"`} — {visiblePosts.length}টি ফলাফল
                      </p>
                      <button onClick={clearFilters} className="text-xs font-semibold" style={{ color: "#0F6E56" }}>সরান ×</button>
                    </div>
                  )}
                  {visiblePosts.map((p) => (
                    <PostCard key={p.id} post={p} currentUserId={userId} onDelete={handleDelete} onHashtag={handleHashtag} />
                  ))}
                  {hasMore && !catFilter && !hasActiveFilter && (
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
            </>
          )}
        </div>

        <div className="hidden lg:block">
          <TrendingSidebar />
        </div>
      </div>
    </div>
  );
}
