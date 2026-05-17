"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardPen, Loader2, CheckCircle, Send } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#F59E0B",
};

const MOODS = [
  { key: "happy",     emoji: "😊", label: "Happy" },
  { key: "sad",       emoji: "😢", label: "Sad" },
  { key: "cranky",    emoji: "😤", label: "Cranky" },
  { key: "tired",     emoji: "😴", label: "Tired" },
  { key: "energetic", emoji: "⚡", label: "Energetic" },
];

const ACTIVITIES = [
  "Drawing", "Singing", "Dancing", "Outdoor Play",
  "Story Time", "Craft", "Nap", "Reading",
];

const ATE_OPTIONS = [
  { key: "well",    label: "ভালো খেয়েছে",   color: "#10B981", bg: "#DCFCE7" },
  { key: "some",    label: "কিছুটা খেয়েছে",  color: "#F59E0B", bg: "#FEF3C7" },
  { key: "nothing", label: "কিছুই খায়নি",   color: "#EF4444", bg: "#FEE2E2" },
];

type StudentReport = {
  id: string;
  name: string;
  section?: string | null;
  photoUrl?: string | null;
  isPresent: boolean;
  report?: {
    id: string;
    mood?: string | null;
    activities: string[];
    ate?: string | null;
    napped: boolean;
    napDuration?: number | null;
    teacherNote?: string | null;
    sentToParent: boolean;
  } | null;
};

type ReportDraft = {
  mood: string;
  activities: string[];
  ate: string;
  napped: boolean;
  napDuration: string;
  teacherNote: string;
};

const defaultDraft = (): ReportDraft => ({
  mood: "", activities: [], ate: "", napped: false, napDuration: "", teacherNote: "",
});

