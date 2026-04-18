"use client";
import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, X, Send, Smile, BarChart2, Plus, Trash2 } from "lucide-react";
import type { PostData } from "./PostCard";

interface Props {
  userName:      string;
  onPostCreated: (post: PostData) => void;
}

const CATEGORIES = [
  { key: "",          emoji: "💬", label: "সাধারণ",  color: "#6B7280", bg: "#F3F4F6" },
  { key: "[💡টিপস]",  emoji: "💡", label: "টিপস",   color: "#D97706", bg: "#FEF3C7" },
  { key: "[❓প্রশ্ন]", emoji: "❓", label: "প্রশ্ন",  color: "#2563EB", bg: "#DBEAFE" },
  { key: "[🎉সাফল্য]", emoji: "🎉", label: "সাফল্য", color: "#0F6E56", bg: "#D1FAE5" },
  { key: "[📦পণ্য]",  emoji: "📦", label: "পণ্য",   color: "#7C3AED", bg: "#EDE9FE" },
];

const EMOJI_SHORTCUTS = ["👍", "🔥", "✅", "💰", "📦", "🚀", "😊", "❤️", "🎉", "💡"];
const DRAFT_KEY        = "community-post-draft";

const AVATAR_COLORS = [
  "#0F6E56","#1877F2","#8B5CF6","#EF4444","#F59E0B",
  "#10B981","#3B82F6","#EC4899","#06B6D4","#84CC16",
];

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
  const color    = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}>
      {initials || "?"}
    </div>
  );
}

