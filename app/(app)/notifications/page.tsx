"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Trash2, Trophy, Gift, TrendingUp, Lightbulb, Package, ShoppingBag, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell, Tabs, Badge, Card, Button, EmptyState, StatCard } from "@/components/ui";

interface NotifItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  achievement: { icon: <Trophy size={16} />, color: "#F59E0B", bg: "#FEF3C7", label: "অর্জন" },
  referral: { icon: <Gift size={16} />, color: "#8B5CF6", bg: "#EDE9FE", label: "রেফারেল" },
  plan_expiry: { icon: <Star size={16} />, color: "#EF4444", bg: "#FEE2E2", label: "প্ল্যান" },
  weekly_tip: { icon: <Lightbulb size={16} />, color: "#0EA5E9", bg: "#E0F2FE", label: "টিপস" },
  low_stock: { icon: <Package size={16} />, color: "#EF4444", bg: "#FEE2E2", label: "স্টক" },
  order: { icon: <ShoppingBag size={16} />, color: "#10B981", bg: "#D1FAE5", label: "অর্ডার" },
  promotion: { icon: <TrendingUp size={16} />, color: "#F59E0B", bg: "#FEF3C7", label: "প্রমো" },
  system: { icon: <Bell size={16} />, color: "#0F6E56", bg: "#D1FAE5", label: "সিস্টেম" },
};

const FILTER_TABS = [
  { key: "all", label: "সব" },
  { key: "unread", label: "অপঠিত" },
  { key: "achievement", label: "অর্জন" },
  { key: "referral", label: "রেফারেল" },
  { key: "weekly_tip", label: "টিপস" },
  { key: "plan_expiry", label: "প্ল্যান" },
  { key: "system", label: "সিস্টেম" },
];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString("bn-BD");
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/notifications").then(r => r.json());
      setNotifications(d.notifications ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {});
    setNotifications(p => p.map(n => ({ ...n, read: true })));
  }

  async function clearRead() {
    setDeleting(true);
    await fetch("/api/notifications", { method: "DELETE" }).catch(() => {});
    setNotifications(p => p.filter(n => !n.read));
    setDeleting(false);
  }

  function handleClick(n: NotifItem) {
    if (!n.read) markRead(n.id);
    if (n.link) router.push(n.link);
  }

  const meta = (type: string) => TYPE_META[type] ?? TYPE_META.system;

  return (
    <PageShell
      title="নোটিফিকেশন"
      subtitle={unreadCount > 0 ? `${unreadCount}টি অপঠিত` : "সব আপডেট এক জায়গায়"}
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" icon={Check} onClick={markAllRead}>সব পড়া</Button>
          )}
          <Button variant="outline" size="sm" icon={Trash2} onClick={clearRead} disabled={deleting} loading={deleting}>
            পড়া মুছুন
          </Button>
        </div>
      }
      stats={
        <>
          <StatCard label="মোট" value={notifications.length} icon={Bell} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--bg-info-text)" />
          <StatCard label="অপঠিত" value={unreadCount} icon={Bell} accent="red" iconBg="var(--bg-danger-soft)" iconColor="var(--bg-danger-text)" />
        </>
      }
    >
      <Tabs
        tabs={FILTER_TABS.map(tab => ({
          key: tab.key,
          label: tab.label,
          count: tab.key === "unread" && unreadCount > 0 ? unreadCount : undefined,
        }))}
        active={filter}
        onChange={setFilter}
      />
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "var(--c-surface)" }}>
              <div className="w-11 h-11 rounded-2xl flex-shrink-0" style={{ backgroundColor: "var(--c-bg)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-48" style={{ backgroundColor: "var(--c-bg)" }} />
                <div className="h-2.5 rounded-full w-36" style={{ backgroundColor: "var(--c-bg)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="কোনো নোটিফিকেশন নেই"
          description={filter === "unread" ? "সব নোটিফিকেশন পড়া হয়ে গেছে!" : "এই বিভাগে এখন কোনো নোটিফিকেশন নেই।"}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const m = meta(n.type);
            return (
              <Card
                key={n.id}
                padding="md"
                className="cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-3.5 w-full text-left">
                {/* Icon */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
                  style={{ backgroundColor: n.read ? "var(--c-bg)" : m.bg, color: n.read ? "var(--c-text-muted)" : m.color }}>
                  {m.icon}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-snug"
                      style={{ color: n.read ? "var(--c-text-sub)" : "var(--c-text)" }}>
                      {n.title}
                    </p>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0F6E56" }} />
                      )}
                      <span className="text-[10px] whitespace-nowrap" style={{ color: "var(--c-text-muted)" }}>
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>
                  {n.body && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
                      {n.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={n.type === "plan_expiry" || n.type === "low_stock" ? "danger" : n.type === "achievement" ? "warning" : "success"}>
                      {m.label}
                    </Badge>
                    {n.link && (
                      <span className="text-[10px] font-semibold" style={{ color: "var(--c-primary)" }}>
                        দেখুন →
                      </span>
                    )}
                  </div>
                </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
