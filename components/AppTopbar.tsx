"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Package, MessageSquare, Check, Trash2, X } from "lucide-react";
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
    setOpen(o => !o);
    if (!open) {
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

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    setUnread(0);
  }

  async function clearRead() {
    await fetch("/api/notifications", { method: "DELETE" });
    setNotifications(p => p.filter(n => !n.read));
  }

  const totalAlerts = unread + lowStock.length + suggested.length;

  return (
    <header
      className="flex items-center justify-between px-5 h-[52px] border-b flex-shrink-0 sticky top-0 z-30"
      style={{ backgroundColor: "var(--shell-bg)", borderColor: "var(--shell-border)" }}
    >
      <h1 className="font-semibold text-base" style={{ color: "var(--shell-text)" }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={ref} className="relative">
          <button onClick={openPanel} className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Bell size={18} style={{ color: "var(--c-text-sub)" }} />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#E24B4A" }}>
                {totalAlerts > 9 ? "9+" : totalAlerts}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-xl overflow-hidden z-50" style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                <span className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>নোটিফিকেশন</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} title="সব পড়া হিসেবে চিহ্নিত করুন" className="p-1 rounded-lg hover:bg-gray-100">
                      <Check size={14} style={{ color: "var(--c-primary)" }} />
                    </button>
                  )}
                  <button onClick={clearRead} title="পড়া notification মুছুন" className="p-1 rounded-lg hover:bg-gray-100">
                    <Trash2 size={14} style={{ color: "var(--c-text-muted)" }} />
                  </button>
                  <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X size={14} style={{ color: "var(--c-text-muted)" }} />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
                  </div>
                ) : (
                  <>
                    {/* Low Stock */}
                    {lowStock.map(p => (
                      <button key={p.id} onClick={() => { router.push(`/inventory/${p.id}/edit`); setOpen(false); }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b text-left"
                        style={{ borderColor: "var(--c-border)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFE8E8" }}>
                          <Package size={15} style={{ color: "#E24B4A" }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>কম স্টক: {p.name}</p>
                          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>মাত্র {p.stockQty} টি বাকি আছে</p>
                        </div>
                      </button>
                    ))}

                    {/* Suggested Orders */}
                    {suggested.map(s => (
                      <button key={s.id} onClick={() => { router.push(`/orders/new?suggestId=${s.id}&customerName=${encodeURIComponent(s.commenterName)}`); setOpen(false); }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b text-left"
                        style={{ borderColor: "var(--c-border)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E1F5EE" }}>
                          <MessageSquare size={15} style={{ color: "var(--c-primary)" }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>নতুন comment: {s.commenterName}</p>
                          <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--c-text-muted)" }}>{s.commentText}</p>
                        </div>
                      </button>
                    ))}

                    {/* System Notifications */}
                    {notifications.map(n => (
                      <button key={n.id} onClick={() => { if (n.link) { router.push(n.link); setOpen(false); } }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b text-left"
                        style={{ borderColor: "var(--c-border)", backgroundColor: n.read ? "transparent" : "#F0FDF7" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E1F5EE" }}>
                          <Bell size={15} style={{ color: "var(--c-primary)" }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>{n.title}</p>
                          {n.body && <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>}
                        </div>
                        {!n.read && <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: "var(--c-primary)" }} />}
                      </button>
                    ))}

                    {lowStock.length === 0 && suggested.length === 0 && notifications.length === 0 && (
                      <div className="py-10 text-center">
                        <Bell size={24} className="mx-auto mb-2" style={{ color: "var(--c-border)" }} />
                        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>কোনো notification নেই</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <FeedbackWidget />

        <button
          onClick={() => router.push("/orders/new")}
          className="hidden sm:flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg text-white"
          style={{ backgroundColor: "var(--c-primary)" }}
        >
          + নতুন অর্ডার
        </button>
      </div>
    </header>
  );
}
