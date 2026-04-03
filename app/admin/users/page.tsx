"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, RefreshCw, ShieldOff, ShieldCheck, Clock,
  Trash2, Loader2, X, ChevronDown, Store,
} from "lucide-react";

const S = {
  surface: "var(--c-surface, #fff)", border: "var(--c-border, #E8E6DF)",
  text: "var(--c-text, #1A1A18)", muted: "var(--c-text-muted, #9B9B97)",
  secondary: "var(--c-text-sub, #6B6B67)", primary: "var(--c-primary, #0F6E56)",
  bg: "var(--c-bg, #F7F6F2)",
};

const STATUS_CFG = {
  active:    { label: "সক্রিয়",   color: "#059669", bg: "#ECFDF5", icon: ShieldCheck },
  disabled:  { label: "নিষ্ক্রিয়", color: "#DC2626", bg: "#FEF2F2", icon: ShieldOff },
  suspended: { label: "স্থগিত",   color: "#D97706", bg: "#FFFBEB", icon: Clock },
};

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  free:     { bg: "#F0F0F0", text: "#666" },
  pro:      { bg: "#DCFCE7", text: "#166534" },
  business: { bg: "#FFF3DC", text: "#92400E" },
};

interface User {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
  statusReason: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  onboarded: boolean;
  totalOrders: number;
  subscription: { plan: string; status: string; endDate: string | null } | null;
  shop: { name: string; businessType: string | null } | null;
}

type ActionType = "disable" | "suspend" | "activate" | "delete";

interface ActionModal {
  user: User;
  action: ActionType;
}

