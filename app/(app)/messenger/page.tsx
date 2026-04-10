"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageCircle, ToggleLeft, ToggleRight, Settings, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

interface FbPage {
  id: string;
  pageId: string;
  pageName: string;
  category?: string | null;
  autoReply: boolean;
  replyMessage?: string | null;
  connectedAt: string;
}

interface Conversation {
  id: string;
  senderId: string;
  senderName?: string | null;
  message: string;
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)} দিন আগে`;
}

export default function MessengerPage() {
  const [pages, setPages]                 = useState<FbPage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPage, setSelectedPage]   = useState<FbPage | null>(null);
  const [editReply, setEditReply]         = useState<string>("");
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [loading, setLoading]             = useState(true);
  const [convLoading, setConvLoading]     = useState(false);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facebook/messenger?type=pages");
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedPage) {
        setSelectedPage(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async (pageId?: string) => {
    setConvLoading(true);
    try {
      const url = pageId
        ? `/api/facebook/messenger?type=conversations&pageId=${pageId}`
        : "/api/facebook/messenger?type=conversations";
      const res = await fetch(url);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => { loadPages(); }, [loadPages]);

  useEffect(() => {
    if (selectedPage) loadConversations(selectedPage.pageId);
  }, [selectedPage, loadConversations]);

  const toggleAutoReply = async (page: FbPage) => {
    const updated = { ...page, autoReply: !page.autoReply };
    setPages((prev) => prev.map((p) => (p.id === page.id ? updated : p)));
    if (selectedPage?.id === page.id) setSelectedPage(updated);

    await fetch("/api/facebook/messenger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id, autoReply: !page.autoReply }),
    });
  };

  const saveReplyMessage = async (page: FbPage) => {
    setSaving(true);
    const res = await fetch("/api/facebook/messenger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id, replyMessage: editReply }),
    });
    const updated = await res.json();
    if (updated?.id) {
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, replyMessage: updated.replyMessage } : p)));
      if (selectedPage?.id === page.id) setSelectedPage((prev) => prev ? { ...prev, replyMessage: updated.replyMessage } : prev);
    }
    setEditingId(null);
    setSaving(false);
  };

  const stats = {
    total:    conversations.length,
    replied:  conversations.filter((c) => c.reply).length,
    pending:  conversations.filter((c) => !c.reply).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EEF3FD" }}>
            <MessageCircle size={18} style={{ color: "#1877F2" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--c-text)" }}>Messenger Auto-Reply</h1>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              Facebook Messenger-এ আসা বার্তায় স্বয়ংক্রিয় উত্তর দিন
            </p>
          </div>
        </div>
        <Link
          href="/fb-connect"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
          style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
        >
          পেজ কানেক্ট করুন
        </Link>
      </div>

      {/* Pages list */}
      {loading ? (
        <div className="rounded-2xl border p-6" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }} />
            ))}
          </div>
        </div>
      ) : pages.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
        >
          <div className="text-4xl mb-3">📭</div>
          <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>কোনো Facebook পেজ কানেক্ট নেই</p>
          <p className="text-xs mt-1 mb-4" style={{ color: "var(--c-text-muted)" }}>
            Facebook পেজ কানেক্ট করে Messenger auto-reply চালু করুন
          </p>
          <Link
            href="/fb-connect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "#1877F2", color: "#fff" }}
          >
            পেজ কানেক্ট করুন
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          {/* Left: Page list */}
          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className="rounded-2xl border p-4 cursor-pointer transition-all"
                style={{
                  borderColor: selectedPage?.id === page.id ? "#1877F2" : "var(--c-border)",
                  backgroundColor: selectedPage?.id === page.id ? "#EEF3FD" : "var(--c-surface)",
                }}
                onClick={() => setSelectedPage(page)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: "#1877F2" }}
                  >
                    {page.pageName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--c-text)" }}>{page.pageName}</p>
                    <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{page.category ?? "Facebook Page"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Auto-Reply</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAutoReply(page); }}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: page.autoReply ? "#0F6E56" : "#9CA3AF" }}
                  >
                    {page.autoReply ? (
                      <><ToggleRight size={20} style={{ color: "#0F6E56" }} /> চালু</>
                    ) : (
                      <><ToggleLeft size={20} /> বন্ধ</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Details */}
          {selectedPage && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "মোট বার্তা", value: stats.total,   color: "#1877F2", bg: "#EEF3FD" },
                  { label: "রিপ্লাই হয়েছে", value: stats.replied, color: "#0F6E56", bg: "#E1F5EE" },
                  { label: "অপেক্ষায়",    value: stats.pending, color: "#EF9F27", bg: "#FFF3DC" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
                  >
                    <p className="text-xs mb-1" style={{ color: "var(--c-text-muted)" }}>{s.label}</p>
                    <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Webhook info */}
              <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--c-text)" }}>
                  Webhook সেটআপ
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Callback URL", value: `${typeof window !== "undefined" ? window.location.origin : ""}/api/facebook/webhook` },
                    { label: "Verify Token", value: process.env.NEXT_PUBLIC_FB_VERIFY_TOKEN ?? "bizilcore_verify_2024" },
                    { label: "Subscriptions",value: "messages, messaging_postbacks" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-2">
                      <span className="w-28 flex-shrink-0 font-medium" style={{ color: "var(--c-text-sub)" }}>{row.label}</span>
                      <code className="flex-1 px-2 py-1 rounded break-all" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                        {row.value}
                      </code>
                    </div>
                  ))}
                </div>
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium"
                  style={{ color: "#1877F2" }}
                >
                  <ExternalLink size={12} />
                  Facebook Developer Console খুলুন
                </a>
              </div>

              {/* Auto-reply message editor */}
              <div className="rounded-2xl border p-4" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                    <Settings size={14} className="inline mr-1.5" />
                    Auto-Reply বার্তা
                  </h3>
                  {editingId !== selectedPage.id ? (
                    <button
                      onClick={() => { setEditingId(selectedPage.id); setEditReply(selectedPage.replyMessage ?? ""); }}
                      className="text-xs font-medium px-3 py-1 rounded-lg border transition-colors"
                      style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
                    >
                      সম্পাদনা
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1 rounded-lg border"
                        style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={() => saveReplyMessage(selectedPage)}
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded-lg font-medium text-white"
                        style={{ backgroundColor: "#0F6E56" }}
                      >
                        {saving ? "সংরক্ষণ…" : "সংরক্ষণ করুন"}
                      </button>
                    </div>
                  )}
                </div>
                {editingId === selectedPage.id ? (
                  <textarea
                    value={editReply}
                    onChange={(e) => setEditReply(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--c-border)",
                      backgroundColor: "var(--c-bg)",
                      color: "var(--c-text)",
                    }}
                    placeholder="কাস্টম রিপ্লাই বার্তা লিখুন (খালি রাখলে AI/rule-based reply হবে)"
                  />
                ) : (
                  <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                    {selectedPage.replyMessage || <span style={{ color: "var(--c-text-muted)" }}>কোনো কাস্টম বার্তা নেই — AI/Rule-based reply চলছে</span>}
                  </p>
                )}
              </div>

              {/* Conversation list */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--c-border)" }}>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                    সর্বশেষ বার্তা ({conversations.length})
                  </h3>
                  <button onClick={() => loadConversations(selectedPage.pageId)} style={{ color: "var(--c-text-muted)" }}>
                    <RefreshCw size={14} className={convLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {convLoading ? (
                  <div className="p-6 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>লোড হচ্ছে…</div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
                      এখনো কোনো বার্তা আসেনি। Webhook সক্রিয় আছে কিনা যাচাই করুন।
                    </p>
                  </div>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: "var(--c-border)" }}>
                    {conversations.map((conv) => (
                      <div key={conv.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: "#1877F2" }}
                          >
                            {(conv.senderName ?? conv.senderId)[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>
                                {conv.senderName ?? conv.senderId}
                              </span>
                              <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                                {relativeTime(conv.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-sub)" }}>{conv.message}</p>
                            {conv.reply && (
                              <div
                                className="mt-2 px-3 py-2 rounded-lg text-xs leading-relaxed"
                                style={{ backgroundColor: "#E1F5EE", color: "#085041" }}
                              >
                                🤖 {conv.reply}
                              </div>
                            )}
                          </div>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: conv.reply ? "#E1F5EE" : "#FFF3DC",
                              color: conv.reply ? "#0F6E56" : "#EF9F27",
                            }}
                          >
                            {conv.reply ? "রিপ্লাই" : "অপেক্ষায়"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
