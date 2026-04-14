"use client";

import { useEffect, useState } from "react";
import {
  Plus, Trash2, TrendingUp, TrendingDown, Download, ShoppingCart,
  BookOpen, X, Save, Loader2, Tag, FileText, Calendar,
  ShoppingBag, Home, Users, Truck, Package, BarChart3,
  ChevronDown, ChevronUp, Pencil,
} from "lucide-react";
import Link from "next/link";
import { formatBDT, formatBanglaDate } from "@/lib/utils";

interface Transaction {
  id: string; type: string; amount: number; category: string | null;
  note: string | null; date: string; taxAmount?: number; taxRate?: number;
}

type ViewMode = "daily" | "weekly" | "monthly";

const INCOME_CATS = ["বিক্রি", "Advance", "অন্যান্য আয়"];
const EXPENSE_CATS = ["Courier", "Packaging", "বেতন", "ভাড়া", "অন্যান্য খরচ"];

const CAT_ICONS: Record<string, React.ElementType> = {
  "বিক্রি": ShoppingCart, "Advance": TrendingUp, "অন্যান্য আয়": Plus,
  "Courier": Truck, "Packaging": Package, "বেতন": Users, "ভাড়া": Home,
  "অন্যান্য খরচ": Tag,
};

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

function getWeekRange(ref: string) {
  const d = new Date(ref + "T12:00:00");
  const day = d.getDay();
  const start = new Date(d); start.setDate(d.getDate() - day);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { from: start.toISOString().split("T")[0], to: end.toISOString().split("T")[0] };
}

