"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import PostCard, { type PostData } from "@/components/community/PostCard";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProfileData {
  id:        string;
  name:      string;
  createdAt: string;
  postCount: number;
}

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "#0F6E56", "#1877F2", "#8B5CF6", "#EF4444", "#F59E0B",
    "#10B981", "#3B82F6", "#EC4899", "#06B6D4", "#84CC16",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}
    >
      {initials || "?"}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data: session } = useSession();

  const [profile, setProfile]     = useState<ProfileData | null>(null);
  const [posts, setPosts]         = useState<PostData[]>([]);
  const [cursor, setCursor]       = useState<string | null>(null);
  const [hasMore, setHasMore]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setMore]    = useState(false);
  const [notFound, setNotFound]   = useState(false);

  const fetchData = useCallback(async (reset = true) => {
    if (reset) setLoading(true);
    else setMore(true);

    const cursorParam = !reset && cursor ? `&cursor=${cursor}` : "";
    const res  = await fetch(`/api/community/profile/${userId}?${cursorParam}`);
    const data = await res.json();

    if (!res.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (reset) {
      setProfile(data.user);
      setPosts(data.posts ?? []);
    } else {
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    }

    setCursor(data.nextCursor ?? null);
    setHasMore(!!data.nextCursor);

    if (reset) setLoading(false);
    else setMore(false);
  }, [userId, cursor]);

  useEffect(() => {
    fetchData(true);
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-28 rounded-xl" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="text-4xl mb-3">😕</div>
        <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>ব্যবহারকারী পাওয়া যায়নি</p>
        <Link href="/community" className="inline-block mt-4 text-sm font-medium" style={{ color: "#0F6E56" }}>
          ← কমিউনিটিতে ফিরুন
        </Link>
      </div>
    );
  }

  const isOwnProfile = session?.user?.id === userId;
  const joinYear = new Date(profile.createdAt).getFullYear();

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--c-text-sub)" }}
      >
        <ArrowLeft size={14} />
        কমিউনিটিতে ফিরুন
      </Link>

      {/* Profile card */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
      >
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size={56} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ color: "var(--c-text)" }}>
              {profile.name}
              {isOwnProfile && (
                <span
                  className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full align-middle"
                  style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
                >
                  আপনি
                </span>
              )}
            </h1>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              সদস্য {joinYear} সাল থেকে
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: "var(--c-border)" }}>
          <div>
            <span className="text-xl font-bold" style={{ color: "#0F6E56" }}>{profile.postCount}</span>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>পোস্ট</p>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
        পোস্টসমূহ ({profile.postCount})
      </h2>

      {posts.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
        >
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
            {isOwnProfile ? "আপনি এখনো কোনো পোস্ট করেননি।" : "এই ব্যবহারকারী এখনো পোস্ট করেননি।"}
          </p>
          {isOwnProfile && (
            <Link href="/community" className="inline-block mt-3 text-sm font-medium" style={{ color: "#0F6E56" }}>
              প্রথম পোস্ট করুন →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={session?.user?.id ?? ""} />
          ))}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => fetchData(false)}
                disabled={loadingMore}
                className="px-6 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
                style={{ borderColor: "#0F6E56", color: "#0F6E56", backgroundColor: "#E1F5EE" }}
              >
                {loadingMore ? "লোড হচ্ছে…" : "আরো দেখুন"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