const ACTION_CFG: Record<ActionType, { label: string; color: string; description: string; needsReason: boolean }> = {
  disable:  { label: "নিষ্ক্রিয় করুন",    color: "#DC2626", description: "ব্যবহারকারী লগইন করতে পারবে না এবং একটি ইমেইল পাবে।", needsReason: true },
  suspend:  { label: "স্থগিত করুন",       color: "#D97706", description: "ব্যবহারকারী লগইন করতে পারবে কিন্তু একটি সতর্কতা দেখবে।", needsReason: true },
  activate: { label: "পুনরায় সক্রিয় করুন", color: "#059669", description: "ব্যবহারকারীর অ্যাকাউন্ট আবার স্বাভাবিক হবে।", needsReason: false },
  delete:   { label: "স্থায়ীভাবে মুছুন",   color: "#DC2626", description: "এই অ্যাকাউন্ট এবং সব ডেটা চিরতরে মুছে যাবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।", needsReason: false },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<ActionModal | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`/api/admin/users?${params}`);
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  function openModal(user: User, action: ActionType) {
    setReason("");
    setModal({ user, action });
  }

  async function executeAction() {
    if (!modal) return;
    setSaving(true);

    if (modal.action === "delete") {
      const r = await fetch(`/api/admin/users?id=${modal.user.id}`, { method: "DELETE" });
      setSaving(false);
      if (!r.ok) { const d = await r.json(); showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
      setUsers(prev => prev.filter(u => u.id !== modal.user.id));
      setModal(null);
      showToast("success", `${modal.user.name} এর অ্যাকাউন্ট মুছে ফেলা হয়েছে`);
      return;
    }

    const statusMap: Record<ActionType, string> = {
      disable: "disabled", suspend: "suspended", activate: "active", delete: "active",
    };
    const newStatus = statusMap[modal.action];

    const r = await fetch(`/api/admin/users/${modal.user.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: newStatus, statusReason: reason }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }

    setUsers(prev => prev.map(u => u.id === modal.user.id
      ? { ...u, accountStatus: newStatus, statusReason: reason || null, statusUpdatedAt: new Date().toISOString() }
      : u
    ));
    setModal(null);
    const actionLabels: Record<string, string> = {
      disabled: "নিষ্ক্রিয় করা হয়েছে", suspended: "স্থগিত করা হয়েছে", active: "সক্রিয় করা হয়েছে",
    };
    showToast("success", `${modal.user.name} এর অ্যাকাউন্ট ${actionLabels[newStatus]}`);
  }

  const counts = {
    all: users.length,
    active: users.filter(u => u.accountStatus === "active").length,
    disabled: users.filter(u => u.accountStatus === "disabled").length,
    suspended: users.filter(u => u.accountStatus === "suspended").length,
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EDE9FE" }}>
            <Users size={20} style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>User Management</h1>
            <p className="text-sm" style={{ color: S.muted }}>সব seller অ্যাকাউন্ট পরিচালনা করুন</p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
          <RefreshCw size={15} style={{ color: S.muted }} />
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "", label: "সব", count: counts.all, color: S.primary, bg: "var(--c-primary-light, #DCFCE7)" },
          { key: "active", label: "সক্রিয়", count: counts.active, color: "#059669", bg: "#ECFDF5" },
          { key: "suspended", label: "স্থগিত", count: counts.suspended, color: "#D97706", bg: "#FFFBEB" },
          { key: "disabled", label: "নিষ্ক্রিয়", count: counts.disabled, color: "#DC2626", bg: "#FEF2F2" },
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={{
              backgroundColor: statusFilter === f.key ? f.color : S.surface,
              color: statusFilter === f.key ? "#fff" : f.color,
              borderColor: statusFilter === f.key ? f.color : S.border,
            }}>
            {f.label} <span className="font-bold">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: S.surface }} />)}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <Users size={32} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.text }}>কোনো user পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
          {users.map((user, i) => {
            const st = STATUS_CFG[user.accountStatus as keyof typeof STATUS_CFG] ?? STATUS_CFG.active;
            const StIcon = st.icon;
            const plan = user.subscription?.plan ?? "free";
            const planStyle = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
            return (
              <div key={user.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3"
                style={{
                  backgroundColor: S.surface,
                  borderTop: i > 0 ? `1px solid ${S.border}` : "none",
                  opacity: user.accountStatus === "disabled" ? 0.8 : 1,
                }}>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm" style={{ color: S.text }}>{user.name}</p>
                    <span className="text-xs" style={{ color: S.muted }}>{user.email}</span>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: st.bg, color: st.color }}>
                      <StIcon size={10} /> {st.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: planStyle.bg, color: planStyle.text }}>
                      {plan.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: S.muted }}>
                    {user.shop && (
                      <span className="flex items-center gap-1">
                        <Store size={11} /> {user.shop.name}
                      </span>
                    )}
                    <span>অর্ডার: {user.totalOrders}</span>
                    <span>যোগ দিয়েছে: {new Date(user.createdAt).toLocaleDateString("bn-BD")}</span>
                    {!user.onboarded && <span className="text-orange-500">Onboarding বাকি</span>}
                  </div>
                  {user.statusReason && user.accountStatus !== "active" && (
                    <p className="text-xs mt-1 italic" style={{ color: st.color }}>
                      কারণ: {user.statusReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {user.accountStatus !== "active" && (
                    <button onClick={() => openModal(user, "activate")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: "#059669" }}>
                      <ShieldCheck size={12} /> সক্রিয়
                    </button>
                  )}
                  {user.accountStatus !== "suspended" && user.accountStatus !== "disabled" && (
                    <button onClick={() => openModal(user, "suspend")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: "#D97706" }}>
                      <Clock size={12} /> স্থগিত
                    </button>
                  )}
                  {user.accountStatus !== "disabled" && (
                    <button onClick={() => openModal(user, "disable")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: "#DC2626" }}>
                      <ShieldOff size={12} /> নিষ্ক্রিয়
                    </button>
                  )}
                  <button onClick={() => openModal(user, "delete")}
                    className="p-1.5 rounded-lg border hover:bg-red-50 transition-colors"
                    style={{ borderColor: S.border }}>
                    <Trash2 size={14} style={{ color: "#DC2626" }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {modal && (() => {
        const cfg = ACTION_CFG[modal.action];
        const isDelete = modal.action === "delete";
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl p-6 max-w-md w-full bg-white shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base" style={{ color: "#1A1A18" }}>{cfg.label}</h3>
                <button onClick={() => setModal(null)}><X size={20} style={{ color: "#6B7280" }} /></button>
              </div>
              <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: isDelete ? "#FEF2F2" : "#F9FAFB", border: `1px solid ${isDelete ? "#FECACA" : "#E5E7EB"}` }}>
                <p className="font-semibold text-sm mb-0.5" style={{ color: "#1A1A18" }}>{modal.user.name}</p>
                <p className="text-xs" style={{ color: "#6B7280" }}>{modal.user.email}</p>
              </div>
              <p className="text-sm mb-4" style={{ color: "#4B5563" }}>{cfg.description}</p>
              {cfg.needsReason && (
                <div className="mb-4">
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "#374151" }}>
                    কারণ লিখুন <span style={{ color: "#9CA3AF" }}>(ব্যবহারকারীকে দেখানো হবে)</span>
                  </label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="যেমন: আমাদের শর্ত লঙ্ঘন করা হয়েছে..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                    style={{ borderColor: "#D1D5DB", color: "#1A1A18" }} />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
                  বাতিল
                </button>
                <button onClick={executeAction} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: cfg.color }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> হচ্ছে...</> : cfg.label}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dropdown hint for small hint */}
      <p className="text-xs text-center" style={{ color: S.muted }}>
        <ChevronDown size={12} className="inline" /> সর্বমোট {users.length}টি ব্যবহারকারী দেখাচ্ছে
      </p>
    </div>
  );
}