function getMonthRange(ref: string) {
  const [y, m] = ref.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${last}`;
  return { from, to };
}

function TransactionPanel({
  type, initial, onClose, onSave, isDesktop,
}: {
  type: "income" | "expense"; initial?: Transaction | null;
  onClose: () => void; onSave: () => void; isDesktop: boolean;
}) {
  const [form, setForm] = useState({
    amount: initial ? String(initial.amount) : "",
    category: initial?.category ?? "",
    note: initial?.note ?? "",
    date: initial ? (initial.date?.split("T")[0] ?? new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
    taxRate: initial ? String(initial.taxRate ?? "") : "",
  });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const isEdit = !!initial;

  const baseAmount = parseFloat(form.amount || "0");
  const taxRate = parseFloat(form.taxRate || "0");
  const taxAmount = baseAmount * (taxRate / 100);
  const total = baseAmount + taxAmount;

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function close() { setVisible(false); setTimeout(onClose, 300); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setLoading(true);
    if (isEdit && initial) {
      await fetch(`/api/transactions?id=${initial.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type, taxRate, taxAmount }),
      });
    } else {
      await fetch("/api/transactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type, taxRate, taxAmount }),
      });
    }
    setLoading(false);
    onSave(); close();
  }

  const isIncome = type === "income";

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
          left: 0, right: 0, bottom: 0, height: "88svh",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}>
        {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: isIncome ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              {isIncome ? <TrendingUp size={18} color="#fff" /> : <TrendingDown size={18} color="#fff" />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{isEdit ? "লেনদেন সম্পাদনা" : isIncome ? "আয় যোগ করুন" : "খরচ যোগ করুন"}</p>
              <p className="text-xs text-gray-400">{isIncome ? "Income entry" : "Expense entry"}</p>
            </div>
          </div>
          <button onClick={close} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">পরিমাণ (৳) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="০" required min="0" className={fieldCls} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ক্যাটাগরি</label>
              <div className="flex flex-wrap gap-2">
                {cats.map(c => {
                  const Icon = CAT_ICONS[c] ?? Tag;
                  return (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: f.category === c ? "" : c }))}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{
                        backgroundColor: form.category === c ? (isIncome ? "#ECFDF5" : "#FFF1F2") : "#fff",
                        borderColor: form.category === c ? (isIncome ? "#10B981" : "#EF4444") : "#E5E7EB",
                        color: form.category === c ? (isIncome ? "#059669" : "#DC2626") : "#6B7280",
                      }}>
                      <Icon size={13} /> {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tax / VAT হার (%)</label>
              <input type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))}
                placeholder="যেমন: 15" min="0" max="100" className={fieldCls} />
              {taxRate > 0 && baseAmount > 0 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 space-y-0.5 border border-blue-100">
                  <p>Tax: <strong>{formatBDT(taxAmount)}</strong></p>
                  <p>মোট (Tax সহ): <strong>{formatBDT(total)}</strong></p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="ঐচ্ছিক মন্তব্য..." className={fieldCls} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">তারিখ</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={fieldCls} />
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
            <button type="button" onClick={close} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
            <button type="submit" disabled={loading || !form.amount}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: isIncome ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#EF4444,#DC2626)" }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : <><Save size={15} /> সেভ করুন</>}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function HisabPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [panel, setPanel] = useState<{ type: "income" | "expense"; edit?: Transaction } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);

  function getRangeForMode(): { from: string; to: string } {
    if (viewMode === "weekly") return getWeekRange(date);
    if (viewMode === "monthly") return getMonthRange(date);
    return { from: date, to: date };
  }

  async function fetchTransactions() {
    setLoading(true);
    const { from, to } = getRangeForMode();
    const params = new URLSearchParams();
    if (from === to) params.set("date", from);
    else { params.set("from", from); params.set("to", to); }
    const r = await fetch(`/api/transactions?${params}`);
    const data = await r.json();
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchTransactions(); }, [date, viewMode]);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/transactions?id=${deleteId}`, { method: "DELETE" });
    setTransactions(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
    showToast("success", "লেনদেন মুছে দেওয়া হয়েছে ✓");
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { from, to } = getRangeForMode();
      const params = new URLSearchParams({ from, to, export: "1" });
      const r = await fetch(`/api/transactions?${params}`);
      const data = await r.json() as Transaction[];
      const rows = [["তারিখ", "ধরন", "ক্যাটাগরি", "পরিমাণ", "Tax", "নোট"]];
      for (const t of data) {
        rows.push([t.date?.split("T")[0] ?? "", t.type === "income" ? "আয়" : "খরচ", t.category ?? "", String(t.amount), String(t.taxAmount ?? 0), t.note ?? ""]);
      }
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `hisab_${from}_${to}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("error", "Export ব্যর্থ হয়েছে।"); }
    setExporting(false);
  }

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;
  const totalTax = transactions.reduce((s, t) => s + (t.taxAmount ?? 0), 0);

  const { from, to } = getRangeForMode();
  const periodLabel = viewMode === "daily" ? "আজকের" : viewMode === "weekly" ? "এই সপ্তাহের" : "এই মাসের";
  const rangeLabel = from === to
    ? formatBanglaDate(new Date(from + "T12:00:00")) + "-এর হিসাব"
    : `${from} থেকে ${to}`;

  const catBreakdown = transactions.reduce<Record<string, { type: string; total: number }>>((acc, t) => {
    const key = t.category || (t.type === "income" ? "অন্যান্য আয়" : "অন্যান্য খরচ");
    if (!acc[key]) acc[key] = { type: t.type, total: 0 };
    acc[key].total += t.amount;
    return acc;
  }, {});
  const breakdown = Object.entries(catBreakdown).sort((a, b) => b[1].total - a[1].total);
  const maxBreakdown = Math.max(...breakdown.map(b => b[1].total), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">লেনদেন মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">এই লেনদেন স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">মুছে দিন</button>
            </div>
          </div>
        </div>
      )}

      {/* Panel */}
      {panel && (
        <TransactionPanel
          type={panel.type}
          initial={panel.edit}
          onClose={() => setPanel(null)}
          onSave={fetchTransactions}
          isDesktop={isDesktop}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">হিসাব বই</h1>
            <p className="text-xs text-gray-500">আয়-ব্যয়ের সম্পূর্ণ হিসাব</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setPanel({ type: "income" })}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
            <Plus size={15} /> আয়
          </button>
          <button onClick={() => setPanel({ type: "expense" })}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
            <Plus size={15} /> খরচ
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Download size={14} /> {exporting ? "..." : "CSV"}
          </button>
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/hisab/purchases"
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" }}>
            <ShoppingBag size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">মাল কেনা</p>
            <p className="text-xs text-gray-400">Purchase Entry</p>
          </div>
        </Link>
        <Link href="/hisab/due-ledger"
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#FEE2E2,#FECACA)" }}>
            <BookOpen size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">বাকি খাতা</p>
            <p className="text-xs text-gray-400">Due Ledger</p>
          </div>
        </Link>
      </div>

      {/* ── View Mode + Date ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {(["daily", "weekly", "monthly"] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: viewMode === m ? "#fff" : "transparent",
                color: viewMode === m ? "#111827" : "#6B7280",
                boxShadow: viewMode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {m === "daily" ? "দৈনিক" : m === "weekly" ? "সাপ্তাহিক" : "মাসিক"}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          {viewMode === "monthly" ? (
            <input type="month" value={date.slice(0, 7)} onChange={e => setDate(e.target.value + "-01")}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-gray-400 transition-colors" />
          ) : (
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-gray-400 transition-colors" />
          )}
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-xl mb-3" /><div className="h-7 bg-gray-100 rounded w-20 mb-1" /><div className="h-3 bg-gray-100 rounded w-28" />
            </div>
          ))
        ) : [
          { label: `${periodLabel} আয়`, value: formatBDT(income), icon: TrendingUp, bg: "#ECFDF5", fg: "#059669", grad: "linear-gradient(135deg,#10B981,#059669)" },
          { label: `${periodLabel} খরচ`, value: formatBDT(expense), icon: TrendingDown, bg: "#FFF1F2", fg: "#DC2626", grad: "linear-gradient(135deg,#EF4444,#DC2626)" },
          { label: `${periodLabel} লাভ`, value: formatBDT(profit), icon: BarChart3, bg: profit >= 0 ? "#ECFDF5" : "#FFF1F2", fg: profit >= 0 ? "#059669" : "#DC2626", grad: profit >= 0 ? "linear-gradient(135deg,#10B981,#059669)" : "linear-gradient(135deg,#EF4444,#DC2626)" },
          { label: "মোট Tax", value: formatBDT(totalTax), icon: FileText, bg: "#EFF6FF", fg: "#1D4ED8", grad: "linear-gradient(135deg,#3B82F6,#1D4ED8)" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
              <s.icon size={17} style={{ color: s.fg }} />
            </div>
            <p className="text-2xl font-black" style={{ color: s.fg }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Transaction List Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-bold text-gray-900 text-sm">{rangeLabel}</p>
          <button onClick={() => setShowBreakdown(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:underline">
            <BarChart3 size={13} /> ক্যাটাগরি বিশ্লেষণ
            {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Category Breakdown */}
        {showBreakdown && !loading && breakdown.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-50 space-y-2.5">
            {breakdown.map(([cat, info]) => {
              const isInc = info.type === "income";
              const pct = Math.round((info.total / maxBreakdown) * 100);
              const Icon = CAT_ICONS[cat] ?? Tag;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isInc ? "#ECFDF5" : "#FFF1F2" }}>
                    <Icon size={12} style={{ color: isInc ? "#059669" : "#DC2626" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-semibold text-gray-700 truncate">{cat}</span>
                      <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: isInc ? "#059669" : "#DC2626" }}>{formatBDT(info.total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isInc ? "#10B981" : "#EF4444" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Transactions */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-32" /><div className="h-3 bg-gray-100 rounded w-48" /></div>
                <div className="h-5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><BookOpen size={24} className="text-gray-400" /></div>
            <p className="text-gray-500 text-sm font-medium">এই সময়ে কোনো লেনদেন নেই।</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPanel({ type: "income" })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}><Plus size={14} /> আয়</button>
              <button onClick={() => setPanel({ type: "expense" })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}><Plus size={14} /> খরচ</button>
            </div>
          </div>
        ) : (
          <>
            {transactions.map(t => {
              const isInc = t.type === "income";
              const Icon = CAT_ICONS[t.category ?? ""] ?? (isInc ? TrendingUp : TrendingDown);
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/40 transition-colors group">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isInc ? "#ECFDF5" : "#FFF1F2" }}>
                    <Icon size={17} style={{ color: isInc ? "#059669" : "#DC2626" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: isInc ? "#ECFDF5" : "#FFF1F2", color: isInc ? "#059669" : "#DC2626" }}>
                        {isInc ? "আয়" : "খরচ"}
                      </span>
                      {t.category && <span className="text-xs font-medium text-gray-500">{t.category}</span>}
                      {viewMode !== "daily" && t.date && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5"><Calendar size={10} /> {t.date.split("T")[0]}</span>
                      )}
                      {(t.taxAmount ?? 0) > 0 && <span className="text-xs text-blue-500 font-medium">Tax: {formatBDT(t.taxAmount!)}</span>}
                    </div>
                    {t.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.note}</p>}
                  </div>
                  <span className="font-black text-base flex-shrink-0" style={{ color: isInc ? "#059669" : "#DC2626" }}>
                    {isInc ? "+" : "−"}{formatBDT(t.amount)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setPanel({ type: t.type as "income" | "expense", edit: t })}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><Pencil size={13} className="text-gray-500" /></button>
                    <button onClick={() => setDeleteId(t.id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </div>
              );
            })}
            {/* Summary Footer */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">আয় <strong className="text-emerald-600">{formatBDT(income)}</strong> − খরচ <strong className="text-red-500">{formatBDT(expense)}</strong></span>
                <span className="font-black text-base" style={{ color: profit >= 0 ? "#059669" : "#DC2626" }}>
                  = {profit >= 0 ? "+" : "−"}{formatBDT(Math.abs(profit))}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
