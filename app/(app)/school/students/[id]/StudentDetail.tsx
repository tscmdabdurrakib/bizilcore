"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, ArrowLeft, Receipt, CalendarCheck2, BookOpenCheck, Pencil, X, Save } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface FeeRecord { id: string; feeType: string; month?: string | null; description?: string | null; netAmount: number; paidAmount: number; dueAmount: number; status: string; method?: string | null; receiptNo?: string | null; createdAt: string }
interface AttRecord { id: string; date: string; status: string }
interface ExamResult { id: string; examName: string; subject: string; totalMark: number; obtainedMark: number; percentage: number; grade: string | null; examDate: string }
interface BatchOption { id: string; name: string }
interface Student {
  id: string; name: string; nameBangla?: string | null; regNumber: string; phone?: string | null;
  guardianName: string; guardianPhone: string; guardianRelation?: string | null;
  address?: string | null; dateOfBirth?: string | null; gender?: string | null; bloodGroup?: string | null;
  previousSchool?: string | null; status: string; notes?: string | null;
  admissionDate: string;
  batch?: { id: string; name: string; monthlyFee: number } | null;
  fees: FeeRecord[]; attendance: AttRecord[]; examResults: ExamResult[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: "#E1F5EE", color: "#085041", label: "পরিশোধ" },
  due:     { bg: "#FCEBEB", color: "#791F1F", label: "বাকি"   },
  partial: { bg: "#FAEEDA", color: "#633806", label: "আংশিক" },
};
const ATT_LABEL: Record<string, { bg: string; color: string; label: string }> = {
  present: { bg: "#E1F5EE", color: "#085041", label: "✓" },
  absent:  { bg: "#FEE2E2", color: "#791F1F", label: "✗" },
  late:    { bg: "#FFF3DC", color: "#633806", label: "⏱" },
  leave:   { bg: "#F3F4F6", color: "#6B7280", label: "—" },
};
const GRADE_COLORS: Record<string, { bg: string; color: string }> = {
  "A+": { bg: "#E1F5EE", color: "#085041" }, "A": { bg: "#DCFCE7", color: "#166534" },
  "A-": { bg: "#D1FAE5", color: "#065F46" }, "B": { bg: "#EFF6FF", color: "#1D4ED8" },
  "C":  { bg: "#FFF3DC", color: "#633806" }, "D": { bg: "#FEF9C3", color: "#713F12" },
  "F":  { bg: "#FEE2E2", color: "#791F1F" },
};
const TABS = [
  { key: "fees",       label: "ফি ইতিহাস",      icon: Receipt        },
  { key: "attendance", label: "উপস্থিতি",        icon: CalendarCheck2 },
  { key: "exams",      label: "পরীক্ষার ফলাফল", icon: BookOpenCheck  },
];

