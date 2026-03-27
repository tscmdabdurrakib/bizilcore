"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "./page";
import { getPriorityStyle, getCategoryLabel } from "./taskUtils";
import { MessageSquare, Calendar, ExternalLink, CheckSquare, Play, Square } from "lucide-react";
import { useTaskTimer } from "./TaskTimerContext";

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string; headerBg: string }[] = [
  { id: "todo",        label: "করতে হবে",  color: "#6B7280", bg: "#F3F4F6",   headerBg: "#E5E7EB" },
  { id: "in_progress", label: "চলছে",      color: "#3B82F6", bg: "#EFF6FF",   headerBg: "#DBEAFE" },
  { id: "review",      label: "রিভিউ",     color: "#F59E0B", bg: "#FFFBEB",   headerBg: "#FEF3C7" },
  { id: "done",        label: "সম্পন্ন",   color: "#10B981", bg: "#F0FDF4",   headerBg: "#DCFCE7" },
];

const PRIORITY_LEFT_BORDER: Record<string, string> = {
  urgent: "#DC2626",
  high:   "#EA580C",
  medium: "#CA8A04",
  low:    "#16A34A",
};

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const priorityStyle = getPriorityStyle(task.priority);
  const now = new Date();
  const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < now;
  const assigneeName = (task as Task & { user?: { name: string } }).user?.name ?? null;
  const subtaskTotal = task.subtasks?.length ?? 0;
  const subtaskDone = task.subtasks?.filter(s => s.done).length ?? 0;
  const { isRunning, startTimer, stopTimer } = useTaskTimer();
  const running = isRunning(task.id);
  const leftBorderColor = PRIORITY_LEFT_BORDER[task.priority] ?? "#CA8A04";

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (running) {
      stopTimer();
    } else {
      startTimer(task.id, task.title);
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--c-surface)",
        borderColor: running ? "var(--c-primary)" : "var(--c-border)",
        borderLeftColor: running ? "var(--c-primary)" : leftBorderColor,
        borderLeftWidth: 3,
        opacity: isDragging ? 0.4 : 1,
        boxShadow: running
          ? "0 0 0 2px var(--c-primary-light)"
          : "0 1px 3px rgba(0,0,0,0.06)",
        padding: "10px 12px 10px 10px",
      }}
    >
      {/* Priority badge + Category + Order link */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color }}
        >
          {priorityStyle.label}
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ backgroundColor: "var(--c-border)", color: "var(--c-text-muted)" }}
        >
          {getCategoryLabel(task.category)}
        </span>
        {task.orderId && (
          <span
            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
          >
            <ExternalLink size={9} />
            অর্ডার
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-snug mb-2 line-clamp-2" style={{ color: "var(--c-text)" }}>
        {task.title}
      </p>

      {/* Subtask progress */}
      {subtaskTotal > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--c-text-muted)" }}>
              <CheckSquare size={9} />
              {subtaskDone}/{subtaskTotal}
            </span>
            <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
              {Math.round((subtaskDone / subtaskTotal) * 100)}%
            </span>
          </div>
          <div className="w-full h-1 rounded-full" style={{ backgroundColor: "var(--c-border)" }}>
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${(subtaskDone / subtaskTotal) * 100}%`,
                backgroundColor: subtaskDone === subtaskTotal ? "#10B981" : "var(--c-primary)",
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--c-text-muted)" }}>
              <MessageSquare size={10} />
              {task.comments.length}
            </span>
          )}
          {assigneeName && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full truncate"
              style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}
              title={assigneeName}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold" style={{ backgroundColor: "var(--c-primary)" }}>
                {assigneeName[0]?.toUpperCase()}
              </span>
              <span className="truncate max-w-[60px]">{assigneeName}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.dueDate && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: isOverdue ? "#E24B4A" : "var(--c-text-muted)" }}
            >
              <Calendar size={10} />
              {new Date(task.dueDate).toLocaleDateString("bn-BD", { month: "short", day: "numeric" })}
            </span>
          )}
          {task.status !== "done" && (
            <button
              onClick={handleTimerClick}
              title={running ? "টাইমার থামান" : "টাইমার শুরু করুন"}
              className="p-1 rounded-md transition-colors"
              style={{
                backgroundColor: running ? "#E24B4A" : "var(--c-primary-light)",
                color: running ? "#fff" : "var(--c-primary)",
              }}
            >
              {running ? <Square size={10} /> : <Play size={10} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
  onTaskClick,
}: {
  column: typeof COLUMNS[0];
  tasks: Task[];
  onTaskClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-1 min-w-[240px] flex flex-col">
      {/* Column header */}
      <div
        className="flex items-center gap-2 mb-2 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: isOver ? column.color + "22" : column.headerBg }}
      >
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
        <span className="text-sm font-bold flex-1" style={{ color: "var(--c-text)" }}>{column.label}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: column.color + "20", color: column.color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 rounded-2xl p-2 min-h-[120px] transition-all"
        style={{
          backgroundColor: isOver ? column.color + "12" : column.bg,
          border: `2px dashed ${isOver ? column.color : "transparent"}`,
        }}
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))}
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-16 text-[11px]" style={{ color: column.color + "80" }}>
            কোনো টাস্ক নেই
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onRefresh: () => void;
}

export default function TaskKanban({ tasks, onTaskClick, onStatusChange }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const groupedTasks = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newStatus = over.id as TaskStatus;
    const validStatuses: TaskStatus[] = ["todo", "in_progress", "review", "done"];
    if (validStatuses.includes(newStatus)) {
      onStatusChange(active.id as string, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 items-start">
        {COLUMNS.map(column => (
          <Column
            key={column.id}
            column={column}
            tasks={groupedTasks[column.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div
            className="rounded-xl border p-3 shadow-2xl rotate-2"
            style={{
              backgroundColor: "var(--c-surface)",
              borderColor: "var(--c-border)",
              borderLeftColor: PRIORITY_LEFT_BORDER[activeTask.priority] ?? "#CA8A04",
              borderLeftWidth: 3,
              width: "240px",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
