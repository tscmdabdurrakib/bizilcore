"use client";

import { useState, useEffect } from "react";
import type { Task, TaskStatus } from "./page";
import { getPriorityStyle, getStatusLabel, getCategoryLabel } from "./taskUtils";
import {
  Calendar, CheckSquare, Trash2, ChevronUp, ChevronDown,
  Flag, UserCheck, Clock, Tag, X,
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

const PRIORITY_LABELS: Record<string, string> = { urgent: "জরুরি", high: "হাই", medium: "মিডিয়াম", low: "লো" };
const PRIORITY_COLORS: Record<string, string> = { urgent: "#DC2626", high: "#EA580C", medium: "#CA8A04", low: "#16A34A" };
const PRIORITY_BGS: Record<string, string> = { urgent: "#FEE2E2", high: "#FFEDD5", medium: "#FEF9C3", low: "#DCFCE7" };

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
      aVal = PRIORITY_ORDER[a.priority] ?? 0;
      bVal = PRIORITY_ORDER[b.priority] ?? 0;
    } else if (sortKey === "dueDate") {
      aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    } else if (sortKey === "createdAt") {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    } else {
      aVal = (a[sortKey] as string) ?? "";
      bVal = (b[sortKey] as string) ?? "";
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      })));
    } else if (action === "delete") {
      if (!confirm(`${ids.length}টি টাস্ক মুছে ফেলবেন?`)) { setBulkLoading(false); return; }
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, { method: "DELETE" })));
    } else if (action.startsWith("priority:")) {
      const priority = action.split(":")[1];
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      })));
    } else if (action === "reassign") {
      if (!reassignId.trim()) { setBulkLoading(false); return; }
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: reassignId.trim() }),
      })));
      setReassignId("");
    } else if (action.startsWith("category:")) {
      const category = action.split(":")[1];
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      })));
      setBulkCategory("");
    } else if (action.startsWith("status:")) {
      const newStatus = action.split(":")[1];
      await Promise.all(ids.map(id => fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })));
      setBulkStatus("");
    }
    setSelected(new Set());
    setBulkLoading(false);
    onRefresh();
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    primary: "var(--c-primary)",
    primaryLight: "var(--c-primary-light)",
  };

  const now = new Date();
  const allSelected = selected.size === paged.length && paged.length > 0;

  return (
    <div className="space-y-3 pb-24">
      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#F7F6F2", borderBottom: `1px solid ${S.border}` }}>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer select-none" style={{ color: S.muted }} onClick={() => toggleSort("title")}>
                  <div className="flex items-center gap-1">শিরোনাম <SortIcon col="title" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer select-none" style={{ color: S.muted }} onClick={() => toggleSort("status")}>
                  <div className="flex items-center gap-1">স্ট্যাটাস <SortIcon col="status" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer select-none" style={{ color: S.muted }} onClick={() => toggleSort("priority")}>
                  <div className="flex items-center gap-1">অগ্রাধিকার <SortIcon col="priority" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold" style={{ color: S.muted }}>ক্যাটাগরি</th>
                <th className="px-4 py-3 text-left text-xs font-bold" style={{ color: S.muted }}>দায়িত্বপ্রাপ্ত</th>
                <th className="px-4 py-3 text-left text-xs font-bold cursor-pointer select-none" style={{ color: S.muted }} onClick={() => toggleSort("dueDate")}>
                  <div className="flex items-center gap-1">ডেডলাইন <SortIcon col="dueDate" /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold" style={{ color: S.muted }}>সময়</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: S.muted }}>
                    কোনো টাস্ক পাওয়া যায়নি
                  </td>
                </tr>
              )}
              {paged.map((task, i) => {
                const priority = getPriorityStyle(task.priority);
                const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < now;
                const isSelected = selected.has(task.id);
                return (
                  <tr
                    key={task.id}
                    className="border-b cursor-pointer transition-colors"
                    style={{
                      borderColor: S.border,
                      backgroundColor: isSelected
                        ? "var(--c-primary-light)"
                        : i % 2 === 0
                          ? S.surface
                          : "#F7F6F2",
                    }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(task.id)}
                        onClick={e => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3" onClick={() => onTaskClick(task.id)}>
                      <p className="font-medium text-sm line-clamp-1 hover:underline" style={{ color: S.text }}>{task.title}</p>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {(() => {
                        const STATUS_CYCLE: TaskStatus[] = ["todo", "in_progress", "review", "done"];
                        const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
                          todo:        { label: "করতে হবে", color: "#6B7280", bg: "#F3F4F6" },
                          in_progress: { label: "চলছে",     color: "#3B82F6", bg: "#DBEAFE" },
                          review:      { label: "রিভিউ",    color: "#F59E0B", bg: "#FEF3C7" },
                          done:        { label: "সম্পন্ন",  color: "#10B981", bg: "#DCFCE7" },
                        };
                        const meta = STATUS_META[task.status] ?? STATUS_META.todo;
                        const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length];
                        return (
                          <button
                            onClick={() => onStatusChange(task.id, nextStatus)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-opacity hover:opacity-75"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                            title={`পরবর্তী: ${STATUS_META[nextStatus]?.label}`}
                          >
                            {meta.label}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: priority.bg, color: priority.color }}>
                        {priority.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: S.muted }}>{getCategoryLabel(task.category)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {task.assignedTo ? (
                        <span className="text-xs" style={{ color: S.text }}>{task.assignedTo.name}</span>
                      ) : (
                        <span className="text-xs" style={{ color: S.muted }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: isOverdue ? "#E24B4A" : S.muted }}>
                          <Calendar size={11} />
                          {new Date(task.dueDate).toLocaleDateString("bn-BD")}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: S.muted }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {(task.estimatedMinutes != null || task.actualMinutes != null) ? (
                        <span
                          className="flex items-center gap-1 text-[11px]"
                          style={{ color: S.muted }}
                          title={`আনুমানিক: ${task.estimatedMinutes ?? "—"}মি | প্রকৃত: ${task.actualMinutes ?? "—"}মি`}
                        >
                          <Clock size={10} />
                          {task.estimatedMinutes != null ? `${task.estimatedMinutes}মি` : "—"}
                          {task.actualMinutes != null && (
                            <span style={{ color: task.actualMinutes > (task.estimatedMinutes ?? Infinity) ? "#E24B4A" : "#16A34A" }}>
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
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: S.muted }}>{sorted.length}টি টাস্ক</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-50"
              style={{ borderColor: S.border, color: S.text }}
            >
              আগে
            </button>
            <span className="text-xs" style={{ color: S.muted }}>{page}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-50"
              style={{ borderColor: S.border, color: S.text }}
            >
              পরে
            </button>
          </div>
        </div>
      )}

      {/* Sticky bottom bulk action bar */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-3"
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "var(--c-primary)" + "40",
            boxShadow: "0 -4px 24px rgba(15,110,86,0.12)",
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            {/* Selection count */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}
            >
              <CheckSquare size={14} />
              {selected.size}টি নির্বাচিত
            </div>

            {/* Mark done */}
            <button
              onClick={() => bulkAction("done")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#10B981", color: "#fff" }}
            >
              <CheckSquare size={13} />
              সম্পন্ন
            </button>

            {/* Bulk status */}
            <div className="flex items-center gap-1">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              >
                <option value="">— স্ট্যাটাস —</option>
                <option value="todo">করতে হবে</option>
                <option value="in_progress">চলছে</option>
                <option value="review">রিভিউ</option>
                <option value="done">সম্পন্ন</option>
              </select>
              <button
                onClick={() => bulkStatus && bulkAction(`status:${bulkStatus}`)}
                disabled={bulkLoading || !bulkStatus}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: "#6366F1", color: "#fff" }}
              >
                আপডেট
              </button>
            </div>

            {/* Priority buttons */}
            <div className="flex items-center gap-1">
              <Flag size={12} style={{ color: S.muted }} />
              {(["urgent", "high", "medium", "low"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => bulkAction(`priority:${p}`)}
                  disabled={bulkLoading}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
                  style={{ backgroundColor: PRIORITY_BGS[p], color: PRIORITY_COLORS[p] }}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Bulk category */}
            <div className="flex items-center gap-1">
              <Tag size={12} style={{ color: S.muted }} />
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              >
                <option value="">— ক্যাটাগরি —</option>
                <option value="order">অর্ডার</option>
                <option value="delivery">ডেলিভারি</option>
                <option value="supplier">সাপ্লায়ার</option>
                <option value="accounts">একাউন্টস</option>
                <option value="general">সাধারণ</option>
              </select>
              <button
                onClick={() => bulkCategory && bulkAction(`category:${bulkCategory}`)}
                disabled={bulkLoading || !bulkCategory}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg disabled:opacity-40"
                style={{ backgroundColor: "#0EA5E9", color: "#fff" }}
              >
                পরিবর্তন
              </button>
            </div>

            {/* Reassign */}
            {staffMembers.length > 0 && (
              <div className="flex items-center gap-1">
                <UserCheck size={12} style={{ color: S.muted }} />
                <select
                  value={reassignId}
                  onChange={e => setReassignId(e.target.value)}
                  className="text-xs border rounded-lg px-2 py-1.5"
                  style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
                >
                  <option value="">— সদস্য —</option>
                  {staffMembers.map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => bulkAction("reassign")}
                  disabled={bulkLoading || !reassignId}
                  className="text-xs font-semibold px-2 py-1.5 rounded-lg disabled:opacity-40"
                  style={{ backgroundColor: "#6366F1", color: "#fff" }}
                >
                  রিঅ্যাসাইন
                </button>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={() => bulkAction("delete")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#E24B4A", color: "#fff" }}
            >
              <Trash2 size={13} />
              মুছুন
            </button>

            {/* Close */}
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto p-1.5 rounded-lg transition-opacity hover:opacity-70"
              title="বাতিল"
            >
              <X size={16} style={{ color: S.muted }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
