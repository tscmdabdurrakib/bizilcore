"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock, X, DollarSign, TrendingUp, TrendingDown, CheckCircle,
  Loader2, AlertCircle, Plus, Minus, Printer, ChevronRight,
} from "lucide-react";

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "#EA580C", bg: "var(--c-bg)",
};

const BN_DENOMS = [
  { value: 1000, label: "১০০০" },
  { value: 500,  label: "৫০০" },
  { value: 200,  label: "২০০" },
  { value: 100,  label: "১০০" },
  { value: 50,   label: "৫০" },
  { value: 20,   label: "২০" },
  { value: 10,   label: "১০" },
  { value: 5,    label: "৫" },
  { value: 2,    label: "২" },
  { value: 1,    label: "১" },
];

interface CashDrawerLog {
  id: string; type: string; amount: number; note?: string | null;
  performedBy?: string | null; loggedAt: string;
}

interface PosShift {
  id: string; shiftNumber: string; openedBy: string; openedAt: string;
  closedAt?: string | null; closedBy?: string | null;
  openingCash: number; countedCash?: number | null; expectedCash: number;
  cashOver?: number | null; cashShort?: number | null;
  status: string; notes?: string | null; runningBalance?: number;
  logs: CashDrawerLog[];
}

interface ShiftManagerProps {
  onShiftChange?: () => void;
}

type ModalMode = "open_shift" | "cash_log" | "close_wizard" | "history" | null;
type WizardStep = 1 | 2 | 3;

