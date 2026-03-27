"use client";

import { useEffect, useState } from "react";
import { Plus, X, Trash2, TrendingDown, ChevronDown, BarChart3, Tag } from "lucide-react";

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
}

const CATEGORIES = [
  { value: "office_rent", label: "অফিস ভাড়া" },
  { value: "salary", label: "কর্মী বেতন" },
  { value: "utility", label: "ইউটিলিটি বিল" },
  { value: "marketing", label: "মার্কেটিং" },
  { value: "transport", label: "পরিবহন" },
  { value: "packaging", label: "প্যাকেজিং" },
  { value: "maintenance", label: "রক্ষণাবেক্ষণ" },
  { value: "other", label: "অন্যান্য" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  sub: "var(--c-text-sub)",
  primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

const inp = (f: boolean) => ({
  height: "40px",
  border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px",
  color: "var(--c-text)",
  backgroundColor: "var(--c-surface)",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
});

function getCategoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function getCategoryColor(value: string) {
  const colors: Record<string, string> = {
    office_rent: "#6366F1",
    salary: "#EC4899",
    utility: "#F59E0B",
    marketing: "#3B82F6",
    transport: "#14B8A6",
    packaging: "#8B5CF6",
    maintenance: "#EF4444",
    other: "#6B7280",
  };
  return colors[value] ?? "#6B7280";
}

function ExpenseModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "other",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setLoading(true);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>
            নতুন খরচ যোগ
          </h3>
          <button onClick={onClose}>
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              শিরোনাম *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="যেমন: মাসের অফিস ভাড়া"
              required
              style={inp(focused === "title")}
              onFocus={() => setFocused("title")}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                পরিমাণ (৳) *
              </label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                required
                style={inp(focused === "amount")}
                onFocus={() => setFocused("amount")}
                onBlur={() => setFocused(null)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                তারিখ *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
                style={inp(focused === "date")}
                onFocus={() => setFocused("date")}
                onBlur={() => setFocused(null)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              ক্যাটাগরি
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                style={{ ...inp(focused === "category"), appearance: "none", paddingRight: "32px" }}
                onFocus={() => setFocused("category")}
                onBlur={() => setFocused(null)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              নোট
            </label>
            <input
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="ঐচ্ছিক মন্তব্য"
              style={inp(focused === "notes")}
              onFocus={() => setFocused("notes")}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: S.border, color: S.text }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: S.primary }}
            >
              {loading ? "সেভ..." : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  async function load() {
    setLoading(true);
    const q = filterCat ? `?category=${filterCat}` : "";
    const res = await fetch(`/api/expenses${q}`);
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filterCat]);

  async function deleteExpense(id: string) {
    if (!confirm("এই খরচটি মুছে ফেলবেন?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  const catTotals = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.value).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
            <TrendingDown size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>খরচ ট্র্যাকার</h1>
            <p className="text-xs" style={{ color: S.muted }}>অফিস ভাড়া, বেতন, utility সব খরচ এক জায়গায়</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}
        >
          <Plus size={16} /> নতুন খরচ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "মোট খরচ", value: `৳${totalAmount.toLocaleString("bn-BD")}`, icon: TrendingDown, color: "#EF4444", bg: "#FEE2E2" },
          { label: catTotals[0]?.label ?? "সর্বোচ্চ ক্যাটাগরি", value: catTotals[0] ? `৳${catTotals[0].total.toLocaleString("bn-BD")}` : "—", icon: BarChart3, color: catTotals[0] ? getCategoryColor(catTotals[0].value) : "#6B7280", bg: catTotals[0] ? getCategoryColor(catTotals[0].value) + "22" : "#F3F4F6" },
          { label: "মোট ক্যাটাগরি", value: `${catTotals.length}টি`, icon: Tag, color: "var(--c-primary)", bg: "var(--c-primary-light)" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: stat.bg }}>
                <stat.icon size={17} style={{ color: stat.color }} />
              </div>
              <p className="text-xs font-medium" style={{ color: S.muted }}>{stat.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto" style={{ backgroundColor: S.bg, border: `1px solid ${S.border}` }}>
        {[{ value: "", label: "সব" }, ...CATEGORIES].map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCat(cat.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
            style={{
              backgroundColor: filterCat === cat.value ? S.primary : "transparent",
              color: filterCat === cat.value ? "#fff" : S.muted,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: S.bg }} />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center" style={{ backgroundColor: S.surface }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, var(--c-primary-light) 0%, var(--c-primary-light) 100%)" }}>
              <TrendingDown size={28} style={{ color: "var(--c-primary)" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো খরচ নেই</p>
            <p className="text-xs mt-1.5 mb-4" style={{ color: S.muted }}>প্রথম খরচটি এখনই যোগ করুন</p>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
              <Plus size={15} /> নতুন খরচ
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                {["তারিখ", "শিরোনাম", "ক্যাটাগরি", "পরিমাণ", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: S.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="transition-colors cursor-default"
                  style={{ borderBottom: `1px solid ${S.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--c-primary-light)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                    {new Date(exp.date).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: S.text }}>
                      {exp.title}
                    </p>
                    {exp.notes && (
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                        {exp.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getCategoryColor(exp.category) + "22",
                        color: getCategoryColor(exp.category),
                      }}
                    >
                      {getCategoryLabel(exp.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#EF4444" }}>
                    ৳{exp.amount.toLocaleString("bn-BD")}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteExpense(exp.id)} className="hover:opacity-70">
                      <Trash2 size={15} style={{ color: S.muted }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <ExpenseModal onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
