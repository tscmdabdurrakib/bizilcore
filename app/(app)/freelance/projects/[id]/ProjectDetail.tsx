"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, FolderKanban, Clock, FileText, StickyNote,
  CheckCircle, Circle, Plus, ChevronDown, AlertTriangle, Timer,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#6366F1",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  proposal:    { label: "প্রস্তাব",   color: "#6B7280", bg: "#F9FAFB" },
  in_progress: { label: "চলমান",      color: "#3B82F6", bg: "#EFF6FF" },
  review:      { label: "রিভিউ",      color: "#8B5CF6", bg: "#F5F3FF" },
  revision:    { label: "রিভিশন",     color: "#F59E0B", bg: "#FFFBEB" },
  completed:   { label: "সম্পন্ন",    color: "#10B981", bg: "#ECFDF5" },
  on_hold:     { label: "বিরতি",      color: "#F97316", bg: "#FFF7ED" },
  cancelled:   { label: "বাতিল",      color: "#EF4444", bg: "#FEF2F2" },
};

const MILESTONE_STATUS: Record<string, { label: string; color: string }> = {
  pending:     { label: "বাকি",        color: "#6B7280" },
  in_progress: { label: "চলমান",       color: "#3B82F6" },
  submitted:   { label: "জমা দেওয়া",  color: "#8B5CF6" },
  revision:    { label: "রিভিশন",      color: "#F59E0B" },
  approved:    { label: "অনুমোদিত",   color: "#10B981" },
  paid:        { label: "পেমেন্ট হয়েছে", color: "#059669" },
};

type Milestone = {
  id: string; title: string; description: string | null;
  amount: number; currency: string; dueDate: string | null;
  status: string; completedAt: string | null; note: string | null;
};

type TimeLog = {
  id: string; task: string; hours: number; hourlyRate: number | null;
  billable: boolean; logDate: string; note: string | null;
};

type Project = {
  id: string; projectNumber: string; title: string; type: string;
  status: string; currency: string; totalAmount: number; totalAmountBDT: number;
  advancePaid: number; dueAmount: number; deadline: string | null;
  startDate: string | null; platform: string | null; description: string | null;
  notes: string | null; exchangeRate: number;
  client: { id: string; name: string; phone: string | null; address: string | null };
  milestones: Milestone[];
  timeLogs: TimeLog[];
  invoices: { id: string; invoiceNumber: string; status: string; totalAmount: number; currency: string; dueDate: string | null }[];
};

