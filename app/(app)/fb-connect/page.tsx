"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Link2,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  Users,
  MessageSquare,
  ShoppingBag,
  Inbox,
  Webhook,
  Shield,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Pause,
  Play,
  Save,
  Eye,
  EyeOff,
  Facebook,
  Loader2,
} from "lucide-react";

interface Page {
  id: string;
  pageId: string;
  pageName: string;
  category?: string | null;
  followers?: number | null;
  isActive: boolean;
  autoReply: boolean;
  replyMessage?: string | null;
  connectedAt: string;
}

interface Stats {
  totalPages: number;
  activePages: number;
  totalFollowers: number;
  commentOrders: number;
  messages: number;
  repliedMessages: number;
}

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";
const VERIFY_TOKEN = "bizilcore_verify_2024";

function fbOAuthUrl() {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const redirect = `${base}/api/auth/facebook/callback`;
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: redirect,
    scope:
      "pages_read_engagement,pages_manage_metadata,pages_show_list,pages_read_user_content,pages_messaging,pages_manage_engagement",
    response_type: "code",
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "আজ";
  if (days < 7) return `${days} দিন আগে`;
  if (days < 30) return `${Math.floor(days / 7)} সপ্তাহ আগে`;
  if (days < 365) return `${Math.floor(days / 30)} মাস আগে`;
  return `${Math.floor(days / 365)} বছর আগে`;
}

