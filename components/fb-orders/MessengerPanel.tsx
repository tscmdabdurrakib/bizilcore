"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  ToggleLeft, ToggleRight, Settings, RefreshCw, ExternalLink, Search,
  Send, MessageSquare, Sparkles, ShoppingCart, ChevronDown, Phone,
} from "lucide-react";
import Link from "next/link";
import { extractContactInfo } from "@/lib/extract-contact";

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

interface Thread {
  senderId: string;
  senderName: string;
  conversations: Conversation[];
  latestAt: number;
  unreplied: number;
}

const FILTER_TABS = [
  { key: "all",       label: "সব" },
  { key: "pending",   label: "অপেক্ষায়" },
  { key: "replied",   label: "রিপ্লাই হয়েছে" },
];

interface CannedReply { id: string; title: string; body: string; }

function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)} দিন আগে`;
}

export default function MessengerPanel() {
  const params = useSearchParams();
  const senderHint = params.get("sender");

  const [pages, setPages]                 = useState<FbPage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPage, setSelectedPage]   = useState<FbPage | null>(null);
  const [activeThread, setActiveThread]   = useState<string | null>(null);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState("all");
  const [editReply, setEditReply]         = useState<string>("");
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [loading, setLoading]             = useState(true);
  const [convLoading, setConvLoading]     = useState(false);
  const [replyText, setReplyText]         = useState("");
  const [sending, setSending]               = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [cannedReplies, setCannedReplies]   = useState<CannedReply[]>([]);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facebook/messenger?type=pages");
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedPage((prev) => prev ?? data[0]);
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
    fetch("/api/messenger/canned-replies").then(r => r.json()).then(setCannedReplies).catch(() => {});
  }, []);
  useEffect(() => {
    if (selectedPage) loadConversations(selectedPage.pageId);
  }, [selectedPage, loadConversations]);

  // Group into threads
  const threads = useMemo<Thread[]>(() => {
    const map = new Map<string, Thread>();
    for (const c of conversations) {
      const t = map.get(c.senderId) ?? {
        senderId: c.senderId,
        senderName: c.senderName ?? c.senderId,
        conversations: [],
        latestAt: 0,
        unreplied: 0,
      };
      t.conversations.push(c);
      const ts = new Date(c.createdAt).getTime();
      if (ts > t.latestAt) t.latestAt = ts;
      if (!c.reply) t.unreplied++;
      map.set(c.senderId, t);
    }
    return Array.from(map.values()).sort((a, b) => b.latestAt - a.latestAt);
  }, [conversations]);

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "pending" && t.unreplied === 0) return false;
      if (filter === "replied" && t.unreplied > 0)   return false;
      if (q) {
        const hay = `${t.senderName} ${t.conversations.map((c) => c.message).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [threads, search, filter]);

  // Auto-select thread from URL hint
  useEffect(() => {
    if (senderHint && threads.find((t) => t.senderId === senderHint)) {
      setActiveThread(senderHint);
    } else if (!activeThread && filteredThreads.length > 0) {
      setActiveThread(filteredThreads[0].senderId);
    }
  }, [senderHint, threads, activeThread, filteredThreads]);

  const activeThreadData = threads.find((t) => t.senderId === activeThread) ?? null;
  const lastConv = activeThreadData?.conversations[0];

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

  const sendManualReply = async (conv: Conversation, text: string) => {
    setSending(true);
    try {
      const res = await fetch("/api/facebook/messenger/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.id, message: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("পাঠাতে সমস্যা: " + (err.error ?? "Unknown"));
        return;
      }
      const updated = await res.json();
      setConversations((prev) => prev.map((c) => c.id === updated.id ? { ...c, reply: updated.reply, repliedAt: updated.repliedAt } : c));
      setReplyText("");
    } finally {
      setSending(false);
    }
  };

  const stats = useMemo(() => ({
    total:    conversations.length,
    replied:  conversations.filter((c) => c.reply).length,
    pending:  conversations.filter((c) => !c.reply).length,
  }), [conversations]);

  if (loading) {
    return (
      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (<div key={i} className="h-14 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }} />))}
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="text-4xl mb-3">📭</div>
        <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>কোনো Facebook পেজ কানেক্ট নেই</p>
        <p className="text-xs mt-1 mb-4" style={{ color: "var(--c-text-muted)" }}>Facebook পেজ কানেক্ট করে Messenger auto-reply চালু করুন</p>
        <Link href="/fb-connect" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#1877F2", color: "#fff" }}>
          পেজ কানেক্ট করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট বার্তা",      value: stats.total,   gradient: "linear-gradient(135deg, #1877F2 0%, #0B5FD9 100%)" },
          { label: "রিপ্লাই হয়েছে",  value: stats.replied, gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)" },
          { label: "অপেক্ষায়",       value: stats.pending, gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 text-white relative overflow-hidden shadow-sm" style={{ background: s.gradient }}>
            <p className="text-xs mb-1 opacity-90">{s.label}</p>
            <span className="text-2xl font-bold">{s.value}</span>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10 bg-white" />
          </div>
        ))}
      </div>

      {/* Page selector + auto-reply toggle */}
      <div className="rounded-2xl border p-3 flex items-center gap-2 flex-wrap" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        {pages.length > 1 && (
          <select
            value={selectedPage?.id ?? ""}
            onChange={(e) => { const p = pages.find((x) => x.id === e.target.value); if (p) setSelectedPage(p); }}
            className="px-3 py-2 rounded-xl border text-sm font-semibold outline-none"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
          >
            {pages.map((p) => <option key={p.id} value={p.id}>{p.pageName}</option>)}
          </select>
        )}
        {pages.length === 1 && selectedPage && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#EEF3FD" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "#1877F2" }}>
              {selectedPage.pageName[0]?.toUpperCase()}
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{selectedPage.pageName}</span>
          </div>
        )}

        {selectedPage && (
          <button
            onClick={() => toggleAutoReply(selectedPage)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold"
            style={{
              borderColor: selectedPage.autoReply ? "#0F6E56" : "var(--c-border)",
              backgroundColor: selectedPage.autoReply ? "#E1F5EE" : "var(--c-bg)",
              color: selectedPage.autoReply ? "#0F6E56" : "var(--c-text-sub)",
            }}
          >
            {selectedPage.autoReply ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            অটো-রিপ্লাই {selectedPage.autoReply ? "চালু" : "বন্ধ"}
          </button>
        )}

        <div className="flex-1" />
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold"
          style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
        >
          <Settings size={13} /> সেটিংস
          <ChevronDown size={12} className="transition-transform" style={{ transform: showSettings ? "rotate(180deg)" : "rotate(0)" }} />
        </button>
        <button
          onClick={() => selectedPage && loadConversations(selectedPage.pageId)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
        >
          <RefreshCw size={13} className={convLoading ? "animate-spin" : ""} /> রিফ্রেশ
        </button>
      </div>

      {/* Settings expandable */}
      {showSettings && selectedPage && (
        <div className="rounded-2xl border p-4 space-y-4" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-muted)" }}>Webhook সেটআপ</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Callback URL",  value: `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/facebook` },
                { label: "Verify Token",  value: process.env.NEXT_PUBLIC_FB_VERIFY_TOKEN ?? "bizilcore_verify_2024" },
                { label: "Subscriptions", value: "messages, messaging_postbacks" },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-2">
                  <span className="w-28 flex-shrink-0 font-medium" style={{ color: "var(--c-text-sub)" }}>{row.label}</span>
                  <code className="flex-1 px-2 py-1 rounded break-all" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>{row.value}</code>
                </div>
              ))}
            </div>
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium" style={{ color: "#1877F2" }}>
              <ExternalLink size={12} /> Facebook Developer Console খুলুন
            </a>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--c-text-muted)" }}>অটো-রিপ্লাই বার্তা</h3>
              {editingId !== selectedPage.id ? (
                <button onClick={() => { setEditingId(selectedPage.id); setEditReply(selectedPage.replyMessage ?? ""); }} className="text-xs font-medium px-3 py-1 rounded-lg border" style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>
                  সম্পাদনা
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 rounded-lg border" style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>বাতিল</button>
                  <button onClick={() => saveReplyMessage(selectedPage)} disabled={saving} className="text-xs px-3 py-1 rounded-lg font-medium text-white" style={{ backgroundColor: "#0F6E56" }}>
                    {saving ? "সংরক্ষণ…" : "সংরক্ষণ"}
                  </button>
                </div>
              )}
            </div>
            {editingId === selectedPage.id ? (
              <textarea value={editReply} onChange={(e) => setEditReply(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none focus:ring-2"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
                placeholder="কাস্টম রিপ্লাই বার্তা লিখুন (খালি রাখলে AI/rule-based reply হবে)" />
            ) : (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
                {selectedPage.replyMessage || <span style={{ color: "var(--c-text-muted)" }}>কোনো কাস্টম বার্তা নেই — AI/Rule-based reply চলছে</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Inbox layout */}
      <div className="grid md:grid-cols-[320px_1fr] gap-4 min-h-[500px]">
        {/* Thread list */}
        <div className="rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          <div className="p-3 border-b space-y-2" style={{ borderColor: "var(--c-border)" }}>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="কথোপকথন খুঁজুন…"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-blue-100"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
              />
            </div>
            <div className="flex items-center gap-1">
              {FILTER_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className="flex-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    backgroundColor: filter === t.key ? "#0F6E56" : "transparent",
                    color: filter === t.key ? "#fff" : "var(--c-text-muted)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs" style={{ color: "var(--c-text-muted)" }}>
                কোনো কথোপকথন নেই
              </div>
            ) : (
              filteredThreads.map((t) => {
                const last = t.conversations[0];
                const active = activeThread === t.senderId;
                return (
                  <button
                    key={t.senderId}
                    onClick={() => setActiveThread(t.senderId)}
                    className="w-full text-left px-3 py-3 border-b transition-colors hover:bg-blue-50/30"
                    style={{
                      borderColor: "var(--c-border)",
                      backgroundColor: active ? "#EEF3FD" : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: "#1877F2" }}>
                        {t.senderName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-xs truncate" style={{ color: "var(--c-text)" }}>{t.senderName}</p>
                          <span className="text-[10px] flex-shrink-0" style={{ color: "var(--c-text-muted)" }}>{relativeTime(last.createdAt)}</span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: t.unreplied > 0 ? "var(--c-text)" : "var(--c-text-muted)", fontWeight: t.unreplied > 0 ? 500 : 400 }}>
                          {last.message}
                        </p>
                        {t.unreplied > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FFF3DC", color: "#EF9F27" }}>
                            {t.unreplied} অপেক্ষায়
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active thread */}
        <div className="rounded-2xl border flex flex-col overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
          {!activeThreadData ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <MessageSquare size={36} style={{ color: "var(--c-text-muted)" }} />
              <p className="text-sm mt-3 font-medium" style={{ color: "var(--c-text-muted)" }}>একটি কথোপকথন নির্বাচন করুন</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--c-border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "#1877F2" }}>
                  {activeThreadData.senderName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: "var(--c-text)" }}>{activeThreadData.senderName}</p>
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                    {activeThreadData.conversations.length} টি বার্তা · {activeThreadData.unreplied} অপেক্ষায়
                  </p>
                </div>
                {lastConv && (() => {
                  const phones = activeThreadData.conversations.flatMap((c) => extractContactInfo(c.message).phones);
                  const phone = phones[0];
                  return phone ? (
                    <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                      <Phone size={11} /> {phone}
                    </a>
                  ) : null;
                })()}
                <Link
                  href={`/orders/new?customerName=${encodeURIComponent(activeThreadData.senderName)}`}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border"
                  style={{ borderColor: "#8B5CF6", color: "#8B5CF6" }}
                  title="অর্ডার তৈরি"
                >
                  <ShoppingCart size={12} /> অর্ডার
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: "var(--c-bg)" }}>
                {[...activeThreadData.conversations].reverse().map((conv) => (
                  <div key={conv.id} className="space-y-1.5">
                    {/* Customer message */}
                    <div className="flex items-end gap-2">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#1877F2" }}>
                        {activeThreadData.senderName[0]?.toUpperCase()}
                      </div>
                      <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm shadow-sm" style={{ backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}>
                        {conv.message}
                        <p className="text-[10px] mt-1 opacity-50">{relativeTime(conv.createdAt)}</p>
                      </div>
                    </div>
                    {/* Reply */}
                    {conv.reply && (
                      <div className="flex items-end gap-2 justify-end">
                        <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-br-sm text-sm shadow-sm text-white" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
                          {conv.reply}
                          <p className="text-[10px] mt-1 opacity-80 flex items-center gap-1">
                            {conv.repliedAt ? relativeTime(conv.repliedAt) : ""} {!conv.repliedAt || conv.reply ? <Sparkles size={9} /> : null}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick replies + composer */}
              {lastConv && (
                <div className="border-t p-3 space-y-2" style={{ borderColor: "var(--c-border)" }}>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {cannedReplies.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => { setReplyText(q.body); replyInputRef.current?.focus(); }}
                        className="flex-shrink-0 px-2.5 py-1 rounded-full border text-[11px] whitespace-nowrap transition-colors hover:bg-blue-50"
                        style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
                        title={q.body}
                      >
                        {q.title}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={replyInputRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && lastConv) {
                          e.preventDefault();
                          sendManualReply(lastConv, replyText);
                        }
                      }}
                      rows={2}
                      placeholder="রিপ্লাই লিখুন… (Ctrl+Enter পাঠাতে)"
                      className="flex-1 px-3 py-2 rounded-xl border text-sm resize-none outline-none focus:ring-2 focus:ring-blue-100"
                      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
                    />
                    <button
                      onClick={() => lastConv && sendManualReply(lastConv, replyText)}
                      disabled={sending || !replyText.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg, #1877F2 0%, #0B5FD9 100%)" }}
                    >
                      <Send size={14} />
                      {sending ? "…" : "পাঠান"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
