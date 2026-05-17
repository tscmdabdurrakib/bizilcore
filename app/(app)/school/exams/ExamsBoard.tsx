"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpenCheck, Plus, X, Loader2, Trophy } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

interface BatchOption { id: string; name: string }
interface Student { id: string; name: string; regNumber: string }
interface ExamResult {
  id: string; examName: string; subject: string; totalMark: number; obtainedMark: number;
  percentage: number; grade: string | null; position: number | null; examDate: string; remarks: string | null;
  student: { id: string; name: string; regNumber: string };
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const GRADE_COLORS: Record<string, { bg: string; color: string }> = {
  "A+": { bg: "#E1F5EE", color: "#085041" },
  "A":  { bg: "#DCFCE7", color: "#166534" },
  "A-": { bg: "#D1FAE5", color: "#065F46" },
  "B":  { bg: "#EFF6FF", color: "#1D4ED8" },
  "C":  { bg: "#FFF3DC", color: "#633806" },
  "D":  { bg: "#FEF9C3", color: "#713F12" },
  "F":  { bg: "#FEE2E2", color: "#791F1F" },
};

function calcGrade(pct: number): string {
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "A-";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  if (pct >= 33) return "D";
  return "F";
}

export default function ExamsBoard() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchFilter, setBatchFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [batchStudents, setBatchStudents] = useState<Student[]>([]);
  const [formBatchId, setFormBatchId] = useState("");
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalMark, setTotalMark] = useState("100");
  const [studentMarks, setStudentMarks] = useState<Record<string, { mark: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (batchFilter) params.set("batchId", batchFilter);
    const res = await fetch(`/api/school/exams?${params}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
    }
    setLoading(false);
  }, [batchFilter]);

  useEffect(() => { fetch("/api/school/batches").then((r) => r.json()).then(setBatches); }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!formBatchId) { setBatchStudents([]); return; }
    fetch(`/api/school/batches/${formBatchId}`).then((r) => r.json()).then((d) => {
      setBatchStudents(d.students ?? []);
      const m: Record<string, { mark: string; remarks: string }> = {};
      for (const s of (d.students ?? [])) m[s.id] = { mark: "", remarks: "" };
      setStudentMarks(m);
    });
  }, [formBatchId]);

  async function submitResults(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const entries = batchStudents
      .filter((s) => studentMarks[s.id]?.mark !== "")
      .map((s) => ({ studentId: s.id, obtainedMark: Number(studentMarks[s.id].mark), remarks: studentMarks[s.id].remarks }));
    await fetch("/api/school/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examName, subject, examDate, totalMark: Number(totalMark), batchId: formBatchId, results: entries }),
    });
    setSaving(false);
    setShowForm(false);
    setExamName(""); setSubject(""); setFormBatchId(""); setStudentMarks({});
    load();
  }

  // Group results by exam
  const grouped = results.reduce((acc, r) => {
    const key = `${r.examName}|||${r.subject}`;
    if (!acc[key]) acc[key] = { examName: r.examName, subject: r.subject, examDate: r.examDate, results: [] };
    acc[key].results.push(r);
    return acc;
  }, {} as Record<string, { examName: string; subject: string; examDate: string; results: ExamResult[] }>);

  const inputCls = "w-full px-3 py-2 rounded-xl border text-sm outline-none";
  const inputStyle = { backgroundColor: S.surface, borderColor: S.border, color: S.text };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>পরীক্ষার ফলাফল</h1>
          <p className="text-xs" style={{ color: S.muted }}>পরীক্ষার ফলাফল এন্ট্রি ও বিশ্লেষণ</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#2563EB" }}>
          <Plus size={16} /> ফলাফল এন্ট্রি
        </button>
      </div>

      {/* Batch Filter */}
      <div className="flex gap-2">
        <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={inputStyle}>
          <option value="">সব ব্যাচ</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl p-10 border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <BookOpenCheck size={36} className="mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="font-semibold" style={{ color: S.text }}>কোনো পরীক্ষার ফলাফল নেই</p>
        </div>
      ) : (
        Object.values(grouped).map((group) => {
          const sorted = [...group.results].sort((a, b) => b.obtainedMark - a.obtainedMark);
          return (
            <div key={`${group.examName}|${group.subject}`} className="rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="px-4 py-3 border-b flex items-start justify-between" style={{ borderColor: S.border }}>
                <div>
                  <p className="font-bold" style={{ color: S.text }}>{group.examName}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{group.subject} · {new Date(group.examDate).toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={14} style={{ color: "#EF9F27" }} />
                  <p className="text-xs font-semibold" style={{ color: S.muted }}>{sorted.length}জন</p>
                </div>
              </div>
              <div>
                {sorted.map((r, i) => {
                  const gradeBadge = GRADE_COLORS[r.grade ?? "F"] ?? GRADE_COLORS.F;
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: i === 0 ? "#EF9F27" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : "#E5E7EB", color: i < 3 ? "white" : S.muted }}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: S.text }}>{r.student.name}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{r.student.regNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: S.text }}>{r.obtainedMark}/{r.totalMark}</p>
                        <p className="text-xs" style={{ color: S.muted }}>{r.percentage}%</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: gradeBadge.bg, color: gradeBadge.color }}>{r.grade ?? "F"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Entry Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="text-base font-bold" style={{ color: S.text }}>পরীক্ষার ফলাফল এন্ট্রি</h2>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={submitResults} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরীক্ষার নাম *</label>
                  <input required value={examName} onChange={(e) => setExamName(e.target.value)} className={inputCls} style={inputStyle} placeholder="Monthly Test - March 2026" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিষয় *</label>
                  <input required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} style={inputStyle} placeholder="Mathematics" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>পরীক্ষার তারিখ</label>
                  <DatePicker value={examDate} onChange={v => setExamDate(v)} className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>মোট নম্বর *</label>
                  <input required type="number" value={totalMark} onChange={(e) => setTotalMark(e.target.value)} className={inputCls} style={inputStyle} placeholder="100" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ব্যাচ *</label>
                  <select required value={formBatchId} onChange={(e) => setFormBatchId(e.target.value)} className={inputCls} style={inputStyle}>
                    <option value="">ব্যাচ নির্বাচন করুন</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {batchStudents.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>শিক্ষার্থীদের নম্বর</p>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: S.border }}>
                    {batchStudents.map((s, i) => {
                      const mark = studentMarks[s.id]?.mark ?? "";
                      const pct = mark && totalMark ? Math.round((Number(mark) / Number(totalMark)) * 100) : null;
                      const grade = pct !== null ? calcGrade(pct) : null;
                      const gStyle = grade ? (GRADE_COLORS[grade] ?? GRADE_COLORS.F) : null;
                      return (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                          <div className="flex-1">
                            <p className="text-xs font-semibold" style={{ color: S.text }}>{s.name}</p>
                            <p className="text-[10px]" style={{ color: S.muted }}>{s.regNumber}</p>
                          </div>
                          <input
                            type="number" min="0" max={totalMark}
                            value={mark}
                            onChange={(e) => setStudentMarks({ ...studentMarks, [s.id]: { ...studentMarks[s.id], mark: e.target.value } })}
                            className="w-16 px-2 py-1 rounded-lg border text-sm text-center outline-none"
                            style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                            placeholder="—"
                          />
                          {grade && gStyle && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold w-10 text-center" style={{ backgroundColor: gStyle.bg, color: gStyle.color }}>{grade}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving || batchStudents.length === 0} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#2563EB" }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <BookOpenCheck size={16} />}
                  সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