export default function FbConnectPage() {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<Page[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showWebhook, setShowWebhook] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState<Record<string, string>>({});

  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fb-connect");
      const data = await res.json();
      const pageList: Page[] = Array.isArray(data) ? data : data.pages ?? [];
      setPages(pageList);
      setStats(data.stats ?? null);
      const drafts: Record<string, string> = {};
      pageList.forEach((p) => {
        drafts[p.pageId] = p.replyMessage ?? "";
      });
      setDraftReply((prev) => ({ ...drafts, ...prev }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      /* noop */
    }
  };

  const updatePage = async (
    pageId: string,
    body: Partial<Pick<Page, "isActive" | "autoReply" | "replyMessage">>,
  ) => {
    setSavingId(pageId);
    try {
      const res = await fetch("/api/fb-connect", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, ...body }),
      });
      if (res.ok) {
        const data = await res.json();
        setPages((prev) =>
          prev.map((p) => (p.pageId === pageId ? { ...p, ...(data.page ?? body) } : p)),
        );
      }
    } finally {
      setSavingId(null);
    }
  };

  const removePage = async (pageId: string, name: string) => {
    if (!confirm(`"${name}" পেজটি disconnect করতে চান?`)) return;
    await fetch("/api/fb-connect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
    });
    await load();
  };

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.pageName.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q),
    );
  }, [pages, search]);

  const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}/api/webhook/facebook` : "";
  const noPages = !loading && pages.length === 0;
  const fbAppMissing = !FB_APP_ID;

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* ── Hero header ─────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl px-6 sm:px-8 py-7 text-white"
        style={{
          background:
            "linear-gradient(135deg, #1877F2 0%, #0F5FCC 50%, #0A4DA8 100%)",
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-12 left-1/3 w-56 h-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
            >
              <Facebook size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Facebook ইন্টিগ্রেশন
              </h1>
              <p className="text-sm mt-1 opacity-90 max-w-xl">
                আপনার পেজ কানেক্ট করুন — কমেন্ট থেকে অর্ডার অটোমেট হবে, Messenger-এ অটো-রিপ্লাই
                চলবে, সব এক জায়গায়।
              </p>
            </div>
          </div>
          <Link
            href="/fb-orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-md transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#1877F2" }}
          >
            <Inbox size={16} />
            FB ইনবক্স দেখুন
          </Link>
        </div>
      </div>

      {/* ── Alerts ─────────────────────── */}
      {success && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium"
          style={{ backgroundColor: "#E1F5EE", color: "#0F6E56", border: "1px solid #BBE5D6" }}
        >
          <CheckCircle2 size={18} />
          Facebook পেজ সফলভাবে কানেক্ট হয়েছে! এখন কমেন্ট ও Messenger অটোমেটিক sync হবে।
        </div>
      )}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium"
          style={{ backgroundColor: "#FFE8E8", color: "#B91C1C", border: "1px solid #FCA5A5" }}
        >
          <AlertCircle size={18} />
          পেজ কানেক্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন বা সাপোর্টে যোগাযোগ করুন।
        </div>
      )}
      {fbAppMissing && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl text-sm"
          style={{ backgroundColor: "#FFF7E6", color: "#92400E", border: "1px solid #FCD8A0" }}
        >
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Facebook App ID সেট করা নেই</p>
            <p className="opacity-90 mt-0.5">
              Replit Secrets-এ <code className="px-1 bg-white/60 rounded">NEXT_PUBLIC_FACEBOOK_APP_ID</code>,{" "}
              <code className="px-1 bg-white/60 rounded">FACEBOOK_APP_ID</code>, এবং{" "}
              <code className="px-1 bg-white/60 rounded">FACEBOOK_APP_SECRET</code> যোগ করুন।
            </p>
          </div>
        </div>
      )}

      {/* ── Stats grid ─────────────────────── */}
      {stats && pages.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<Link2 size={18} />}
            label="কানেক্টেড পেজ"
            value={`${stats.activePages}/${stats.totalPages}`}
            color="#1877F2"
          />
          <StatCard
            icon={<Users size={18} />}
            label="মোট ফলোয়ার"
            value={formatNumber(stats.totalFollowers)}
            color="#0F6E56"
          />
          <StatCard
            icon={<ShoppingBag size={18} />}
            label="কমেন্ট অর্ডার"
            value={formatNumber(stats.commentOrders)}
            color="#9333EA"
          />
          <StatCard
            icon={<MessageSquare size={18} />}
            label="মেসেজ"
            value={`${formatNumber(stats.messages)}`}
            sublabel={`${stats.repliedMessages} রিপ্লাই হয়েছে`}
            color="#EA580C"
          />
        </div>
      )}

      {/* ── Setup checklist (only when no pages) ─────────────────────── */}
      {noPages && (
        <div
          className="rounded-3xl border p-6 sm:p-8"
          style={{
            borderColor: "var(--c-border)",
            background:
              "linear-gradient(135deg, rgba(24,119,242,0.04) 0%, rgba(15,110,86,0.04) 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: "#1877F2" }} />
            <h2 className="font-bold text-lg" style={{ color: "var(--c-text)" }}>
              ৩ মিনিটে শুরু করুন
            </h2>
          </div>
          <div className="space-y-3 mb-6">
            <ChecklistStep
              num={1}
              done
              title="অ্যাকাউন্ট তৈরি হয়েছে"
              desc="স্বাগতম! এবার Facebook পেজ কানেক্ট করুন।"
            />
            <ChecklistStep
              num={2}
              active
              title="Facebook পেজ কানেক্ট করুন"
              desc="নিচের বাটনে ক্লিক করে FB-তে লগইন করুন এবং অনুমতি দিন।"
            />
            <ChecklistStep
              num={3}
              title="Webhook সেটআপ করুন"
              desc="FB Developer Console-এ Callback URL ও Verify Token যোগ করুন।"
            />
            <ChecklistStep
              num={4}
              title="অর্ডার পেতে শুরু করুন"
              desc="পেজে কমেন্ট আসলেই অটো অর্ডার তৈরি হবে এবং Messenger-এ অটো-রিপ্লাই যাবে।"
            />
          </div>
        </div>
      )}

      {/* ── Connect CTA + Quick actions ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a
          href={FB_APP_ID ? fbOAuthUrl() : "#"}
          onClick={(e) => {
            if (!FB_APP_ID) {
              e.preventDefault();
              alert("NEXT_PUBLIC_FACEBOOK_APP_ID environment variable সেট করুন।");
            }
          }}
          className="md:col-span-2 group relative overflow-hidden rounded-3xl p-6 text-white transition-transform hover:scale-[1.01]"
          style={{
            background:
              "linear-gradient(135deg, #1877F2 0%, #0F5FCC 100%)",
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 group-hover:scale-110 transition-transform"
            style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Facebook size={28} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg sm:text-xl">নতুন Facebook পেজ যুক্ত করুন</h2>
              <p className="text-sm opacity-90 mt-0.5">
                FB-তে লগইন করুন → পেজ select করুন → অনুমতি দিন। ব্যাস!
              </p>
            </div>
            <ChevronRight size={24} className="opacity-80 group-hover:translate-x-1 transition-transform" />
          </div>
        </a>

        <button
          onClick={load}
          className="rounded-3xl p-6 text-left transition-all hover:shadow-md"
          style={{
            border: "1px solid var(--c-border)",
            backgroundColor: "var(--c-surface)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#F0FBF7" }}
            >
              <RefreshCw size={18} style={{ color: "#0F6E56" }} className={loading ? "animate-spin" : ""} />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>
              রিফ্রেশ করুন
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            পেজ ও স্ট্যাট আপডেট নিন
          </p>
        </button>
      </div>

      {/* ── Connected pages ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-base" style={{ color: "var(--c-text)" }}>
            কানেক্টেড পেজ{" "}
            <span className="text-sm font-medium" style={{ color: "var(--c-text-muted)" }}>
              ({pages.length})
            </span>
          </h2>
          {pages.length > 3 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--c-text-muted)" }}
              />
              <input
                type="text"
                placeholder="পেজ খুঁজুন…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid var(--c-border)",
                  backgroundColor: "var(--c-surface)",
                  color: "var(--c-text)",
                  width: 220,
                }}
              />
            </div>
          )}
        </div>

        {loading ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }}
          >
            <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "var(--c-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
              লোড হচ্ছে…
            </p>
          </div>
        ) : noPages ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ border: "2px dashed var(--c-border)", backgroundColor: "var(--c-surface)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#EEF3FD" }}
            >
              <Facebook size={32} style={{ color: "#1877F2" }} />
            </div>
            <h3 className="font-bold text-base mb-1" style={{ color: "var(--c-text)" }}>
              এখনো কোনো পেজ কানেক্ট হয়নি
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--c-text-muted)" }}>
              উপরের নীল বাটনে ক্লিক করে আপনার প্রথম FB পেজ যুক্ত করুন
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredPages.map((p) => {
              const expanded = expandedId === p.id;
              const draft = draftReply[p.pageId] ?? p.replyMessage ?? "";
              const dirty = draft !== (p.replyMessage ?? "");
              return (
                <div
                  key={p.id}
                  className="rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
                  style={{
                    border: "1px solid var(--c-border)",
                    backgroundColor: "var(--c-surface)",
                  }}
                >
                  {/* Header */}
                  <div className="p-4 flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={`https://graph.facebook.com/${p.pageId}/picture?type=square&width=80&height=80`}
                        alt={p.pageName}
                        className="w-12 h-12 rounded-xl object-cover"
                        style={{ backgroundColor: "#1877F2" }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{
                          backgroundColor: p.isActive ? "#10B981" : "#9CA3AF",
                          borderColor: "var(--c-surface)",
                        }}
                      >
                        {p.isActive && <Check size={9} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className="font-semibold text-sm truncate"
                          style={{ color: "var(--c-text)" }}
                        >
                          {p.pageName}
                        </h3>
                        {p.autoReply && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap"
                            style={{ backgroundColor: "#EEF3FD", color: "#1877F2" }}
                          >
                            অটো-রিপ্লাই
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                        {p.category ?? "Facebook Page"}
                        {p.followers ? ` • ${formatNumber(p.followers)} ফলোয়ার` : ""}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: "var(--c-text-muted)" }}>
                        কানেক্ট হয়েছে {timeAgo(p.connectedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(expanded ? null : p.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                        title="সেটিংস"
                        style={{ color: "var(--c-text-sub)" }}
                      >
                        <SettingsIcon size={14} />
                      </button>
                      <button
                        onClick={() => updatePage(p.pageId, { isActive: !p.isActive })}
                        disabled={savingId === p.pageId}
                        className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                        title={p.isActive ? "Pause" : "Resume"}
                        style={{ color: p.isActive ? "#EA580C" : "#0F6E56" }}
                      >
                        {p.isActive ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={() => removePage(p.pageId, p.pageName)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        title="Disconnect"
                        style={{ color: "#E24B4A" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline auto-reply toggle row */}
                  <div
                    className="px-4 py-3 flex items-center justify-between gap-3"
                    style={{ borderTop: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare size={14} style={{ color: "var(--c-text-muted)" }} />
                      <span className="text-xs font-medium truncate" style={{ color: "var(--c-text-sub)" }}>
                        Messenger অটো-রিপ্লাই
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={p.autoReply}
                      onChange={(v) => updatePage(p.pageId, { autoReply: v })}
                      disabled={savingId === p.pageId}
                    />
                  </div>

                  {/* Expanded settings */}
                  {expanded && (
                    <div
                      className="px-4 py-4 space-y-3"
                      style={{ borderTop: "1px solid var(--c-border)" }}
                    >
                      <div>
                        <label
                          className="text-xs font-semibold block mb-1.5"
                          style={{ color: "var(--c-text-sub)" }}
                        >
                          অটো-রিপ্লাই মেসেজ
                        </label>
                        <textarea
                          value={draft}
                          onChange={(e) =>
                            setDraftReply((prev) => ({ ...prev, [p.pageId]: e.target.value }))
                          }
                          rows={3}
                          placeholder="যেমন: আপনার বার্তার জন্য ধন্যবাদ! শীঘ্রই যোগাযোগ করব।"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                          style={{
                            border: "1px solid var(--c-border)",
                            backgroundColor: "var(--c-surface)",
                            color: "var(--c-text)",
                          }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
                            {draft.length} অক্ষর
                          </p>
                          <button
                            disabled={!dirty || savingId === p.pageId}
                            onClick={() => updatePage(p.pageId, { replyMessage: draft })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                            style={{
                              backgroundColor: dirty ? "#0F6E56" : "var(--c-bg)",
                              color: dirty ? "#fff" : "var(--c-text-muted)",
                            }}
                          >
                            <Save size={12} />
                            সেভ করুন
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div
                          className="rounded-lg p-2"
                          style={{ backgroundColor: "var(--c-bg)" }}
                        >
                          <p className="font-semibold mb-0.5" style={{ color: "var(--c-text-sub)" }}>
                            Page ID
                          </p>
                          <code className="break-all" style={{ color: "var(--c-text-muted)" }}>
                            {p.pageId}
                          </code>
                        </div>
                        <div
                          className="rounded-lg p-2"
                          style={{ backgroundColor: "var(--c-bg)" }}
                        >
                          <p className="font-semibold mb-0.5" style={{ color: "var(--c-text-sub)" }}>
                            Subscribed
                          </p>
                          <span style={{ color: "var(--c-text-muted)" }}>
                            feed, comments, messages
                          </span>
                        </div>
                      </div>

                      <a
                        href={`https://www.facebook.com/${p.pageId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: "#1877F2" }}
                      >
                        FB পেজ দেখুন <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Webhook setup (collapsible) ─────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }}
      >
        <button
          onClick={() => setShowWebhook((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#FFF7E6" }}
            >
              <Webhook size={16} style={{ color: "#D97706" }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>
                Webhook সেটআপ তথ্য
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                FB Developer Console-এ এই URL ও Token যোগ করুন
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: "var(--c-text-muted)",
              transform: showWebhook ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {showWebhook && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--c-border)" }}>
            <CopyRow
              label="Callback URL"
              value={callbackUrl}
              onCopy={() => copy(callbackUrl, "url")}
              copied={copiedKey === "url"}
            />
            <CopyRow
              label="Verify Token"
              value={showVerifyToken ? VERIFY_TOKEN : "••••••••••••••••••••"}
              onCopy={() => copy(VERIFY_TOKEN, "token")}
              copied={copiedKey === "token"}
              extra={
                <button
                  onClick={() => setShowVerifyToken((v) => !v)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                  title={showVerifyToken ? "Hide" : "Show"}
                  style={{ color: "var(--c-text-muted)" }}
                >
                  {showVerifyToken ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              }
            />
            <div
              className="rounded-xl p-3 text-xs"
              style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-sub)" }}
            >
              <p className="font-semibold mb-1" style={{ color: "var(--c-text)" }}>
                Subscribed Fields:
              </p>
              <p>feed, comments, messages, messaging_postbacks</p>
            </div>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "#1877F2" }}
            >
              FB Developer Console খুলুন <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>

      {/* ── Permissions (collapsible) ─────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }}
      >
        <button
          onClick={() => setShowPermissions((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#F0FBF7" }}
            >
              <Shield size={16} style={{ color: "#0F6E56" }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>
                প্রয়োজনীয় Permissions
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                BizilCore কী কী Facebook permission চায়
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: "var(--c-text-muted)",
              transform: showPermissions ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s",
            }}
          />
        </button>
        {showPermissions && (
          <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid var(--c-border)" }}>
            {[
              { name: "pages_show_list", desc: "আপনার সব পেজের তালিকা দেখানোর জন্য" },
              { name: "pages_read_engagement", desc: "পোস্টের কমেন্ট ও লাইক পড়ার জন্য" },
              { name: "pages_read_user_content", desc: "ইউজারদের কমেন্ট ও মেসেজ পড়ার জন্য" },
              { name: "pages_manage_metadata", desc: "Webhook subscribe ও পেজ মেটাডাটা ম্যানেজ" },
              { name: "pages_messaging", desc: "Messenger-এ মেসেজ পাঠানো ও রিসিভ করার জন্য" },
              { name: "pages_manage_engagement", desc: "কমেন্টে রিপ্লাই/লাইক করার জন্য" },
            ].map((perm) => (
              <div
                key={perm.name}
                className="flex items-start gap-3 p-2.5 rounded-xl"
                style={{ backgroundColor: "var(--c-bg)" }}
              >
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#0F6E56" }} />
                <div className="flex-1 min-w-0">
                  <code
                    className="text-xs font-semibold block"
                    style={{ color: "var(--c-text)" }}
                  >
                    {perm.name}
                  </code>
                  <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                    {perm.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ border: "1px solid var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>
          {label}
        </span>
      </div>
      <div className="font-bold text-xl" style={{ color: "var(--c-text)" }}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[11px] mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function ChecklistStep({
  num,
  title,
  desc,
  done,
  active,
}: {
  num: number;
  title: string;
  desc: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
        style={{
          backgroundColor: done ? "#0F6E56" : active ? "#1877F2" : "var(--c-bg)",
          color: done || active ? "#fff" : "var(--c-text-muted)",
        }}
      >
        {done ? <Check size={14} strokeWidth={3} /> : num}
      </div>
      <div className="flex-1">
        <p
          className="font-semibold text-sm"
          style={{
            color: done ? "var(--c-text-muted)" : "var(--c-text)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
  extra,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-sub)" }}>
        {label}
      </p>
      <div
        className="flex items-center gap-1 rounded-xl px-3 py-2"
        style={{ backgroundColor: "var(--c-bg)" }}
      >
        <code
          className="text-xs flex-1 break-all min-w-0"
          style={{ color: "var(--c-text)", fontFamily: "ui-monospace, monospace" }}
        >
          {value}
        </code>
        {extra}
        <button
          onClick={onCopy}
          className="p-1.5 rounded-lg transition-colors hover:bg-white"
          title={copied ? "কপি হয়েছে!" : "কপি করুন"}
          style={{ color: copied ? "#0F6E56" : "var(--c-text-muted)" }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
      style={{ backgroundColor: checked ? "#0F6E56" : "#D1D5DB" }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}
