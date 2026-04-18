"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Heart, MessageCircle, Send, MoreHorizontal,
  Edit2, Trash2, Copy, Check, Bookmark, BookmarkCheck,
  X, ChevronDown, ChevronUp, Flag, Link2,
} from "lucide-react";

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

const CATEGORY_MAP: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  "[💡টিপস]":  { emoji: "💡", label: "টিপস",   color: "#D97706", bg: "#FEF3C7" },
  "[❓প্রশ্ন]": { emoji: "❓", label: "প্রশ্ন",  color: "#2563EB", bg: "#DBEAFE" },
  "[🎉সাফল্য]": { emoji: "🎉", label: "সাফল্য", color: "#0F6E56", bg: "#D1FAE5" },
  "[📦পণ্য]":  { emoji: "📦", label: "পণ্য",   color: "#7C3AED", bg: "#EDE9FE" },
};

function parseContent(raw: string) {
  const firstLine = raw.split("\n")[0] ?? "";
  const cat = CATEGORY_MAP[firstLine];
  if (cat) {
    return { category: { ...cat, key: firstLine }, body: raw.slice(firstLine.length).replace(/^\n+/, "") };
  }
  return { category: null, body: raw };
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)          return "এইমাত্র";
  if (diff < 3600)        return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 86400 * 30)  return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(iso).toLocaleDateString("bn-BD");
}

