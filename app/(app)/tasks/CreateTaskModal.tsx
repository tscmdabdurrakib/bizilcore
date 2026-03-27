"use client";

import { useState, useEffect } from "react";
import { X, BookmarkPlus } from "lucide-react";
import type { TaskTemplate } from "./TaskTemplates";
import { saveCustomTemplate } from "./TaskTemplates";

interface InitialData {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  tags?: string;
  subtasks?: string[];
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
  initialData?: InitialData;
}

export default function CreateTaskModal({ onClose, onCreated, initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState(initialData?.priority ?? "medium");
  const [category, setCategory] = useState(initialData?.category ?? "general");
  const [dueDate, setDueDate] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState("none");
  const [tags, setTags] = useState(initialData?.tags ?? "");
  const [subtasks, setSubtasks] = useState<string[]>(initialData?.subtasks ?? []);
  const [newSubtask, setNewSubtask] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [staffMembers, setStaffMembers] = useState<{ id: string; userId: string; user: { name: string } }[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    fetch("/api/staff").then(r => r.ok ? r.json() : []).then(data => {
      if (Array.isArray(data)) setStaffMembers(data);
    }).catch(() => {});
  }, []);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    primary: "var(--c-primary)",
    primaryLight: "var(--c-primary-light)",
  };

  const addSubtask = () => {
    const t = newSubtask.trim();
    if (t) { setSubtasks(prev => [...prev, t]); setNewSubtask(""); }
  };

  const removeSubtask = (i: number) => setSubtasks(prev => prev.filter((_, idx) => idx !== i));

  const handleSaveTemplate = () => {
    const name = templateName.trim();
    if (!name) return;
    const template: TaskTemplate = {
      name,
      title,
      description,
      category,
      priority,
      tags,
      subtasks,
    };
    saveCustomTemplate(template);
    setTemplateName("");
    setSavingTemplate(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("শিরোনাম আবশ্যক"); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        category,
        dueDate: dueDate || null,
        reminderAt: reminderAt || null,
        recurring,
        recurrence: recurring ? recurrence : "none",
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        assignedToId: assignedToId || null,
        orderId: orderId.trim() || null,
        subtasks: subtasks.filter(Boolean),
      }),
    });
    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json();
      setError(data.error ?? "টাস্ক তৈরিতে ত্রুটি হয়েছে");
    }
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl"
        style={{ backgroundColor: S.surface, borderColor: S.border, borderTopColor: "var(--c-primary)", borderTopWidth: 3 }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: S.border, backgroundColor: "var(--c-primary-light)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--c-primary)" }}>নতুন টাস্ক তৈরি করুন</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">

          {error && (
            <div className="px-5 pt-4">
              <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: "#FFE8E8", color: "#E24B4A" }}>{error}</p>
            </div>
          )}

          {/* ── Section 1: Basic Info ── */}
          <div className="px-5 pt-4 pb-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: S.primary }}>মূল তথ্য</p>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>শিরোনাম *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="টাস্কের শিরোনাম লিখুন..."
                className="w-full text-sm border rounded-xl px-3 py-2.5"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>বিবরণ</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="টাস্কের বিস্তারিত..."
                className="w-full text-sm border rounded-xl px-3 py-2.5 resize-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              />
            </div>

            {/* Inline button-group pickers for priority + category */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>অগ্রাধিকার</label>
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: S.border }}>
                  {[
                    { value: "urgent", label: "জরুরি",    color: "#DC2626", bg: "#FEE2E2" },
                    { value: "high",   label: "হাই",      color: "#EA580C", bg: "#FFEDD5" },
                    { value: "medium", label: "মিডিয়াম", color: "#CA8A04", bg: "#FEF9C3" },
                    { value: "low",    label: "লো",       color: "#16A34A", bg: "#DCFCE7" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className="flex-1 text-[11px] font-semibold py-2 transition-colors"
                      style={{
                        backgroundColor: priority === opt.value ? opt.bg : "transparent",
                        color: priority === opt.value ? opt.color : S.muted,
                        borderRight: `1px solid ${S.border}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>ক্যাটাগরি</label>
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: S.border }}>
                  {[
                    { value: "order",    label: "অর্ডার" },
                    { value: "delivery", label: "ডেলিভারি" },
                    { value: "supplier", label: "সাপ্লায়ার" },
                    { value: "accounts", label: "একাউন্টস" },
                    { value: "general",  label: "সাধারণ" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className="flex-1 text-[11px] font-semibold py-2 transition-colors"
                      style={{
                        backgroundColor: category === opt.value ? S.primaryLight : "transparent",
                        color: category === opt.value ? S.primary : S.muted,
                        borderRight: `1px solid ${S.border}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>চেকলিস্ট (সাব-টাস্ক)</label>
              {subtasks.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {subtasks.map((st, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <span className="text-[10px] w-4 text-center flex-shrink-0" style={{ color: S.muted }}>{i + 1}.</span>
                      <span className="flex-1 text-xs" style={{ color: S.text }}>{st}</span>
                      <button type="button" onClick={() => removeSubtask(i)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity">
                        <X size={11} style={{ color: "#E24B4A" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                  placeholder="নতুন সাব-টাস্ক..."
                  className="flex-1 text-xs border rounded-lg px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  disabled={!newSubtask.trim()}
                  className="text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: S.primaryLight, color: S.primary }}
                >
                  যোগ
                </button>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="border-t" style={{ borderColor: S.border }} />

          {/* ── Section 2: Advanced Details ── */}
          <div className="px-5 pt-4 pb-5 space-y-4" style={{ backgroundColor: "#FAFAF9" }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: S.muted }}>বিস্তারিত (ঐচ্ছিক)</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>স্ট্যাটাস</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="todo">করতে হবে</option>
                  <option value="in_progress">চলছে</option>
                  <option value="review">রিভিউ</option>
                  <option value="done">সম্পন্ন</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>ডেডলাইন</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>রিমাইন্ডার</label>
                <input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={e => setReminderAt(e.target.value)}
                  className="w-full text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত</label>
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="">কেউ নয়</option>
                  {staffMembers.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>ট্যাগ (কমা দিয়ে)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="জরুরি, ফলো-আপ..."
                  className="w-full text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>অর্ডার ID</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="অর্ডার ID (ঐচ্ছিক)"
                  className="w-full text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={e => setRecurring(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: S.text }}>পুনরাবৃত্তিমূলক</span>
              </label>
              {recurring && (
                <select
                  value={recurrence}
                  onChange={e => setRecurrence(e.target.value)}
                  className="ml-auto text-sm border rounded-lg px-2 py-1.5"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="daily">দৈনিক</option>
                  <option value="weekly">সাপ্তাহিক</option>
                  <option value="monthly">মাসিক</option>
                </select>
              )}
            </div>

            {/* Save as template */}
            <div className="rounded-xl border p-3" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              {savingTemplate ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSaveTemplate(); } if (e.key === "Escape") setSavingTemplate(false); }}
                    placeholder="টেমপ্লেটের নাম..."
                    className="flex-1 text-xs border rounded-lg px-3 py-2"
                    style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                    autoFocus
                  />
                  <button type="button" onClick={handleSaveTemplate} className="text-xs font-semibold px-2 py-1.5 rounded-lg" style={{ backgroundColor: S.primary, color: "#fff" }}>
                    সেভ
                  </button>
                  <button type="button" onClick={() => setSavingTemplate(false)} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: S.muted }}>
                    বাতিল
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSavingTemplate(true)}
                  className="flex items-center gap-2 text-xs font-medium w-full"
                  style={{ color: S.muted }}
                >
                  <BookmarkPlus size={13} />
                  এই ফর্ম টেমপ্লেট হিসেবে সেভ করুন
                </button>
              )}
            </div>
          </div>

          {/* ── Footer actions ── */}
          <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: S.border }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border"
              style={{ borderColor: S.border, color: S.muted }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: S.primary }}
            >
              {submitting ? "তৈরি হচ্ছে..." : "টাস্ক তৈরি করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