export default function StudentDetail({ id }: { id: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("fees");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/school/students/${id}`);
    if (res.ok) {
      const d = await res.json();
      setStudent(d);
      setEditForm({ name: d.name, nameBangla: d.nameBangla, phone: d.phone, guardianName: d.guardianName, guardianPhone: d.guardianPhone, guardianRelation: d.guardianRelation, address: d.address, gender: d.gender, bloodGroup: d.bloodGroup, previousSchool: d.previousSchool, batchId: d.batch?.id ?? undefined, notes: d.notes, status: d.status });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); fetch("/api/school/batches").then((r) => r.json()).then(setBatches); }, [load]);

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/school/students/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setSaving(false);
    setEditing(false);
    load();
  }

  async function issueTC() {
    if (!confirm("TC দিলে শিক্ষার্থী নিষ্ক্রিয় হয়ে যাবে। নিশ্চিত?")) return;
    await fetch(`/api/school/students/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "tc_issued" }) });
    load();
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#2563EB" }} /></div>;
  if (!student) return <div className="text-center py-20" style={{ color: S.muted }}>শিক্ষার্থী পাওয়া যায়নি</div>;

  const presentCount = student.attendance.filter((a) => a.status === "present").length;
  const totalAtt = student.attendance.length;
  const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : null;
  const totalPaid = student.fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalDue = student.fees.reduce((s, f) => s + f.dueAmount, 0);
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <ArrowLeft size={16} style={{ color: S.text }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: S.text }}>{student.name}</h1>
          <p className="text-xs" style={{ color: S.muted }}>{student.regNumber}</p>
        </div>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold" style={{ borderColor: S.border, color: S.text }}>
          <Pencil size={12} /> এডিট
        </button>
        {student.status === "active" && (
          <button onClick={issueTC} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#EF4444" }}>
            TC দিন
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ backgroundColor: "#2563EB" }}>{initials}</div>
          <div className="flex-1 grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {[
              ["ব্যাচ", student.batch?.name ?? "—"],
              ["অভিভাবক", `${student.guardianName} (${student.guardianRelation ?? ""})`],
              ["অভিভাবকের ফোন", student.guardianPhone],
              ["লিঙ্গ", student.gender ?? "—"],
              ["রক্তের গ্রুপ", student.bloodGroup ?? "—"],
              ["ঠিকানা", student.address ?? "—"],
              ["ভর্তির তারিখ", new Date(student.admissionDate).toLocaleDateString("bn-BD")],
              ["স্ট্যাটাস", student.status],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px]" style={{ color: S.muted }}>{label}</p>
                <p className="text-xs font-semibold" style={{ color: S.text }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Summary pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#E1F5EE", color: "#085041" }}>পরিশোধ: {formatBDT(totalPaid)}</span>
          {totalDue > 0 && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#FEE2E2", color: "#791F1F" }}>বাকি: {formatBDT(totalDue)}</span>}
          {attPct !== null && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>উপস্থিতি: {attPct}%</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: tab === t.key ? "#2563EB" : "transparent", color: tab === t.key ? "white" : S.muted }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "fees" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {student.fees.length === 0 ? (
            <div className="py-10 text-center"><Receipt size={28} className="mx-auto mb-2" style={{ color: S.muted }} /><p className="text-xs" style={{ color: S.muted }}>কোনো ফি রেকর্ড নেই</p></div>
          ) : student.fees.map((f, i) => {
            const badge = STATUS_BADGE[f.status] ?? STATUS_BADGE.due;
            return (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: S.text }}>{f.description ?? f.month ?? f.feeType}</p>
                  {f.receiptNo && <p className="text-[10px]" style={{ color: S.muted }}>{f.receiptNo}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(f.netAmount)}</p>
                  {f.dueAmount > 0 && <p className="text-[10px]" style={{ color: "#EF4444" }}>বাকি {formatBDT(f.dueAmount)}</p>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {tab === "attendance" && (
        <div>
          {attPct !== null && (
            <div className="rounded-xl px-4 py-3 border mb-3 flex items-center gap-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <CalendarCheck2 size={16} style={{ color: "#2563EB" }} />
              <p className="text-sm" style={{ color: S.text }}>উপস্থিত: <strong>{presentCount} দিন</strong> · অনুপস্থিত: <strong>{totalAtt - presentCount} দিন</strong> · উপস্থিতি: <strong style={{ color: "#2563EB" }}>{attPct}%</strong></p>
            </div>
          )}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            {student.attendance.length === 0 ? (
              <div className="py-10 text-center"><p className="text-xs" style={{ color: S.muted }}>কোনো উপস্থিতি রেকর্ড নেই</p></div>
            ) : student.attendance.slice(0, 30).map((a, i) => {
              const badge = ATT_LABEL[a.status] ?? ATT_LABEL.absent;
              return (
                <div key={a.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                  <p className="text-xs" style={{ color: S.text }}>{new Date(a.date).toLocaleDateString("bn-BD", { day: "numeric", month: "long", weekday: "short" })}</p>
                  <span className="w-8 h-6 rounded-lg text-xs font-bold flex items-center justify-center" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "exams" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {student.examResults.length === 0 ? (
            <div className="py-10 text-center"><BookOpenCheck size={28} className="mx-auto mb-2" style={{ color: S.muted }} /><p className="text-xs" style={{ color: S.muted }}>কোনো পরীক্ষার ফলাফল নেই</p></div>
          ) : student.examResults.map((r, i) => {
            const gBadge = GRADE_COLORS[r.grade ?? "F"] ?? GRADE_COLORS.F;
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: S.text }}>{r.examName}</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>{r.subject} · {new Date(r.examDate).toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: S.text }}>{r.obtainedMark}/{r.totalMark}</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>{r.percentage}%</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: gBadge.bg, color: gBadge.color }}>{r.grade ?? "F"}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-bold flex items-center gap-2" style={{ color: S.text }}><GraduationCap size={16} /> তথ্য সম্পাদনা</h2>
              <button onClick={() => setEditing(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নাম *</label>
                  <input required value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বাংলা নাম</label>
                  <input value={editForm.nameBangla ?? ""} onChange={(e) => setEditForm({ ...editForm, nameBangla: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অভিভাবকের নাম *</label>
                  <input required value={editForm.guardianName ?? ""} onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>অভিভাবকের ফোন *</label>
                  <input required value={editForm.guardianPhone ?? ""} onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ব্যাচ</label>
                  <select value={(editForm as Record<string, unknown>).batchId as string ?? ""} onChange={(e) => setEditForm({ ...editForm, ...({ batchId: e.target.value } as Record<string, unknown>) })} className={inputCls} style={inputStyle}>
                    <option value="">ব্যাচ ছাড়া</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>স্ট্যাটাস</label>
                  <select value={editForm.status ?? "active"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={inputCls} style={inputStyle}>
                    <option value="active">সক্রিয়</option>
                    <option value="inactive">নিষ্ক্রিয়</option>
                    <option value="tc_issued">TC দেওয়া</option>
                    <option value="graduated">পাস</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>নোট</label>
                <textarea rows={2} value={editForm.notes ?? ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className={inputCls} style={inputStyle} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#2563EB" }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} সেভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
