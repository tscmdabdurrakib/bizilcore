"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus, X, Trash2, TrendingDown, BarChart3, Tag,
  Loader2, Save, Building, Users, Zap, Megaphone,
  Truck, Package, Wrench, Download, Search, Pencil,
  CalendarRange, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Expense {
  id: string; title: string; amount: number;
  category: string; date: string; notes: string | null;
}

const CATEGORIES = [
  { value: "office_rent", label: "অফিস ভাড়া", icon: Building, color: "#6366F1", bg: "#EEF2FF" },
  { value: "salary", label: "কর্মী বেতন", icon: Users, color: "#EC4899", bg: "#FDF2F8" },
  { value: "utility", label: "ইউটিলিটি বিল", icon: Zap, color: "#F59E0B", bg: "#FFFBEB" },
  { value: "marketing", label: "মার্কেটিং", icon: Megaphone, color: "#3B82F6", bg: "#EFF6FF" },
  { value: "transport", label: "পরিবহন", icon: Truck, color: "#14B8A6", bg: "#F0FDFA" },
  { value: "packaging", label: "প্যাকেজিং", icon: Package, color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "maintenance", label: "রক্ষণাবেক্ষণ", icon: Wrench, color: "#EF4444", bg: "#FEF2F2" },
  { value: "other", label: "অন্যান্য", icon: Tag, color: "#6B7280", bg: "#F9FAFB" },
];

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

