"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Inbox, MessageSquare, MessageCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import CommentOrdersPanel from "@/components/fb-orders/CommentOrdersPanel";
import MessengerPanel from "@/components/fb-orders/MessengerPanel";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";

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

  const tabs = [
    { key: "comments", label: "কমেন্ট অর্ডার", icon: MessageSquare },
    { key: "messenger", label: "Messenger রিপ্লাই", icon: MessageCircle },
  ] as const;

  return (
    <div className="space-y-5">
      <div
        className="card-premium rounded-2xl p-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, #1877F2 8%, var(--c-surface)) 0%, color-mix(in srgb, var(--c-primary) 6%, var(--c-surface)) 60%, var(--c-surface) 100%)",
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
              <h1 className="text-xl font-bold tracking-tight font-display" style={{ color: "var(--c-text)" }}>
                Facebook ইনবক্স
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                পোস্টের কমেন্ট অর্ডার এবং Messenger অটো-রিপ্লাই — সব এক জায়গায়
              </p>
            </div>
          </div>

          <Link href="/fb-connect">
            <Button variant="outline" size="sm" icon={LinkIcon}>
              পেজ কানেক্ট করুন
            </Button>
          </Link>
        </div>

        <div
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(24,119,242,0.35) 0%, transparent 70%)" }}
        />

        <div className="mt-5 relative z-10">
          <Tabs
            tabs={tabs.map(t => ({ key: t.key, label: t.label, icon: t.icon }))}
            active={view}
            onChange={(k) => switchView(k as View)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <Card padding="none" className="overflow-hidden min-h-[480px]">
          {view === "comments" ? <CommentOrdersPanel /> : <MessengerPanel />}
        </Card>
      </div>
    </div>
  );
}
