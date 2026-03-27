"use client";

import { useEffect, useState } from "react";
import {
  Users, Store, ShoppingCart, TrendingUp, RefreshCw, Crown,
  CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, Smartphone,
  Tag, Save, ToggleLeft, ToggleRight,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface ShopRow {
  id: string;
  name: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    subscription: { plan: string; status: string; endDate: string | null } | null;
  };
  _count: { products: number; customers: number; staffMembers: number };
}

interface Stats {
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number;
  planCounts: { plan: string; _count: { _all: number } }[];
  recentShops: ShopRow[];
}

interface Payment {
  id: string;
  plan: string;
  months: number;
  amount: number;
  method: string;
  transactionId: string | null;
  senderPhone: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    subscription: { plan: string; status: string; endDate: string | null } | null;
  };
}

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  free:     { bg: "#F0F0F0", text: "#666" },
  pro:      { bg: "var(--c-primary-light)", text: "var(--c-primary)" },
  business: { bg: "#FFF3DC", text: "#EF9F27" },
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "Pending",  color: "#D97706", bg: "#FEF3C7" },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEF2F2" },
};

const METHOD_LABEL: Record<string, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "Bank" };

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

const TABS = ["overview", "payments", "shops", "newsletter", "pricing"] as const;
type Tab = typeof TABS[number];

interface PricingConfig {
  id: string;
  planKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  discountEnabled: boolean;
  discountPercent: number;
  discountLabel: string;
}