const TABS = [
  { key: "overview", label: "সারসংক্ষেপ", icon: FolderKanban },
  { key: "milestones", label: "মাইলস্টোন", icon: CheckCircle },
  { key: "timelog", label: "টাইম লগ", icon: Clock },
  { key: "invoices", label: "Invoice", icon: FileText },
  { key: "notes", label: "নোট", icon: StickyNote },
];

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);

  // Milestone modal
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [mForm, setMForm] = useState({ title: "", description: "", amount: "", dueDate: "" });

  // Time log modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tForm, setTForm] = useState({ task: "", hours: "", hourlyRate: "", billable: true, logDate: "", note: "" });

  // Notes
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/freelance/projects/${projectId}`);
    if (r.ok) {
      const data = await r.json();
      setProject(data);
      setNotes(data.notes || "");
    }
    setLoading(false);
  }

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/freelance/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status }),
    });
    load();
    setSaving(false);
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/freelance/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_milestone",
        title: mForm.title,
        description: mForm.description,
        amount: parseFloat(mForm.amount) || 0,
        currency: project?.currency || "BDT",
        dueDate: mForm.dueDate || null,
      }),
    });
    setShowMilestoneModal(false);
    setMForm({ title: "", description: "", amount: "", dueDate: "" });
    load();
    setSaving(false);
  }

  async function updateMilestone(milestoneId: string, status: string) {
    await fetch(`/api/freelance/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_milestone", milestoneId, status }),
    });
    load();
  }

  async function addTimeLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/freelance/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_timelog",
        task: tForm.task,
        hours: parseFloat(tForm.hours) || 0,
        hourlyRate: tForm.hourlyRate ? parseFloat(tForm.hourlyRate) : null,
        billable: tForm.billable,
        logDate: tForm.logDate || null,
        note: tForm.note || null,
      }),
    });
    setShowTimeModal(false);
    setTForm({ task: "", hours: "", hourlyRate: "", billable: true, logDate: "", note: "" });
    load();
    setSaving(false);
  }

  async function saveNotes() {
    await fetch(`/api/freelance/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_note", notes }),
    });
    setEditingNotes(false);
    load();
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#E0E7FF", borderTopColor: S.primary }} />
    </div>
  );

  if (!project) return (
    <div className="text-center py-16" style={{ color: S.muted }}>প্রজেক্ট পাওয়া যায়নি</div>
  );

  const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.in_progress;
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && !["completed", "cancelled"].includes(project.status);
  const doneMilestones = project.milestones.filter(m => ["approved", "paid"].includes(m.status)).length;
  const totalHours = project.timeLogs.reduce((s, l) => s + l.hours, 0);
  const billableHours = project.timeLogs.filter(l => l.billable).reduce((s, l) => s + l.hours, 0);
  const nonBillableHours = totalHours - billableHours;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-8">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href="/freelance/projects" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={18} style={{ color: S.muted }} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold" style={{ color: S.primary }}>{project.projectNumber}</span>
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                <AlertTriangle size={12} /> Overdue
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>{project.title}</h1>
          <p className="text-sm" style={{ color: S.muted }}>{project.client.name}{project.client.phone ? ` · ${project.client.phone}` : ""}</p>
        </div>
        <div className="relative">
          <select
            value={project.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={saving}
            className="pl-3 pr-8 py-2 rounded-xl border text-sm font-semibold appearance-none"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + "40" }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
              <option key={key} value={key}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: cfg.color }} />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট মূল্য", value: project.currency !== "BDT" ? `${project.currency} ${project.totalAmount.toLocaleString()}` : formatBDT(project.totalAmountBDT), sub: project.currency !== "BDT" ? `≈ ${formatBDT(project.totalAmountBDT)}` : "" },
          { label: "অগ্রিম পেমেন্ট", value: formatBDT(project.advancePaid), sub: "" },
          { label: "বাকি", value: formatBDT(project.dueAmount), sub: "", highlight: project.dueAmount > 0 },
          { label: "টাইম লগ", value: `${totalHours.toFixed(1)} hrs`, sub: `Billable: ${billableHours.toFixed(1)} hrs` },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl border p-3 text-center" style={{ background: S.surface, borderColor: S.border }}>
            <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>{card.label}</p>
            <p className="text-base font-bold" style={{ color: card.highlight ? "#EF4444" : S.text }}>{card.value}</p>
            {card.sub && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: S.border }}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all"
              style={{
                borderColor: tab === t.key ? S.primary : "transparent",
                color: tab === t.key ? S.primary : S.muted,
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
            <h3 className="font-semibold mb-3" style={{ color: S.text }}>প্রজেক্ট তথ্য</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["ক্লায়েন্ট", project.client.name],
                ["প্ল্যাটফর্ম", project.platform ?? "—"],
                ["শুরুর তারিখ", project.startDate ? new Date(project.startDate).toLocaleDateString("bn-BD") : "—"],
                ["Deadline", project.deadline ? new Date(project.deadline).toLocaleDateString("bn-BD") : "—"],
                ["Currency", project.currency],
                ["Exchange Rate", project.currency !== "BDT" ? `1 ${project.currency} = ৳${project.exchangeRate}` : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ color: S.muted }}>{label}</p>
                  <p className="font-medium" style={{ color: S.text }}>{value}</p>
                </div>
              ))}
            </div>
            {project.description && (
              <p className="mt-3 text-sm" style={{ color: S.muted }}>{project.description}</p>
            )}
          </div>

          {project.milestones.length > 0 && (
            <div className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold" style={{ color: S.text }}>মাইলস্টোন অগ্রগতি</h3>
                <span className="text-sm" style={{ color: S.muted }}>{doneMilestones}/{project.milestones.length}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#E0E7FF" }}>
                <div className="h-2 rounded-full" style={{
                  width: `${project.milestones.length ? (doneMilestones / project.milestones.length) * 100 : 0}%`,
                  background: S.primary
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "milestones" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium" style={{ color: S.muted }}>
              {doneMilestones}/{project.milestones.length} সম্পন্ন
            </p>
            <button onClick={() => setShowMilestoneModal(true)}
              className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl text-white"
              style={{ background: S.primary }}>
              <Plus size={14} /> মাইলস্টোন যোগ করুন
            </button>
          </div>

          {project.milestones.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border" style={{ borderColor: S.border, background: S.surface }}>
              <Circle size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
              <p style={{ color: S.muted }}>কোনো মাইলস্টোন নেই</p>
            </div>
          ) : (
            project.milestones.map((m, i) => {
              const mCfg = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.pending;
              return (
                <div key={m.id} className="rounded-2xl border p-4" style={{ background: S.surface, borderColor: S.border }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ background: S.primary }}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: S.text }}>{m.title}</p>
                        {m.description && <p className="text-sm" style={{ color: S.muted }}>{m.description}</p>}
                        {m.dueDate && (
                          <p className="text-xs mt-1" style={{ color: S.muted }}>
                            Due: {new Date(m.dueDate).toLocaleDateString("bn-BD")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-bold" style={{ color: S.text }}>
                        ৳{m.amount.toLocaleString()}
                      </span>
                      <select
                        value={m.status}
                        onChange={e => updateMilestone(m.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border font-semibold"
                        style={{ background: mCfg.color + "15", color: mCfg.color, borderColor: mCfg.color + "40" }}
                      >
                        {Object.entries(MILESTONE_STATUS).map(([k, c]) => (
                          <option key={k} value={k}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "timelog" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm" style={{ color: S.muted }}>
              মোট: <strong style={{ color: S.text }}>{totalHours.toFixed(1)} hrs</strong>
              {" · "}Billable: <strong style={{ color: S.primary }}>{billableHours.toFixed(1)} hrs</strong>
              {nonBillableHours > 0 && ` · Non-billable: ${nonBillableHours.toFixed(1)} hrs`}
            </div>
            <button onClick={() => setShowTimeModal(true)}
              className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl text-white"
              style={{ background: S.primary }}>
              <Plus size={14} /> সময় লগ করুন
            </button>
          </div>

          {project.timeLogs.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border" style={{ borderColor: S.border, background: S.surface }}>
              <Timer size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
              <p style={{ color: S.muted }}>কোনো টাইম লগ নেই</p>
            </div>
          ) : (
            project.timeLogs.map(log => (
              <div key={log.id} className="rounded-2xl border p-3 flex items-center justify-between gap-3"
                style={{ background: S.surface, borderColor: S.border }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: S.text }}>{log.task}</p>
                  <p className="text-xs" style={{ color: S.muted }}>
                    {new Date(log.logDate).toLocaleDateString("bn-BD")}
                    {log.note && ` · ${log.note}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!log.billable && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>Non-billable</span>
                  )}
                  <span className="font-bold text-sm" style={{ color: S.primary }}>{log.hours} hrs</span>
                  {log.hourlyRate && (
                    <span className="text-xs" style={{ color: S.muted }}>= ৳{(log.hours * log.hourlyRate).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link href="/freelance/invoices"
              className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl text-white"
              style={{ background: S.primary }}>
              <Plus size={14} /> Invoice তৈরি করুন
            </Link>
          </div>
          {project.invoices.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border" style={{ borderColor: S.border, background: S.surface }}>
              <FileText size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
              <p style={{ color: S.muted }}>কোনো invoice নেই</p>
            </div>
          ) : (
            project.invoices.map(inv => (
              <div key={inv.id} className="rounded-2xl border p-3 flex items-center justify-between"
                style={{ background: S.surface, borderColor: S.border }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: S.text }}>{inv.invoiceNumber}</p>
                  {inv.dueDate && <p className="text-xs" style={{ color: S.muted }}>Due: {new Date(inv.dueDate).toLocaleDateString("bn-BD")}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: S.text }}>{inv.currency} {inv.totalAmount.toLocaleString()}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: inv.status === "paid" ? "#ECFDF5" : inv.status === "overdue" ? "#FEF2F2" : "#EFF6FF",
                      color: inv.status === "paid" ? "#059669" : inv.status === "overdue" ? "#DC2626" : "#1D4ED8",
                    }}>{inv.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "notes" && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ background: S.surface, borderColor: S.border }}>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold" style={{ color: S.text }}>নোট ও মিটিং মেমো</h3>
            {!editingNotes && (
              <button onClick={() => setEditingNotes(true)} className="text-sm font-semibold" style={{ color: S.primary }}>
                সম্পাদনা করুন
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 rounded-xl border text-sm"
                style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                placeholder="মিটিং নোট, ক্লায়েন্ট ফিডব্যাক, সিদ্ধান্ত..."
              />
              <div className="flex gap-2">
                <button onClick={() => setEditingNotes(false)}
                  className="px-3 py-1.5 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.muted }}>
                  বাতিল
                </button>
                <button onClick={saveNotes}
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white" style={{ background: S.primary }}>
                  সেভ করুন
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap" style={{ color: notes ? S.text : S.muted }}>
              {notes || "এখানে নোট যোগ করুন..."}
            </p>
          )}
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: S.surface }}>
            <div className="p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>মাইলস্টোন যোগ করুন</h2>
            </div>
            <form onSubmit={addMilestone} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>শিরোনাম *</label>
                <input required value={mForm.title} onChange={e => setMForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                  placeholder="যেমন: Design Mockup Approval" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>বিবরণ</label>
                <input value={mForm.description} onChange={e => setMForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>পরিমাণ</label>
                  <input type="number" value={mForm.amount} onChange={e => setMForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>Due Date</label>
                  <input type="date" value={mForm.dueDate} onChange={e => setMForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowMilestoneModal(false)}
                  className="flex-1 py-2 rounded-xl border text-sm font-semibold" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: S.primary }}>
                  {saving ? "..." : "যোগ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Time Log Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: S.surface }}>
            <div className="p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>সময় লগ করুন</h2>
            </div>
            <form onSubmit={addTimeLog} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>কাজের বিবরণ *</label>
                <input required value={tForm.task} onChange={e => setTForm(f => ({ ...f, task: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                  placeholder="যেমন: Header design, API integration" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ঘণ্টা *</label>
                  <input required type="number" step="0.25" value={tForm.hours} onChange={e => setTForm(f => ({ ...f, hours: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                    placeholder="2.5" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ঘণ্টাপ্রতি রেট (৳)</label>
                  <input type="number" value={tForm.hourlyRate} onChange={e => setTForm(f => ({ ...f, hourlyRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }}
                    placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>তারিখ</label>
                  <input type="date" value={tForm.logDate} onChange={e => setTForm(f => ({ ...f, logDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={tForm.billable} onChange={e => setTForm(f => ({ ...f, billable: e.target.checked }))} />
                    <span className="text-sm" style={{ color: S.text }}>Billable</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>নোট</label>
                <input value={tForm.note} onChange={e => setTForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm" style={{ background: "var(--c-bg)", borderColor: S.border, color: S.text }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowTimeModal(false)}
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
