"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Loader2, Send, Facebook, Instagram, MessageCircle, ShoppingCart, Inbox as InboxIcon } from "lucide-react";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import PageShell from "@/components/ui/PageShell";

interface ThreadMessage {
  id: string;
  message: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}
interface Thread {
  key: string;
  channel: string;
  senderId: string;
  senderName: string | null;
  lastMessage: string;
  lastAt: string;
  unreplied: boolean;
  messages: ThreadMessage[];
}
interface Counts { all: number; messenger: number; instagram: number; whatsapp: number; unreplied: number; }

const QUICK_REPLIES = [
  "আসসালামু আলাইকুম! কীভাবে সাহায্য করতে পারি?",
  "পণ্যটি স্টকে আছে। অর্ডার করতে নাম, ফোন ও ঠিকানা দিন।",
  "আপনার অর্ডারটি প্রক্রিয়াধীন আছে। শীঘ্রই আপডেট পাবেন।",
  "ডেলিভারি চার্জ ঢাকায় ৳৬০, ঢাকার বাইরে ৳১২০।",
  "ধন্যবাদ! আবার আসবেন। 🛍️",
];

const CHANNEL_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  messenger: { label: "Messenger", Icon: Facebook, color: "#1877F2" },
  instagram: { label: "Instagram", Icon: Instagram, color: "#E1306C" },
  whatsapp:  { label: "WhatsApp", Icon: MessageCircle, color: "#25D366" },
};

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Thread | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/inbox${filter !== "all" ? `?channel=${filter}` : ""}`);
    if (r.ok) {
      const d = await r.json();
      setThreads(d.threads ?? []);
      setCounts(d.counts ?? null);
      // Keep active thread in sync.
      if (active) {
        const updated = (d.threads as Thread[]).find((t) => t.key === active.key);
        if (updated) setActive(updated);
      }
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active?.messages.length]);

  async function sendReply() {
    if (!active || !reply.trim()) return;
    if (active.channel === "instagram") {
      showToast("error", "Instagram রিপ্লাই এখনও সমর্থিত নয়।");
      return;
    }
    setSending(true);
    const r = await fetch("/api/inbox/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: active.channel, senderId: active.senderId, message: reply.trim() }),
    });
    const d = await r.json();
    setSending(false);
    if (r.ok) {
      setReply("");
      showToast("success", "রিপ্লাই পাঠানো হয়েছে ✓");
      load();
    } else {
      showToast("error", d.error ?? "পাঠানো যায়নি");
    }
  }

  const createOrderHref = (t: Thread) => {
    const params = new URLSearchParams();
    if (t.senderName) params.set("customerName", t.senderName);
    if (t.channel === "whatsapp") params.set("phone", t.senderId);
    return `/orders/new?${params.toString()}`;
  };

  return (
    <PageShell
      title="ইউনিফাইড ইনবক্স"
      subtitle="Messenger, Instagram ও WhatsApp — সব মেসেজ এক জায়গায়।"
      noPadding
    >
      <Tabs
        tabs={[
          { k: "all", label: `সব${counts ? ` (${counts.all})` : ""}`, icon: InboxIcon },
          { k: "messenger", label: `Messenger${counts ? ` (${counts.messenger})` : ""}`, icon: Facebook },
          { k: "instagram", label: `Instagram${counts ? ` (${counts.instagram})` : ""}`, icon: Instagram },
          { k: "whatsapp", label: `WhatsApp${counts ? ` (${counts.whatsapp})` : ""}`, icon: MessageCircle },
        ].map(c => ({ key: c.k, label: c.label, icon: c.icon }))}
        active={filter}
        onChange={(k) => { setFilter(k); setActive(null); }}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: "60vh" }}>
        {/* Thread list */}
        <Card padding="none" className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" style={{ color: S.muted }} /></div>
          ) : threads.length === 0 ? (
            <div className="text-center py-20 text-xs" style={{ color: S.muted }}>কোনো মেসেজ নেই।</div>
          ) : (
            <div className="divide-y" style={{ borderColor: S.border }}>
              {threads.map((t) => {
                const meta = CHANNEL_META[t.channel] ?? CHANNEL_META.messenger;
                const { Icon } = meta;
                return (
                  <button key={t.key} onClick={() => setActive(t)}
                    className="w-full text-left px-3 py-3 flex items-start gap-2.5 transition-colors hover:bg-black/5"
                    style={{ backgroundColor: active?.key === t.key ? "var(--c-bg)" : "transparent" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.color + "22" }}>
                      <Icon size={15} style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{t.senderName || t.senderId}</p>
                        {t.unreplied && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#E24B4A" }} />}
                      </div>
                      <p className="text-xs truncate" style={{ color: S.muted }}>{t.lastMessage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Conversation */}
        <Card padding="none" className="md:col-span-2 flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-xs" style={{ color: S.muted }}>একটি থ্রেড বেছে নিন।</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
                <div className="flex items-center gap-2">
                  {(() => { const M = (CHANNEL_META[active.channel] ?? CHANNEL_META.messenger); const I = M.Icon; return <I size={16} style={{ color: M.color }} />; })()}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{active.senderName || active.senderId}</p>
                    <p className="text-[11px]" style={{ color: S.muted }}>{(CHANNEL_META[active.channel] ?? CHANNEL_META.messenger).label}</p>
                  </div>
                </div>
                <Link href={createOrderHref(active)}>
                  <Button size="sm" icon={ShoppingCart}>অর্ডার তৈরি</Button>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: "45vh" }}>
                {active.messages.map((m) => (
                  <div key={m.id} className="space-y-2">
                    {m.message.trim() && (
                      <div className="flex">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm" style={{ backgroundColor: S.bg, color: S.text }}>
                          {m.message}
                        </div>
                      </div>
                    )}
                    {m.reply && (
                      <div className="flex justify-end">
                        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white" style={{ backgroundColor: "var(--c-primary)" }}>
                          {m.reply}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Quick replies + composer */}
              <div className="border-t p-3" style={{ borderColor: S.border }}>
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                  {QUICK_REPLIES.map((q, i) => (
                    <button key={i} onClick={() => setReply(q)}
                      className="px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap border flex-shrink-0 hover:bg-black/5"
                      style={{ borderColor: S.border, color: S.muted }}>
                      {q.length > 28 ? q.slice(0, 28) + "…" : q}
                    </button>
                  ))}
                </div>
                {active.channel === "instagram" && (
                  <p className="text-[11px] mb-2" style={{ color: "#9A3412" }}>Instagram রিপ্লাই শীঘ্রই আসছে (Meta অ্যাপ রিভিউ প্রয়োজন)।</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2}
                    placeholder="মেসেজ লিখুন..." disabled={active.channel === "instagram"}
                    className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none resize-none disabled:opacity-50"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                  <button onClick={sendReply} disabled={sending || !reply.trim() || active.channel === "instagram"}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "var(--c-primary)" }}>
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg z-50"
          style={{ backgroundColor: toast.type === "success" ? "#0F6E56" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}
    </PageShell>
  );
}