interface NewsletterSub {
  id: string;
  email: string;
  status: string;
  subscribedAt: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilter, setPaymentFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ paymentId: string; action: "approve" | "reject" } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [planModal, setPlanModal] = useState<{ userId: string; name: string; currentPlan: string } | null>(null);
  const [newPlan, setNewPlan] = useState("pro");
  const [newMonths, setNewMonths] = useState(1);
  const [newsletter, setNewsletter] = useState<{ subscribers: NewsletterSub[]; total: number; active: number } | null>(null);
  const [nlLoading, setNlLoading] = useState(false);
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [pricingDraft, setPricingDraft] = useState<PricingConfig[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);

  async function loadStats() {
    setLoading(true);
    const r = await fetch("/api/admin/stats");
    if (r.ok) setStats(await r.json());
    setLoading(false);
  }

  async function loadPayments(status: string) {
    setPayLoading(true);
    const r = await fetch(`/api/admin/payments?status=${status}`);
    if (r.ok) {
      const d = await r.json();
      setPayments(d.payments);
    }
    setPayLoading(false);
  }

  async function loadNewsletter() {
    setNlLoading(true);
    const r = await fetch("/api/admin/newsletter?status=all");
    if (r.ok) setNewsletter(await r.json());
    setNlLoading(false);
  }

  async function loadPricing() {
    setPricingLoading(true);
    const r = await fetch("/api/admin/pricing");
    if (r.ok) {
      const data = await r.json();
      setPricingConfigs(data);
      setPricingDraft(JSON.parse(JSON.stringify(data)));
    }
    setPricingLoading(false);
  }

  async function savePricing() {
    setPricingSaving(true);
    const r = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricingDraft),
    });
    setPricingSaving(false);
    if (r.ok) {
      const data = await r.json();
      setPricingConfigs(data);
      setPricingDraft(JSON.parse(JSON.stringify(data)));
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 3000);
    }
  }

  function updateDraft(planKey: string, field: keyof PricingConfig, value: string | number | boolean) {
    setPricingDraft(prev => prev.map(p => p.planKey === planKey ? { ...p, [field]: value } : p));
  }

  useEffect(() => { loadStats(); }, []);
  useEffect(() => {
    if (tab === "payments") loadPayments(paymentFilter);
    if (tab === "newsletter") loadNewsletter();
    if (tab === "pricing") loadPricing();
  }, [tab, paymentFilter]);

  async function runCron() {
    setRunningCron(true);
    setCronResult(null);
    const r = await fetch("/api/cron/check-subscriptions", {
      headers: { Authorization: "Bearer bizilcore-cron" },
    });
    const d = await r.json();
    setRunningCron(false);
    setCronResult(r.ok ? `✓ ${d.checked} subscriptions checked, ${d.expired} expired.` : "Cron failed.");
  }

  async function handlePaymentAction(paymentId: string, action: "approve" | "reject", note?: string) {
    setActionLoading(paymentId);
    const r = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: note }),
    });
    setActionLoading(null);
    setNoteModal(null);
    setNoteText("");
    if (r.ok) loadPayments(paymentFilter);
  }

  async function handleSetPlan() {
    if (!planModal) return;
    const r = await fetch(`/api/admin/users/${planModal.userId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan, months: newMonths }),
    });
    setPlanModal(null);
    if (r.ok) {
      loadStats();
      if (tab === "payments") loadPayments(paymentFilter);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}</div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return <p className="text-center py-20" style={{ color: S.muted }}>ডেটা লোড করা যায়নি।</p>;

  const pendingCount = tab === "payments" ? payments.filter(p => p.status === "pending").length : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: S.text }}>Admin Dashboard</h2>
        <button onClick={loadStats} className="p-2 rounded-xl border hover:bg-white transition-colors" style={{ borderColor: S.border }}>
          <RefreshCw size={16} style={{ color: S.secondary }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: S.border }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all relative"
            style={{
              backgroundColor: tab === t ? S.surface : "transparent",
              color: tab === t ? S.text : S.muted,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === "payments" ? "Payments" : t === "shops" ? "Shops" : t === "newsletter" ? "Newsletter" : t === "pricing" ? "Pricing" : "Overview"}
            {t === "payments" && stats && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                {stats.planCounts.reduce((a, b) => a + b._count._all, 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "মোট Users", value: stats.totalUsers, icon: Users, color: S.primary, bg: "var(--c-primary-light)" },
              { label: "মোট Shops", value: stats.totalShops, icon: Store, color: "#2B7CE9", bg: "#E1F0FF" },
              { label: "মোট Orders", value: stats.totalOrders, icon: ShoppingCart, color: "#EF9F27", bg: "#FFF3DC" },
              { label: "মোট Revenue", value: formatBDT(stats.totalRevenue), icon: TrendingUp, color: S.primary, bg: "var(--c-primary-light)" },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: S.text }}>{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: S.muted }}>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <Crown size={16} style={{ color: "#EF9F27" }} />
              <h3 className="font-semibold text-sm" style={{ color: S.text }}>Subscription Plans</h3>
            </div>
            <div className="flex gap-3 flex-wrap">
              {stats.planCounts.map(p => {
                const style = PLAN_COLOR[p.plan] ?? PLAN_COLOR.free;
                return (
                  <div key={p.plan} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: style.bg }}>
                    <span className="text-sm font-bold" style={{ color: style.text }}>{p._count._all}</span>
                    <span className="text-xs font-medium uppercase" style={{ color: style.text }}>{p.plan}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm mb-2" style={{ color: S.text }}>Subscription Cron Job</h3>
            <p className="text-xs mb-3" style={{ color: S.muted }}>
              Expired subscriptions-কে Free plan-এ ফিরিয়ে আনে।
            </p>
            <div className="p-3 rounded-xl mb-3 font-mono text-xs break-all" style={{ backgroundColor: S.bg, color: S.secondary }}>
              GET /api/cron/check-subscriptions<br/>
              Authorization: Bearer bizilcore-cron
            </div>
            <div className="flex items-center gap-3">
              <button onClick={runCron} disabled={runningCron}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
                {runningCron ? "চলছে..." : "এখনই চালান"}
              </button>
              {cronResult && <span className="text-sm" style={{ color: cronResult.startsWith("✓") ? S.primary : "#E24B4A" }}>{cronResult}</span>}
            </div>
          </div>
        </>
      )}

      {/* PAYMENTS TAB */}
      {tab === "payments" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["pending", "approved", "rejected", ""].map((f) => (
              <button
                key={f || "all"}
                onClick={() => setPaymentFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: paymentFilter === f ? S.primary : S.surface,
                  color: paymentFilter === f ? "#fff" : S.secondary,
                  borderColor: paymentFilter === f ? S.primary : S.border,
                }}
              >
                {f === "" ? "সব" : STATUS_STYLE[f]?.label ?? f}
              </button>
            ))}
          </div>

          {payLoading ? (
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: S.border }} />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-14 text-center rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <AlertCircle size={28} style={{ color: S.muted, margin: "0 auto 8px" }} />
              <p className="text-sm" style={{ color: S.muted }}>কোনো payment নেই</p>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
              {payments.map((p, i) => {
                const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
                const planS = PLAN_COLOR[p.plan] ?? PLAN_COLOR.free;
                const isLoading = actionLoading === p.id;
                return (
                  <div
                    key={p.id}
                    className="p-4"
                    style={{
                      backgroundColor: S.surface,
                      borderTop: i > 0 ? `1px solid ${S.border}` : "none",
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-bold" style={{ color: S.text }}>{p.user.name}</p>
                          <span className="text-xs" style={{ color: S.muted }}>{p.user.email}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: planS.bg, color: planS.text }}>
                            Current: {p.user.subscription?.plan ?? "free"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: S.secondary }}>
                          <span>📦 {p.plan.toUpperCase()} · {p.months}মাস · ৳{p.amount}</span>
                          <span>{METHOD_LABEL[p.method] ?? p.method}</span>
                          <span className="font-mono">TrxID: {p.transactionId || "—"}</span>
                          {p.senderPhone && <span>📱 {p.senderPhone}</span>}
                          <span>{new Date(p.createdAt).toLocaleString("bn-BD")}</span>
                        </div>
                        {p.adminNote && (
                          <p className="text-xs mt-1" style={{ color: ss.color }}>📝 {p.adminNote}</p>
                        )}
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: ss.bg, color: ss.color }}
                        >
                          {p.status === "pending" ? <Clock size={11} /> : p.status === "approved" ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {ss.label}
                        </span>

                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => setNoteModal({ paymentId: p.id, action: "approve" })}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: "#059669" }}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => setNoteModal({ paymentId: p.id, action: "reject" })}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: "#DC2626" }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setPlanModal({ userId: p.user.id, name: p.user.name, currentPlan: p.user.subscription?.plan ?? "free" });
                            setNewPlan(p.plan);
                            setNewMonths(p.months);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                          style={{ borderColor: S.border, color: S.secondary }}
                        >
                          Plan Set
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SHOPS TAB */}
      {tab === "shops" && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <div className="px-5 py-3 border-b" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold text-sm" style={{ color: S.text }}>সব Shops ({stats.recentShops.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: S.bg }}>
                  {["Shop", "Owner", "Plan", "Products", "Customers", "Staff", "যোগ দিয়েছে", "Actions"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: S.secondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentShops.map((shop, i) => {
                  const planStyle = PLAN_COLOR[shop.user.subscription?.plan ?? "free"] ?? PLAN_COLOR.free;
                  return (
                    <tr key={shop.id} style={{ backgroundColor: i % 2 === 0 ? S.surface : S.bg }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: S.text }}>{shop.name}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{shop.id.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm" style={{ color: S.text }}>{shop.user.name}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{shop.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: planStyle.bg, color: planStyle.text }}>
                          {shop.user.subscription?.plan ?? "free"}
                        </span>
                        {shop.user.subscription?.status === "expired" && (
                          <span className="ml-1 text-xs" style={{ color: "#E24B4A" }}>expired</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: S.text }}>{shop._count.products}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: S.text }}>{shop._count.customers}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: S.text }}>{shop._count.staffMembers}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>
                        {new Date(shop.user.createdAt).toLocaleDateString("bn-BD")}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setPlanModal({ userId: shop.user.id, name: shop.user.name, currentPlan: shop.user.subscription?.plan ?? "free" });
                            setNewPlan(shop.user.subscription?.plan ?? "pro");
                            setNewMonths(1);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                          style={{ borderColor: S.border, color: S.secondary }}
                        >
                          Plan Set
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NEWSLETTER TAB ── */}
      {tab === "newsletter" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
            <div>
              <h3 className="font-bold text-base" style={{ color: S.text }}>Newsletter Subscribers</h3>
              {newsletter && (
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                  মোট: {newsletter.total} · সক্রিয়: {newsletter.active}
                </p>
              )}
            </div>
            <button onClick={loadNewsletter} className="p-2 rounded-xl border hover:bg-gray-50 transition-colors" style={{ borderColor: S.border }}>
              <RefreshCw size={14} style={{ color: S.muted }} />
            </button>
          </div>

          {nlLoading ? (
            <div className="p-8 text-center text-sm" style={{ color: S.muted }}>লোড হচ্ছে...</div>
          ) : !newsletter || newsletter.subscribers.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: S.muted }}>এখনো কোনো subscriber নেই।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: S.bg, borderBottom: `1px solid ${S.border}` }}>
                    {["ইমেইল", "তারিখ", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: S.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newsletter.subscribers.map((sub, i) => (
                    <tr key={sub.id} style={{ borderBottom: i < newsletter.subscribers.length - 1 ? `1px solid ${S.border}` : "none" }}>
                      <td className="px-5 py-3 font-medium" style={{ color: S.text }}>{sub.email}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: S.muted }}>
                        {new Date(sub.subscribedAt).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: sub.status === "active" ? "#ECFDF5" : "#FEF2F2",
                            color: sub.status === "active" ? "#059669" : "#DC2626",
                          }}
                        >
                          {sub.status === "active" ? "সক্রিয়" : "Unsubscribed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ACTION NOTE MODAL */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-md" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-bold text-base mb-3" style={{ color: S.text }}>
              {noteModal.action === "approve" ? "✅ Payment Approve করুন" : "❌ Payment Reject করুন"}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Admin note (ঐচ্ছিক) — user-কে দেখানো হবে"
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none mb-4"
              style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setNoteModal(null); setNoteText(""); }}
                className="flex-1 py-2.5 rounded-xl border text-sm"
                style={{ borderColor: S.border, color: S.secondary }}
              >
                বাতিল
              </button>
              <button
                onClick={() => handlePaymentAction(noteModal.paymentId, noteModal.action, noteText)}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: noteModal.action === "approve" ? "#059669" : "#DC2626" }}
              >
                {noteModal.action === "approve" ? "Approve করুন" : "Reject করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICING TAB */}
      {tab === "pricing" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={18} style={{ color: S.primary }} />
              <h3 className="font-bold text-base" style={{ color: S.text }}>Plan Pricing ম্যানেজমেন্ট</h3>
            </div>
            <button
              onClick={savePricing}
              disabled={pricingSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all"
              style={{ backgroundColor: pricingSaved ? "#059669" : S.primary }}
            >
              <Save size={14} />
              {pricingSaving ? "সেভ হচ্ছে..." : pricingSaved ? "সেভ হয়েছে ✓" : "পরিবর্তন সেভ করুন"}
            </button>
          </div>

          {pricingLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ backgroundColor: S.border }} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {pricingDraft.map((pc) => {
                const planName = pc.planKey === "free" ? "Free" : pc.planKey === "pro" ? "Pro" : "Business";
                const planColor = pc.planKey === "free" ? "#6B7280" : pc.planKey === "pro" ? S.primary : "#EF9F27";
                const discountedMonthly = pc.discountEnabled && pc.discountPercent > 0
                  ? Math.round(pc.monthlyPrice * (1 - pc.discountPercent / 100))
                  : pc.monthlyPrice;
                const discountedYearly = pc.discountEnabled && pc.discountPercent > 0
                  ? Math.round(pc.yearlyPrice * (1 - pc.discountPercent / 100))
                  : pc.yearlyPrice;

                return (
                  <div key={pc.planKey} className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: pc.planKey === "pro" ? "var(--c-primary-light)" : pc.planKey === "business" ? "#FFF3DC" : "#F3F4F6", color: planColor }}>
                        {planName}
                      </span>
                      {pc.discountEnabled && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FCD34D", color: "#92400E" }}>
                          {pc.discountPercent}% ছাড় চলছে
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>মাসিক মূল্য (৳)</label>
                        <input
                          type="number"
                          min={0}
                          value={pc.monthlyPrice}
                          onChange={(e) => updateDraft(pc.planKey, "monthlyPrice", Number(e.target.value))}
                          disabled={pc.planKey === "free"}
                          className="w-full px-3 py-2 rounded-xl border text-sm outline-none disabled:opacity-50"
                          style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
                        />
                        {pc.discountEnabled && pc.discountPercent > 0 && pc.monthlyPrice > 0 && (
                          <p className="text-xs mt-1 font-medium" style={{ color: "#059669" }}>
                            ছাড়ের পর: ৳{discountedMonthly}/মাস
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>বার্ষিক মূল্য (৳/মাস)</label>
                        <input
                          type="number"
                          min={0}
                          value={pc.yearlyPrice}
                          onChange={(e) => updateDraft(pc.planKey, "yearlyPrice", Number(e.target.value))}
                          disabled={pc.planKey === "free"}
                          className="w-full px-3 py-2 rounded-xl border text-sm outline-none disabled:opacity-50"
                          style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
                        />
                        {pc.discountEnabled && pc.discountPercent > 0 && pc.yearlyPrice > 0 && (
                          <p className="text-xs mt-1 font-medium" style={{ color: "#059669" }}>
                            ছাড়ের পর: ৳{discountedYearly}/মাস
                          </p>
                        )}
                      </div>
                    </div>

                    {pc.planKey !== "free" && (
                      <div className="border-t pt-4" style={{ borderColor: S.border }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Tag size={14} style={{ color: S.primary }} />
                            <span className="text-sm font-semibold" style={{ color: S.text }}>ডিসকাউন্ট অফার</span>
                          </div>
                          <button
                            onClick={() => updateDraft(pc.planKey, "discountEnabled", !pc.discountEnabled)}
                            className="flex items-center gap-1.5 text-sm font-medium"
                            style={{ color: pc.discountEnabled ? S.primary : S.muted }}
                          >
                            {pc.discountEnabled
                              ? <ToggleRight size={22} style={{ color: S.primary }} />
                              : <ToggleLeft size={22} style={{ color: S.muted }} />
                            }
                            {pc.discountEnabled ? "চালু" : "বন্ধ"}
                          </button>
                        </div>

                        {pc.discountEnabled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ছাড়ের পরিমাণ (%)</label>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={pc.discountPercent}
                                onChange={(e) => updateDraft(pc.planKey, "discountPercent", Math.min(99, Math.max(1, Number(e.target.value))))}
                                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                                style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
                                placeholder="যেমন: 50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ব্যাজ লেবেল</label>
                              <input
                                type="text"
                                value={pc.discountLabel}
                                onChange={(e) => updateDraft(pc.planKey, "discountLabel", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                                style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
                                placeholder="যেমন: ৫০% ঈদ অফার"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border p-4" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#92400E" }}>⚠️ গুরুত্বপূর্ণ নোট</p>
            <p className="text-xs" style={{ color: "#78350F" }}>
              দাম পরিবর্তন করলে Pricing পেজ, bKash ও Nagad payment এ সাথে সাথে নতুন দাম প্রযোজ্য হবে।
              বিদ্যমান subscriptions এ কোনো প্রভাব পড়বে না।
            </p>
          </div>
        </div>
      )}

      {/* SET PLAN MODAL */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-bold text-base mb-1" style={{ color: S.text }}>Plan Set করুন</h3>
            <p className="text-xs mb-4" style={{ color: S.muted }}>{planModal.name} — বর্তমান: {planModal.currentPlan}</p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </div>
              {newPlan !== "free" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.text }}>মেয়াদ (মাস)</label>
                  <select
                    value={newMonths}
                    onChange={(e) => setNewMonths(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
                  >
                    {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} মাস</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPlanModal(null)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>
                বাতিল
              </button>
              <button
                onClick={handleSetPlan}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: S.primary }}
              >
                Set করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
