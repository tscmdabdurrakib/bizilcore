"use client";

import { useEffect, useState } from "react";
import { X, Clock, Tag, Paperclip, MessageSquare, Activity, RefreshCw, Link as LinkIcon, Trash2, File, Copy, CheckSquare, Plus, Timer, Play, Square } from "lucide-react";
import { getPriorityStyle, getStatusLabel, getCategoryLabel } from "./taskUtils";
import { useTaskTimer } from "./TaskTimerContext";

interface SubTask {
  id: string;
  title: string;
  done: boolean;
  position: number;
}

interface TaskDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category: string;
  assignedToId?: string | null;
  tags: string[];
  attachments: string[];
  dueDate?: string | null;
  reminderAt?: string | null;
  recurring: boolean;
  recurrence: string;
  orderId?: string | null;
  completedAt?: string | null;
  createdAt: string;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  comments: Array<{ id: string; body: string; createdAt: string; user: { id: string; name: string } }>;
  activityLogs: Array<{ id: string; action: string; detail?: string | null; createdAt: string; user: { id: string; name: string } }>;
  subtasks: SubTask[];
  order?: { id: string } | null;
}

interface Props {
  taskId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function TaskDetailPanel({ taskId, onClose, onUpdated }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editReminderAt, setEditReminderAt] = useState("");
  const [editRecurring, setEditRecurring] = useState(false);
  const [editRecurrence, setEditRecurrence] = useState("none");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editOrderId, setEditOrderId] = useState("");
  const [editAttachments, setEditAttachments] = useState<string[]>([]);
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState("");
  const [editActualMinutes, setEditActualMinutes] = useState("");
  const [attachmentUrlInput, setAttachmentUrlInput] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [staffMembers, setStaffMembers] = useState<{ id: string; userId: string; user: { name: string } }[]>([]);

  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const { isRunning, startTimer, stopTimer, timer } = useTaskTimer();

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

  const fetchTask = async () => {
    const res = await fetch(`/api/tasks/${taskId}`);
    if (res.ok) {
      const data = await res.json();
      setTask(data);
      setEditTitle(data.title);
      setEditDescription(data.description ?? "");
      setEditStatus(data.status);
      setEditPriority(data.priority);
      setEditDueDate(data.dueDate ? data.dueDate.split("T")[0] : "");
      setEditReminderAt(data.reminderAt ? data.reminderAt.slice(0, 16) : "");
      setEditRecurring(data.recurring);
      setEditRecurrence(data.recurrence);
      setEditTags(data.tags ?? []);
      setEditAssignedTo(data.assignedToId ?? "");
      setEditOrderId(data.orderId ?? "");
      setEditAttachments(data.attachments ?? []);
      setEditEstimatedMinutes(data.estimatedMinutes != null ? String(data.estimatedMinutes) : "");
      setEditActualMinutes(data.actualMinutes != null ? String(data.actualMinutes) : "");
      setSubtasks(data.subtasks ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTask(); }, [taskId]);

  const saveChanges = async () => {
    setSaving(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate || null,
        reminderAt: editReminderAt || null,
        recurring: editRecurring,
        recurrence: editRecurrence,
        tags: editTags,
        assignedToId: editAssignedTo || null,
        orderId: editOrderId || null,
        attachments: editAttachments,
        estimatedMinutes: editEstimatedMinutes ? parseInt(editEstimatedMinutes) : null,
        actualMinutes: editActualMinutes ? parseInt(editActualMinutes) : null,
      }),
    });
    setSaving(false);
    onUpdated();
    await fetchTask();
  };

  const [deleting, setDeleting] = useState(false);

  const markDone = async () => {
    await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    onUpdated();
    onClose();
  };

  const deleteTask = async () => {
    if (!confirm("এই টাস্কটি মুছে ফেলবেন?")) return;
    setDeleting(true);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onUpdated();
    onClose();
  };

  const duplicateTask = async () => {
    setDuplicating(true);
    const res = await fetch(`/api/tasks/${taskId}/duplicate`, { method: "POST" });
    setDuplicating(false);
    if (res.ok) {
      onUpdated();
      onClose();
    }
  };

  const submitComment = async () => {
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody.trim() }),
    });
    setCommentBody("");
    setSubmittingComment(false);
    await fetchTask();
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !editTags.includes(t)) setEditTags(prev => [...prev, t]);
    setNewTag("");
  };

  const addAttachmentUrl = async () => {
    const url = attachmentUrlInput.trim();
    if (!url || editAttachments.includes(url)) return;
    const newAttachments = [...editAttachments, url];
    setEditAttachments(newAttachments);
    setAttachmentUrlInput("");
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachments: newAttachments }),
    });
  };

  const removeAttachment = async (url: string) => {
    const newAttachments = editAttachments.filter(a => a !== url);
    setEditAttachments(newAttachments);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachments: newAttachments }),
    });
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setAddingSubtask(true);
    const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newSubtaskTitle.trim() }),
    });
    if (res.ok) {
      const st = await res.json();
      setSubtasks(prev => [...prev, st]);
      setNewSubtaskTitle("");
    }
    setAddingSubtask(false);
  };

  const toggleSubtask = async (subtaskId: string, done: boolean) => {
    setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, done } : s));
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtaskId, done }),
    });
    onUpdated();
  };

  const deleteSubtask = async (subtaskId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtaskId }),
    });
    onUpdated();
  };

  const subtaskDone = subtasks.filter(s => s.done).length;
  const subtaskTotal = subtasks.length;

  if (loading || !task) {
    return (
      <div
        className="fixed inset-0 z-50 flex justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg h-full border-l flex items-center justify-center"
          style={{ backgroundColor: S.surface, borderColor: S.border }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: S.primary }} />
        </div>
      </div>
    );
  }

  const priority = getPriorityStyle(task.priority as "low" | "medium" | "high" | "urgent");

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full border-l flex flex-col overflow-hidden"
        style={{
          backgroundColor: S.surface,
          borderColor: S.border,
          borderLeftColor: priority.color,
          borderLeftWidth: 3,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: S.border, backgroundColor: priority.bg + "40" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0"
              style={{ backgroundColor: priority.bg, color: priority.color }}
            >
              {priority.label}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded flex-shrink-0"
              style={{ backgroundColor: S.border, color: S.muted }}
            >
              {getCategoryLabel(task.category as "order" | "delivery" | "supplier" | "accounts" | "general")}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={duplicateTask}
              disabled={duplicating}
              title="টাস্ক ডুপ্লিকেট করুন"
              className="p-1.5 rounded-lg hover:opacity-70 disabled:opacity-50 transition-opacity"
            >
              <Copy size={15} style={{ color: S.muted }} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity">
              <X size={18} style={{ color: S.muted }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Title */}
            <div>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-lg font-bold border-b pb-1 bg-transparent focus:outline-none"
                style={{ color: S.text, borderColor: S.border }}
                placeholder="টাস্কের শিরোনাম"
              />
            </div>

            {/* Status + Priority — button group selectors */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>স্ট্যাটাস</label>
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: S.border }}>
                  {[
                    { value: "todo",        label: "করতে হবে", color: "#6B7280", bg: "#F3F4F6" },
                    { value: "in_progress", label: "চলছে",     color: "#3B82F6", bg: "#DBEAFE" },
                    { value: "review",      label: "রিভিউ",    color: "#F59E0B", bg: "#FEF3C7" },
                    { value: "done",        label: "সম্পন্ন",  color: "#10B981", bg: "#DCFCE7" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditStatus(opt.value)}
                      className="flex-1 text-[11px] font-semibold py-2 transition-colors"
                      style={{
                        backgroundColor: editStatus === opt.value ? opt.bg : "transparent",
                        color: editStatus === opt.value ? opt.color : S.muted,
                        borderRight: `1px solid ${S.border}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
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
                      onClick={() => setEditPriority(opt.value)}
                      className="flex-1 text-[11px] font-semibold py-2 transition-colors"
                      style={{
                        backgroundColor: editPriority === opt.value ? opt.bg : "transparent",
                        color: editPriority === opt.value ? opt.color : S.muted,
                        borderRight: `1px solid ${S.border}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>বিবরণ</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className="w-full text-sm border rounded-xl px-3 py-2 resize-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                placeholder="টাস্কের বিস্তারিত বিবরণ..."
              />
            </div>

            {/* Subtasks / Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold flex items-center gap-1" style={{ color: S.muted }}>
                  <CheckSquare size={11} />
                  চেকলিস্ট
                  {subtaskTotal > 0 && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: subtaskDone === subtaskTotal ? "#DCFCE7" : S.primaryLight, color: subtaskDone === subtaskTotal ? "#16A34A" : S.primary }}>
                      {subtaskDone}/{subtaskTotal}
                    </span>
                  )}
                </label>
              </div>

              {subtaskTotal > 0 && (
                <div className="mb-2">
                  <div className="w-full h-1.5 rounded-full mb-2" style={{ backgroundColor: S.border }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(subtaskDone / subtaskTotal) * 100}%`,
                        backgroundColor: subtaskDone === subtaskTotal ? "#10B981" : S.primary,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 mb-2">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={e => toggleSubtask(st.id, e.target.checked)}
                      className="rounded flex-shrink-0"
                    />
                    <span
                      className="flex-1 text-sm"
                      style={{ color: st.done ? S.muted : S.text, textDecoration: st.done ? "line-through" : "none" }}
                    >
                      {st.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                    >
                      <X size={11} style={{ color: "#E24B4A" }} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addSubtask()}
                  placeholder="নতুন সাব-টাস্ক..."
                  className="flex-1 text-xs border rounded-lg px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
                <button
                  onClick={addSubtask}
                  disabled={addingSubtask || !newSubtaskTitle.trim()}
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                  style={{ backgroundColor: S.primaryLight, color: S.primary }}
                >
                  <Plus size={12} />
                  যোগ
                </button>
              </div>
            </div>

            {/* Time tracking */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold flex items-center gap-1" style={{ color: S.muted }}>
                  <Timer size={11} />
                  সময় ট্র্যাকিং (মিনিট)
                </label>
                {task.status !== "done" && (
                  <button
                    onClick={() => {
                      if (isRunning(task.id)) {
                        stopTimer().then(() => {
                          fetchTask();
                        });
                      } else {
                        startTimer(task.id, task.title);
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isRunning(task.id) ? "#E24B4A" : "var(--c-primary-light)",
                      color: isRunning(task.id) ? "#fff" : "var(--c-primary)",
                    }}
                  >
                    {isRunning(task.id) ? (
                      <>
                        <Square size={11} />
                        থামান ({Math.floor(timer.elapsed / 60)}মি {timer.elapsed % 60}সে)
                      </>
                    ) : (
                      <>
                        <Play size={11} />
                        টাইমার শুরু
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: S.muted }}>আনুমানিক সময়</label>
                  <input
                    type="number"
                    min="0"
                    value={editEstimatedMinutes}
                    onChange={e => setEditEstimatedMinutes(e.target.value)}
                    placeholder="যেমন: 60"
                    className="w-full text-sm border rounded-lg px-3 py-2"
                    style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  />
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: S.muted }}>প্রকৃত সময়</label>
                  <input
                    type="number"
                    min="0"
                    value={editActualMinutes}
                    onChange={e => setEditActualMinutes(e.target.value)}
                    placeholder="যেমন: 45"
                    className="w-full text-sm border rounded-lg px-3 py-2"
                    style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                  />
                </div>
              </div>
              {(editEstimatedMinutes || editActualMinutes) && (
                <p className="text-[10px] mt-1" style={{ color: S.muted }}>
                  {editEstimatedMinutes ? `আনুমানিক: ${Math.floor(parseInt(editEstimatedMinutes) / 60)}ঘ ${parseInt(editEstimatedMinutes) % 60}মি` : ""}
                  {editEstimatedMinutes && editActualMinutes ? " | " : ""}
                  {editActualMinutes ? `প্রকৃত: ${Math.floor(parseInt(editActualMinutes) / 60)}ঘ ${parseInt(editActualMinutes) % 60}মি` : ""}
                </p>
              )}
            </div>

            {/* Due date + Reminder */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: S.muted }}>
                  <Clock size={11} /> ডেডলাইন
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: S.muted }}>
                  <Clock size={11} /> রিমাইন্ডার
                </label>
                <input
                  type="datetime-local"
                  value={editReminderAt}
                  onChange={e => setEditReminderAt(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
              </div>
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: S.border }}>
              <RefreshCw size={14} style={{ color: S.muted }} />
              <span className="text-sm" style={{ color: S.text }}>পুনরাবৃত্তি</span>
              <label className="flex items-center gap-2 ml-auto cursor-pointer">
                <input
                  type="checkbox"
                  checked={editRecurring}
                  onChange={e => setEditRecurring(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs" style={{ color: S.muted }}>চালু</span>
              </label>
              {editRecurring && (
                <select
                  value={editRecurrence}
                  onChange={e => setEditRecurrence(e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="daily">দৈনিক</option>
                  <option value="weekly">সাপ্তাহিক</option>
                  <option value="monthly">মাসিক</option>
                </select>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold flex items-center gap-1 mb-2" style={{ color: S.muted }}>
                <Tag size={11} /> ট্যাগ
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editTags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-70"
                    style={{ backgroundColor: S.primaryLight, color: S.primary }}
                    onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTag()}
                  placeholder="ট্যাগ যোগ করুন..."
                  className="flex-1 text-xs border rounded-lg px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
                <button
                  onClick={addTag}
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ backgroundColor: S.primaryLight, color: S.primary }}
                >
                  যোগ
                </button>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="text-xs font-semibold flex items-center gap-1 mb-2" style={{ color: S.muted }}>
                <Paperclip size={11} /> সংযুক্তি
              </label>
              <div className="space-y-2 mb-2">
                {editAttachments.map((url, idx) => {
                  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) ||
                    url.includes("cloudinary.com") && !url.match(/\.(pdf|doc|docx|xls|xlsx)$/i);
                  return (
                    <div key={url} className="rounded-lg border overflow-hidden" style={{ borderColor: S.border }}>
                      {isImage && (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`সংযুক্তি ${idx + 1}`}
                            className="w-full max-h-40 object-cover"
                            onError={e => { (e.target as HTMLElement).style.display = "none"; }} />
                        </a>
                      )}
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        {isImage
                          ? <LinkIcon size={12} style={{ color: S.muted, flexShrink: 0 }} />
                          : <File size={14} style={{ color: S.muted, flexShrink: 0 }} />
                        }
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-xs flex-1 truncate hover:underline" style={{ color: S.primary }}>
                          {url}
                        </a>
                        <button onClick={() => removeAttachment(url)}
                          className="p-1 rounded hover:opacity-70 flex-shrink-0">
                          <Trash2 size={12} style={{ color: "#E24B4A" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {editAttachments.length === 0 && (
                  <p className="text-xs" style={{ color: S.muted }}>কোনো সংযুক্তি নেই</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={attachmentUrlInput}
                  onChange={e => setAttachmentUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAttachmentUrl())}
                  placeholder="https://... URL paste করুন"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                />
                <button
                  onClick={addAttachmentUrl}
                  disabled={!attachmentUrlInput.trim()}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg disabled:opacity-40"
                  style={{ backgroundColor: S.primaryLight, color: S.primary }}
                >
                  <Plus size={12} /> যোগ
                </button>
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত</label>
              <select
                value={editAssignedTo}
                onChange={e => setEditAssignedTo(e.target.value)}
                className="w-full text-sm border rounded-xl px-3 py-2"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              >
                <option value="">কেউ নয়</option>
                {staffMembers.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.name}</option>
                ))}
              </select>
            </div>

            {/* Linked order */}
            <div>
              <label className="text-xs font-semibold flex items-center gap-1 mb-1.5" style={{ color: S.muted }}>
                <LinkIcon size={11} /> লিংক করা অর্ডার ID
              </label>
              <input
                type="text"
                value={editOrderId}
                onChange={e => setEditOrderId(e.target.value)}
                placeholder="অর্ডার ID (ঐচ্ছিক)"
                className="w-full text-sm border rounded-xl px-3 py-2"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              />
              {editOrderId && (
                <p className="text-[10px] mt-1" style={{ color: S.muted }}>
                  #{editOrderId.slice(-6).toUpperCase()}
                </p>
              )}
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: S.text }}>
                <MessageSquare size={14} />
                মন্তব্য ({task.comments.length})
              </h4>
              <div className="space-y-3 mb-4">
                {task.comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: S.primary }}
                    >
                      {comment.user.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold" style={{ color: S.text }}>{comment.user.name}</p>
                      <p className="text-sm mt-0.5" style={{ color: S.text }}>{comment.body}</p>
                      <p className="text-[10px] mt-1" style={{ color: S.muted }}>
                        {new Date(comment.createdAt).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                  </div>
                ))}
                {task.comments.length === 0 && (
                  <p className="text-xs" style={{ color: S.muted }}>কোনো মন্তব্য নেই</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                  placeholder="মন্তব্য লিখুন..."
                  className="flex-1 text-sm border rounded-xl px-3 py-2"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                />
                <button
                  onClick={submitComment}
                  disabled={submittingComment || !commentBody.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: S.primary }}
                >
                  পাঠান
                </button>
              </div>
            </div>

            {/* Activity log */}
            {task.activityLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: S.text }}>
                  <Activity size={14} />
                  কার্যক্রম লগ
                </h4>
                <div className="space-y-2">
                  {task.activityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 text-xs" style={{ color: S.muted }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: S.primary }} />
                      <div>
                        <span className="font-medium" style={{ color: S.text }}>{log.user.name}</span>
                        {" "}{log.action}
                        {log.detail && <span> — {log.detail}</span>}
                        <span className="ml-1 text-[10px]">{new Date(log.createdAt).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex gap-2 px-5 py-3 border-t flex-shrink-0" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <button
            onClick={markDone}
            disabled={task.status === "done" || saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "#16a34a" }}
          >
            ✓ সম্পন্ন চিহ্নিত করুন
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: S.primary }}
          >
            {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
          </button>
          <button
            onClick={deleteTask}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#dc2626" }}
            title="টাস্ক মুছুন"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
