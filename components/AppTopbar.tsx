"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Package, MessageSquare, Check, Trash2, X, ShoppingBag, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import FeedbackWidget from "@/components/FeedbackWidget";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":          "ড্যাশবোর্ড",
  "/orders":             "অর্ডার",
  "/inventory":          "পণ্য ও স্টক",
  "/customers":          "কাস্টমার",
  "/suppliers":          "Supplier",
  "/hisab/purchases":    "মাল কেনা (Purchase)",
  "/hisab/due-ledger":   "বাকি খাতা",
  "/hisab":              "হিসাব",
  "/reports":            "রিপোর্ট",
  "/communications":     "যোগাযোগ কেন্দ্র",
  "/activity-log":       "Activity Log",
  "/settings":           "সেটিংস",
  "/admin":              "অ্যাডমিন প্যানেল",
  "/tasks":              "টাস্ক ম্যানেজমেন্ট",
};

interface LowStockProduct { id: string; name: string; stockQty: number; lowStockAt: number; }
interface SuggestedOrderItem { id: string; commenterName: string; commentText: string; }
interface NotifItem { id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; createdAt: string; }

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "এইমাত্র";
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)} দিন আগে`;
}

export default function AppTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [suggested, setSuggested] = useState<SuggestedOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "BizilCore";

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(d => {
      setUnread(d.unread ?? 0);
    }).catch(() => {});

    const pollReminders = () => {
      fetch("/api/tasks/reminders", { method: "POST" })
        .then(r => r.json())
        .then((d: { reminded?: number }) => {
          if (d.reminded && d.reminded > 0) {
            fetch("/api/notifications").then(r => r.json()).then(n => {
              setUnread(n.unread ?? 0);
            }).catch(() => {});
          }
        })
        .catch(() => {});
    };
    pollReminders();
    const interval = setInterval(pollReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function openPanel() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      setLoading(true);
      try {
        const d = await fetch("/api/notifications").then(r => r.json());
        setNotifications(d.notifications ?? []);
        setLowStock(d.lowStockProducts ?? []);
        setSuggested(d.suggestedOrders ?? []);
        setUnread(d.unread ?? 0);
      } catch {}
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(p => Math.max(0, p - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  async function clearRead() {
    await fetch("/api/notifications", { method: "DELETE" });
    setNotifications(p => p.filter(n => !n.read));
  }

  const isEmpty = lowStock.length === 0 && suggested.length === 0 && notifications.length === 0;

  return (
    <header
      className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0 sticky top-0 z-30"
      style={{
        backgroundColor: "var(--shell-bg)",
        borderColor: "var(--shell-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <h1 className="font-bold text-[15px] tracking-tight" style={{ color: "var(--shell-text)" }}>
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div ref={ref} className="relative">
          <button
            onClick={openPanel}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            style={{ backgroundColor: open ? "var(--c-primary-light)" : "var(--c-bg)", border: `1px solid ${open ? "var(--c-primary)" : "var(--c-border)"}` }}
          >
            <Bell size={17} style={{ color: open ? "var(--c-primary)" : "var(--c-text-sub)" }} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shadow-md"
                style={{ backgroundColor: "#EF4444", border: "2px solid var(--shell-bg)" }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50"
              style={{ width: 360, backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b"
                style={{ borderColor: "var(--c-border)", background: "linear-gradient(135deg, var(--c-bg), var(--c-surface))" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}>
                    <Bell size={13} color="#fff" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>নোটিফিকেশন</p>
                    {unread > 0 && (
                      <p className="text-[10px] font-semibold" style={{ color: "#EF4444" }}>{unread}টি অপঠিত</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:opacity-80"
                      style={{ backgroundColor: "#E8F5F0", color: "#0F6E56" }}>
                      <Check size={10} /> সব পড়া
                    </button>
                  )}
                  <button onClick={clearRead}
                    className="p-1.5 rounded-xl transition-colors hover:bg-gray-100"
                    title="পড়া notification মুছুন">
                    <Trash2 size={13} style={{ color: "var(--c-text-muted)" }} />
                  </button>
                  <button onClick={() => setOpen(false)}
                    className="p-1.5 rounded-xl transition-colors hover:bg-gray-100">
                    <X size={13} style={{ color: "var(--c-text-muted)" }} />
                  </button>
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex-shrink-0" style={{ backgroundColor: "var(--c-bg)" }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-full w-40" style={{ backgroundColor: "var(--c-bg)" }} />
                          <div className="h-2.5 rounded-full w-28" style={{ backgroundColor: "var(--c-bg)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isEmpty ? (
                  <div className="py-14 text-center px-6">
                    <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)" }}>
                      <Bell size={26} style={{ color: "#0F6E56" }} />
                    </div>
                    <p className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>সব ঠিকঠাক!</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>কোনো নতুন নোটিফিকেশন নেই।</p>
                  </div>
                ) : (
                  <>
                    {/* Low Stock Section */}
                    {lowStock.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "#EF4444" }}>⚠ কম স্টক</p>
                        </div>
                        {lowStock.map(p => (
                          <button key={p.id}
                            onClick={() => { router.push(`/inventory/${p.id}/edit`); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:brightness-95"
                            style={{ backgroundColor: "#FFF5F5" }}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ background: "linear-gradient(135deg, #FEE2E2, #FECACA)" }}>
                              <Package size={16} style={{ color: "#EF4444" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: "var(--c-text)" }}>কম স্টক: {p.name}</p>
                              <p className="text-[10px] font-medium mt-0.5" style={{ color: "#EF4444" }}>মাত্র {p.stockQty} টি বাকি আছে</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-xl flex-shrink-0"
                              style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>{p.stockQty}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Suggested Orders Section */}
                    {suggested.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "#1877F2" }}>💬 সম্ভাব্য অর্ডার</p>
                        </div>
                        {suggested.map(s => (
                          <button key={s.id}
                            onClick={() => { router.push(`/orders/new?suggestId=${s.id}&customerName=${encodeURIComponent(s.commenterName)}`); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:brightness-95"
                            style={{ backgroundColor: "#F0F6FF" }}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)" }}>
                              <MessageSquare size={16} style={{ color: "#1877F2" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold" style={{ color: "var(--c-text)" }}>{s.commenterName}</p>
                              <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>{s.commentText}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded-xl flex-shrink-0"
                              style={{ backgroundColor: "#DBEAFE", color: "#1877F2" }}>অর্ডার</span>
                          </button>
                        ))}
                      </>
                    )}

                    {/* System Notifications */}
                    {notifications.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>🔔 নোটিফিকেশন</p>
                        </div>
                        {notifications.map(n => (
                          <button key={n.id}
                            onClick={() => {
                              if (!n.read) markRead(n.id);
                              if (n.link) { router.push(n.link); setOpen(false); }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                            style={{
                              backgroundColor: n.read ? "transparent" : "#F0FDF7",
                              borderLeft: n.read ? "none" : "3px solid #0F6E56",
                            }}
                            onMouseEnter={e => { if (n.read) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--c-bg)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = n.read ? "transparent" : "#F0FDF7"; }}
                          >
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={{ background: n.read ? "linear-gradient(135deg, var(--c-bg), var(--c-border))" : "linear-gradient(135deg, #E8F5F0, #C8EDE3)" }}>
                              <Bell size={16} style={{ color: n.read ? "var(--c-text-muted)" : "#0F6E56" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold" style={{ color: n.read ? "var(--c-text-sub)" : "var(--c-text)" }}>{n.title}</p>
                              {n.body && <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>}
                              <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-muted)" }}>{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.read && (
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#0F6E56", boxShadow: "0 0 0 3px #C8EDE3" }} />
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {!isEmpty && !loading && (
                <div className="px-4 py-3 border-t text-center" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}>
                  <button onClick={() => { router.push("/activity-log"); setOpen(false); }}
                    className="text-xs font-bold transition-colors hover:underline"
                    style={{ color: "var(--c-primary)" }}>
                    সব activity দেখুন →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <FeedbackWidget />

        <button
          onClick={() => router.push("/orders/new")}
          className="hidden sm:flex items-center gap-2 text-[13px] font-semibold px-3.5 py-[7px] rounded-xl text-white hover:opacity-90 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)", boxShadow: "0 2px 8px rgba(15,110,86,0.35)" }}
        >
          <ShoppingBag size={13} />
          নতুন অর্ডার
        </button>

        <button
          onClick={() => router.push("/settings")}
          title="সেটিংস"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100 flex-shrink-0"
          style={{ color: "var(--shell-text-muted)", border: "1px solid var(--shell-border)" }}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