function ExpensePanel({
  initial, onClose, onSave, isDesktop,
}: {
  initial?: Expense | null; onClose: () => void; onSave: () => void; isDesktop: boolean;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    amount: initial ? String(initial.amount) : "",
    category: initial?.category ?? "other",
    date: initial ? (initial.date?.split("T")[0] ?? new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
    notes: initial?.notes ?? "",
  });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function close() { setVisible(false); setTimeout(onClose, 300); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setLoading(true);
    if (isEdit && initial) {
      await fetch(`/api/expenses/${initial.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setLoading(false);
    onSave(); close();
  }

  const selCat = getCat(form.category);

  return (
    <>
      <div onClick={close} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }} />
      <div className="fixed z-50 bg-white flex flex-col"
        style={isDesktop ? {
          top: 0, right: 0, bottom: 0, width: 440,
          borderLeft: "1px solid #F3F4F6",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        } : {
          left: 0, right: 0, bottom: 0, height: "90svh",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}>

        {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              <TrendingDown size={18} color="#fff" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{isEdit ? "খরচ সম্পাদনা" : "নতুন খরচ"}</p>
              <p className="text-xs text-gray-400">{isEdit ? "Edit expense entry" : "Add expense entry"}</p>
            </div>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">শিরোনাম *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="যেমন: মাসের অফিস ভাড়া" required className={fieldCls} />
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">পরিমাণ (৳) *</label>
                <input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="০" required className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">তারিখ *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required className={fieldCls} />
              </div>
            </div>

            {/* Category chips */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ক্যাটাগরি</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const selected = form.category === cat.value;
                  return (
                    <button key={cat.value} type="button" onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                      style={{ borderColor: selected ? cat.color : "#E5E7EB", backgroundColor: selected ? cat.bg : "#fff" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: selected ? cat.color + "22" : "#F3F4F6" }}>
                        <Icon size={13} style={{ color: selected ? cat.color : "#9CA3AF" }} />
                      </div>
                      <span className="text-xs font-semibold truncate" style={{ color: selected ? cat.color : "#6B7280" }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ঐচ্ছিক মন্তব্য..." className={fieldCls} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button type="button" onClick={close} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button type="submit" disabled={loading || !form.title || !form.amount}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : <><Save size={15} /> সেভ করুন</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [panel, setPanel] = useState<{ edit?: Expense } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [exporting, setExporting] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (filterCat) params.set("category", filterCat);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterCat, fromDate, toDate]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    showToast("success", "খরচ মুছে দেওয়া হয়েছে ✓");
    load();
  }

  function handleExport() {
    setExporting(true);
    try {
      const rows = [["তারিখ", "শিরোনাম", "ক্যাটাগরি", "পরিমাণ", "নোট"]];
      for (const e of filtered) {
        rows.push([e.date?.split("T")[0] ?? "", e.title, getCat(e.category).label, String(e.amount), e.notes ?? ""]);
      }
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("error", "Export ব্যর্থ।"); }
    setExporting(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(e => e.title.toLowerCase().includes(q) || getCat(e.category).label.includes(q) || (e.notes ?? "").toLowerCase().includes(q));
  }, [expenses, search]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const catBreakdown = CATEGORIES.map(cat => ({
    ...cat, total: filtered.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const maxBreakdown = Math.max(...catBreakdown.map(c => c.total), 1);

  const topCat = catBreakdown[0];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">খরচ মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-1.5">
              <span className="font-semibold text-gray-800">{deleteTarget.title}</span> — {formatBDT(deleteTarget.amount)}
            </p>
            <p className="text-xs text-gray-400 mb-6">এই খরচটি স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">মুছে দিন</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Panel */}
      {panel !== null && (
        <ExpensePanel
          initial={panel.edit}
          onClose={() => setPanel(null)}
          onSave={load}
          isDesktop={isDesktop}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
            <TrendingDown size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">খরচ ট্র্যাকার</h1>
            <p className="text-xs text-gray-500">অফিস ভাড়া, বেতন, utility সব খরচ এক জায়গায়</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Download size={14} /> {exporting ? "..." : "CSV"}
          </button>
          <button onClick={() => setPanel({})}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
            <Plus size={16} /> নতুন খরচ
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />)
        ) : [
          { label: "মোট খরচ (ফিল্টার)", value: formatBDT(totalAmount), icon: TrendingDown, bg: "#FEF2F2", fg: "#DC2626" },
          { label: "এই মাসে খরচ", value: formatBDT(thisMonth), icon: CalendarRange, bg: "#FFF7ED", fg: "#C2410C" },
          { label: "সর্বোচ্চ ক্যাটাগরি", value: topCat?.label ?? "—", icon: BarChart3, bg: topCat ? topCat.bg : "#F9FAFB", fg: topCat ? topCat.color : "#6B7280" },
          { label: "মোট এন্ট্রি", value: `${filtered.length}টি`, icon: Tag, bg: "#F0FDF4", fg: "#15803D" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ backgroundColor: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <p className="text-xl font-black text-gray-900 truncate">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Search + Date toggle */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="খরচ খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors" />
          </div>
          <button onClick={() => setShowDateFilter(v => !v)}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border text-xs font-semibold transition-all flex-shrink-0"
            style={{ borderColor: (fromDate || toDate) ? "#EF4444" : "#E5E7EB", color: (fromDate || toDate) ? "#DC2626" : "#6B7280", backgroundColor: (fromDate || toDate) ? "#FEF2F2" : "#fff" }}>
            <CalendarRange size={14} /> তারিখ {showDateFilter ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {(fromDate || toDate) && <span className="w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(""); setToDate(""); }} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">সরিয়ে দিন</button>
          )}
        </div>

        {/* Date Range */}
        {showDateFilter && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-gray-50">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-500 flex-shrink-0">থেকে:</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400 transition-colors" />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold text-gray-500 flex-shrink-0">পর্যন্ত:</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="flex-1 h-9 border border-gray-200 rounded-xl px-3 text-sm bg-white outline-none focus:border-gray-400 transition-colors" />
            </div>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-gray-50">
          <button onClick={() => setFilterCat("")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0"
            style={{ backgroundColor: filterCat === "" ? "#EF4444" : "#F3F4F6", color: filterCat === "" ? "#fff" : "#6B7280" }}>
            সব
          </button>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button key={cat.value} onClick={() => setFilterCat(cat.value === filterCat ? "" : cat.value)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: filterCat === cat.value ? cat.color : "#F3F4F6", color: filterCat === cat.value ? "#fff" : "#6B7280" }}>
                <Icon size={11} /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* Category Breakdown (Collapsible) */}
        <div className="px-4 py-3 border-b border-gray-50">
          <button onClick={() => setShowBreakdown(v => !v)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors">
            <BarChart3 size={13} /> ক্যাটাগরি বিশ্লেষণ {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showBreakdown && !loading && catBreakdown.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {catBreakdown.map(cat => {
                const pct = Math.round((cat.total / maxBreakdown) * 100);
                const Icon = cat.icon;
                return (
                  <div key={cat.value} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg }}>
                      <Icon size={13} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-gray-700 truncate">{cat.label}</span>
                        <span className="text-xs font-black ml-2 flex-shrink-0" style={{ color: cat.color }}>{formatBDT(cat.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Table / Cards */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-48" /><div className="h-3 bg-gray-100 rounded w-32" /></div>
                <div className="h-5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-50">
              <TrendingDown size={28} className="text-red-400" />
            </div>
            <p className="font-semibold text-gray-700 text-sm mb-1">কোনো খরচ পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mb-4">ফিল্টার পরিবর্তন করুন বা নতুন খরচ যোগ করুন</p>
            <button onClick={() => setPanel({})} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold mx-auto" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              <Plus size={14} /> নতুন খরচ
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["তারিখ", "শিরোনাম", "ক্যাটাগরি", "পরিমাণ", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(exp => {
                    const cat = getCat(exp.category);
                    const Icon = cat.icon;
                    return (
                      <tr key={exp.id} className="hover:bg-red-50/20 transition-colors group">
                        <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
                          {new Date(exp.date).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{exp.title}</p>
                          {exp.notes && <p className="text-xs text-gray-400 mt-0.5">{exp.notes}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                            style={{ backgroundColor: cat.bg, color: cat.color }}>
                            <Icon size={11} /> {cat.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-black text-red-600 text-base">{formatBDT(exp.amount)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button onClick={() => setPanel({ edit: exp })}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Pencil size={13} className="text-gray-500" /></button>
                            <button onClick={() => setDeleteTarget(exp)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} className="text-red-400" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {filtered.map(exp => {
                const cat = getCat(exp.category);
                const Icon = cat.icon;
                return (
                  <div key={exp.id} className="flex items-start gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg }}>
                      <Icon size={17} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{exp.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                            <span className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString("bn-BD")}</span>
                          </div>
                          {exp.notes && <p className="text-xs text-gray-400 mt-0.5">{exp.notes}</p>}
                        </div>
                        <p className="font-black text-red-600 text-base flex-shrink-0">{formatBDT(exp.amount)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button onClick={() => setPanel({ edit: exp })} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Pencil size={13} className="text-gray-400" /></button>
                      <button onClick={() => setDeleteTarget(exp)} className="p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{filtered.length}টি খরচ</span>
              <span className="font-black text-red-600 text-base">{formatBDT(totalAmount)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
