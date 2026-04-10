"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, Trash2, CheckCircle, ExternalLink } from "lucide-react";

interface Page {
  id: string;
  pageId: string;
  pageName: string;
  category?: string | null;
  followers?: number | null;
  isActive: boolean;
  connectedAt: string;
}

const FB_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "";

function fbOAuthUrl() {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const redirect = `${base}/api/auth/facebook/callback`;
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: redirect,
    scope: "pages_read_engagement,pages_manage_metadata,pages_show_list,pages_read_user_content",
    response_type: "code",
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

export default function FbConnectPage() {
  const searchParams = useSearchParams();
  const [pages, setPages]     = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const success = searchParams.get("success");
  const error   = searchParams.get("error");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fb-connect");
      const data = await res.json();
      setPages(Array.isArray(data) ? data.filter((p: Page) => p.isActive) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const removePage = async (pageId: string) => {
    setRemoving(pageId);
    await fetch("/api/fb-connect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
    });
    setPages((prev) => prev.filter((p) => p.pageId !== pageId));
    setRemoving(null);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EEF3FD" }}>
          <Link2 size={18} style={{ color: "#1877F2" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--c-text)" }}>Facebook পেজ কানেক্ট</h1>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            আপনার Facebook পেজ কানেক্ট করুন — কমেন্ট থেকে অর্ডার অটোমেটিক আসবে
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
          <CheckCircle size={16} />
          Facebook পেজ সফলভাবে কানেক্ট হয়েছে!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "#FFE8E8", color: "#E24B4A" }}>
          পেজ কানেক্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
        </div>
      )}

      {/* Connect button */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <h2 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>নতুন পেজ কানেক্ট করুন</h2>
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
          Facebook-এ লগইন করে আপনার পেজগুলো অনুমতি দিন। সব পেজ স্বয়ংক্রিয়ভাবে যুক্ত হবে।
        </p>
        <a
          href={FB_APP_ID ? fbOAuthUrl() : "#"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#1877F2", color: "#fff" }}
          onClick={(e) => {
            if (!FB_APP_ID) {
              e.preventDefault();
              alert("NEXT_PUBLIC_FACEBOOK_APP_ID environment variable সেট করুন।");
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
          Facebook দিয়ে কানেক্ট করুন
        </a>
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
          প্রয়োজনীয় Permission:{" "}
          <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: "var(--c-bg)" }}>
            pages_read_engagement, pages_manage_metadata, pages_show_list
          </code>
        </p>
      </div>

      {/* Webhook info */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <h2 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Webhook সেটআপ তথ্য</h2>
        <div className="space-y-2 text-xs" style={{ color: "var(--c-text-muted)" }}>
          <div className="flex items-center gap-2">
            <span className="font-medium w-24 flex-shrink-0" style={{ color: "var(--c-text-sub)" }}>Callback URL</span>
            <code className="px-2 py-1 rounded flex-1 break-all" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
              {typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/facebook
            </code>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1877F2" }}
            >
              <ExternalLink size={13} />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium w-24 flex-shrink-0" style={{ color: "var(--c-text-sub)" }}>Verify Token</span>
            <code className="px-2 py-1 rounded" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
              bizilcore_verify_2024
            </code>
          </div>
        </div>
      </div>

      {/* Connected pages */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--c-border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>
            কানেক্টেড পেজ ({pages.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>লোড হচ্ছে…</div>
        ) : pages.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>
            এখনো কোনো পেজ কানেক্ট করা হয়নি
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {pages.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: "#1877F2" }}
                >
                  {p.pageName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--c-text)" }}>{p.pageName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>
                    {p.category ?? "Facebook Page"}
                    {p.followers ? ` • ${p.followers.toLocaleString()} followers` : ""}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                  সক্রিয়
                </span>
                <button
                  onClick={() => removePage(p.pageId)}
                  disabled={removing === p.pageId}
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                  style={{ color: "#E24B4A" }}
                  title="সরিয়ে দিন"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