export default function DailyReportBoard() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentReport[]>([]);
  const [totalPresent, setTotalPresent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  // drafts keyed by studentId
  const [drafts, setDrafts] = useState<Record<string, ReportDraft>>({});

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/kindergarten/daily-report?date=${date}`);
    const data = await res.json();
    const list: StudentReport[] = data.students ?? [];
    setStudents(list);
    setTotalPresent(data.totalPresent ?? 0);
    // Seed drafts from existing reports
    const d: Record<string, ReportDraft> = {};
    list.forEach(s => {
      if (s.report) {
        d[s.id] = {
          mood: s.report.mood ?? "",
          activities: s.report.activities ?? [],
          ate: s.report.ate ?? "",
          napped: s.report.napped,
          napDuration: String(s.report.napDuration ?? ""),
          teacherNote: s.report.teacherNote ?? "",
        };
      } else {
        d[s.id] = defaultDraft();
      }
    });
    setDrafts(d);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateDraft = (studentId: string, field: keyof ReportDraft, value: ReportDraft[keyof ReportDraft]) => {
    setDrafts(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    setSaved(false);
  };

  const toggleActivity = (studentId: string, activity: string) => {
    const current = drafts[studentId]?.activities ?? [];
    const updated = current.includes(activity)
      ? current.filter(a => a !== activity)
      : [...current, activity];
    updateDraft(studentId, "activities", updated);
  };

  const handleSave = async (markSent = false) => {
    if (markSent) setSending(true); else setSaving(true);

    const reports = students.map(s => {
      const d = drafts[s.id] ?? defaultDraft();
      return {
        studentId: s.id,
        mood: d.mood || null,
        activities: d.activities,
        ate: d.ate || null,
        napped: d.napped,
        napDuration: d.napDuration ? Number(d.napDuration) : null,
        teacherNote: d.teacherNote || null,
      };
    });

    await fetch("/api/kindergarten/daily-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reports, markSent }),
    });

    if (markSent) setSending(false); else setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); fetchReports(); }, 2000);
  };

  const sentCount = students.filter(s => s.report?.sentToParent).length;
  const reportedCount = students.filter(s => s.report).length;

  return (
    <div className="space-y-4">
      {/* Date picker + summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <DatePicker
  value={date}
  onChange={v => setDate(v)}
  className="border rounded-lg px-3 py-2 text-sm"
  style={{ borderColor: S.border, background: S.surface }}
/>
        <div className="flex items-center gap-3 text-sm" style={{ color: S.muted }}>
          <span>উপস্থিত: <strong style={{ color: S.text }}>{totalPresent}</strong></span>
          <span>রিপোর্ট: <strong style={{ color: S.text }}>{reportedCount}/{students.length}</strong></span>
          <span>পাঠানো: <strong style={{ color: "#10B981" }}>{sentCount}</strong></span>
        </div>
      </div>

      {/* Bulk send button */}
      {students.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: S.border, color: S.text }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saved ? "সেভ হয়েছে ✓" : "সব সেভ করুন"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#10B981" }}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            সবার রিপোর্ট পাঠান ({students.length - sentCount} জন বাকি)
          </button>
        </div>
      )}

      {/* Student reports */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" size={26} style={{ color: S.primary }} />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <ClipboardPen size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">আজকের উপস্থিত শিশু নেই</p>
          <p className="text-sm mt-1">আগে উপস্থিতি নিন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(student => {
            const draft = drafts[student.id] ?? defaultDraft();
            const isSent = student.report?.sentToParent;
            return (
              <div
                key={student.id}
                className="rounded-xl p-4 space-y-3"
                style={{ background: S.surface, border: `1px solid ${isSent ? "#BBF7D0" : S.border}` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0" style={{ background: "#FFFBEB", color: S.primary }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm" style={{ color: S.text }}>{student.name}</p>
                        {student.section && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: S.muted }}>{student.section}</span>}
                      </div>
                    </div>
                  </div>
                  {isSent && (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#10B981" }}>
                      <CheckCircle size={13} /> পাঠানো হয়েছে
                    </span>
                  )}
                </div>

                {/* Mood */}
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: S.muted }}>মুড</p>
                  <div className="flex gap-2 flex-wrap">
                    {MOODS.map(m => (
                      <button
                        key={m.key}
                        onClick={() => updateDraft(student.id, "mood", draft.mood === m.key ? "" : m.key)}
                        className="text-xl px-2 py-1 rounded-lg border-2 transition-all"
                        style={{
                          borderColor: draft.mood === m.key ? S.primary : "transparent",
                          background: draft.mood === m.key ? "#FFFBEB" : "#F9FAFB",
                        }}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: S.muted }}>আজকের কার্যক্রম</p>
                  <div className="flex gap-2 flex-wrap">
                    {ACTIVITIES.map(act => {
                      const selected = draft.activities.includes(act);
                      return (
                        <button
                          key={act}
                          onClick={() => toggleActivity(student.id, act)}
                          className="text-xs px-3 py-1 rounded-full border transition-all"
                          style={{
                            background: selected ? "#FFFBEB" : "transparent",
                            borderColor: selected ? S.primary : S.border,
                            color: selected ? "#B45309" : S.muted,
                          }}
                        >
                          {act}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ate + Nap row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: S.muted }}>খাওয়া</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {ATE_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => updateDraft(student.id, "ate", draft.ate === opt.key ? "" : opt.key)}
                          className="text-xs px-2 py-1 rounded-lg border-2 font-medium"
                          style={{
                            background: draft.ate === opt.key ? opt.bg : "transparent",
                            borderColor: draft.ate === opt.key ? opt.color : "transparent",
                            color: draft.ate === opt.key ? opt.color : S.muted,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: S.muted }}>ঘুম</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateDraft(student.id, "napped", !draft.napped)}
                        className="text-xs px-3 py-1.5 rounded-lg border-2 font-medium"
                        style={{
                          background: draft.napped ? "#EFF6FF" : "transparent",
                          borderColor: draft.napped ? "#3B82F6" : S.border,
                          color: draft.napped ? "#1D4ED8" : S.muted,
                        }}
                      >
                        {draft.napped ? "ঘুমিয়েছে ✓" : "ঘুমেনি"}
                      </button>
                      {draft.napped && (
                        <input
                          type="number"
                          className="w-20 border rounded-lg px-2 py-1 text-xs"
                          placeholder="মিনিট"
                          value={draft.napDuration}
                          onChange={e => updateDraft(student.id, "napDuration", e.target.value)}
                          style={{ borderColor: S.border }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Teacher note */}
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-xs resize-none"
                  placeholder="শিক্ষকের নোট (ঐচ্ছিক)..."
                  value={draft.teacherNote}
                  onChange={e => updateDraft(student.id, "teacherNote", e.target.value)}
                  rows={2}
                  style={{ borderColor: S.border, background: "#FAFAFA" }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
