"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, DollarSign, Lock, Unlock, TrendingUp, TrendingDown, AlertCircle, Check } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
};

interface CashRegister {
  id: string;
  date: string;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number;
  difference: number | null;
  status: "open" | "closed";
}

interface RegisterState {
  register: CashRegister | null;
  salesCash: number;
  expenses: number;
  expectedCash: number;
}

export default function CashRegisterPage() {
  const [state, setState] = useState<RegisterState | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchRegister = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/cash-register");
    if (r.ok) {
      const data = await r.json();
      setState(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRegister(); }, [fetchRegister]);

  async function handleOpen() {
    if (!openingCash.trim()) { showToast("error", "উদ্বোধনী নগদ পরিমাণ লিখুন।"); return; }
    const amount = Number(openingCash);
    if (isNaN(amount) || amount < 0) { showToast("error", "বৈধ পরিমাণ লিখুন।"); return; }
    setSaving(true);
    const r = await fetch("/api/cash-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingCash: amount }),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) { showToast("error", data.error ?? "Cash Register খোলা যায়নি।"); return; }
    showToast("success", "Cash Register খোলা হয়েছে।");
    setOpeningCash("");
    await fetchRegister();
  }

  async function handleClose() {
    if (!closingCash.trim()) { showToast("error", "সমাপনী নগদ পরিমাণ লিখুন।"); return; }
    const amount = Number(closingCash);
    if (isNaN(amount) || amount < 0) { showToast("error", "বৈধ পরিমাণ লিখুন।"); return; }
    setSaving(true);
    const r = await fetch("/api/cash-register", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closingCash: amount }),
    });
    const data = await r.json();
    setSaving(false);
    if (!r.ok) { showToast("error", data.error ?? "Cash Register বন্ধ করা যায়নি।"); return; }
    showToast("success", "Cash Register বন্ধ করা হয়েছে।");
    setClosingCash("");
    await fetchRegister();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--c-primary)" }} />
      </div>
    );
  }

  const register = state?.register ?? null;
  const isOpen = register?.status === "open";
  const isClosed = register?.status === "closed";
  const hasRegister = !!register;
  const expectedCash = state?.expectedCash ?? register?.expectedCash ?? 0;
  const salesCash = state?.salesCash ?? 0;
  const expenses = state?.expenses ?? 0;

  const diff = isClosed && register?.difference != null ? register.difference : null;
  const diffPositive = diff !== null && diff >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
          <DollarSign size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>Cash Register</h1>
          <p className="text-xs" style={{ color: S.muted }}>আজকের নগদ হিসাব</p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          backgroundColor: !hasRegister ? "#F5F3FF" : isOpen ? "#ECFDF5" : "#EFF6FF",
          border: `1px solid ${!hasRegister ? "#DDD6FE" : isOpen ? "#A7F3D0" : "#BFDBFE"}`,
        }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: !hasRegister ? "#EDE9FE" : isOpen ? "#D1FAE5" : "#DBEAFE" }}>
          {!hasRegister ? <AlertCircle size={18} style={{ color: "#7C3AED" }} /> :
           isOpen ? <Unlock size={18} style={{ color: "#10B981" }} /> :
           <Lock size={18} style={{ color: "#1D4ED8" }} />}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: !hasRegister ? "#5B21B6" : isOpen ? "#065F46" : "#1E40AF" }}>
            {!hasRegister ? "Cash Register এখনো খোলা হয়নি" :
             isOpen ? "Cash Register চালু আছে" :
             "Cash Register বন্ধ করা হয়েছে"}
          </p>
          {hasRegister && (
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>
              তারিখ: {formatBanglaDate(new Date(register.date))}
            </p>
          )}
        </div>
      </div>

      {/* Open Register */}
      {!hasRegister && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="font-bold text-base mb-4" style={{ color: S.text }}>Cash Register খুলুন</h2>
          <p className="text-sm mb-4" style={{ color: S.muted }}>
            দিন শুরুতে কতটা নগদ টাকা আছে সেটা লিখুন। এটাই আপনার উদ্বোধনী নগদ।
          </p>
          <label className="text-xs font-medium block mb-1.5" style={{ color: S.secondary }}>উদ্বোধনী নগদ (৳)</label>
          <div className="flex gap-3">
            <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)}
              placeholder="যেমন: 5000"
              style={{ flex: 1, height: 44, border: `1px solid ${S.border}`, borderRadius: 12, backgroundColor: S.surface, color: S.text, padding: "0 14px", fontSize: 15, outline: "none" }} />
            <button onClick={handleOpen} disabled={saving}
              className="px-6 h-11 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "#10B981" }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
              খুলুন
            </button>
          </div>
        </div>
      )}

      {/* Live Summary (register is open) */}
      {isOpen && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "উদ্বোধনী নগদ", value: formatBDT(register.openingCash), color: "#8B5CF6", bg: "#F5F3FF" },
              { label: "আজকের POS বিক্রয়", value: formatBDT(salesCash), color: "#10B981", bg: "#ECFDF5" },
              { label: "আজকের খরচ", value: formatBDT(expenses), color: "#EF4444", bg: "#FEF2F2" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                </div>
                <p className="text-[11px] mb-1" style={{ color: S.muted }}>{s.label}</p>
                <p className="text-base font-bold font-mono" style={{ color: S.text }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex justify-between items-center mb-3 pb-3 border-b" style={{ borderColor: S.border }}>
              <span className="text-sm font-medium" style={{ color: S.secondary }}>প্রত্যাশিত নগদ</span>
              <span className="text-lg font-bold font-mono" style={{ color: "#F59E0B" }}>{formatBDT(expectedCash)}</span>
            </div>
            <p className="text-xs" style={{ color: S.muted }}>
              উদ্বোধনী ({formatBDT(register.openingCash)}) + বিক্রয় ({formatBDT(salesCash)}) − খরচ ({formatBDT(expenses)}) = {formatBDT(expectedCash)}
            </p>
          </div>

          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h2 className="font-bold text-base mb-4" style={{ color: S.text }}>Cash Register বন্ধ করুন</h2>
            <p className="text-sm mb-4" style={{ color: S.muted }}>
              দিন শেষে আপনার কাছে কত নগদ আছে গণনা করে লিখুন। সিস্টেম হিসেবের সাথে মিলিয়ে দেখবে।
            </p>
            <label className="text-xs font-medium block mb-1.5" style={{ color: S.secondary }}>সমাপনী নগদ (৳)</label>
            <div className="flex gap-3">
              <input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)}
                placeholder="যেমন: 8500"
                style={{ flex: 1, height: 44, border: `1px solid ${S.border}`, borderRadius: 12, backgroundColor: S.surface, color: S.text, padding: "0 14px", fontSize: 15, outline: "none" }} />
              <button onClick={handleClose} disabled={saving}
                className="px-5 h-11 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#EF4444" }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                বন্ধ করুন
              </button>
            </div>
          </div>
        </>
      )}

      {/* Closed summary */}
      {isClosed && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: S.text }}>
            <Check size={18} style={{ color: "#10B981" }} />
            আজকের Cash Register সারাংশ
          </h2>
          <div className="space-y-3">
            {[
              { label: "উদ্বোধনী নগদ",    value: formatBDT(register.openingCash),               sub: "দিনের শুরু" },
              { label: "POS বিক্রয় (নগদ)", value: formatBDT(salesCash),                          sub: "আজকের আয়" },
              { label: "খরচ",              value: `−${formatBDT(expenses)}`,                      sub: "আজকের ব্যয়" },
              { label: "প্রত্যাশিত নগদ",   value: formatBDT(expectedCash),                       sub: "সিস্টেম হিসাব" },
              { label: "সমাপনী নগদ",       value: formatBDT(register.closingCash ?? 0),           sub: "আপনার গণনা" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: S.text }}>{row.label}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{row.sub}</p>
                </div>
                <span className="font-mono font-bold text-base" style={{ color: S.text }}>{row.value}</span>
              </div>
            ))}

            {diff !== null && (
              <div className="mt-3 p-4 rounded-xl flex items-center gap-3"
                style={{ backgroundColor: diffPositive ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${diffPositive ? "#A7F3D0" : "#FECACA"}` }}>
                {diffPositive
                  ? <TrendingUp size={20} style={{ color: "#10B981" }} />
                  : <TrendingDown size={20} style={{ color: "#EF4444" }} />}
                <div>
                  <p className="font-bold text-sm" style={{ color: diffPositive ? "#065F46" : "#991B1B" }}>
                    {diffPositive ? `উদ্বৃত্ত: ${formatBDT(diff)}` : `ঘাটতি: ${formatBDT(Math.abs(diff))}`}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                    {diffPositive ? "সমাপনী নগদ বেশি আছে" : "সমাপনী নগদ কম আছে"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
