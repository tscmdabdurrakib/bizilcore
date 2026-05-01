"use client";

import { useEffect, useState, useCallback } from "react";
import { Receipt, Loader2, X, CheckCircle, RefreshCw, Plus } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface BatchOption { id: string; name: string }
interface FeeRecord {
  id: string; feeType: string; month?: string | null; description?: string | null;
  amount: number; discount: number; netAmount: number; paidAmount: number; dueAmount: number;
  status: string; method?: string | null; receiptNo?: string | null;
  student: { id: string; name: string; regNumber: string };
  batch?: { id: string; name: string } | null;
}
interface Summary { status: string; _count: { status: number }; _sum: { netAmount: number | null; paidAmount: number | null; dueAmount: number | null } }

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: "#E1F5EE", color: "#085041", label: "পরিশোধ" },
  due:     { bg: "#FCEBEB", color: "#791F1F", label: "বাকি"   },
  partial: { bg: "#FAEEDA", color: "#633806", label: "আংশিক" },
};

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FeesBoard() {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [payModal, setPayModal] = useState<FeeRecord | null>(null);
  const [generating, setGenerating] = useState(false);
  const [payForm, setPayForm] = useState({ paidAmount: "", method: "cash", note: "" });
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (batchFilter) params.set("batchId", batchFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/school/fees?${params}`);
    if (res.ok) {
      const data = await res.json();
      setFees(data.fees);
      setSummary(data.summary);
    }
    setLoading(false);
  }, [month, batchFilter, statusFilter]);

  useEffect(() => { fetch("/api/school/batches").then((r) => r.json()).then(setBatches); }, []);
  useEffect(() => { load(); }, [load]);

  async function generateMonthlyFees() {
    if (!confirm(`${month} মাসের জন্য সব শিক্ষার্থীর ফি তৈরি করবেন?`)) return;
    setGenerating(true);
    await fetch("/api/school/fees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulk_monthly", month }) });
    setGenerating(false);
    load();
  }

  async function collectPayment() {
    if (!payModal) return;
    setPaying(true);
    await fetch(`/api/school/fees/${payModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount: Number(payForm.paidAmount), method: payForm.method, note: payForm.note }),
    });
    setPaying(false);
    setPayModal(null);
    setPayForm({ paidAmount: "", method: "cash", note: "" });
    load();
  }

  const totalNet = summary.reduce((s, x) => s + (x._sum.netAmount ?? 0), 0);
  const totalPaid = summary.reduce((s, x) => s + (x._sum.paidAmount ?? 0), 0);
  const totalDue = summary.reduce((s, x) => s + (x._sum.dueAmount ?? 0), 0);
  const paidCount = summary.find((x) => x.status === "paid")?._count.status ?? 0;
  const dueCount = summary.find((x) => x.status === "due")?._count.status ?? 0;
  const partialCount = summary.find((x) => x.status === "partial")?._count.status ?? 0;
  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>ফি ম্যানেজমেন্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>মাসিক ফি সংগ্রহ ও পরিচালনা</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateMonthlyFees} disabled={generating} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold" style={{ borderColor: S.border, color: S.text }}>
            {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {month} ফি তৈরি
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট ফি",       value: formatBDT(totalNet),  color: "#2563EB", bg: "#EFF6FF" },
          { label: "পরিশোধ",      value: `${paidCount}জন`,     color: "#0F6E56", bg: "#E1F5EE" },
          { label: "বাকি",         value: `${dueCount}জন`,      color: "#EF4444", bg: "#FEE2E2" },
          { label: "আংশিক",       value: `${partialCount}জন`,  color: "#EF9F27", bg: "#FFF3DC" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl p-3 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <p className="text-[11px]" style={{ color: S.muted }}>{c.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={inputStyle} />
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={inputStyle}>
          <option value="">সব ব্যাচ</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={inputStyle}>
          <option value="">সব স্ট্যাটাস</option>
          <option value="due">বাকি</option>
          <option value="partial">আংশিক</option>
          <option value="paid">পরিশোধ</option>
        </select>
      </div>

      {/* Fee Collection summary bar */}
      {totalNet > 0 && (
        <div className="rounded-xl px-4 py-3 border flex items-center gap-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: S.muted }}>
              <span>সংগৃহীত: {formatBDT(totalPaid)}</span>
              <span>বাকি: {formatBDT(totalDue)}</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
              <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.round((totalPaid / totalNet) * 100))}%`, backgroundColor: "#0F6E56" }} />
            </div>
          </div>
          <p className="text-sm font-bold flex-shrink-0" style={{ color: "#0F6E56" }}>{Math.round((totalPaid / totalNet) * 100)}%</p>
        </div>
      )}

      {/* Fee Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : fees.length === 0 ? (
        <div className="rounded-2xl p-10 border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Receipt size={36} className="mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="font-semibold" style={{ color: S.text }}>এই মাসের ফি তৈরি হয়নি</p>
          <p className="text-xs mt-1 mb-4" style={{ color: S.muted }}>উপরে "{month} ফি তৈরি" বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {fees.map((fee, i) => {
            const badge = STATUS_BADGE[fee.status] ?? STATUS_BADGE.due;
            return (
              <div key={fee.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{fee.student.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <p className="text-[11px]" style={{ color: S.muted }}>{fee.student.regNumber}</p>
                    {fee.batch && <p className="text-[11px]" style={{ color: S.muted }}>{fee.batch.name}</p>}
                    {fee.receiptNo && <p className="text-[11px]" style={{ color: S.muted }}>{fee.receiptNo}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold" style={{ color: fee.status === "paid" ? "#0F6E56" : "#EF4444" }}>
                    {fee.status === "paid" ? formatBDT(fee.paidAmount) : `বাকি ${formatBDT(fee.dueAmount)}`}
                  </p>
                  <p className="text-[10px]" style={{ color: S.muted }}>মোট ৳{fee.netAmount}</p>
                </div>
                {fee.status !== "paid" && (
                  <button
                    onClick={() => { setPayModal(fee); setPayForm({ paidAmount: String(fee.dueAmount), method: "cash", note: "" }); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    <Plus size={11} /> ফি নিন
                  </button>
                )}
                {fee.status === "paid" && <CheckCircle size={18} style={{ color: "#0F6E56" }} className="flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border shadow-xl" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>ফি সংগ্রহ</h2>
              <button onClick={() => setPayModal(null)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="rounded-xl p-3 border" style={{ backgroundColor: S.bg, borderColor: S.border }}>
                <p className="text-sm font-semibold" style={{ color: S.text }}>{payModal.student.name}</p>
                <p className="text-xs" style={{ color: S.muted }}>{payModal.description ?? payModal.month} · বাকি: {formatBDT(payModal.dueAmount)}</p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরিশোধের পরিমাণ *</label>
                <input type="number" value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পদ্ধতি</label>
                <div className="flex gap-2">
                  {["cash","bkash","nagad"].map((m) => (
                    <button key={m} type="button" onClick={() => setPayForm({ ...payForm, method: m })} className="flex-1 py-2 rounded-xl border text-xs font-semibold capitalize" style={{ borderColor: payForm.method === m ? "#2563EB" : S.border, backgroundColor: payForm.method === m ? "#EFF6FF" : S.surface, color: payForm.method === m ? "#2563EB" : S.muted }}>
                      {m === "cash" ? "ক্যাশ" : m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} className={inputCls} style={inputStyle} placeholder="ঐচ্ছিক" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setPayModal(null)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button onClick={collectPayment} disabled={paying || !payForm.paidAmount} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#2563EB" }}>
                  {paying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  সেভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
