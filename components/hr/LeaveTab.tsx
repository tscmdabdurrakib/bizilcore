"use client";

import { useEffect, useState } from "react";
import { Calendar, Check, X, Loader2, Plus } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import type { LeaveRequest, LeaveBalance, StaffMember } from "@/lib/hr/types";
import { LEAVE_TYPE_LABEL } from "@/lib/hr/types";

interface Props {
  staff: StaffMember[];
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function LeaveTab({ staff, showToast }: Props) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staffId: "", startDate: "", endDate: "", type: "casual", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/hr/leave");
    const data = await res.json();
    setRequests(data.requests ?? []);
    setBalances(data.balances ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const r = await fetch("/api/hr/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, autoApprove: true }),
    });
    setSubmitting(false);
    if (r.ok) {
      showToast("success", "ছুটি রেকর্ড হয়েছে ✓");
      setShowForm(false);
      setForm({ staffId: "", startDate: "", endDate: "", type: "casual", reason: "" });
      load();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "যোগ করা যায়নি");
    }
  }

  async function review(id: string, status: "approved" | "rejected") {
    const r = await fetch(`/api/hr/leave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      showToast("success", status === "approved" ? "অনুমোদিত ✓" : "প্রত্যাখ্যাত");
      load();
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{pending.length}টি অপেক্ষমান আবেদন</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-xl bg-blue-600 text-white text-sm font-semibold">
          <Plus size={14} /> ছুটি দিন
        </button>
      </div>

      {/* Balance cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {balances.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-bold text-sm text-gray-900">{b.staff.user.name}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-emerald-600">নৈমিত্তিক: {b.casual - b.usedCasual}/{b.casual}</span>
                <span className="text-blue-600">অসুস্থ: {b.sick - b.usedSick}/{b.sick}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-sm font-bold text-amber-800">অপেক্ষমান আবেদন</p>
              </div>
              {pending.map((req, i) => (
                <LeaveRow key={req.id} req={req} isLast={i === pending.length - 1} onReview={review} />
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-700">ছুটির ইতিহাস</p>
            </div>
            {approved.length === 0 && pending.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar size={32} className="mx-auto text-blue-400 mb-3" />
                <p className="font-bold text-gray-900">কোনো ছুটি নেই</p>
              </div>
            ) : (
              [...pending, ...approved, ...requests.filter(r => r.status === "rejected")].map((req, i, arr) => (
                <LeaveRow key={req.id} req={req} isLast={i === arr.length - 1} onReview={review} showActions={req.status === "pending"} />
              ))
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-4">ছুটি রেকর্ড করুন</h3>
            <form onSubmit={submitLeave} className="space-y-3">
              <select value={form.staffId} onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))} required
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm">
                <option value="">কর্মী বেছে নিন *</option>
                {staff.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
              </select>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm">
                {Object.entries(LEAVE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker value={form.startDate} onChange={v => setForm(p => ({ ...p, startDate: v }))} className="h-10 px-3 rounded-xl border border-gray-200 text-sm" required />
                <DatePicker value={form.endDate} onChange={v => setForm(p => ({ ...p, endDate: v }))} className="h-10 px-3 rounded-xl border border-gray-200 text-sm" required />
              </div>
              <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="কারণ (ঐচ্ছিক)"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm">বাতিল</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60">
                  {submitting ? "..." : "সেভ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveRow({ req, isLast, onReview, showActions = false }: {
  req: LeaveRequest; isLast: boolean; onReview: (id: string, s: "approved" | "rejected") => void; showActions?: boolean;
}) {
  const statusColor = req.status === "approved" ? "#10B981" : req.status === "rejected" ? "#EF4444" : "#F59E0B";
  const statusBg = req.status === "approved" ? "#ECFDF5" : req.status === "rejected" ? "#FEF2F2" : "#FFFBEB";
  const statusLabel = req.status === "approved" ? "অনুমোদিত" : req.status === "rejected" ? "প্রত্যাখ্যাত" : "অপেক্ষমান";

  return (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: isLast ? "none" : "1px solid #F3F4F6" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{req.staff.user.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {LEAVE_TYPE_LABEL[req.type] ?? req.type} · {new Date(req.startDate).toLocaleDateString("bn-BD")} — {new Date(req.endDate).toLocaleDateString("bn-BD")}
        </p>
        {req.reason && <p className="text-xs text-gray-500 mt-0.5">{req.reason}</p>}
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ color: statusColor, backgroundColor: statusBg }}>{statusLabel}</span>
      {showActions && (
        <div className="flex gap-1">
          <button onClick={() => onReview(req.id, "approved")} className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Check size={14} /></button>
          <button onClick={() => onReview(req.id, "rejected")} className="p-2 rounded-lg bg-red-50 text-red-600"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
