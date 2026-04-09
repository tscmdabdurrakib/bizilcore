"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus } from "./page";
import { getPriorityStyle, getStatusLabel, getCategoryLabel } from "./taskUtils";
import {
  Calendar, CheckSquare, Trash2, ChevronUp, ChevronDown,
  Flag, UserCheck, Clock, Tag, X, ClipboardList,
} from "lucide-react";

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onRefresh: () => void;
}

type SortKey = "title" | "priority" | "status" | "dueDate" | "createdAt";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;
const PRIORITY_ORDER: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

const PRIORITY_LABELS: Record<string, string> = { urgent: "🔥 জরুরি", high: "⬆ হাই", medium: "➡ মিডিয়াম", low: "⬇ লো" };
const PRIORITY_COLORS: Record<string, string> = { urgent: "#DC2626", high: "#EA580C", medium: "#CA8A04", low: "#16A34A" };
const PRIORITY_BGS: Record<string, string> = { urgent: "#FEE2E2", high: "#FFEDD5", medium: "#FEF9C3", low: "#DCFCE7" };

const STATUS_META: Record<string, { label: string; color: string; bg: string; next: TaskStatus }> = {
  todo:        { label: "করতে হবে", color: "#6B7280", bg: "#F3F4F6",  next: "in_progress" },
  in_progress: { label: "চলছে",     color: "#3B82F6", bg: "#DBEAFE",  next: "review" },
  review:      { label: "রিভিউ",    color: "#F59E0B", bg: "#FEF3C7",  next: "done" },
  done:        { label: "✓ সম্পন্ন", color: "#10B981", bg: "#DCFCE7", next: "todo" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  bg: "var(--c-bg)",
};

export default function TaskList({ tasks, onTaskClick, onStatusChange, onRefresh }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [reassignId, setReassignId] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [staffMembers, setStaffMembers] = useState<{ id: string; userId: string; user: { name: string } }[]>([]);

  useEffect(() => {
    fetch("/api/staff").then(r => r.ok ? r.json() : []).then(data => {
      if (Array.isArray(data)) setStaffMembers(data);
    }).catch(() => {});
  }, []);

  const sorted = [...tasks].sort((a, b) => {
    let aVal: number | string = "";
    let bVal: number | string = "";
    if (sortKey === "priority") {
      aVal = PRIORITY_ORDER[a.priority] ?? 0; bVal = PRIORITY_ORDER[b.priority] ?? 0;
    } else if (sortKey === "dueDate") {
      aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    } else if (sortKey === "createdAt") {
      aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime();
    } else {
      aVal = (a[sortKey] as string) ?? ""; bVal = (b[sortKey] as string) ?? "";
    }
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map(t => t.id)));
  };

  const bulkAction = async (action: string) => {
    setBulkLoading(true);
    const ids = Array.from(selected);
    if (action === "done") {
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      })));
    } else if (action === "delete") {
      if (!confirm(`${ids.length}টি টাস্ক মুছে ফেলবেন?`)) { setBulkLoading(false); return; }
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, { method: "DELETE" })));
    } else if (action.startsWith("priority:")) {
      const priority = action.split(":")[1];
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      })));
    } else if (action === "reassign") {
      if (!reassignId.trim()) { setBulkLoading(false); return; }
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: reassignId.trim() }),
      })));
      setReassignId("");
    } else if (action.startsWith("category:")) {
      const category = action.split(":")[1];
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      })));
      setBulkCategory("");
    } else if (action.startsWith("status:")) {
      const newStatus = action.split(":")[1];
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })));
      setBulkStatus("");
    }
    setSelected(new Set()); setBulkLoading(false); onRefresh();
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={10} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const now = new Date();
  const allSelected = selected.size === paged.length && paged.length > 0;

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border py-16 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #E8F5F0, #C8EDE3)" }}>
          <ClipboardList size={26} style={{ color: "#0F6E56" }} />
        </div>
        <p className="text-sm font-bold mb-1" style={{ color: S.text }}>কোনো টাস্ক পাওয়া যায়নি</p>
        <p className="text-xs" style={{ color: S.muted }}>ফিল্টার পরিবর্তন করুন বা নতুন টাস্ক তৈরি করুন</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "linear-gradient(135deg, var(--c-bg), var(--c-surface))", borderBottom: `1px solid ${S.border}` }}>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="rounded accent-green-600" />
                </th>
                {[
                  { key: "title" as SortKey, label: "শিরোনাম" },
                  { key: "status" as SortKey, label: "স্ট্যাটাস" },
                  { key: "priority" as SortKey, label: "অগ্রাধিকার" },
                ].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide cursor-pointer select-none"
                    style={{ color: sortKey === col.key ? "#0F6E56" : S.muted }}>
                    <div className="flex items-center gap-1">{col.label} <SortIcon col={col.key} /></div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide" style={{ color: S.muted }}>ক্যাটাগরি</th>
                <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত</th>
                <th onClick={() => toggleSort("dueDate")}
                  className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide cursor-pointer select-none"
                  style={{ color: sortKey === "dueDate" ? "#0F6E56" : S.muted }}>
                  <div className="flex items-center gap-1">ডেডলাইন <SortIcon col="dueDate" /></div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wide" style={{ color: S.muted }}>সময়</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((task, i) => {
                const priority = getPriorityStyle(task.priority);
                const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < now;
                const isSelected = selected.has(task.id);
                const meta = STATUS_META[task.status] ?? STATUS_META.todo;

                return (
                  <tr key={task.id}
                    className="border-b cursor-pointer transition-all group"
                    style={{
                      borderColor: S.border,
                      backgroundColor: isSelected
                        ? "#E8F5F0"
                        : i % 2 === 0 ? S.surface : S.bg,
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#F0FDF7"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "#E8F5F0" : i % 2 === 0 ? S.surface : S.bg; }}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={isSelected}
                        onChange={() => toggleSelect(task.id)}
                        onClick={e => e.stopPropagation()}
                        className="rounded accent-green-600" />
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3 max-w-[220px]" onClick={() => onTaskClick(task.id)}>
                      <p className="font-semibold text-sm line-clamp-1 group-hover:underline"
                        style={{ color: task.status === "done" ? S.muted : S.text,
                          textDecoration: task.status === "done" ? "line-through" : "none" }}>
                        {task.title}
                      </p>
                      {task.subtasks?.length > 0 && (
                        <p className="text-[10px] mt-0.5 font-medium"
                          style={{ color: "#0F6E56" }}>
                          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} সাবটাস্ক
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onStatusChange(task.id, meta.next)}
                        className="text-[10px] font-extrabold px-3 py-1 rounded-full transition-all hover:opacity-80 active:scale-95 border"
                        style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.color + "40" }}
                        title={`পরবর্তী: ${STATUS_META[meta.next]?.label}`}>
                        {meta.label}
                      </button>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: priority.bg, color: priority.color }}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
                        style={{ backgroundColor: S.bg, color: S.muted }}>
                        {getCategoryLabel(task.category)}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3">
                      {task.assignedTo ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                            style={{ backgroundColor: "#0F6E56" }}>
                            {task.assignedTo.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: S.text }}>{task.assignedTo.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: S.muted }}>—</span>
                      )}
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                          style={{
                            color: isOverdue ? "#EF4444" : S.muted,
                            backgroundColor: isOverdue ? "#FEF2F2" : "transparent",
                          }}>
                          <Calendar size={11} />
                          {new Date(task.dueDate).toLocaleDateString("bn-BD")}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: S.muted }}>—</span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3">
                      {(task.estimatedMinutes != null || task.actualMinutes != null) ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: S.muted }}
                          title={`আনুমানিক: ${task.estimatedMinutes ?? "—"}মি | প্রকৃত: ${task.actualMinutes ?? "—"}মি`}>
                          <Clock size={10} />
                          {task.estimatedMinutes != null ? `${task.estimatedMinutes}মি` : "—"}
                          {task.actualMinutes != null && (
                            <span style={{ color: task.actualMinutes > (task.estimatedMinutes ?? Infinity) ? "#EF4444" : "#16A34A" }}>
                              /{task.actualMinutes}মি
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: S.muted }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold" style={{ color: S.muted }}>{sorted.length}টি টাস্ক</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border disabled:opacity-40 transition-all hover:opacity-80"
              style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
              ← আগে
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className="w-8 h-8 text-xs font-bold rounded-xl border transition-all"
                style={{
                  borderColor: page === p ? "#0F6E56" : S.border,
                  backgroundColor: page === p ? "#0F6E56" : S.surface,
                  color: page === p ? "#fff" : S.text,
                }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border disabled:opacity-40 transition-all hover:opacity-80"
              style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
              পরে →
            </button>
          </div>
        </div>
      )}

      {/* ── Sticky Bulk Action Bar ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderColor: "#A7F3D0",
            boxShadow: "0 -4px 32px rgba(15,110,86,0.15)",
          }}>
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold flex-shrink-0"
              style={{ backgroundColor: "#E8F5F0", color: "#0F6E56" }}>
              <CheckSquare size={14} /> {selected.size}টি নির্বাচিত
            </div>

            <button onClick={() => bulkAction("done")} disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              style={{ backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #6EE7B7" }}>
              <CheckSquare size={13} /> সম্পন্ন
            </button>

            <div className="flex items-center gap-1">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                className="text-xs border rounded-xl px-2 py-1.5 font-medium"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}>
                <option value="">— স্ট্যাটাস —</option>
                <option value="todo">করতে হবে</option>
                <option value="in_progress">চলছে</option>
                <option value="review">রিভিউ</option>
                <option value="done">সম্পন্ন</option>
              </select>
              <button onClick={() => bulkStatus && bulkAction(`status:${bulkStatus}`)}
                disabled={bulkLoading || !bulkStatus}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl disabled:opacity-40"
                style={{ backgroundColor: "#DBEAFE", color: "#3B82F6", border: "1px solid #93C5FD" }}>
                আপডেট
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Flag size={12} style={{ color: S.muted }} />
              {(["urgent", "high", "medium", "low"] as const).map(p => (
                <button key={p} onClick={() => bulkAction(`priority:${p}`)} disabled={bulkLoading}
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                  style={{ backgroundColor: PRIORITY_BGS[p], color: PRIORITY_COLORS[p], border: `1px solid ${PRIORITY_COLORS[p]}40` }}>
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Tag size={12} style={{ color: S.muted }} />
              <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}
                className="text-xs border rounded-xl px-2 py-1.5 font-medium"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}>
                <option value="">— ক্যাটাগরি —</option>
                <option value="order">📦 অর্ডার</option>
                <option value="delivery">🚚 ডেলিভারি</option>
                <option value="supplier">🏭 সাপ্লায়ার</option>
                <option value="accounts">💰 একাউন্টস</option>
                <option value="general">📋 সাধারণ</option>
              </select>
              <button onClick={() => bulkCategory && bulkAction(`category:${bulkCategory}`)}
                disabled={bulkLoading || !bulkCategory}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl disabled:opacity-40"
                style={{ backgroundColor: "#F5F3FF", color: "#8B5CF6", border: "1px solid #C4B5FD" }}>
                পরিবর্তন
              </button>
            </div>

            {staffMembers.length > 0 && (
              <div className="flex items-center gap-1">
                <UserCheck size={12} style={{ color: S.muted }} />
                <select value={reassignId} onChange={e => setReassignId(e.target.value)}
                  className="text-xs border rounded-xl px-2 py-1.5 font-medium"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}>
                  <option value="">— সদস্য —</option>
                  {staffMembers.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
                <button onClick={() => bulkAction("reassign")} disabled={bulkLoading || !reassignId}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl disabled:opacity-40"
                  style={{ backgroundColor: "#DBEAFE", color: "#3B82F6", border: "1px solid #93C5FD" }}>
                  রিঅ্যাসাইন
                </button>
              </div>
            )}

            <button onClick={() => bulkAction("delete")} disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
              style={{ backgroundColor: "#FEE2E2", color: "#EF4444", border: "1px solid #FCA5A5" }}>
              <Trash2 size={13} /> মুছুন
            </button>

            <button onClick={() => setSelected(new Set())} className="ml-auto p-1.5 rounded-xl hover:opacity-70" title="বাতিল">
              <X size={16} style={{ color: S.muted }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
