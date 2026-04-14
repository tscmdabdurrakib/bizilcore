"use client";

import { useEffect, useState, useRef } from "react";
import {
  Users, Search, UserCheck, UserX, Mail, Phone, Calendar,
  Pencil, Trash2, X, Save, Loader2, FileDown, Filter,
  TrendingUp, ShieldCheck, Chrome, UserPlus, MapPin,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  emailVerified: boolean;
  googleId: string | null;
  createdAt: string;
}

const AVATAR_COLORS = [
  ["#EFF6FF", "#1D4ED8"], ["#F0FDF4", "#15803D"], ["#FFF7ED", "#C2410C"],
  ["#FDF4FF", "#7E22CE"], ["#FFF1F2", "#BE123C"], ["#F0FDFA", "#0F766E"],
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function Avatar({ c, size = 38 }: { c: Customer; size?: number }) {
  const [bg, fg] = avatarColor(c.name);
  if (c.avatar) return <img src={c.avatar} alt={c.name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.37, flexShrink: 0 }}>
      {c.name.charAt(0).toUpperCase()}
    </div>
  );
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

export default function StoreCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "verified" | "unverified" | "google">("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", emailVerified: false });
  const [saving, setSaving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  function fetchCustomers() {
    fetch("/api/dashboard/store/customers")
      .then(r => r.json())
      .then(d => {
        setCustomers(d.customers || []);
        setThisMonthCount(d.thisMonthCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchCustomers(); }, []);

  function openEdit(c: Customer) {
    setEditCustomer(c);
    setEditForm({ name: c.name, phone: c.phone || "", address: c.address || "", emailVerified: c.emailVerified });
    setEditPanelOpen(true);
  }

  function closeEdit() {
    setEditPanelOpen(false);
    setTimeout(() => setEditCustomer(null), 320);
  }

  async function handleSave() {
    if (!editCustomer || !editForm.name.trim()) return;
    setSaving(true);
    const r = await fetch(`/api/dashboard/store/customers/${editCustomer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        emailVerified: editForm.emailVerified,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const updated = await r.json();
      setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c));
      showToast("success", "কাস্টমার আপডেট হয়েছে ✓");
      closeEdit();
    } else {
      showToast("error", "আপডেট করা যায়নি।");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const r = await fetch(`/api/dashboard/store/customers/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (r.ok) {
      setCustomers(cs => cs.filter(c => c.id !== deleteId));
      showToast("success", "কাস্টমার মুছে দেওয়া হয়েছে।");
    } else {
      showToast("error", "মুছতে ব্যর্থ হয়েছে।");
    }
  }

  function exportCSV() {
    const rows = [
      ["নাম", "ইমেইল", "ফোন", "ঠিকানা", "ভেরিফাইড", "Google", "যোগদান"],
      ...customers.map(c => [
        c.name, c.email, c.phone || "", c.address || "",
        c.emailVerified ? "হ্যাঁ" : "না",
        c.googleId ? "হ্যাঁ" : "না",
        new Date(c.createdAt).toLocaleDateString("bn-BD"),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = customers
    .filter(c => {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || "").includes(q);
    })
    .filter(c => {
      if (tab === "verified") return c.emailVerified;
      if (tab === "unverified") return !c.emailVerified;
      if (tab === "google") return !!c.googleId;
      return true;
    });

  const stats = [
    { label: "মোট কাস্টমার", value: customers.length, sub: "রেজিস্টার্ড", icon: Users, bg: "#EFF6FF", fg: "#1D4ED8", grad: "linear-gradient(135deg,#3B82F6,#1D4ED8)" },
    { label: "ভেরিফাইড", value: customers.filter(c => c.emailVerified).length, sub: "ইমেইল নিশ্চিত", icon: ShieldCheck, bg: "#F0FDF4", fg: "#15803D", grad: "linear-gradient(135deg,#22C55E,#15803D)" },
    { label: "Google ইউজার", value: customers.filter(c => c.googleId).length, sub: "OAuth লগিন", icon: Chrome, bg: "#FFF7ED", fg: "#C2410C", grad: "linear-gradient(135deg,#FB923C,#C2410C)" },
    { label: "এই মাসে", value: thisMonthCount, sub: "নতুন সদস্য", icon: UserPlus, bg: "#FDF4FF", fg: "#7E22CE", grad: "linear-gradient(135deg,#A855F7,#7E22CE)" },
  ];

  const TABS = [
    { key: "all", label: "সব", count: customers.length },
    { key: "verified", label: "ভেরিফাইড", count: customers.filter(c => c.emailVerified).length },
    { key: "unverified", label: "আনভেরিফাইড", count: customers.filter(c => !c.emailVerified).length },
    { key: "google", label: "Google", count: customers.filter(c => c.googleId).length },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">কাস্টমার মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">এই কাজ undo করা যাবে না। কাস্টমারের সব তথ্য মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Panel Backdrop ── */}
      {editCustomer && (
        <div onClick={closeEdit}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: editPanelOpen ? 1 : 0 }} />
      )}

      {/* ── Edit Panel ── */}
      {editCustomer && (
        <div
          className="fixed z-50 bg-white flex flex-col"
          style={isDesktop ? {
            top: 0, right: 0, bottom: 0, width: 460,
            borderLeft: "1px solid #F3F4F6",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
            transform: editPanelOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          } : {
            left: 0, right: 0, bottom: 0, height: "85svh",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            transform: editPanelOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}
            <div className="flex items-center gap-3">
              <Avatar c={editCustomer} size={36} />
              <div>
                <p className="font-bold text-gray-900 text-sm">{editCustomer.name}</p>
                <p className="text-xs text-gray-400 truncate max-w-[200px]">{editCustomer.email}</p>
              </div>
            </div>
            <button onClick={closeEdit} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নাম *</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="কাস্টমারের নাম" className={fieldCls} />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ইমেইল</label>
              <div className="flex items-center gap-2 h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">{editCustomer.email}</span>
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">পরিবর্তন করা যাবে না</span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ফোন নম্বর</label>
              <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="০১XXXXXXXXX" className={fieldCls} />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ঠিকানা</label>
              <textarea value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                placeholder="কাস্টমারের ঠিকানা..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 resize-none" />
            </div>

            {/* Email Verified Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">ইমেইল ভেরিফাইড</p>
                  <p className="text-xs text-gray-500">ম্যানুয়ালি ভেরিফাই করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditForm(f => ({ ...f, emailVerified: !f.emailVerified }))}
                style={{
                  position: "relative", flexShrink: 0, width: 48, height: 26, borderRadius: 13,
                  border: "none", cursor: "pointer",
                  backgroundColor: editForm.emailVerified ? "#10B981" : "#D1D5DB",
                  transition: "background-color 0.2s ease",
                }}
              >
                <span style={{
                  position: "absolute", top: 3,
                  left: editForm.emailVerified ? 25 : 3,
                  width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
                  transition: "left 0.2s ease", display: "block",
                }} />
              </button>
            </div>

            {/* Google badge */}
            {editCustomer.googleId && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <div>
                  <p className="text-sm font-bold text-blue-800">Google Account</p>
                  <p className="text-xs text-blue-600">এই কাস্টমার Google দিয়ে লগইন করেছেন</p>
                </div>
              </div>
            )}

            {/* Joined */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-100">
              <Calendar size={13} className="text-gray-400" />
              যোগদান: {new Date(editCustomer.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          {/* Panel footer */}
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button onClick={closeEdit} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button onClick={handleSave} disabled={saving || !editForm.name.trim()}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
              {saving ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : <><Save size={15} /> সেভ করুন</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)" }}>
            <Users size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">স্টোর কাস্টমার</h1>
            <p className="text-xs text-gray-500">রেজিস্টার্ড কাস্টমারদের ব্যবস্থাপনা</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <FileDown size={15} /> CSV Export
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 bg-gray-100 rounded-lg w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))
        ) : stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
              <s.icon size={17} style={{ color: s.fg }} />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label} · {s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-50">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-400 font-medium flex-shrink-0">{filtered.length} জন পাওয়া গেছে</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-3 border-b border-gray-50 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
              style={{
                backgroundColor: tab === t.key ? "var(--c-primary)" : "transparent",
                color: tab === t.key ? "#fff" : "#6B7280",
              }}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          /* Skeleton */
          <div className="divide-y divide-gray-50">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-56" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserX size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {search ? "কোনো ফলাফল পাওয়া যায়নি" : "এখনো কোনো কাস্টমার নেই"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["কাস্টমার", "ইমেইল", "ফোন", "ঠিকানা", "স্ট্যাটাস", "যোগদান", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar c={c} size={38} />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                            {c.googleId && (
                              <span className="text-xs text-blue-500 font-medium">Google</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{c.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" />{c.phone}
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {c.address ? (
                          <div className="flex items-center gap-1.5 max-w-[150px]">
                            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                            <UserCheck size={11} /> ভেরিফাইড
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                            <UserX size={11} /> পেন্ডিং
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar size={11} className="text-gray-400" />
                          {new Date(c.createdAt).toLocaleDateString("bn-BD")}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="সম্পাদনা">
                            <Pencil size={14} className="text-gray-500" />
                          </button>
                          <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="মুছুন">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {filtered.map(c => (
                <div key={c.id} className="flex items-start gap-3 px-4 py-4">
                  <Avatar c={c} size={42} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.email}</p>
                        {c.phone && <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {c.emailVerified ? (
                          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full">ভেরিফাইড</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 font-bold rounded-full">পেন্ডিং</span>
                        )}
                        {c.googleId && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full">Google</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("bn-BD")}</span>
                      <button onClick={() => openEdit(c)} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                        <Pencil size={11} /> সম্পাদনা
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline">
                        <Trash2 size={11} /> মুছুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
