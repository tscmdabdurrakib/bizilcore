"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, ChevronDown } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#6366F1",
};

type Log = {
  id: string; task: string; hours: number; hourlyRate: number | null;
  billable: boolean; logDate: string; note: string | null;
  project: { id: string; projectNumber: string; title: string };
};
type Project = { id: string; projectNumber: string; title: string };

export default function TimeLogBoard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    projectId: "", task: "", hours: "", hourlyRate: "", billable: true, logDate: "", note: "",
  });

  useEffect(() => { load(); }, [projectFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (projectFilter !== "all") params.set("projectId", projectFilter);
    const r = await fetch(`/api/freelance/timelog?${params}`);
    const data = await r.json();
    setLogs(data.logs ?? []);
    setProjects(data.projects ?? []);
    setLoading(false);
  }

  async function saveLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/freelance/timelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: form.projectId,
        task: form.task,
        hours: parseFloat(form.hours) || 0,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        billable: form.billable,
        logDate: form.logDate || null,
        note: form.note || null,
      }),
    });
    setShowModal(false);
    load();
    setSaving(false);
  }

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const billableHours = logs.filter(l => l.billable).reduce((s, l) => s + l.hours, 0);
  const billableAmount = logs.filter(l => l.billable && l.hourlyRate).reduce((s, l) => s + l.hours * (l.hourlyRate || 0), 0);

  // Group by date
  const grouped: Record<string, Log[]> = {};
  for (const log of logs) {
    const date = new Date(log.logDate).toDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock size={22} style={{ color: S.primary }} />
          <h1 className="text-xl font-bold" style={{ color: S.text }}>টাইম লগ</h1>
        </div>
        <button onClick={() => { setForm({ projectId: "", task: "", hours: "", hourlyRate: "", billable: true, logDate: "", note: "" }); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: S.primary }}>
          <Plus size={16} /> সময় লগ করুন
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট সময়", value: `${totalHours.toFixed(1)} hrs`, sub: `${logs.length} লগ এন্ট্রি` },
          { label: "Billable", value: `${billableHours.toFixed(1)} hrs`, sub: "" },
          { label: "Billable আয়", value: `৳${billableAmount.toLocaleString()}`, sub: "রেট সহ এন্ট্রি" },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border p-3 text-center" style={{ background: S.surface, borderColor: S.border }}>
            <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>{c.label}</p>
            <p className="text-lg font-bold" style={{ color: S.primary }}>{c.value}</p>
            {c.sub && <p className="text-xs" style={{ color: S.muted }}>{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Project filter */}
      <div className="relative inline-block">
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="pl-3 pr-8 py-2 rounded-xl border text-sm appearance-none"
          style={{ background: S.surface, borderColor: S.border, color: S.text }}>
          <option value="all">সব প্রজেক্ট</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.projectNumber} — {p.title}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#E0E7FF", borderTopColor: S.primary }} />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center" style={{ background: S.surface, borderColor: S.border }}>
          <Clock size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p style={{ color: S.muted }}>কোনো টাইম লগ নেই</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayLogs]) => {
          const dayHours = dayLogs.reduce((s, l) => s + l.hours, 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: S.muted }}>{new Date(date).toLocaleDateString("bn-BD", { weekday: "long", month: "long", day: "numeric" })}</p>
                <span className="text-sm font-bold" style={{ color: S.primary }}>{dayHours.toFixed(1)} hrs</span>
              </div>
              <div className="space-y-2">
                {dayLogs.map(log => (
                  <div key={log.id} className="rounded-xl border p-3 flex items-center justify-between gap-3"
                    style={{ background: S.surface, borderColor: S.border }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: S.text }}>{log.task}</p>
                      <p className="text-xs" style={{ color: S.muted }}>
                        {log.project.projectNumber} · {log.project.title}
                        {log.note && ` · ${log.note}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!log.billable && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>Non-billable</span>
                      )}
                      <span className="font-bold" style={{ color: S.primary }}>{log.hours} hrs</span>
                      {log.hourlyRate && (
                        <span className="text-xs" style={{ color: S.muted }}>৳{(log.hours * log.hourlyRate).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Add Time Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: S.surface }}>
            <div className="p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>সময় লগ করুন</h2>
            </div>
            <form onSubmit={saveLog} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>প্রজেক্ট *</label>
                <select required value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}>
                  <option value="">-- প্রজেক্ট বেছে নিন --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.projectNumber} — {p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>কাজের বিবরণ *</label>
                <input required value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                  placeholder="যেমন: Header design, API integration" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ঘণ্টা *</label>
                  <input required type="number" step="0.25" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                    placeholder="2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ঘণ্টাপ্রতি রেট (৳)</label>
                  <input type="number" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                    placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>তারিখ</label>
                  <input type="date" value={form.logDate} onChange={e => setForm(f => ({ ...f, logDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))} />
                    <span className="text-sm" style={{ color: S.text }}>Billable</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>নোট</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: S.primary }}>
                  {saving ? "..." : "সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
