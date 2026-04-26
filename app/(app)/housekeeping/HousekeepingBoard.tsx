"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, Plus, Play, Check, X, RefreshCw } from "lucide-react";

interface Room { id: string; number: string; type: string; }

interface HKLog {
  id: string;
  task: string;
  status: string;
  priority: string;
  note: string | null;
  startedAt: string | null;
  doneAt: string | null;
  createdAt: string;
  room: { id: string; number: string };
}

const TASK_LABELS: Record<string, string> = {
  cleaning:    "ক্লিনিং",
  maintenance: "মেইনটেন্যান্স",
  laundry:     "লন্ড্রি",
  inspection:  "ইন্সপেকশন",
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:    { label: "কম",     color: "#0F6E56" },
  normal: { label: "সাধারণ", color: "#0C447C" },
  high:   { label: "জরুরি",  color: "#791F1F" },
};

const COLUMNS = [
  { key: "pending",     label: "অপেক্ষমান",  bg: "#FFF3DC", color: "#B45309" },
  { key: "in_progress", label: "চলছে",       bg: "#E6F1FB", color: "#0C447C" },
  { key: "done",        label: "সম্পন্ন",    bg: "#E1F5EE", color: "#0F6E56" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function HousekeepingBoard() {
  const [logs, setLogs] = useState<HKLog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ roomId: "", task: "cleaning", priority: "normal", note: "" });

  const fetchAll = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const [logsRes, roomsRes] = await Promise.all([
        fetch("/api/housekeeping", { cache: "no-store" }),
        fetch("/api/rooms", { cache: "no-store" }),
      ]);
      if (logsRes.ok) setLogs(await logsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch {}
    if (silent) setRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async () => {
    if (!form.roomId) return alert("রুম সিলেক্ট করুন");
    setBusy(true);
    try {
      const res = await fetch("/api/housekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "সমস্যা হয়েছে");
      } else {
        setShowModal(false);
        setForm({ roomId: "", task: "cleaning", priority: "normal", note: "" });
        await fetchAll();
      }
    } catch {
      alert("সার্ভার সমস্যা");
    }
    setBusy(false);
  };

  const updateStatus = async (log: HKLog, action: "start" | "done" | "cancel") => {
    setBusy(true);
    try {
      await fetch(`/api/housekeeping/${log.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await fetchAll();
    } catch {}
    setBusy(false);
  };

  const grouped: Record<string, HKLog[]> = { pending: [], in_progress: [], done: [] };
  for (const log of logs) if (grouped[log.status]) grouped[log.status].push(log);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FCEBEB" }}>
            <Sparkles size={20} style={{ color: "#791F1F" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>হাউসকিপিং</h1>
            <p className="text-xs" style={{ color: S.muted }}>{logs.length}টি টাস্ক</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchAll(true)} className="p-2.5 rounded-xl" style={{ backgroundColor: "#E6F1FB", color: "#0C447C" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: "#0F6E56" }}>
            <Plus size={16} /> নতুন টাস্ক
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: "#0F6E56" }} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: col.bg, color: col.color }}>{col.label}</span>
                  <span className="text-xs font-bold" style={{ color: S.muted }}>{grouped[col.key].length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {grouped[col.key].length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: S.muted }}>খালি</p>
                )}
                {grouped[col.key].map(log => {
                  const pri = PRIORITY_META[log.priority] ?? PRIORITY_META.normal;
                  return (
                    <div key={log.id} className="rounded-xl p-3 border" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)", borderColor: S.border }}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-bold" style={{ color: S.text }}>রুম {log.room.number}</p>
                        <span className="text-[9px] font-bold" style={{ color: pri.color }}>● {pri.label}</span>
                      </div>
                      <p className="text-[11px]" style={{ color: S.muted }}>{TASK_LABELS[log.task] ?? log.task}</p>
                      {log.note && <p className="text-[10px] mt-1" style={{ color: S.muted }}>{log.note}</p>}
                      <div className="flex gap-1 mt-2 pt-2 border-t" style={{ borderColor: S.border }}>
                        {log.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(log, "start")} disabled={busy} className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: "#E6F1FB", color: "#0C447C" }}>
                              <Play size={9} /> শুরু
                            </button>
                            <button onClick={() => updateStatus(log, "cancel")} disabled={busy} className="flex items-center justify-center w-7 h-7 rounded" style={{ backgroundColor: "#FCEBEB", color: "#791F1F" }}>
                              <X size={9} />
                            </button>
                          </>
                        )}
                        {log.status === "in_progress" && (
                          <button onClick={() => updateStatus(log, "done")} disabled={busy} className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                            <Check size={9} /> সম্পন্ন
                          </button>
                        )}
                        {log.status === "done" && log.doneAt && (
                          <p className="text-[10px] text-center w-full" style={{ color: S.muted }}>{new Date(log.doneAt).toLocaleString("bn-BD")}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold" style={{ color: S.text }}>নতুন টাস্ক</h2>
            <div>
              <label className="text-xs font-semibold block mb-1">রুম *</label>
              <select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                <option value="">— সিলেক্ট —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>রুম {r.number} ({r.type})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">কাজ</label>
                <select value={form.task} onChange={e => setForm({ ...form, task: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                  {Object.entries(TASK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">প্রায়োরিটি</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                  {Object.entries(PRIORITY_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">নোট</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                rows={2} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}>বাতিল</button>
              <button onClick={create} disabled={busy} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: "#0F6E56" }}>
                {busy && <Loader2 size={12} className="animate-spin" />} যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
