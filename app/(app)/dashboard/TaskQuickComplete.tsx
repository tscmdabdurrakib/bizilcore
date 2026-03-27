"use client";

import { useState } from "react";
import { CheckSquare, CheckCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: Date | null;
}

const PRIORITY_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  urgent: { color: "var(--priority-urgent-text)", bg: "var(--priority-urgent-bg)", label: "জরুরি" },
  high:   { color: "var(--priority-high-text)",   bg: "var(--priority-high-bg)",   label: "হাই" },
  medium: { color: "var(--priority-medium-text)", bg: "var(--priority-medium-bg)", label: "মিডিয়াম" },
  low:    { color: "var(--priority-low-text)",     bg: "var(--priority-low-bg)",    label: "লো" },
};

export default function TaskQuickComplete({ tasks, emptyMessage }: {
  tasks: Task[];
  emptyMessage?: boolean;
}) {
  const [done, setDone] = useState<Set<string>>(new Set());

  const markDone = async (taskId: string) => {
    setDone(prev => new Set([...prev, taskId]));
    await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    }).catch(() => {});
  };

  if (tasks.length === 0 && emptyMessage) {
    return (
      <div className="text-center py-4">
        <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "#10B981" }} />
        <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>দারুণ! সব টাস্ক সম্পন্ন</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const p = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;
        const isDone = done.has(task.id);
        return (
          <div
            key={task.id}
            className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ backgroundColor: "var(--c-bg, #F7F6F2)", opacity: isDone ? 0.5 : 1 }}
          >
            <button
              onClick={() => !isDone && markDone(task.id)}
              className="flex-shrink-0 transition-colors"
              title="সম্পন্ন করুন"
            >
              {isDone
                ? <CheckCircle size={16} style={{ color: "#10B981" }} />
                : <CheckSquare size={16} style={{ color: "var(--c-text-muted)" }} />
              }
            </button>
            <p className="text-sm flex-1 truncate" style={{ color: "var(--c-text)", textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: p.bg, color: p.color }}>
              {p.label}
            </span>
            {task.dueDate && (
              <span className="text-[10px] flex-shrink-0" style={{ color: "var(--c-text-muted)" }} suppressHydrationWarning>
                {(() => {
                  const iso = task.dueDate instanceof Date ? task.dueDate.toISOString() : String(task.dueDate);
                  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString("bn-BD", { month: "short", day: "numeric" });
                })()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
