"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Facebook,
  Instagram,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plug,
  Unplug,
  RefreshCw,
  X,
  Check,
  Info,
} from "lucide-react";
import { PageShell, Card, Badge, Button } from "@/components/ui";

// ── Types ──────────────────────────────────────────────────

type Platform = "facebook" | "instagram" | "whatsapp";

interface Connection {
  platform: Platform;
  status: string; // 'connected' | 'not_connected' | 'disconnected' | 'expired' | ...
  accountId?: string;
  accountName?: string | null;
  accountAvatarUrl?: string | null;
  connectedAt?: string;
  tokenExpiresAt?: string | null;
  expiringSoon?: boolean;
  displayPhoneNumber?: string | null;
  pageName?: string | null;
}

interface IntegrationsResponse {
  connections: Connection[];
  configured: boolean;
  whatsappConfigured: boolean;
}

interface PickerPage {
  id: string;
  name: string;
  category?: string | null;
  pictureUrl?: string;
}

// ── Platform meta ──────────────────────────────────────────

const PLATFORM_META: Record<
  Platform,
  {
    name: string;
    connectLabel: string;
    accountLabel: string;
    color: string;
    gradient: string;
    iconBg: string;
    icon: React.ElementType;
    startUrl: string;
  }
> = {
  facebook: {
    name: "Facebook",
    connectLabel: "Facebook Page কানেক্ট করুন",
    accountLabel: "Facebook Page",
    color: "#1877F2",
    gradient: "linear-gradient(135deg, #1877F2 0%, #0F5FCC 100%)",
    iconBg: "#EEF3FD",
    icon: Facebook,
    startUrl: "/api/integrations/facebook/start?platform=facebook",
  },
  instagram: {
    name: "Instagram",
    connectLabel: "Instagram অ্যাকাউন্ট কানেক্ট করুন",
    accountLabel: "Instagram Business",
    color: "#E4405F",
    gradient: "linear-gradient(135deg, #833AB4 0%, #E4405F 50%, #FCAF45 100%)",
    iconBg: "#FDEEF2",
    icon: Instagram,
    startUrl: "/api/integrations/facebook/start?platform=instagram",
  },
  whatsapp: {
    name: "WhatsApp",
    connectLabel: "WhatsApp Business কানেক্ট করুন",
    accountLabel: "WhatsApp Business",
    color: "#25D366",
    gradient: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    iconBg: "#E9FBF0",
    icon: MessageCircle,
    startUrl: "/api/integrations/whatsapp/start",
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  config: "Meta App কনফিগার করা নেই। META_APP_ID ও META_APP_SECRET সেট করুন।",
  wa_config: "WhatsApp Embedded Signup কনফিগার করা নেই। META_WHATSAPP_CONFIG_ID সেট করুন।",
  cancelled: "কানেকশন বাতিল করা হয়েছে বা অনুমতি দেওয়া হয়নি। আবার চেষ্টা করুন।",
  state: "নিরাপত্তা যাচাই ব্যর্থ হয়েছে। অনুগ্রহ করে আবার কানেক্ট করার চেষ্টা করুন।",
  token: "Meta থেকে টোকেন আনতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  no_pages: "আপনার অ্যাকাউন্টে কোনো Facebook Page পাওয়া যায়নি। প্রথমে একটি Page তৈরি করুন।",
  no_instagram:
    "এই Facebook Page-এর সাথে কোনো Instagram Business অ্যাকাউন্ট লিংক করা নেই। অনুগ্রহ করে আপনার Instagram অ্যাকাউন্টকে Professional/Business করে Facebook Page-এর সাথে লিংক করুন।",
  wa_no_waba: "কোনো WhatsApp Business অ্যাকাউন্ট পাওয়া যায়নি। Signup প্রক্রিয়াটি সম্পূর্ণ করুন।",
  wa_no_phone:
    "WhatsApp Business অ্যাকাউন্টে কোনো ফোন নম্বর পাওয়া যায়নি। Meta-তে ফোন নম্বর যোগ ও ভেরিফাই করে আবার চেষ্টা করুন।",
};

const CONNECTED_MESSAGES: Record<string, string> = {
  facebook: "Facebook Page সফলভাবে কানেক্ট হয়েছে!",
  instagram: "Instagram অ্যাকাউন্ট সফলভাবে কানেক্ট হয়েছে!",
  whatsapp: "WhatsApp Business সফলভাবে কানেক্ট হয়েছে!",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "আজ";
  if (days < 7) return `${days} দিন আগে`;
  if (days < 30) return `${Math.floor(days / 7)} সপ্তাহ আগে`;
  if (days < 365) return `${Math.floor(days / 30)} মাস আগে`;
  return `${Math.floor(days / 365)} বছর আগে`;
}

// ── Page ───────────────────────────────────────────────────

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<IntegrationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Platform | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Page picker state
  const [picker, setPicker] = useState<Platform | null>(null);
  const [pickerPages, setPickerPages] = useState<PickerPage[] | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [pickerSaving, setPickerSaving] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Handle OAuth redirect query params (error / connected / warn / picker)
  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");
    const warn = searchParams.get("warn");
    const pickerParam = searchParams.get("picker");

    if (error) showToast("error", ERROR_MESSAGES[error] ?? "কানেক্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    if (connected) {
      showToast("success", CONNECTED_MESSAGES[connected] ?? "সফলভাবে কানেক্ট হয়েছে!");
      if (warn === "wa_unverified") {
        setTimeout(
          () =>
            showToast(
              "error",
              "সতর্কতা: WhatsApp ফোন নম্বর ভেরিফিকেশন এখনো সম্পন্ন হয়নি। Meta Business Manager-এ ভেরিফিকেশন সম্পূর্ণ করুন।",
            ),
          5200,
        );
      }
    }
    if (pickerParam === "facebook" || pickerParam === "instagram") {
      setPicker(pickerParam as Platform);
    }

    if (error || connected || pickerParam) {
      router.replace("/integrations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load page list when the picker opens
  useEffect(() => {
    if (!picker) return;
    setPickerPages(null);
    setPickerError(null);
    setSelectedPage(null);
    (async () => {
      try {
        const res = await fetch("/api/integrations/facebook/pages");
        const json = await res.json();
        if (!res.ok) {
          setPickerError(json.error ?? "পেজ লোড করতে সমস্যা হয়েছে।");
          return;
        }
        setPickerPages(json.pages ?? []);
      } catch {
        setPickerError("পেজ লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    })();
  }, [picker]);

  const getConnection = (platform: Platform): Connection | undefined =>
    data?.connections.find((c) => c.platform === platform);

  const connect = (platform: Platform) => {
    const conn = getConnection(platform);
    if (conn?.status === "connected") {
      const ok = confirm(
        `${PLATFORM_META[platform].name} ইতোমধ্যে কানেক্টেড আছে। পুনরায় কানেক্ট করলে আগের কানেকশন overwrite হয়ে যাবে। চালিয়ে যেতে চান?`,
      );
      if (!ok) return;
    }
    setBusy(platform);
    window.location.href = PLATFORM_META[platform].startUrl;
  };

  const disconnect = async (platform: Platform) => {
    const meta = PLATFORM_META[platform];
    if (!confirm(`${meta.name} অ্যাকাউন্টটি disconnect করতে চান?`)) return;
    setBusy(platform);
    try {
      const res = await fetch(`/api/integrations/${platform}/disconnect`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        showToast("error", json.error ?? "ডিসকানেক্ট করতে সমস্যা হয়েছে।");
        return;
      }
      showToast("success", `${meta.name} disconnect করা হয়েছে।`);
      await load();
    } catch {
      showToast("error", "ডিসকানেক্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setBusy(null);
    }
  };

  const savePickedPage = async () => {
    if (!selectedPage || !picker) return;
    setPickerSaving(true);
    try {
      const res = await fetch("/api/integrations/facebook/select-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPage }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPickerError(json.error ?? "কানেকশন সেভ করতে সমস্যা হয়েছে।");
        return;
      }
      showToast("success", CONNECTED_MESSAGES[picker] ?? "সফলভাবে কানেক্ট হয়েছে!");
      setPicker(null);
      await load();
    } catch {
      setPickerError("কানেকশন সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setPickerSaving(false);
    }
  };

  const notConfigured = data && !data.configured;
  const platforms: Platform[] = ["facebook", "instagram", "whatsapp"];

  return (
    <PageShell
      title="সোশ্যাল ইন্টিগ্রেশন"
      subtitle="এই অ্যাকাউন্ট থেকে অর্ডার এবং মেসেজ ম্যানেজ করতে আপনার Facebook/Instagram/WhatsApp Business অ্যাকাউন্ট কানেক্ট করুন।"
      className="max-w-5xl pb-12"
    >
      {/* ── Config warning ─────────────────────── */}
      {notConfigured && (
        <div
          className="flex items-start gap-3 text-sm rounded-2xl border p-5 card-premium"
          style={{ backgroundColor: "#FFF7E6", color: "#92400E", borderColor: "#FCD8A0" }}
        >
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Meta App কনফিগার করা নেই</p>
            <p className="opacity-90 mt-0.5">
              Environment variables-এ{" "}
              <code className="px-1 bg-white/60 rounded">META_APP_ID</code> এবং{" "}
              <code className="px-1 bg-white/60 rounded">META_APP_SECRET</code> যোগ করুন। WhatsApp-এর
              জন্য <code className="px-1 bg-white/60 rounded">META_WHATSAPP_CONFIG_ID</code>-ও লাগবে।
            </p>
          </div>
        </div>
      )}

      {/* ── Platform cards ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <PlatformCard
            key={platform}
            platform={platform}
            connection={getConnection(platform)}
            loading={loading}
            busy={busy === platform}
            disabled={
              !data?.configured || (platform === "whatsapp" && !data?.whatsappConfigured)
            }
            onConnect={() => connect(platform)}
            onDisconnect={() => disconnect(platform)}
          />
        ))}
      </div>

      {/* ── Info note ─────────────────────── */}
      <Card className="flex items-start gap-3 text-xs [&_*]:text-[var(--c-text-muted)]">
        <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: "#0F6E56" }} />
        <p>
          প্রতিটি প্ল্যাটফর্মে একটি করে অ্যাকাউন্ট কানেক্ট করা যাবে। Instagram Business অ্যাকাউন্ট
          কানেক্ট করতে হলে সেটি অবশ্যই একটি Facebook Page-এর সাথে লিংক থাকতে হবে। কানেক্ট করা
          অ্যাকাউন্টের access token নিরাপদভাবে encrypted অবস্থায় সংরক্ষণ করা হয়।
        </p>
      </Card>

      {/* ── Page picker modal ─────────────────────── */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--c-surface)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--c-border)" }}
            >
              <div>
                <h3 className="font-bold text-sm" style={{ color: "var(--c-text)" }}>
                  {picker === "instagram" ? "Instagram-এর জন্য পেজ বাছাই করুন" : "Facebook Page বাছাই করুন"}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                  {picker === "instagram"
                    ? "যে Page-এর সাথে আপনার Instagram অ্যাকাউন্ট লিংক করা আছে সেটি বাছাই করুন"
                    : "কোন পেজটি BizilCore-এর সাথে কানেক্ট করবেন?"}
                </p>
              </div>
              <button
                onClick={() => setPicker(null)}
                className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "var(--c-text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {pickerError ? (
                <div
                  className="flex items-start gap-2 px-3 py-3 rounded-xl text-xs"
                  style={{ backgroundColor: "#FFE8E8", color: "#B91C1C" }}
                >
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {pickerError}
                </div>
              ) : pickerPages === null ? (
                <div className="py-8 text-center">
                  <Loader2
                    size={22}
                    className="animate-spin mx-auto mb-2"
                    style={{ color: "var(--c-text-muted)" }}
                  />
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                    পেজ লোড হচ্ছে…
                  </p>
                </div>
              ) : pickerPages.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: "var(--c-text-muted)" }}>
                  কোনো পেজ পাওয়া যায়নি।
                </p>
              ) : (
                pickerPages.map((p) => {
                  const selected = selectedPage === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPage(p.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                      style={{
                        border: `1.5px solid ${selected ? "#0F6E56" : "var(--c-border)"}`,
                        backgroundColor: selected ? "#F0FBF7" : "var(--c-surface)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.pictureUrl}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        style={{ backgroundColor: "#EEF3FD" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold text-sm truncate"
                          style={{ color: "var(--c-text)" }}
                        >
                          {p.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>
                          {p.category ?? "Facebook Page"}
                        </p>
                      </div>
                      {selected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#0F6E56" }}
                        >
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div
              className="flex items-center justify-end gap-2 px-5 py-4"
              style={{ borderTop: "1px solid var(--c-border)" }}
            >
              <button
                onClick={() => setPicker(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ color: "var(--c-text-sub)", border: "1px solid var(--c-border)" }}
              >
                বাতিল
              </button>
              <button
                onClick={savePickedPage}
                disabled={!selectedPage || pickerSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: "#0F6E56" }}
              >
                {pickerSaving && <Loader2 size={14} className="animate-spin" />}
                কানেক্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg max-w-sm"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}
        >
          {toast.msg}
        </div>
      )}
    </PageShell>
  );
}

// ── Platform card ──────────────────────────────────────────

function PlatformCard({
  platform,
  connection,
  loading,
  busy,
  disabled,
  onConnect,
  onDisconnect,
}: {
  platform: Platform;
  connection?: Connection;
  loading: boolean;
  busy: boolean;
  disabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const meta = PLATFORM_META[platform];
  const Icon = meta.icon;
  const isConnected = connection?.status === "connected";
  const isExpired = connection?.status === "expired";
  const expiringSoon = Boolean(connection?.expiringSoon);

  return (
    <Card padding="none" className="overflow-hidden flex flex-col">
      {/* Brand strip */}
      <div className="h-1.5" style={{ background: meta.gradient }} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: meta.iconBg, color: meta.color }}
          >
            <Icon size={22} />
          </div>
          {isConnected && (
            <Badge variant="success">
              <CheckCircle2 size={11} className="inline mr-0.5" />
              কানেক্টেড
            </Badge>
          )}
        </div>

        <h3 className="font-bold text-sm mb-0.5" style={{ color: "var(--c-text)" }}>
          {meta.name}
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--c-text-muted)" }}>
          {meta.accountLabel}
        </p>

        {/* Body */}
        <div className="flex-1">
          {loading || busy ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={16} className="animate-spin" style={{ color: meta.color }} />
              <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                {busy ? "প্রসেস হচ্ছে…" : "লোড হচ্ছে…"}
              </span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-3 py-1">
              {connection?.accountAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={connection.accountAvatarUrl}
                  alt={connection.accountName ?? meta.name}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  style={{ backgroundColor: meta.iconBg }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.iconBg, color: meta.color }}
                >
                  <Icon size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "var(--c-text)" }}>
                  {connection?.accountName ?? connection?.accountId}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--c-text-muted)" }}>
                  {platform === "whatsapp" && connection?.displayPhoneNumber
                    ? connection.displayPhoneNumber
                    : platform === "instagram" && connection?.pageName
                      ? `Page: ${connection.pageName}`
                      : connection?.connectedAt
                        ? `কানেক্ট হয়েছে ${timeAgo(connection.connectedAt)}`
                        : ""}
                </p>
              </div>
            </div>
          ) : isExpired ? (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{ backgroundColor: "#FFE8E8", color: "#B91C1C" }}
            >
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>সংযোগের মেয়াদ শেষ হয়ে গেছে। অর্ডার/মেসেজ পেতে পুনরায় কানেক্ট করুন।</span>
            </div>
          ) : (
            <p className="text-xs py-2 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
              {platform === "facebook" && "কমেন্ট ও Messenger থেকে অর্ডার ম্যানেজ করতে পেজ কানেক্ট করুন।"}
              {platform === "instagram" && "Facebook Page-এর সাথে লিংক করা Instagram Business অ্যাকাউন্ট কানেক্ট করুন।"}
              {platform === "whatsapp" && "WhatsApp Business Platform-এ মেসেজ পাঠাতে অ্যাকাউন্ট কানেক্ট করুন।"}
            </p>
          )}
          {isConnected && expiringSoon && (
            <div
              className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl text-xs"
              style={{ backgroundColor: "#FFF7E6", color: "#92400E" }}
            >
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>টোকেনের মেয়াদ শীঘ্রই শেষ হবে — নিরবচ্ছিন্ন সেবা নিশ্চিত করতে পুনরায় কানেক্ট করুন।</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4">
          {isConnected ? (
            <div className="flex gap-2">
              <button
                onClick={onDisconnect}
                disabled={busy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{ color: "#E24B4A", border: "1px solid #FCA5A5", backgroundColor: "#FFF5F5" }}
              >
                <Unplug size={13} />
                Disconnect
              </button>
              <button
                onClick={onConnect}
                disabled={busy || disabled}
                title="পুনরায় কানেক্ট করুন"
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{
                  color: "var(--c-text-sub)",
                  border: "1px solid var(--c-border)",
                  backgroundColor: "var(--c-surface)",
                }}
              >
                <RefreshCw size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              disabled={busy || loading || disabled}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: meta.gradient }}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}
              {meta.connectLabel}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
