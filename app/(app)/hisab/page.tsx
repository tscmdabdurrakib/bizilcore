"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Download, ShoppingCart, BookOpen } from "lucide-react";
import Link from "next/link";
import { formatBDT, formatBanglaDate } from "@/lib/utils";

interface Transaction {
  id: string; type: string; amount: number; category: string | null; note: string | null; date: string;
}

type ViewMode = "daily" | "weekly" | "monthly";

const INCOME_CATS = ["বিক্রি", "Advance", "অন্যান্য আয়"];
const EXPENSE_CATS = ["Courier", "Packaging", "বেতন", "ভাড়া", "অন্যান্য খরচ"];

const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`, borderRadius: "8px",
  color: "var(--c-text)", backgroundColor: "var(--c-surface)", padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

function AddModal({ type, onClose, onSave }: { type: "income" | "expense"; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ amount: "", category: "", note: "", date: new Date().toISOString().split("T")[0], taxRate: "" });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  const S = { primary: "var(--c-primary)", text: "var(--c-text)", secondary: "var(--c-text-sub)", border: "var(--c-border)", muted: "var(--c-text-muted)" };

  const baseAmount = parseFloat(form.amount || "0");
  const taxRate = parseFloat(form.taxRate || "0");
  const taxAmount = baseAmount * (taxRate / 100);
  const totalWithTax = baseAmount + taxAmount;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setLoading(true);
    await fetch("/api/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type, taxRate, taxAmount }),
    });
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
        <h3 className="font-semibold text-lg mb-4" style={{ color: S.text }}>
          {type === "income" ? "আয় যোগ করুন" : "খরচ যোগ করুন"}
        </h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>পরিমাণ (৳) *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="০" required min="0" style={inp(focused === "amt")}
              onFocus={() => setFocused("amt")} onBlur={() => setFocused(null)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>ক্যাটাগরি</label>
            <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ ...inp(false), appearance: "auto" }}>
              <option value="">বেছে নিন</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>Tax / VAT হার (%)</label>
            <input type="number" value={form.taxRate} onChange={(e) => setForm(p => ({ ...p, taxRate: e.target.value }))}
              placeholder="যেমন: 15" min="0" max="100" style={inp(focused === "tax")}
              onFocus={() => setFocused("tax")} onBlur={() => setFocused(null)} />
            {taxRate > 0 && baseAmount > 0 && (
              <p className="text-xs mt-1" style={{ color: S.muted }}>
                Tax: ৳{taxAmount.toFixed(2)} → মোট: ৳{totalWithTax.toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>নোট</label>
            <input type="text" value={form.note} onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="ঐচ্ছিক" style={inp(focused === "note")}
              onFocus={() => setFocused("note")} onBlur={() => setFocused(null)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>তারিখ</label>
            <input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
              style={inp(focused === "date")} onFocus={() => setFocused("date")} onBlur={() => setFocused(null)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: type === "income" ? "var(--c-primary)" : "#E24B4A" }}>
              {loading ? "সেভ..." : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getWeekRange(ref: string) {
  const d = new Date(ref + "T12:00:00");
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: start.toISOString().split("T")[0],
    to: end.toISOString().split("T")[0],
  };
}

function getMonthRange(ref: string) {
  const [y, m] = ref.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${last}`;
  return { from, to };
}