const AVATAR_COLORS = [
  "#0F6E56", "#1877F2", "#8B5CF6", "#EF4444", "#F59E0B",
  "#10B981", "#3B82F6", "#EC4899", "#06B6D4", "#84CC16",
];

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
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
  onDelete,
}: {
  post: PostData;
  currentUserId: string;
  onDelete?: (id: string) => void;
}) {
  const [post, setPost]               = useState<PostData>(initialPost);
  const [showComments, setShow]       = useState(false);
  const [comments, setComments]       = useState<Comment[]>([]);
  const [commentsLoaded, setLoaded]   = useState(false);
  const [commentText, setComment]     = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCat]    = useState<string | null>(null);
  const [savingEdit, setSavingEdit]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);
  const [copied, setCopied]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [likeAnim, setLikeAnim]       = useState(false);
  const [imgExpanded, setImgExpanded] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = post.user.id === currentUserId;
  const { category, body } = parseContent(post.content);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleLike = async () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
    const prev = { liked: post.liked, likeCount: post.likeCount };
    setPost((p) => ({ ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) }));
    try {
      const res  = await fetch("/api/community/like", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error();
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
    const res  = await fetch("/api/community/comments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, content: commentText.trim() }),
    });
    const data = await res.json();
    if (data?.id) {
      setComments((prev) => [...prev, data]);
      setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }));
      setComment("");
    }
    setSubmitting(false);
  };

  const startEdit = () => {
    const { category: cat, body: b } = parseContent(post.content);
    setEditCat(cat?.key ?? null);
    setEditContent(b);
    setEditing(true);
    setMenuOpen(false);
  };

  const saveEdit = async () => {
    const newContent = (editCategory ? editCategory + "\n" : "") + editContent.trim();
    if (!newContent.trim() || savingEdit) return;
    setSavingEdit(true);
    const res  = await fetch("/api/community/posts", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, content: newContent }),
    });
    if (res.ok) {
      const data = await res.json();
      setPost((p) => ({ ...p, content: data.content }));
    }
    setSavingEdit(false);
    setEditing(false);
  };

  const deletePost = async () => {
    setDeleting(true);
    const res = await fetch(`/api/community/posts?id=${post.id}`, { method: "DELETE" });
    if (res.ok) onDelete?.(post.id);
    else setDeleting(false);
    setConfirmDel(false);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/community`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMenuOpen(false);
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/community/profile/${post.user.id}`}>
          <div className="relative">
            <Avatar name={post.user.name} size={42} />
            <div
              className="absolute -inset-0.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #0F6E56, #10B981)", opacity: 0.2, zIndex: -1 }}
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/community/profile/${post.user.id}`}
              className="font-bold text-sm hover:underline"
              style={{ color: "var(--c-text)" }}
            >
              {post.user.name}
            </Link>
            {category && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: category.bg, color: category.color }}
              >
                {category.emoji} {category.label}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            {timeAgo(post.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSaved((v) => !v)}
            className="p-1.5 rounded-xl transition-colors"
            style={{ color: saved ? "#0F6E56" : "var(--c-text-muted)" }}
            title="সেভ করুন"
          >
            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-xl transition-colors hover:bg-opacity-10"
              style={{ color: "var(--c-text-muted)" }}
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-9 z-50 rounded-2xl border shadow-xl overflow-hidden min-w-[160px]"
                style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}
              >
                {isOwner && (
                  <>
                    <button
                      onClick={startEdit}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-opacity-50 transition-colors"
                      style={{ color: "var(--c-text)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Edit2 size={14} style={{ color: "#0F6E56" }} />
                      সম্পাদনা
                    </button>
                    <button
                      onClick={() => { setConfirmDel(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                      style={{ color: "#DC2626" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Trash2 size={14} />
                      মুছে ফেলুন
                    </button>
                    <div style={{ borderTop: "1px solid var(--c-border)" }} />
                  </>
                )}
                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: "var(--c-text)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {copied ? <Check size={14} style={{ color: "#0F6E56" }} /> : <Link2 size={14} />}
                  {copied ? "লিংক কপি হয়েছে!" : "লিংক কপি করুন"}
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: "var(--c-text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => setMenuOpen(false)}
                >
                  <Flag size={14} />
                  রিপোর্ট করুন
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDel && (
        <div
          className="mx-4 mb-3 rounded-xl border p-4 text-center"
          style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "#DC2626" }}>পোস্ট মুছে ফেলবেন?</p>
          <p className="text-xs mb-3" style={{ color: "#B91C1C" }}>এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setConfirmDel(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
            >
              বাতিল
            </button>
            <button
              onClick={deletePost}
              disabled={deleting}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#DC2626" }}
            >
              {deleting ? "মুছছে…" : "হ্যাঁ, মুছুন"}
            </button>
          </div>
        </div>
      )}

      {/* Content / Edit mode */}
      {editing ? (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[null, "[💡টিপস]", "[❓প্রশ্ন]", "[🎉সাফল্য]", "[📦পণ্য]"].map((k) => {
              const cat = k ? CATEGORY_MAP[k] : null;
              const active = editCategory === k;
              return (
                <button
                  key={k ?? "none"}
                  onClick={() => setEditCat(k)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: active ? (cat?.bg ?? "#F3F4F6") : "transparent",
                    color: active ? (cat?.color ?? "var(--c-text)") : "var(--c-text-muted)",
                    borderColor: active ? (cat?.color ?? "#9CA3AF") : "var(--c-border)",
                  }}
                >
                  {cat ? `${cat.emoji} ${cat.label}` : "💬 সাধারণ"}
                </button>
              );
            })}
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            maxLength={2000}
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none"
            style={{
              borderColor: "#0F6E56",
              backgroundColor: "var(--c-bg)",
              color: "var(--c-text)",
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{editContent.length}/2000</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
              >
                বাতিল
              </button>
              <button
                onClick={saveEdit}
                disabled={!editContent.trim() || savingEdit}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5"
                style={{ backgroundColor: "#0F6E56" }}
              >
                {savingEdit && <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--c-text)" }}
          >
            {body}
          </p>
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <div
          className="relative w-full overflow-hidden cursor-pointer"
          style={{ maxHeight: imgExpanded ? "none" : 380 }}
          onClick={() => setImgExpanded((v) => !v)}
        >
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full object-cover"
            style={{ maxHeight: imgExpanded ? "none" : 380 }}
            loading="lazy"
          />
          {!imgExpanded && (
            <div
              className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center pb-2"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.35))" }}
            >
              <button className="flex items-center gap-1 text-white text-xs font-medium">
                <ChevronDown size={14} /> বড় দেখুন
              </button>
            </div>
          )}
          {imgExpanded && (
            <div className="absolute top-2 right-2">
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}
              >
                <ChevronUp size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div
        className="flex items-center gap-0.5 px-3 py-2 border-t"
        style={{ borderColor: "var(--c-border)" }}
      >
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
          style={{
            color:           post.liked ? "#E24B4A" : "var(--c-text-muted)",
            backgroundColor: post.liked ? "#FEE2E2" : "transparent",
            transform:       likeAnim ? "scale(1.2)" : "scale(1)",
          }}
        >
          <Heart size={16} fill={post.liked ? "#E24B4A" : "none"} strokeWidth={post.liked ? 0 : 2} />
          <span className="text-xs font-semibold">{post.likeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            color:           showComments ? "#0F6E56" : "var(--c-text-muted)",
            backgroundColor: showComments ? "#D1FAE5" : "transparent",
          }}
        >
          <MessageCircle size={16} />
          <span className="text-xs font-semibold">{post.commentCount}</span>
          <span className="text-xs hidden sm:inline">মন্তব্য</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          style={{ color: copied ? "#0F6E56" : "var(--c-text-muted)" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="hidden sm:inline">{copied ? "কপি!" : "শেয়ার"}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t" style={{ borderColor: "var(--c-border)" }}>
          <form onSubmit={submitComment} className="flex items-center gap-2 px-4 py-3">
            <Avatar name="আমি" size={30} />
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}>
              <input
                value={commentText}
                onChange={(e) => setComment(e.target.value)}
                placeholder="মন্তব্য করুন…"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: "var(--c-text)" }}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="p-1 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                style={{ color: commentText.trim() ? "#0F6E56" : "var(--c-text-muted)" }}
              >
                <Send size={14} />
              </button>
            </div>
          </form>

          {comments.length === 0 && commentsLoaded ? (
            <p className="text-xs text-center pb-4" style={{ color: "var(--c-text-muted)" }}>
              প্রথম মন্তব্যকারী হোন! 👋
            </p>
          ) : (
            <div className="px-4 pb-3 space-y-2.5">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar name={c.user.name} size={28} />
                  <div className="flex-1">
                    <div
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ backgroundColor: "var(--c-bg)" }}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <Link
                          href={`/community/profile/${c.user.id}`}
                          className="font-bold text-xs hover:underline"
                          style={{ color: "var(--c-text)" }}
                        >
                          {c.user.name}
                        </Link>
                        <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                          {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-sub)" }}>
                        {c.content}
                      </p>
                    </div>
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
