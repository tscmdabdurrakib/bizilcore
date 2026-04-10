"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Send } from "lucide-react";

export interface PostData {
  id:           string;
  content:      string;
  imageUrl?:    string | null;
  createdAt:    string;
  user:         { id: string; name: string };
  likeCount:    number;
  commentCount: number;
  liked:        boolean;
}

interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  user:      { id: string; name: string };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return "এইমাত্র";
  if (diff < 3600)  return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(iso).toLocaleDateString("bn-BD");
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
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

export default function PostCard({
  post: initialPost,
  currentUserId,
}: {
  post: PostData;
  currentUserId: string;
}) {
  const [post, setPost]             = useState<PostData>(initialPost);
  const [showComments, setShow]     = useState(false);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [commentsLoaded, setLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleLike = async () => {
    const prev = { liked: post.liked, likeCount: post.likeCount };
    setPost((p) => ({ ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) }));

    try {
      const res  = await fetch("/api/community/like", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error("like failed");
      const data = await res.json();
      setPost((p) => ({ ...p, liked: data.liked, likeCount: data.count }));
    } catch {
      setPost((p) => ({ ...p, ...prev }));
    }
  };

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return;
    const res  = await fetch(`/api/community/comments?postId=${post.id}`);
    const data = await res.json();
    setComments(Array.isArray(data) ? data : []);
    setLoaded(true);
  }, [post.id, commentsLoaded]);

  const handleToggleComments = () => {
    if (!showComments) loadComments();
    setShow((v) => !v);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/community/comments", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ postId: post.id, content: commentText.trim() }),
    });
    const data = await res.json();
    if (data?.id) {
      setComments((prev) => [...prev, data]);
      setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }));
      setCommentText("");
    }
    setSubmitting(false);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/community/profile/${post.user.id}`}>
          <Avatar name={post.user.name} size={40} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/community/profile/${post.user.id}`}
            className="font-semibold text-sm hover:underline"
            style={{ color: "var(--c-text)" }}
          >
            {post.user.name}
          </Link>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--c-text)" }}>
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="relative w-full overflow-hidden" style={{ maxHeight: 420 }}>
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full object-cover"
            style={{ maxHeight: 420 }}
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t" style={{ borderColor: "var(--c-border)" }}>
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
          style={{
            color:           post.liked ? "#E24B4A" : "var(--c-text-muted)",
            backgroundColor: post.liked ? "#FFE8E8" : "transparent",
          }}
        >
          <Heart size={16} fill={post.liked ? "#E24B4A" : "none"} />
          <span>{post.likeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            color:           showComments ? "#0F6E56" : "var(--c-text-muted)",
            backgroundColor: showComments ? "#E1F5EE" : "transparent",
          }}
        >
          <MessageCircle size={16} />
          <span>{post.commentCount} মন্তব্য</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t" style={{ borderColor: "var(--c-border)" }}>
          {/* Add comment */}
          <form onSubmit={submitComment} className="flex items-center gap-2 px-4 py-3">
            <Avatar name="আমি" size={28} />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="মন্তব্য করুন…"
              className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none"
              style={{
                borderColor:     "var(--c-border)",
                backgroundColor: "var(--c-bg)",
                color:           "var(--c-text)",
              }}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="p-2 rounded-xl transition-colors disabled:opacity-40"
              style={{ backgroundColor: "#0F6E56", color: "#fff" }}
            >
              <Send size={14} />
            </button>
          </form>

          {/* Comment list */}
          {comments.length === 0 && commentsLoaded ? (
            <p className="text-xs text-center pb-4" style={{ color: "var(--c-text-muted)" }}>
              প্রথম মন্তব্যকারী হোন!
            </p>
          ) : (
            <div className="px-4 pb-3 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar name={c.user.name} size={28} />
                  <div
                    className="flex-1 px-3 py-2 rounded-xl text-sm"
                    style={{ backgroundColor: "var(--c-bg)" }}
                  >
                    <Link
                      href={`/community/profile/${c.user.id}`}
                      className="font-semibold text-xs mr-2 hover:underline"
                      style={{ color: "var(--c-text)" }}
                    >
                      {c.user.name}
                    </Link>
                    <span className="text-xs leading-relaxed" style={{ color: "var(--c-text-sub)" }}>
                      {c.content}
                    </span>
                    <p className="text-[10px] mt-1" style={{ color: "var(--c-text-muted)" }}>
                      {timeAgo(c.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
