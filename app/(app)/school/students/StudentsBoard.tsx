"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Plus, Search, X, Loader2, ChevronRight } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

interface BatchOption { id: string; name: string; monthlyFee: number; admissionFee: number }
interface Student {
  id: string; regNumber: string; name: string; nameBangla?: string | null;
  guardianPhone: string; status: string;
  batch?: { id: string; name: string } | null;
  fees?: { status: string; dueAmount: number }[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const STATUS_LABEL: Record<string, string> = { active: "সক্রিয়", inactive: "নিষ্ক্রিয়", tc_issued: "TC দেওয়া", graduated: "পাস" };
const FEE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: "#E1F5EE", color: "#085041", label: "পরিশোধ" },
  due:     { bg: "#FCEBEB", color: "#791F1F", label: "বাকি"   },
  partial: { bg: "#FAEEDA", color: "#633806", label: "আংশিক" },
};

export default function StudentsBoard() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [form, setForm] = useState({
    name: "", nameBangla: "", phone: "", guardianName: "", guardianPhone: "",
    guardianRelation: "Father", address: "", dateOfBirth: "", gender: "", bloodGroup: "",
    previousSchool: "", batchId: "", admissionFee: "", admissionPaid: false, admissionMethod: "cash", notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: statusFilter });
    if (batchFilter) params.set("batchId", batchFilter);
    const res = await fetch(`/api/school/students?${params}`);
    if (res.ok) setStudents(await res.json());
    setLoading(false);
  }, [search, statusFilter, batchFilter]);

  useEffect(() => {
    fetch("/api/school/batches").then((r) => r.json()).then(setBatches);
    if (searchParams.get("new") === "1") setShowForm(true);
  }, [searchParams]);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(load, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [load]);

  const selectedBatch = batches.find((b) => b.id === form.batchId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/school/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, admissionFee: selectedBatch?.admissionFee ?? Number(form.admissionFee) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", nameBangla: "", phone: "", guardianName: "", guardianPhone: "", guardianRelation: "Father", address: "", dateOfBirth: "", gender: "", bloodGroup: "", previousSchool: "", batchId: "", admissionFee: "", admissionPaid: false, admissionMethod: "cash", notes: "" });
      load();
    }
    setSaving(false);
  }

  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm outline-none`;
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>শিক্ষার্থী তালিকা</h1>
          <p className="text-xs" style={{ color: S.muted }}>{students.length} জন</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#2563EB" }}>
          <Plus size={16} /> শিক্ষার্থী ভর্তি
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="নাম / রেজি নং / ফোন..." className={`${inputCls} pl-8`} style={inputStyle} />
        </div>
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={inputStyle}>
          <option value="">সব ব্যাচ</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={inputStyle}>
          <option value="">সব</option>
          <option value="active">সক্রিয়</option>
          <option value="inactive">নিষ্ক্রিয়</option>
          <option value="tc_issued">TC দেওয়া</option>
          <option value="graduated">পাস</option>
        </select>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl p-10 border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <GraduationCap size={36} className="mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="font-semibold" style={{ color: S.text }}>কোনো শিক্ষার্থী নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>উপরে "শিক্ষার্থী ভর্তি" বাটনে ক্লিক করুন</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {students.map((s, i) => {
            const feeStatus = s.fees?.[0]?.status ?? "due";
            const feeBadge = FEE_BADGE[feeStatus] ?? FEE_BADGE.due;
            const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <Link key={s.id} href={`/school/students/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: "#2563EB" }}>{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{s.name}</p>
                    {s.nameBangla && <p className="text-xs" style={{ color: S.muted }}>{s.nameBangla}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-[11px]" style={{ color: S.muted }}>{s.regNumber}</p>
                    {s.batch && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}>{s.batch.name}</span>}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: feeBadge.bg, color: feeBadge.color }}>{feeBadge.label}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: S.muted }}>{s.guardianPhone}</p>
                  <p className="text-[10px] mt-0.5 font-medium" style={{ color: s.status === "active" ? "#0F6E56" : S.muted }}>{STATUS_LABEL[s.status] ?? s.status}</p>
                </div>
                <ChevronRight size={14} style={{ color: S.muted }} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Student Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="text-base font-bold" style={{ color: S.text }}>শিক্ষার্থী ভর্তি</h2>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Personal Info */}
              <div>
                <p className="text-xs font-bold uppercase mb-3" style={{ color: S.muted }}>ব্যক্তিগত তথ্য</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম (ইংরেজি) *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} placeholder="Student Name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম (বাংলা)</label>
                    <input value={form.nameBangla} onChange={(e) => setForm({ ...form, nameBangla: e.target.value })} className={inputCls} style={inputStyle} placeholder="শিক্ষার্থীর নাম" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>জন্ম তারিখ</label>
                    <DatePicker value={form.dateOfBirth} onChange={v => setForm({ ...form, dateOfBirth: v })} className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>লিঙ্গ</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls} style={inputStyle}>
                      <option value="">নির্বাচন করুন</option>
                      <option value="Male">ছেলে</option>
                      <option value="Female">মেয়ে</option>
                      <option value="Other">অন্যান্য</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>রক্তের গ্রুপ</label>
                    <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className={inputCls} style={inputStyle}>
                      <option value="">নির্বাচন করুন</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ফোন (শিক্ষার্থীর)</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} style={inputStyle} placeholder="01XXXXXXXXX" />
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div>
                <p className="text-xs font-bold uppercase mb-3" style={{ color: S.muted }}>অভিভাবকের তথ্য</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অভিভাবকের নাম *</label>
                    <input required value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className={inputCls} style={inputStyle} placeholder="Guardian Name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অভিভাবকের ফোন *</label>
                    <input required value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} className={inputCls} style={inputStyle} placeholder="01XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সম্পর্ক</label>
                    <select value={form.guardianRelation} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} className={inputCls} style={inputStyle}>
                      {["Father","Mother","Uncle","Aunt","Brother","Sister","Other"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ঠিকানা</label>
                    <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} style={inputStyle} placeholder="বাড়ির ঠিকানা" />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <p className="text-xs font-bold uppercase mb-3" style={{ color: S.muted }}>শিক্ষামূলক তথ্য</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ব্যাচ *</label>
                    <select required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className={inputCls} style={inputStyle}>
                      <option value="">ব্যাচ নির্বাচন করুন</option>
                      {batches.filter((b) => b.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>আগের শিক্ষা প্রতিষ্ঠান</label>
                    <input value={form.previousSchool} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} className={inputCls} style={inputStyle} placeholder="আগের স্কুল/কলেজের নাম" />
                  </div>
                </div>
              </div>

              {/* Fee Setup */}
              {selectedBatch && (
                <div className="rounded-xl p-3 border" style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#1D4ED8" }}>ফি সেটআপ</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs" style={{ color: "#1E40AF" }}>
                    <p>মাসিক ফি: <strong>৳{selectedBatch.monthlyFee}</strong></p>
                    <p>ভর্তি ফি: <strong>৳{selectedBatch.admissionFee}</strong></p>
                  </div>
                  {selectedBatch.admissionFee > 0 && (
                    <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer" style={{ color: "#1D4ED8" }}>
                      <input type="checkbox" checked={form.admissionPaid} onChange={(e) => setForm({ ...form, admissionPaid: e.target.checked })} />
                      এখনই ভর্তি ফি নিচ্ছি
                    </label>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} style={inputStyle} placeholder="যেকোনো বিশেষ তথ্য..." />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#2563EB" }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                  ভর্তি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
