"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarCheck2, Loader2, Save, CheckCircle, XCircle, Clock } from "lucide-react";

interface BatchOption { id: string; name: string }
interface Student { id: string; name: string; regNumber: string }
interface AttendanceData { students: Student[]; attendanceMap: Record<string, string>; date: string }

type AttStatus = "present" | "absent" | "late" | "leave";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)" };
const BTN: Record<AttStatus, { label: string; bg: string; color: string; icon: React.ComponentType<{ size: number }> }> = {
  present: { label: "উপস্থিত",  bg: "#E1F5EE", color: "#085041", icon: CheckCircle },
  absent:  { label: "অনুপস্থিত", bg: "#FEE2E2", color: "#791F1F", icon: XCircle    },
  late:    { label: "দেরিতে",   bg: "#FFF3DC", color: "#633806", icon: Clock       },
  leave:   { label: "ছুটি",     bg: "#F3F4F6", color: "#6B7280", icon: Clock       },
};

export default function AttendanceBoard() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [marks, setMarks] = useState<Record<string, AttStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/school/batches").then((r) => r.json()).then((list: BatchOption[]) => {
      setBatches(list);
      if (list.length > 0) setBatchId(list[0].id);
    });
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    const res = await fetch(`/api/school/attendance?batchId=${batchId}&date=${date}`);
    if (res.ok) {
      const d: AttendanceData = await res.json();
      setData(d);
      const initialMarks: Record<string, AttStatus> = {};
      for (const s of d.students) {
        initialMarks[s.id] = (d.attendanceMap[s.id] as AttStatus) ?? "present";
      }
      setMarks(initialMarks);
    }
    setLoading(false);
    setSaved(false);
  }, [batchId, date]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  function markAll(status: AttStatus) {
    if (!data) return;
    const m: Record<string, AttStatus> = {};
    for (const s of data.students) m[s.id] = status;
    setMarks(m);
  }

  async function saveAttendance() {
    if (!data || !batchId) return;
    setSaving(true);
    const records = data.students.map((s) => ({ studentId: s.id, status: marks[s.id] ?? "present" }));
    await fetch("/api/school/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, date, records }),
    });
    setSaving(false);
    setSaved(true);
  }

  const presentCount = Object.values(marks).filter((s) => s === "present").length;
  const absentCount = Object.values(marks).filter((s) => s === "absent").length;
  const lateCount = Object.values(marks).filter((s) => s === "late").length;
  const total = data?.students.length ?? 0;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      <div>
        <h1 className="text-lg font-bold" style={{ color: S.text }}>উপস্থিতি</h1>
        <p className="text-xs" style={{ color: S.muted }}>দৈনিক উপস্থিতি নিন</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }}>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-xl border text-sm" style={{ backgroundColor: S.surface, borderColor: S.border, color: S.text }} />
      </div>

      {/* Quick mark all */}
      {data && data.students.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <p className="text-xs self-center" style={{ color: S.muted }}>সবাইকে:</p>
          {(Object.keys(BTN) as AttStatus[]).map((s) => (
            <button key={s} onClick={() => markAll(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: BTN[s].bg, color: BTN[s].color }}>{BTN[s].label}</button>
          ))}
        </div>
      )}

      {/* Summary */}
      {total > 0 && (
        <div className="flex gap-3 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#E1F5EE", color: "#085041" }}>উপস্থিত: {presentCount}</span>
          <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#FEE2E2", color: "#791F1F" }}>অনুপস্থিত: {absentCount}</span>
          <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#FFF3DC", color: "#633806" }}>দেরিতে: {lateCount}</span>
          <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>মোট: {total}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : !data || data.students.length === 0 ? (
        <div className="rounded-2xl p-10 border text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <CalendarCheck2 size={36} className="mx-auto mb-3" style={{ color: "#2563EB" }} />
          <p className="font-semibold" style={{ color: S.text }}>কোনো শিক্ষার্থী নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>এই ব্যাচে শিক্ষার্থী যোগ করুন</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            {data.students.map((s, i) => {
              const current = marks[s.id] ?? "present";
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? `1px solid ${S.border}` : "none" }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{s.name}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{s.regNumber}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {(Object.keys(BTN) as AttStatus[]).map((status) => {
                      const b = BTN[status];
                      const active = current === status;
                      const Icon = b.icon;
                      return (
                        <button key={status} onClick={() => setMarks({ ...marks, [s.id]: status })} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all" style={{ backgroundColor: active ? b.bg : S.bg, color: active ? b.color : S.muted, border: `1px solid ${active ? b.color + "40" : S.border}` }}>
                          <Icon size={11} />
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={saveAttendance} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: saved ? "#0F6E56" : "#2563EB" }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
          </button>
        </>
      )}
    </div>
  );
}