export default function CreatePost({ userName, onPostCreated }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [content, setContent]     = useState("");
  const [category, setCategory]   = useState("");
  const [preview, setPreview]     = useState<string | null>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [submitting, setSub]      = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pollMode, setPollMode]   = useState(false);
  const [pollQ, setPollQ]         = useState("");
  const [pollOpts, setPollOpts]   = useState(["", ""]);
  const [hasDraft, setHasDraft]   = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const charLimit = 2000;
  const charWarn  = charCount > 1800;
  const charFull  = charCount >= charLimit;

  /* ── Draft auto-save ── */
  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) { const parsed = JSON.parse(d); setContent(parsed.content ?? ""); setCategory(parsed.category ?? ""); setHasDraft(true); }
    } catch {}
  }, []);

  useEffect(() => {
    if (!expanded) return;
    try {
      if (content || category) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, category }));
        setHasDraft(true);
      }
    } catch {}
  }, [content, category, expanded]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setHasDraft(false);
    setContent("");
    setCategory("");
  };

  /* ── File ── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setError("ছবির সাইজ সর্বোচ্চ 2MB হতে হবে"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setPollMode(false);
  };

  const removeImage = () => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  /* ── Emoji ── */
  const insertEmoji = (emoji: string) => {
    const ta = textRef.current;
    if (!ta) { setContent((p) => p + emoji); return; }
    const s = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    setContent(content.slice(0, s) + emoji + content.slice(end));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + emoji.length, s + emoji.length); }, 0);
    setShowEmoji(false);
  };

  /* ── Poll ── */
  const addPollOpt  = () => { if (pollOpts.length < 4) setPollOpts((p) => [...p, ""]); };
  const removePollOpt = (i: number) => { if (pollOpts.length > 2) setPollOpts((p) => p.filter((_, idx) => idx !== i)); };
  const setPollOpt  = (i: number, v: string) => setPollOpts((p) => p.map((o, idx) => idx === i ? v : o));

  const togglePoll = () => {
    setPollMode((v) => !v);
    setPreview(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    let finalContent = "";

    if (pollMode) {
      if (!pollQ.trim() || pollOpts.filter((o) => o.trim()).length < 2) {
        setError("পোলের প্রশ্ন ও কমপক্ষে ২টি বিকল্প দিন");
        return;
      }
      const validOpts = pollOpts.filter((o) => o.trim());
      const pollJson  = JSON.stringify({ q: pollQ.trim(), o: validOpts });
      const extra     = content.trim() ? "\n" + content.trim() : "";
      finalContent    = (category ? category + "\n" : "") + `[POLL]${pollJson}` + extra;
    } else {
      if (!content.trim()) return;
      finalContent = (category ? category + "\n" : "") + content.trim();
    }

    setSub(true);
    setError(null);

    const fd = new FormData();
    fd.append("content", finalContent);
    if (file) fd.append("image", file);

    const res  = await fetch("/api/community/posts", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data?.error ?? "পোস্ট করতে সমস্যা হয়েছে"); setSub(false); return; }

    onPostCreated(data as PostData);
    clearDraft();
    setExpanded(false);
    setPollMode(false);
    setPollQ("");
    setPollOpts(["", ""]);
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
        boxShadow:       expanded ? "0 0 0 3px rgba(15,110,86,0.08),0 2px 8px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#0F6E56,#10B981,#3B82F6)" }} />

      <div className="p-4">
        {/* Collapsed state */}
        {!expanded ? (
          <div className="flex items-center gap-3">
            <Avatar name={userName} size={40} />
            <div className="flex-1 flex items-center gap-2">
              <button
                onClick={() => { setExpanded(true); setTimeout(() => textRef.current?.focus(), 100); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-left border transition-colors"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text-muted)" }}
              >
                {hasDraft ? "📝 Draft সেভ আছে — চালিয়ে যান…" : `${userName}-এর মনে কী আছে?`}
              </button>
              {hasDraft && (
                <button onClick={clearDraft} className="p-2 rounded-xl text-xs border" style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }} title="Draft মুছুন">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => { setExpanded(true); setPollMode(true); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium border"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
              title="পোল তৈরি করুন"
            >
              <BarChart2 size={14} />
              <span className="hidden sm:inline">পোল</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* User + close */}
            <div className="flex items-center gap-3">
              <Avatar name={userName} size={40} />
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--c-text)" }}>{userName}</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                  {pollMode ? "পোল তৈরি করছেন" : "কমিউনিটিতে পোস্ট করছেন"}
                </p>
              </div>
              <button type="button" onClick={() => { setExpanded(false); setPollMode(false); setError(null); }} className="ml-auto p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Category selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>বিষয়:</span>
              {CATEGORIES.map((cat) => (
                <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
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

            {/* Poll mode UI */}
            {pollMode ? (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#6366F1", backgroundColor: "#EEF2FF" }}>
                <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "#C7D2FE" }}>
                  <span className="text-xs font-bold" style={{ color: "#4F46E5" }}>📊 পোল তৈরি করুন</span>
                  <button type="button" onClick={togglePoll} className="p-0.5" style={{ color: "#6366F1" }}><X size={14} /></button>
                </div>
                <div className="p-3 space-y-2.5">
                  <input
                    value={pollQ}
                    onChange={(e) => setPollQ(e.target.value)}
                    placeholder="প্রশ্ন লিখুন… (যেমন: সেরা কুরিয়ার কোনটি?)"
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#A5B4FC", backgroundColor: "white", color: "var(--c-text)" }}
                  />
                  <div className="space-y-1.5">
                    {pollOpts.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-bold w-5 text-center flex-shrink-0" style={{ color: "#6366F1" }}>{i + 1}</span>
                        <input
                          value={opt}
                          onChange={(e) => setPollOpt(i, e.target.value)}
                          placeholder={`বিকল্প ${i + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-xl border text-sm outline-none"
                          style={{ borderColor: "#C7D2FE", backgroundColor: "white", color: "var(--c-text)" }}
                        />
                        {pollOpts.length > 2 && (
                          <button type="button" onClick={() => removePollOpt(i)} className="p-0.5" style={{ color: "#EF4444" }}>
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOpts.length < 4 && (
                    <button type="button" onClick={addPollOpt}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border w-full justify-center transition-colors"
                      style={{ borderColor: "#A5B4FC", color: "#4F46E5", backgroundColor: "white" }}
                    >
                      <Plus size={12} /> আরো বিকল্প যোগ করুন (সর্বোচ্চ ৪টি)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  ref={textRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, charLimit))}
                  onKeyDown={(e) => { if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); } }}
                  placeholder={
                    activeCat.key === "[💡টিপস]"   ? "আপনার টিপস বা অভিজ্ঞতা শেয়ার করুন…" :
                    activeCat.key === "[❓প্রশ্ন]"  ? "আপনার প্রশ্ন লিখুন, কমিউনিটি সাহায্য করবে…" :
                    activeCat.key === "[🎉সাফল্য]"  ? "আপনার সাফল্যের গল্প শেয়ার করুন! 🎉" :
                    activeCat.key === "[📦পণ্য]"   ? "আপনার পণ্য বা ব্যবসা সম্পর্কে লিখুন…" :
                    "কী মনে আছে? শেয়ার করুন… (Ctrl+Enter = পোস্ট)"
                  }
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition-colors"
                  style={{ borderColor: charWarn ? "#F59E0B" : "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
                />
                <div className="absolute bottom-2 right-3">
                  <span className="text-[10px] font-medium" style={{ color: charFull ? "#DC2626" : charWarn ? "#D97706" : "var(--c-text-muted)" }}>
                    {charCount}/{charLimit}
                  </span>
                </div>
              </div>
            )}

            {/* Extra text field for poll */}
            {pollMode && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                placeholder="ঐচ্ছিক: পোলের সাথে কিছু লিখুন…"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
              />
            )}

            {/* Image preview */}
            {preview && (
              <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: 220 }}>
                <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 220 }} />
                <button type="button" onClick={removeImage}
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
            {showEmoji && !pollMode && (
              <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl border" style={{ backgroundColor: "var(--c-bg)", borderColor: "var(--c-border)" }}>
                {EMOJI_SHORTCUTS.map((em) => (
                  <button key={em} type="button" onClick={() => insertEmoji(em)} className="text-xl p-1 rounded-lg hover:scale-125 transition-transform">{em}</button>
                ))}
              </div>
            )}

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                {!pollMode && (
                  <>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} id="community-image-upload" />
                    <label htmlFor="community-image-upload"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer border transition-colors"
                      style={{ borderColor: "var(--c-border)", color: preview ? "#0F6E56" : "var(--c-text-sub)", backgroundColor: preview ? "#D1FAE5" : "transparent" }}
                    >
                      <ImageIcon size={14} /> ছবি
                    </label>

                    <button type="button" onClick={() => setShowEmoji((v) => !v)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                      style={{ borderColor: "var(--c-border)", color: showEmoji ? "#F59E0B" : "var(--c-text-sub)", backgroundColor: showEmoji ? "#FEF3C7" : "transparent" }}
                    >
                      <Smile size={14} /> ইমোজি
                    </button>
                  </>
                )}

                <button type="button" onClick={togglePoll}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors"
                  style={{ borderColor: pollMode ? "#6366F1" : "var(--c-border)", color: pollMode ? "#4F46E5" : "var(--c-text-sub)", backgroundColor: pollMode ? "#EEF2FF" : "transparent" }}
                >
                  <BarChart2 size={14} /> পোল
                </button>
              </div>

              <button
                type="submit"
                disabled={pollMode ? (!pollQ.trim() || pollOpts.filter((o) => o.trim()).length < 2 || submitting) : (!content.trim() || submitting)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#0F6E56 0%,#10B981 100%)", color: "#fff", boxShadow: "0 2px 8px rgba(15,110,86,0.25)" }}
              >
                {submitting ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Send size={14} />}
                পোস্ট করুন
              </button>
            </div>

            {/* Draft indicator */}
            {hasDraft && !pollMode && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>📝 Draft স্বয়ংক্রিয়ভাবে সেভ হচ্ছে</p>
                <button type="button" onClick={clearDraft} className="text-[10px] font-semibold" style={{ color: "#EF4444" }}>Draft মুছুন</button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