export default function ShiftManager({ onShiftChange }: ShiftManagerProps) {
  const [activeShift, setActiveShift] = useState<PosShift | null>(null);
  const [recentShifts, setRecentShifts] = useState<PosShift[]>([]);
  const [requireShift, setRequireShift] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Open shift form
  const [openingCash, setOpeningCash] = useState("0");
  const [openerName, setOpenerName] = useState("");
  const [openPin, setOpenPin] = useState("");

  // Cash log form
  const [logType, setLogType] = useState<"in" | "out">("in");
  const [logAmount, setLogAmount] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logPin, setLogPin] = useState("");

  // Closing wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({});
  const [closingNotes, setClosingNotes] = useState("");
  const [closePin, setClosePin] = useState("");
  const [closeResult, setCloseResult] = useState<{
    countedCash: number; expectedCash: number; diff: number;
    cashOver: number; cashShort: number; cashOrderRevenue: number;
  } | null>(null);
  // Snapshot of shift data preserved for step-3 (shift becomes null after close+load)
  const [closedShiftSnapshot, setClosedShiftSnapshot] = useState<PosShift | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/restaurant/shift");
      if (r.ok) {
        const d = await r.json();
        setActiveShift(d.activeShift);
        setRecentShifts(d.recentShifts ?? []);
        setRequireShift(d.requireShift ?? false);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatBDT = (n: number) => `৳${n.toFixed(2)}`;
  const formatTime = (s: string) => new Date(s).toLocaleString("bn-BD", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

  // Denomination total
  const denomTotal = BN_DENOMS.reduce((s, d) => s + (denomCounts[d.value] ?? 0) * d.value, 0);

  // ── Open Shift ──────────────────────────────────────────────────
  const openShift = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/restaurant/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingCash: parseFloat(openingCash) || 0, openedBy: openerName, pin: openPin || undefined }),
      });
      const data = await r.json();
      if (!r.ok) { showToast("error", data.error ?? "শিফট শুরু হয়নি"); setSaving(false); return; }
      showToast("success", `✓ শিফট শুরু — ${data.shiftNumber}`);
      setModal(null); setOpeningCash("0"); setOpenerName(""); setOpenPin("");
      await load(); onShiftChange?.();
    } catch { showToast("error", "Error"); }
    setSaving(false);
  };

  // ── Cash Log ────────────────────────────────────────────────────
  const saveCashLog = async () => {
    if (!activeShift) return;
    const amount = parseFloat(logAmount);
    if (!amount || amount <= 0) { showToast("error", "পরিমাণ দিন"); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/restaurant/shift/${activeShift.id}/cash-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: logType, amount, note: logNote, pin: logPin || undefined }),
      });
      const data = await r.json();
      if (!r.ok) { showToast("error", data.error ?? "লগ সেভ হয়নি"); setSaving(false); return; }
      showToast("success", `✓ ${logType === "in" ? "ক্যাশ জমা" : "ক্যাশ বের"} — ${formatBDT(amount)}`);
      setModal(null); setLogAmount(""); setLogNote(""); setLogPin("");
      await load();
    } catch { showToast("error", "Error"); }
    setSaving(false);
  };

  // ── Close Shift ─────────────────────────────────────────────────
  const closeShift = async () => {
    if (!activeShift) return;
    setSaving(true);
    try {
      // Snapshot shift data BEFORE load() nullifies activeShift so step-3 can render
      const shiftSnapshot = { ...activeShift };
      const r = await fetch(`/api/restaurant/shift/${activeShift.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countedCash: denomTotal,
          notes: closingNotes,
          denominationBreakdown: denomCounts,
          pin: closePin || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) { showToast("error", data.error ?? "শিফট বন্ধ হয়নি"); setSaving(false); return; }
      // Save snapshot BEFORE load() so step-3 can still access shift data
      setClosedShiftSnapshot(shiftSnapshot);
      setCloseResult({
        countedCash: data.countedCash ?? denomTotal,
        expectedCash: data.expectedCash,
        diff: data.diff,
        cashOver: data.cashOver,
        cashShort: data.cashShort,
        cashOrderRevenue: data.cashOrderRevenue,
      });
      setWizardStep(3);
      // Refresh data in background — step-3 uses closedShiftSnapshot, not activeShift
      load(); onShiftChange?.();
    } catch { showToast("error", "Error"); }
    setSaving(false);
  };

  const printShiftReport = () => {
    if (!activeShift && !closeResult) return;
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    const now = new Date().toLocaleString("bn-BD");
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>শিফট রিপোর্ট</title>
      <style>
        body{font-family:monospace;font-size:12px;padding:16px;max-width:300px;margin:0 auto}
        h2{text-align:center;font-size:14px;margin:0 0 8px}
        .line{border-top:1px dashed #ccc;margin:6px 0}
        .row{display:flex;justify-content:space-between;margin:3px 0}
        .bold{font-weight:bold}.over{color:#10B981}.short{color:#EF4444}
        @media print{button{display:none}}
      </style>
    </head><body>
      <h2>শিফট সমাপ্তি রিপোর্ট</h2>
      <div class="row"><span>তারিখ</span><span>${now}</span></div>
      <div class="line"></div>
      ${closeResult ? `
        <div class="row"><span>প্রারম্ভিক ক্যাশ</span><span>৳${(activeShift?.openingCash ?? 0).toFixed(2)}</span></div>
        <div class="row"><span>ক্যাশ অর্ডার আয়</span><span>৳${closeResult.cashOrderRevenue.toFixed(2)}</span></div>
        <div class="row bold"><span>প্রত্যাশিত ক্যাশ</span><span>৳${closeResult.expectedCash.toFixed(2)}</span></div>
        <div class="row bold"><span>গণনাকৃত ক্যাশ</span><span>৳${closeResult.countedCash.toFixed(2)}</span></div>
        <div class="line"></div>
        ${closeResult.cashOver > 0
          ? `<div class="row bold over"><span>বেশি (Over)</span><span>+৳${closeResult.cashOver.toFixed(2)}</span></div>`
          : closeResult.cashShort > 0
          ? `<div class="row bold short"><span>কম (Short)</span><span>-৳${closeResult.cashShort.toFixed(2)}</span></div>`
          : `<div class="row bold"><span>পার্থক্য</span><span>৳০.০০</span></div>`
        }
      ` : ""}
      <div class="line"></div>
      <div style="text-align:center;margin-top:12px">
        <button onclick="window.print()" style="padding:6px 16px;cursor:pointer">প্রিন্ট করুন</button>
      </div>
    </body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 400);
  };

  if (loading) return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ color: S.muted }}>
      <Loader2 size={12} className="animate-spin" />
    </div>
  );

  // ── Shift Status Badge ───────────────────────────────────────────
  const shiftBadge = (
    <div className="flex items-center gap-2">
      {activeShift ? (
        <button onClick={() => setModal("close_wizard")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
          style={{ backgroundColor: "#ECFDF5", borderColor: "#059669", color: "#059669" }}
          title={`শিফট: ${activeShift.shiftNumber} | ব্যালেন্স: ${formatBDT(activeShift.runningBalance ?? activeShift.openingCash)}`}>
          <Clock size={12} />
          <span className="hidden sm:inline">{activeShift.shiftNumber}</span>
          <span className="sm:hidden">চলছে</span>
        </button>
      ) : (
        <button onClick={() => setModal("open_shift")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
          style={{ backgroundColor: "#FEF2F2", borderColor: "#EF4444", color: "#EF4444" }}>
          <AlertCircle size={12} />
          শিফট শুরু করুন
        </button>
      )}
      {activeShift && (
        <button onClick={() => setModal("cash_log")}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border"
          style={{ borderColor: S.border, color: S.muted, backgroundColor: S.surface }}>
          <DollarSign size={12} />
          <span className="hidden sm:inline">ক্যাশ লগ</span>
        </button>
      )}
      <button onClick={() => setModal("history")}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border"
        style={{ borderColor: S.border, color: S.muted, backgroundColor: S.surface }}>
        <Clock size={12} />
      </button>
    </div>
  );

  return (
    <>
      {shiftBadge}

      {/* ── Open Shift Modal ──────────────────────────────────── */}
      {modal === "open_shift" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
                  <Clock size={18} style={{ color: "#059669" }} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: S.text }}>শিফট শুরু করুন</h3>
                  <p className="text-xs" style={{ color: S.muted }}>Opening cash register</p>
                </div>
              </div>
              <button onClick={() => setModal(null)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>দায়িত্বশীল ব্যক্তির নাম</label>
                <input value={openerName} onChange={e => setOpenerName(e.target.value)}
                  placeholder="নাম লিখুন..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>প্রারম্ভিক ক্যাশ (Opening Cash)</label>
                <input type="number" min="0" value={openingCash} onChange={e => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "#ECFDF5" }}>
                <p className="font-semibold" style={{ color: "#059669" }}>Opening: {formatBDT(parseFloat(openingCash) || 0)}</p>
                <p className="text-xs mt-0.5" style={{ color: "#059669" }}>এই পরিমাণ দিয়ে ড্রয়ার শুরু হবে</p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>
                  Manager PIN <span style={{ color: "#6B7280", fontWeight: 400 }}>(PIN সেট না থাকলে খালি রাখুন)</span>
                </label>
                <input type="password" value={openPin} onChange={e => setOpenPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
            </div>
            <div className="p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={openShift} disabled={saving || !openerName.trim()}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "#059669" }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                শিফট শুরু করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cash Log Modal ────────────────────────────────────── */}
      {modal === "cash_log" && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
                  <DollarSign size={18} style={{ color: "#3B82F6" }} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: S.text }}>ক্যাশ লগ</h3>
                  <p className="text-xs" style={{ color: S.muted }}>ব্যালেন্স: {formatBDT(activeShift.runningBalance ?? activeShift.openingCash)}</p>
                </div>
              </div>
              <button onClick={() => setModal(null)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ backgroundColor: S.bg }}>
                {([
                  { key: "in",  label: "ক্যাশ জমা", icon: Plus,  color: "#059669" },
                  { key: "out", label: "ক্যাশ বের",  icon: Minus, color: "#EF4444" },
                ] as const).map(o => {
                  const Icon = o.icon;
                  return (
                    <button key={o.key} onClick={() => setLogType(o.key)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all"
                      style={{
                        backgroundColor: logType === o.key ? o.color : "transparent",
                        color: logType === o.key ? "#fff" : S.muted,
                      }}>
                      <Icon size={14} />{o.label}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>পরিমাণ (৳)</label>
                <input type="number" min="0" value={logAmount} onChange={e => setLogAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>কারণ</label>
                <input value={logNote} onChange={e => setLogNote(e.target.value)}
                  placeholder="যেমন: petty cash expense, tips..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              {/* Manager PIN required for cash-out */}
              {logType === "out" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#EF4444" }}>
                    Manager PIN (ক্যাশ বের করতে আবশ্যক)
                  </label>
                  <input type="password" value={logPin} onChange={e => setLogPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                    style={{ borderColor: "#EF4444", backgroundColor: S.bg, color: S.text }} />
                </div>
              )}
              {/* Recent logs */}
              {activeShift.logs.filter(l => l.type === "in" || l.type === "out").length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold" style={{ color: S.muted }}>সাম্প্রতিক লগ</p>
                  {[...activeShift.logs].filter(l => l.type === "in" || l.type === "out").reverse().slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg" style={{ backgroundColor: S.bg }}>
                      <span style={{ color: l.type === "in" ? "#059669" : "#EF4444" }}>
                        {l.type === "in" ? "+" : "-"}{formatBDT(l.amount)}
                      </span>
                      <span style={{ color: S.muted }}>{l.note ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={saveCashLog} disabled={saving}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: logType === "in" ? "#059669" : "#EF4444" }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <DollarSign size={15} />}
                {logType === "in" ? "ক্যাশ জমা করুন" : "ক্যাশ বের করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift Closing Wizard ─────────────────────────────── */}
      {modal === "close_wizard" && (activeShift || closedShiftSnapshot) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ backgroundColor: S.surface }}>
            <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF7ED" }}>
                  <Clock size={18} style={{ color: S.primary }} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: S.text }}>
                    শিফট বন্ধ করুন
                    <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: S.bg, color: S.muted }}>
                      ধাপ {wizardStep}/৩
                    </span>
                  </h3>
                  <p className="text-xs" style={{ color: S.muted }}>{(closedShiftSnapshot ?? activeShift)?.shiftNumber}</p>
                </div>
              </div>
              {wizardStep < 3 && <button onClick={() => { setModal(null); setWizardStep(1); }}><X size={18} style={{ color: S.muted }} /></button>}
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {/* Step 1: Denomination Count */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>ড্রয়ারে থাকা নোট গণনা করুন</p>
                  <div className="space-y-2">
                    {BN_DENOMS.map(d => (
                      <div key={d.value} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                        <span className="w-14 text-sm font-bold font-mono" style={{ color: S.text }}>৳{d.label}</span>
                        <span className="text-xs" style={{ color: S.muted }}>×</span>
                        <input
                          type="number" min="0"
                          value={denomCounts[d.value] ?? ""}
                          onChange={e => setDenomCounts(prev => ({ ...prev, [d.value]: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="w-20 text-center px-2 py-1.5 rounded-lg border text-sm outline-none font-mono"
                          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                        />
                        <span className="text-xs ml-auto font-mono" style={{ color: S.muted }}>
                          = {((denomCounts[d.value] ?? 0) * d.value).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl font-bold text-sm flex items-center justify-between" style={{ backgroundColor: "#FFF7ED" }}>
                    <span style={{ color: S.primary }}>গণনার মোট</span>
                    <span className="font-mono text-lg" style={{ color: S.primary }}>{formatBDT(denomTotal)}</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>নোট (ঐচ্ছিক)</label>
                    <input value={closingNotes} onChange={e => setClosingNotes(e.target.value)}
                      placeholder="শিফট শেষের মন্তব্য..."
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                  </div>
                </div>
              )}

              {/* Step 2: Pre-close summary — show expected vs counted before irreversible action */}
              {wizardStep === 2 && (() => {
                const manualCashIn  = activeShift.logs.filter(l => l.type === "in").reduce((s, l) => s + l.amount, 0);
                const manualCashOut = activeShift.logs.filter(l => l.type === "out").reduce((s, l) => s + l.amount, 0);
                const knownExpected = activeShift.openingCash + manualCashIn - manualCashOut;
                const previewDiff   = denomTotal - knownExpected;
                return (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold" style={{ color: S.text }}>চূড়ান্ত নিশ্চিতকরণ — প্রত্যাশিত বনাম গণনাকৃত</p>
                    {/* Expected vs Counted preview */}
                    <div className="space-y-2">
                      {[
                        { label: "প্রারম্ভিক ক্যাশ",   value: activeShift.openingCash, color: S.text },
                        { label: "ম্যানুয়াল ক্যাশ-ইন",  value: manualCashIn,  color: "#059669" },
                        { label: "ম্যানুয়াল ক্যাশ-আউট", value: -manualCashOut, color: "#EF4444" },
                        { label: "পরিচিত প্রত্যাশিত (অর্ডার বাদে)", value: knownExpected, color: "#6366F1", bold: true },
                        { label: "আপনার গণনা",          value: denomTotal,    color: "#3B82F6", bold: true },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center px-3 py-2 rounded-xl" style={{ backgroundColor: S.bg }}>
                          <span className="text-xs" style={{ color: S.muted }}>{row.label}</span>
                          <span className={`${row.bold ? "text-sm font-bold" : "text-xs font-semibold"} font-mono`} style={{ color: row.color }}>
                            {row.value < 0 ? `-${formatBDT(Math.abs(row.value))}` : formatBDT(Math.abs(row.value))}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Preliminary over/short indicator */}
                    <div className="flex items-center justify-between p-3 rounded-xl border-2"
                      style={{
                        borderColor: previewDiff >= 0 ? "#059669" : "#EF4444",
                        backgroundColor: previewDiff >= 0 ? "#ECFDF5" : "#FEF2F2",
                      }}>
                      <div className="flex items-center gap-2">
                        {previewDiff >= 0
                          ? <TrendingUp size={16} style={{ color: "#059669" }} />
                          : <TrendingDown size={16} style={{ color: "#EF4444" }} />}
                        <span className="text-xs font-semibold" style={{ color: previewDiff >= 0 ? "#059669" : "#EF4444" }}>
                          {previewDiff >= 0 ? "সম্ভাব্য বেশি (Over)" : "সম্ভাব্য কম (Short)"}
                          <span className="font-normal ml-1">(অর্ডার আয় যুক্ত হলে চূড়ান্ত হবে)</span>
                        </span>
                      </div>
                      <span className="font-bold font-mono text-sm" style={{ color: previewDiff >= 0 ? "#059669" : "#EF4444" }}>
                        {previewDiff >= 0 ? "+" : ""}{formatBDT(previewDiff)}
                      </span>
                    </div>
                    {/* Cash log summary */}
                    {activeShift.logs.filter(l => l.type === "in" || l.type === "out").length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold" style={{ color: S.muted }}>ম্যানুয়াল ক্যাশ লগ</p>
                        {activeShift.logs.filter(l => l.type === "in" || l.type === "out").map(l => (
                          <div key={l.id} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: S.bg }}>
                            <span style={{ color: l.type === "in" ? "#059669" : "#EF4444" }}>
                              {l.type === "in" ? "+" : "-"}{formatBDT(l.amount)} {l.note ? `(${l.note})` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-3 rounded-xl border-2" style={{ borderColor: "#F59E0B", backgroundColor: "#FFFBEB" }}>
                      <p className="text-xs font-semibold" style={{ color: "#92400E" }}>⚠️ শিফট বন্ধ হলে আর পরিবর্তন করা যাবে না</p>
                      <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>ক্যাশ অর্ডার আয় সার্ভার থেকে স্বয়ংক্রিয়ভাবে যোগ হবে</p>
                    </div>
                    {/* Manager PIN for shift close */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#EF4444" }}>
                        Manager PIN (শিফট বন্ধ করতে আবশ্যক)
                      </label>
                      <input type="password" value={closePin} onChange={e => setClosePin(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-mono"
                        style={{ borderColor: "#EF4444", backgroundColor: S.bg, color: S.text }} />
                      <p className="text-[10px] mt-1" style={{ color: S.muted }}>
                        PIN সেট না থাকলে খালি রাখুন
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step 3: Result — uses closedShiftSnapshot since activeShift may be null after load() */}
              {wizardStep === 3 && closeResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#ECFDF5" }}>
                      <CheckCircle size={32} style={{ color: "#059669" }} />
                    </div>
                  </div>
                  <p className="text-center text-base font-bold" style={{ color: S.text }}>শিফট সফলভাবে বন্ধ হয়েছে</p>
                  <div className="space-y-2">
                    {[
                      { label: "প্রারম্ভিক ক্যাশ", value: (closedShiftSnapshot ?? activeShift)?.openingCash ?? 0 },
                      { label: "ক্যাশ অর্ডার আয়", value: closeResult.cashOrderRevenue },
                      { label: "প্রত্যাশিত ক্যাশ", value: closeResult.expectedCash },
                      { label: "গণনাকৃত ক্যাশ", value: closeResult.countedCash },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between text-sm p-2.5 rounded-lg" style={{ backgroundColor: S.bg }}>
                        <span style={{ color: S.muted }}>{row.label}</span>
                        <span className="font-bold font-mono" style={{ color: S.text }}>{formatBDT(row.value)}</span>
                      </div>
                    ))}
                    {closeResult.cashOver > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-xl border-2" style={{ borderColor: "#059669", backgroundColor: "#ECFDF5" }}>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} style={{ color: "#059669" }} />
                          <span className="font-bold text-sm" style={{ color: "#059669" }}>বেশি (Over)</span>
                        </div>
                        <span className="font-bold font-mono" style={{ color: "#059669" }}>+{formatBDT(closeResult.cashOver)}</span>
                      </div>
                    )}
                    {closeResult.cashShort > 0 && (
                      <div className="flex justify-between items-center p-3 rounded-xl border-2" style={{ borderColor: "#EF4444", backgroundColor: "#FEF2F2" }}>
                        <div className="flex items-center gap-2">
                          <TrendingDown size={16} style={{ color: "#EF4444" }} />
                          <span className="font-bold text-sm" style={{ color: "#EF4444" }}>কম (Short)</span>
                        </div>
                        <span className="font-bold font-mono" style={{ color: "#EF4444" }}>-{formatBDT(closeResult.cashShort)}</span>
                      </div>
                    )}
                    {closeResult.cashOver === 0 && closeResult.cashShort === 0 && (
                      <div className="flex justify-between items-center p-3 rounded-xl border-2" style={{ borderColor: "#059669", backgroundColor: "#ECFDF5" }}>
                        <span className="font-bold text-sm" style={{ color: "#059669" }}>✓ Balanced — কোনো পার্থক্য নেই</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex gap-3 flex-shrink-0" style={{ borderColor: S.border }}>
              {wizardStep === 1 && (
                <button onClick={() => setWizardStep(2)}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: S.primary }}>
                  পরবর্তী <ChevronRight size={15} />
                </button>
              )}
              {wizardStep === 2 && (
                <>
                  <button onClick={() => setWizardStep(1)}
                    className="px-5 py-3 rounded-2xl text-sm font-semibold border"
                    style={{ borderColor: S.border, color: S.text }}>
                    পেছনে
                  </button>
                  <button onClick={closeShift} disabled={saving}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: "#EF4444" }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                    শিফট বন্ধ করুন
                  </button>
                </>
              )}
              {wizardStep === 3 && (
                <>
                  <button onClick={printShiftReport}
                    className="px-5 py-3 rounded-2xl text-sm font-semibold border flex items-center gap-2"
                    style={{ borderColor: S.border, color: S.text }}>
                    <Printer size={14} /> প্রিন্ট
                  </button>
                  <button onClick={() => { setModal(null); setWizardStep(1); setDenomCounts({}); setCloseResult(null); setClosedShiftSnapshot(null); setClosePin(""); setClosingNotes(""); }}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: "#059669" }}>
                    সম্পন্ন
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── History Modal ─────────────────────────────────────── */}
      {modal === "history" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" style={{ backgroundColor: S.surface }}>
            <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-base" style={{ color: S.text }}>শিফট ইতিহাস</h3>
              <button onClick={() => setModal(null)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: S.border }}>
              {recentShifts.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{ color: S.muted }}>কোনো বন্ধ শিফট নেই</div>
              ) : recentShifts.map(s => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono" style={{ color: S.text }}>{s.shiftNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      s.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>{s.status === "open" ? "চলছে" : "বন্ধ"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p style={{ color: S.muted }}>খোলা</p>
                      <p className="font-semibold" style={{ color: S.text }}>{s.openedBy}</p>
                      <p style={{ color: S.muted }}>{formatTime(s.openedAt)}</p>
                    </div>
                    {s.closedAt && (
                      <div>
                        <p style={{ color: S.muted }}>বন্ধ</p>
                        <p className="font-semibold" style={{ color: S.text }}>{s.closedBy ?? "—"}</p>
                        <p style={{ color: S.muted }}>{formatTime(s.closedAt)}</p>
                      </div>
                    )}
                    <div>
                      <p style={{ color: S.muted }}>প্রারম্ভিক</p>
                      <p className="font-bold font-mono" style={{ color: S.text }}>{formatBDT(s.openingCash)}</p>
                      {s.countedCash != null && (
                        <>
                          <p className="mt-1" style={{ color: S.muted }}>গণনাকৃত</p>
                          <p className="font-bold font-mono" style={{ color: S.text }}>{formatBDT(s.countedCash)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {(s.cashOver || s.cashShort) ? (
                    <div className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                      (s.cashOver ?? 0) > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}>
                      {(s.cashOver ?? 0) > 0
                        ? `↑ Over: +${formatBDT(s.cashOver ?? 0)}`
                        : `↓ Short: -${formatBDT(s.cashShort ?? 0)}`
                      }
                    </div>
                  ) : s.status === "closed" && (
                    <div className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 font-semibold">✓ Balanced</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${
          toast.type === "success" ? "bg-green-600" : "bg-red-500"
        }`}>{toast.msg}</div>
      )}
    </>
  );
}
