"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Inbox, MessageSquare, MessageCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import CommentOrdersPanel from "@/components/fb-orders/CommentOrdersPanel";
import MessengerPanel from "@/components/fb-orders/MessengerPanel";

type View = "comments" | "messenger";

export default function FbInboxPage() {
  const params  = useSearchParams();
  const router  = useRouter();
  const initial = (params.get("view") === "messenger" ? "messenger" : "comments") as View;
  const [view, setView] = useState<View>(initial);

  useEffect(() => {
    const v = params.get("view") === "messenger" ? "messenger" : "comments";
    setView(v as View);
  }, [params]);

  const switchView = (v: View) => {
    setView(v);
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("view", v);
    router.replace(`/fb-orders?${sp.toString()}`);
  };

  const tabs: { key: View; label: string; icon: typeof MessageSquare; sub: string }[] = [
    { key: "comments",  label: "কমেন্ট অর্ডার",   icon: MessageSquare, sub: "পোস্ট থেকে অর্ডার" },
    { key: "messenger", label: "Messenger রিপ্লাই", icon: MessageCircle, sub: "অটো-রিপ্লাই ও বার্তা" },
  ];

  return (
    <div className="space-y-5">
      {/* Modern hero header */}
      <div
        className="rounded-3xl border p-5 md:p-6 relative overflow-hidden"
        style={{
          borderColor: "var(--c-border)",
          background:
            "linear-gradient(135deg, rgba(24,119,242,0.08) 0%, rgba(15,110,86,0.06) 60%, rgba(255,255,255,0) 100%), var(--c-surface)",
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: "linear-gradient(135deg, #1877F2 0%, #0B5FD9 100%)" }}
            >
              <Inbox size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
                Facebook ইনবক্স
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                পোস্টের কমেন্ট অর্ডার এবং Messenger অটো-রিপ্লাই — সব এক জায়গায়
              </p>
            </div>
          </div>

          <Link
            href="/fb-connect"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:shadow-sm"
            style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text-sub)" }}
          >
            <LinkIcon size={13} />
            পেজ কানেক্ট করুন
          </Link>
        </div>

        {/* Decorative orb */}
        <div
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(24,119,242,0.35) 0%, transparent 70%)" }}
        />

        {/* Segmented tabs */}
        <div
          className="mt-5 inline-flex p-1 rounded-2xl border relative z-10"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}
        >
          {tabs.map((t) => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                onClick={() => switchView(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" : "transparent",
                  color: active ? "#fff" : "var(--c-text-sub)",
                  boxShadow: active ? "0 4px 12px rgba(15,110,86,0.25)" : "none",
                }}
              >
                <t.icon size={14} />
                <span>{t.label}</span>
                <span className="hidden sm:inline opacity-70 font-normal text-[10px]">· {t.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {view === "comments" ? <CommentOrdersPanel /> : <MessengerPanel />}
    </div>
  );
}
