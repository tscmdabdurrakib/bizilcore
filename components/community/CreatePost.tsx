"use client";
import { useState, useRef } from "react";
import { Image as ImageIcon, X, Send, Smile, ChevronDown } from "lucide-react";
import type { PostData } from "./PostCard";

interface Props {
  userName:    string;
  onPostCreated: (post: PostData) => void;
}

const CATEGORIES: { key: string; emoji: string; label: string; color: string; bg: string }[] = [
  { key: "",          emoji: "💬", label: "সাধারণ",  color: "#6B7280", bg: "#F3F4F6" },
  { key: "[💡টিপস]",  emoji: "💡", label: "টিপস",   color: "#D97706", bg: "#FEF3C7" },
  { key: "[❓প্রশ্ন]", emoji: "❓", label: "প্রশ্ন",  color: "#2563EB", bg: "#DBEAFE" },
  { key: "[🎉সাফল্য]", emoji: "🎉", label: "সাফল্য", color: "#0F6E56", bg: "#D1FAE5" },
  { key: "[📦পণ্য]",  emoji: "📦", label: "পণ্য",   color: "#7C3AED", bg: "#EDE9FE" },
];

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

const EMOJI_SHORTCUTS = ["👍", "🔥", "✅", "💰", "📦", "🚀", "😊", "❤️"];

export default function CreatePost({ userName, onPostCreated }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [content, setContent]     = useState("");
  const [category, setCategory]   = useState("");
  const [preview, setPreview]     = useState<string | null>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [submitting, setSub]      = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const charCount  = content.length;
  const charLimit  = 2000;
  const charWarn   = charCount > 1800;
  const charFull   = charCount >= charLimit;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("ছবির সাইজ সর্বোচ্চ 2MB হতে হবে"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const insertEmoji = (emoji: string) => {
    const ta = textRef.current;
    if (!ta) { setContent((p) => p + emoji); return; }
    const start = ta.selectionStart ?? content.length;
    const end   = ta.selectionEnd   ?? content.length;
    const next  = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + emoji.length, start + emoji.length); }, 0);
    setShowEmoji(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSub(true);
    setError(null);

    const fd = new FormData();
    const fullContent = category ? `${category}\n${content.trim()}` : content.trim();
    fd.append("content", fullContent);
    if (file) fd.append("image", file);

    const res  = await fetch("/api/community/posts", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ?? "পোস্ট করতে সমস্যা হয়েছে");
      setSub(false);
      return;
    }

    onPostCreated(data as PostData);
    setContent("");
    setCategory("");
    setExpanded(false);
    removeImage();
    setSub(false);
  };

  const activeCat = CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[0];

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-shadow"
      style={{
        borderColor:     expanded ? "#0F6E56" : "var(--c-border)",
        backgroundColor: "var(--c-surface)",
        boxShadow:       expanded ? "0 0 0 3px rgba(15,110,86,0.08), 0 2px 8px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top gradient bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0F6E56, #10B981, #3B82F6)" }} />

      <div className="p-4">
        {/* Collapsed state — clickable placeholder */}
        {!expanded ? (
          <div className="flex items-center gap-3">
            <Avatar name={userName} size={40} />
            <button
              onClick={() => { setExpanded(true); setTimeout(() => textRef.current?.focus(), 100); }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-left border transition-colors"
              style={{
                borderColor:     "var(--c-border)",
                backgroundColor: "var(--c-bg)",
                color:           "var(--c-text-muted)",
              }}
            >
              {userName}-এর মনে কী আছে? শেয়ার করুন…
            </button>
            <button
              onClick={() => { setExpanded(true); setTimeout(() => fileRef.current?.click(), 100); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
            >
              <ImageIcon size={14} />
              <span className="hidden sm:inline">ছবি</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* User row */}
            <div className="flex items-center gap-3">
              <Avatar name={userName} size={40} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--c-text)" }}>{userName}</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>কমিউনিটিতে পোস্ট করছেন</p>
              </div>
              <button
                type="button"
                onClick={() => { setExpanded(false); setContent(""); setCategory(""); removeImage(); setError(null); }}
                className="ml-auto p-1.5 rounded-xl transition-colors"
                style={{ color: "var(--c-text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Category selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>বিষয়:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: category === cat.key ? cat.bg : "transparent",
                    color:           category === cat.key ? cat.color : "var(--c-text-muted)",
                    borderColor:     category === cat.key ? cat.color : "var(--c-border)",
                    fontWeight:      category === cat.key ? 700 : 500,
                  }}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                ref={textRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                onKeyDown={(e) => { if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
                placeholder={
                  activeCat.key === "[💡টিপস]"  ? "আপনার টিপস বা অভিজ্ঞতা শেয়ার করুন…" :
                  activeCat.key === "[❓প্রশ্ন]" ? "আপনার প্রশ্ন লিখুন, কমিউনিটি সাহায্য করবে…" :
                  activeCat.key === "[🎉সাফল্য]" ? "আপনার সাফল্যের গল্প শেয়ার করুন! 🎉" :
                  activeCat.key === "[📦পণ্য]"  ? "আপনার পণ্য বা ব্যবসা সম্পর্কে লিখুন…" :
                  "কী মনে আছে? শেয়ার করুন… (Ctrl+Enter দিয়ে পোস্ট করুন)"
                }
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition-colors"
                style={{
                  borderColor:     charWarn ? "#F59E0B" : "var(--c-border)",
                  backgroundColor: "var(--c-bg)",
                  color:           "var(--c-text)",
                }}
              />
              <div className="absolute bottom-2 right-3 flex items-center gap-2">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: charFull ? "#DC2626" : charWarn ? "#D97706" : "var(--c-text-muted)" }}
                >
                  {charCount}/{charLimit}
                </span>
              </div>
            </div>

            {/* Image preview */}
            {preview && (
              <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 240 }}>
                <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 240 }} />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow"
                  style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "#fff" }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#FEF2F2" }}>
                <span className="text-xs font-medium" style={{ color: "#DC2626" }}>{error}</span>
              </div>
            )}

            {/* Emoji picker */}
            {showEmoji && (
              <div
                className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl border"
                style={{ backgroundColor: "var(--c-bg)", borderColor: "var(--c-border)" }}
              >
                {EMOJI_SHORTCUTS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => insertEmoji(em)}
                    className="text-xl p-1 rounded-lg hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFile}
                  id="community-image-upload"
                />
                <label
                  htmlFor="community-image-upload"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors border"
                  style={{
                    borderColor:     "var(--c-border)",
                    color:           preview ? "#0F6E56" : "var(--c-text-sub)",
                    backgroundColor: preview ? "#D1FAE5" : "transparent",
                  }}
                  title="ছবি যোগ করুন"
                >
                  <ImageIcon size={14} />
                  <span>ছবি</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                  style={{
                    borderColor:     "var(--c-border)",
                    color:           showEmoji ? "#F59E0B" : "var(--c-text-sub)",
                    backgroundColor: showEmoji ? "#FEF3C7" : "transparent",
                  }}
                >
                  <Smile size={14} />
                  <span>ইমোজি</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #0F6E56 0%, #10B981 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(15,110,86,0.25)",
                }}
              >
                {submitting ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send size={14} />
                )}
                পোস্ট করুন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
