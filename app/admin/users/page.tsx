"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Search, RefreshCw, ShieldOff, ShieldCheck, Clock,
  Trash2, Loader2, X, Store, Star, Send, LogIn, Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";

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
  adminRole: string | null;
  isAdmin: boolean;
  accountStatus: string;
  statusReason: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  onboarded: boolean;
  totalOrders: number;
  reviewRequestedAt: string | null;
  subscription: { plan: string; status: string; endDate: string | null } | null;
  shop: { name: string; businessType: string | null } | null;
  appReviews: { id: string; rating: number }[];
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
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleSaving, setRoleSaving] = useState(false);

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

  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const { update } = useSession();

  async function impersonateUser(user: User) {
    setImpersonating(user.id);
    const r = await fetch(`/api/admin/users/${user.id}/impersonate`, { method: "POST" });
    const d = await r.json();
    setImpersonating(null);
    if (!r.ok) {
      showToast("error", d.error ?? "Impersonation failed");
      return;
    }
    await update({
      impersonatingUserId: d.impersonatingUserId,
      impersonatingUserName: d.impersonatingUserName,
      onboarded: d.onboarded,
      activeShopId: d.activeShopId,
    });
    window.location.href = "/dashboard";
  }

  async function requestReview(user: User) {
    setReviewBusy(user.id);
    const r = await fetch(`/api/admin/users/${user.id}/request-review`, { method: "POST" });
    setReviewBusy(null);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      showToast("error", d.error ?? "সমস্যা হয়েছে");
      return;
    }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, reviewRequestedAt: new Date().toISOString() } : u));
    showToast("success", `${user.name} কে review request পাঠানো হয়েছে`);
  }

  async function cancelReviewRequest(user: User) {
    setReviewBusy(user.id);
    const r = await fetch(`/api/admin/users/${user.id}/request-review`, { method: "DELETE" });
    setReviewBusy(null);
    if (!r.ok) { showToast("error", "বাতিল করতে সমস্যা হয়েছে"); return; }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, reviewRequestedAt: null } : u));
    showToast("success", "Review request বাতিল করা হয়েছে");
  }

  async function saveRole() {
    if (!roleModal) return;
    setRoleSaving(true);
    const adminRole = selectedRole === "" ? null : selectedRole;
    const r = await fetch(`/api/admin/users/${roleModal.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminRole }),
    });
    const d = await r.json();
    setRoleSaving(false);
    if (!r.ok) {
      showToast("error", d.error ?? "Role update failed");
      return;
    }
    setUsers((prev) => prev.map((u) => u.id === roleModal.id
      ? { ...u, adminRole: d.adminRole, isAdmin: d.isAdmin }
      : u));
    setRoleModal(null);
    showToast("success", `${roleModal.name} এর admin role আপডেট হয়েছে`);
  }

  function openRoleModal(user: User) {
    setSelectedRole(user.adminRole ?? "");
    setRoleModal(user);
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
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">সব seller অ্যাকাউন্ট পরিচালনা করুন</p>
        </div>
        <button onClick={load} className="rounded-xl border border-gray-200 p-2.5 hover:bg-white active:scale-95">
          <RefreshCw size={15} className="text-gray-500" />
        </button>
      </div>

      <AdminPillTabs
        tabs={[
          { key: "", label: `সব (${counts.all})` },
          { key: "active", label: `সক্রিয় (${counts.active})` },
          { key: "suspended", label: `স্থগিত (${counts.suspended})` },
          { key: "disabled", label: `নিষ্ক্রিয় (${counts.disabled})` },
        ]}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-emerald-500" />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : users.length === 0 ? (
        <AdminCard hover={false}>
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">কোনো user পাওয়া যায়নি</p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const st = STATUS_CFG[user.accountStatus as keyof typeof STATUS_CFG] ?? STATUS_CFG.active;
            const StIcon = st.icon;
            const plan = user.subscription?.plan ?? "free";
            const planStyle = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
            return (
              <AdminCard key={user.id} hover={false} className={`!p-4 ${user.accountStatus === "disabled" ? "opacity-80" : ""}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <span className="text-xs text-gray-500">{user.email}</span>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: st.bg, color: st.color }}>
                      <StIcon size={10} /> {st.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: planStyle.bg, color: planStyle.text }}>
                      {plan.toUpperCase()}
                    </span>
                    {user.isAdmin && user.adminRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: "#EDE9FE", color: "#5B21B6" }}>
                        Admin: {user.adminRole}
                      </span>
                    )}
                    {user.appReviews?.[0] && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
                        <Star size={10} fill="#F5B400" stroke="#F5B400" /> {user.appReviews[0].rating}★ Submitted
                      </span>
                    )}
                    {user.reviewRequestedAt && !user.appReviews?.[0] && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}>
                        <Send size={10} /> Review request pending
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                  {user.accountStatus === "active" && user.onboarded && (
                    <button
                      onClick={() => impersonateUser(user)}
                      disabled={impersonating === user.id}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50 active:scale-95"
                      title="Login as this user"
                    >
                      {impersonating === user.id ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />}
                      Login as
                    </button>
                  )}
                  {!user.appReviews?.[0] && !user.reviewRequestedAt && user.accountStatus === "active" && (
                    <button
                      onClick={() => requestReview(user)}
                      disabled={reviewBusy === user.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
                      style={{ backgroundColor: "#fff", color: "#1D4ED8", borderColor: "#BFDBFE" }}
                      title="এই ইউজারকে review modal দেখান (eligibility বাইপাস)"
                    >
                      {reviewBusy === user.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Request Review
                    </button>
                  )}
                  {user.reviewRequestedAt && !user.appReviews?.[0] && (
                    <button
                      onClick={() => cancelReviewRequest(user)}
                      disabled={reviewBusy === user.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border disabled:opacity-50"
                      style={{ backgroundColor: "#fff", color: "#6B7280", borderColor: "#E5E7EB" }}
                      title="পেন্ডিং review request বাতিল করুন"
                    >
                      {reviewBusy === user.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                      Cancel
                    </button>
                  )}
                  <button onClick={() => openRoleModal(user)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-700"
                    title="Admin role set করুন">
                    <Shield size={12} /> Role
                  </button>
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
                    className="rounded-lg border border-gray-200 p-1.5 transition-colors hover:bg-red-50">
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Role Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-md w-full bg-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Admin Role</h3>
              <button onClick={() => setRoleModal(null)}><X size={20} className="text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{roleModal.name} ({roleModal.email})</p>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm mb-4 outline-none focus:border-emerald-500">
              <option value="">No admin access</option>
              <option value="super">Super Admin</option>
              <option value="support">Support</option>
              <option value="billing">Billing</option>
              <option value="content">Content</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setRoleModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600">
                বাতিল
              </button>
              <button onClick={saveRole} disabled={roleSaving}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-60">
                {roleSaving ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
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

      <p className="text-center text-xs text-gray-500">
        সর্বমোট {users.length}টি ব্যবহারকারী দেখাচ্ছে
      </p>
    </div>
  );
}