export default function HisabPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [modal, setModal] = useState<"income" | "expense" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  }

  function getRangeForMode(): { from: string; to: string } {
    if (viewMode === "weekly") return getWeekRange(date);
    if (viewMode === "monthly") return getMonthRange(date);
    return { from: date, to: date };
  }

  async function fetchTransactions() {
    setLoading(true);
    const { from, to } = getRangeForMode();
    const params = new URLSearchParams();
    if (from === to) {
      params.set("date", from);
    } else {
      params.set("from", from);
      params.set("to", to);
    }
    const r = await fetch(`/api/transactions?${params}`);
    const data = await r.json();
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchTransactions(); }, [date, viewMode]);

  async function deleteTransaction(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast("success", "মুছে দেওয়া হয়েছে ✓");
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { from, to } = getRangeForMode();
      const params = new URLSearchParams({ from, to, export: "1" });
      const r = await fetch(`/api/transactions?${params}`);
      const data = await r.json() as Transaction[];

      const rows = [["তারিখ", "ধরন", "ক্যাটাগরি", "পরিমাণ", "নোট"]];
      for (const t of data) {
        rows.push([
          t.date?.split("T")[0] ?? "",
          t.type === "income" ? "আয়" : "খরচ",
          t.category ?? "",
          String(t.amount),
          t.note ?? "",
        ]);
      }
      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hisab_${from}_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("error", "Export ব্যর্থ হয়েছে।");
    }
    setExporting(false);
  }

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;

  const { from, to } = getRangeForMode();
  const rangeLabel = from === to
    ? `${formatBanglaDate(new Date(from + "T12:00:00"))}-এর লেনদেন`
    : `${from} থেকে ${to}`;

  const periodLabel = viewMode === "daily" ? "আজকের" : viewMode === "weekly" ? "এই সপ্তাহের" : "এই মাসের";

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}
      {modal && <AddModal type={modal} onClose={() => setModal(null)} onSave={fetchTransactions} />}

      {/* Page Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #065E48 100%)" }}>
          <BookOpen size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>হিসাব বই</h1>
          <p className="text-xs" style={{ color: S.muted }}>আয়-ব্যয়ের সম্পূর্ণ হিসাব এক জায়গায়</p>
        </div>
      </div>

      {/* Quick sub-nav */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link href="/hisab/purchases"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border hover:shadow-sm transition-all"
          style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F0E8FF" }}>
            <ShoppingCart size={18} style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: S.text }}>মাল কেনা</p>
            <p className="text-xs" style={{ color: S.muted }}>Purchase Entry</p>
          </div>
        </Link>
        <Link href="/hisab/due-ledger"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border hover:shadow-sm transition-all"
          style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFE8E8" }}>
            <BookOpen size={18} style={{ color: "#E24B4A" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: S.text }}>বাকি খাতা</p>
            <p className="text-xs" style={{ color: S.muted }}>Due Ledger</p>
          </div>
        </Link>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2 mb-5">
        {(["daily", "weekly", "monthly"] as ViewMode[]).map(m => (
          <button key={m} onClick={() => setViewMode(m)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: viewMode === m ? S.primary : S.surface, color: viewMode === m ? "#fff" : S.text, border: `1px solid ${viewMode === m ? S.primary : S.border}` }}>
            {m === "daily" ? "দৈনিক" : m === "weekly" ? "সাপ্তাহিক" : "মাসিক"}
          </button>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: `${periodLabel} আয়`, value: formatBDT(income), color: S.primary, bg: "var(--c-primary-light)", icon: TrendingUp },
          { label: `${periodLabel} খরচ`, value: formatBDT(expense), color: "#E24B4A", bg: "#FFE8E8", icon: TrendingDown },
          { label: `${periodLabel} লাভ`, value: formatBDT(profit), color: profit >= 0 ? S.primary : "#E24B4A", bg: profit >= 0 ? "var(--c-primary-light)" : "#FFE8E8", icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <p className="text-xs" style={{ color: S.muted }}>{stat.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons + date filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button onClick={() => setModal("income")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
          <Plus size={15} /> আয় যোগ করুন
        </button>
        <button onClick={() => setModal("expense")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border" style={{ borderColor: "#E24B4A", color: "#E24B4A", backgroundColor: "#FFF" }}>
          <Plus size={15} /> খরচ যোগ করুন
        </button>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-60" style={{ borderColor: S.border, color: S.secondary }}>
          <Download size={15} /> {exporting ? "..." : "CSV Export"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          {viewMode === "monthly" ? (
            <input type="month" value={date.slice(0, 7)} onChange={e => setDate(e.target.value + "-01")}
              className="h-9 px-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
          ) : (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="h-9 px-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
          <p className="text-sm font-semibold" style={{ color: S.text }}>{rangeLabel}</p>
        </div>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: S.muted }}>এই সময়ে কোনো লেনদেন নেই।</p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-4 border-b last:border-0"
              style={{ borderColor: S.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: t.type === "income" ? "var(--c-primary-light)" : "#FFE8E8" }}>
                {t.type === "income" ? <TrendingUp size={16} style={{ color: S.primary }} /> : <TrendingDown size={16} style={{ color: "#E24B4A" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: t.type === "income" ? "var(--c-primary-light)" : "#FFE8E8", color: t.type === "income" ? S.primary : "#E24B4A" }}>
                    {t.type === "income" ? "আয়" : "খরচ"}
                  </span>
                  {t.category && <span className="text-xs" style={{ color: S.muted }}>{t.category}</span>}
                  {viewMode !== "daily" && t.date && (
                    <span className="text-xs" style={{ color: S.muted }}>{t.date.split("T")[0]}</span>
                  )}
                </div>
                {t.note && <p className="text-xs mt-0.5 truncate" style={{ color: S.secondary }}>{t.note}</p>}
              </div>
              <span className="font-bold text-sm flex-shrink-0" style={{ color: t.type === "income" ? S.primary : "#E24B4A" }}>
                {t.type === "income" ? "+" : "-"}{formatBDT(t.amount)}
              </span>
              <button onClick={() => deleteTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={15} style={{ color: "#E24B4A" }} />
              </button>
            </div>
          ))
        )}
        {transactions.length > 0 && (
          <div className="px-5 py-4 border-t" style={{ backgroundColor: "var(--c-bg)", borderColor: S.border }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: S.secondary }}>মোট আয় {formatBDT(income)} − মোট খরচ {formatBDT(expense)}</span>
              <span className="font-bold" style={{ color: profit >= 0 ? S.primary : "#E24B4A" }}>
                = লাভ {formatBDT(profit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
