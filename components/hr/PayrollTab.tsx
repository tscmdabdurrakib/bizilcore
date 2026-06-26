"use client";

import { useEffect, useState } from "react";
import { DollarSign, Loader2, Plus, FileText, Check } from "lucide-react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import type { PayrollRun, StaffAdvance, StaffMember } from "@/lib/hr/types";
import { MONTH_NAMES } from "@/lib/hr/types";
import DatePicker from "@/components/ui/DatePicker";

interface Props {
  staff: StaffMember[];
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function PayrollTab({ staff, showToast }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [payroll, setPayroll] = useState<PayrollRun | null>(null);
  const [advances, setAdvances] = useState<StaffAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAdvance, setShowAdvance] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ staffId: "", amount: "", date: new Date().toISOString().slice(0, 10), reason: "" });
  const [payingId, setPayingId] = useState<string | null>(null);
  const [addToExpenses, setAddToExpenses] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/hr/payroll?month=${month}&year=${year}`);
    const data = await res.json();
    setPayroll(data.payroll ?? null);
    setAdvances(data.advances ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month]);

  async function generate() {
    setGenerating(true);
    const r = await fetch("/api/hr/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", month, year }),
    });
    const d = await r.json();
    setGenerating(false);
    if (r.ok) {
      setPayroll(d.payroll);
      showToast("success", "বেতন তৈরি হয়েছে ✓");
    } else {
      showToast("error", d.error ?? "তৈরি করা যায়নি");
    }
  }

  async function finalize() {
    if (!payroll) return;
    const r = await fetch(`/api/hr/payroll/${payroll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finalize" }),
    });
    if (r.ok) {
      showToast("success", "Payroll finalized ✓");
      load();
    }
  }

  async function markPaid(itemId: string, netPay: number, paidAmount: number) {
    if (!payroll) return;
    setPayingId(itemId);
    const remaining = netPay - paidAmount;
    await fetch(`/api/hr/payroll/${payroll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", itemId, paidAmount: remaining, addToExpenses }),
    });
    setPayingId(null);
    showToast("success", "পরিশোধ রেকর্ড ✓");
    load();
  }

  async function submitAdvance(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/hr/payroll/advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(advanceForm),
    });
    if (r.ok) {
      showToast("success", "অ্যাডভান্স রেকর্ড ✓");
      setShowAdvance(false);
      setAdvanceForm({ staffId: "", amount: "", date: new Date().toISOString().slice(0, 10), reason: "" });
      load();
    } else {
      showToast("error", "যোগ করা যায়নি");
    }
  }

  const totalNet = payroll?.items.reduce((s, i) => s + i.netPay, 0) ?? 0;
  const totalPaid = payroll?.items.reduce((s, i) => s + i.paidAmount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white font-medium">
          {MONTH_NAMES.map((name, idx) => <option key={idx} value={idx + 1}>{name} {year}</option>)}
        </select>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAdvance(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">
            <Plus size={14} /> অ্যাডভান্স
          </button>
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-amber-600 text-white text-sm font-semibold disabled:opacity-60">
            {generating ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
            বেতন তৈরি
          </button>
          {payroll && payroll.status === "draft" && (
            <button onClick={finalize} className="px-4 h-9 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Finalize</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">মোট বেতন</p>
          <p className="text-lg font-black text-gray-900">{formatBDT(totalNet)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">পরিশোধিত</p>
          <p className="text-lg font-black text-emerald-600">{formatBDT(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">বাকি</p>
          <p className="text-lg font-black text-red-500">{formatBDT(totalNet - totalPaid)}</p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={addToExpenses} onChange={e => setAddToExpenses(e.target.checked)} className="rounded" />
        পরিশোধে খরচ (Expenses) এ যোগ করুন
      </label>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : !payroll ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
          <DollarSign size={32} className="mx-auto text-amber-500 mb-3" />
          <p className="font-bold text-gray-900">এই মাসের payroll নেই</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">&quot;বেতন তৈরি&quot; বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["কর্মী", "বেতন", "বোনাস", "কাটা", "অ্যাডভান্স", "নেট", "পরিশোধিত", "বাকি", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payroll.items.map((item, i) => {
                  const due = item.netPay - item.paidAmount;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50" style={{ borderBottom: i < payroll.items.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{item.staff.user.name}</p>
                        {item.staff.jobTitle && <p className="text-[10px] text-gray-400">{item.staff.jobTitle}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatBDT(item.baseSalary)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600">{formatBDT(item.bonus)}</td>
                      <td className="px-4 py-3 text-sm text-red-500">{formatBDT(item.deductions)}</td>
                      <td className="px-4 py-3 text-sm text-amber-600">{formatBDT(item.advance)}</td>
                      <td className="px-4 py-3 text-sm font-bold">{formatBDT(item.netPay)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600">{formatBDT(item.paidAmount)}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ color: due > 0 ? "#EF4444" : "#10B981" }}>{formatBDT(due)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {due > 0 && (
                            <button onClick={() => markPaid(item.id, item.netPay, item.paidAmount)} disabled={payingId === item.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 disabled:opacity-60">
                              {payingId === item.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                              দিয়েছি
                            </button>
                          )}
                          <Link href={`/hr/payroll/${item.id}/slip?month=${month}&year=${year}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-gray-100 text-gray-600">
                            <FileText size={10} /> Slip
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {advances.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">অ্যাডভান্স ইতিহাস</p>
          <div className="space-y-2">
            {advances.slice(0, 5).map(a => (
              <div key={a.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{a.staff.user.name}</span>
                <span className="font-semibold">{formatBDT(a.amount)} <span className="text-xs text-gray-400">(বাকি: {formatBDT(a.amount - a.settled)})</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdvance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-4">অ্যাডভান্স দিন</h3>
            <form onSubmit={submitAdvance} className="space-y-3">
              <select value={advanceForm.staffId} onChange={e => setAdvanceForm(p => ({ ...p, staffId: e.target.value }))} required
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm">
                <option value="">কর্মী *</option>
                {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
              </select>
              <input type="number" value={advanceForm.amount} onChange={e => setAdvanceForm(p => ({ ...p, amount: e.target.value }))} placeholder="পরিমাণ (৳) *" required
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
              <DatePicker value={advanceForm.date} onChange={v => setAdvanceForm(p => ({ ...p, date: v }))} className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
              <input value={advanceForm.reason} onChange={e => setAdvanceForm(p => ({ ...p, reason: e.target.value }))} placeholder="কারণ"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdvance(false)} className="flex-1 py-2.5 rounded-xl border text-sm">বাতিল</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold">সেভ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
