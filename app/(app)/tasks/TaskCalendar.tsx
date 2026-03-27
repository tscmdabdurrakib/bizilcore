"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Task } from "./page";
import { getPriorityStyle } from "./taskUtils";

interface Props {
  tasks: Task[];
  onTaskClick: (id: string) => void;
}

function formatKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];
const BN_WEEKDAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

const STATUS_LABELS: Record<string, string> = {
  todo: "করতে হবে",
  in_progress: "চলছে",
  review: "রিভিউ",
  done: "সম্পন্ন",
};

export default function TaskCalendar({ tasks, onTaskClick }: Props) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    const key = formatKey(new Date(task.dueDate));
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(today); };

  const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  const selectedKey = selectedDate ? formatKey(selectedDate) : null;
  const selectedTasks = selectedKey ? (tasksByDate[selectedKey] ?? []) : [];
  const todayKey = formatKey(today);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">

      {/* ── Custom Calendar Grid ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0a5540 100%)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
              style={{ color: "white" }}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <p className="text-white font-bold text-lg leading-none">
                {BN_MONTHS[month]}
              </p>
              <p className="text-white/70 text-xs mt-0.5">{year}</p>
            </div>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
              style={{ color: "white" }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={goToday}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-white/30"
            style={{ color: "white", backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            আজ
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--c-border)", backgroundColor: "#F7F6F2" }}>
          {BN_WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className="text-center text-[11px] font-bold py-2.5"
              style={{ color: i === 0 || i === 6 ? "#E24B4A" : "var(--c-text-muted)" }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const key = formatKey(cell.date);
            const dayTasks = tasksByDate[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(cell.date)}
                className="relative flex flex-col items-center pt-2 pb-2.5 min-h-[68px] border-r border-b transition-colors"
                style={{
                  borderColor: "var(--c-border)",
                  backgroundColor: isSelected
                    ? "var(--c-primary-light)"
                    : isToday
                      ? "#E1F5EE"
                      : cell.isCurrentMonth
                        ? "var(--c-surface)"
                        : "#FAFAF9",
                }}
              >
                {/* Day number */}
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1"
                  style={{
                    backgroundColor: isSelected ? "var(--c-primary)" : isToday ? "var(--c-primary)" : "transparent",
                    color: isSelected || isToday
                      ? "white"
                      : !cell.isCurrentMonth
                        ? "var(--c-text-muted)"
                        : isWeekend
                          ? "#E24B4A"
                          : "var(--c-text)",
                    opacity: !cell.isCurrentMonth ? 0.4 : 1,
                  }}
                >
                  {cell.date.getDate()}
                </span>

                {/* Task dots */}
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center px-1">
                    {dayTasks.slice(0, 4).map((t, i) => {
                      const ps = getPriorityStyle(t.priority);
                      return (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: t.status === "done" ? "#10B981" : ps.color }}
                        />
                      );
                    })}
                    {dayTasks.length > 4 && (
                      <span className="text-[8px] font-bold" style={{ color: "var(--c-primary)" }}>
                        +{dayTasks.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t" style={{ borderColor: "var(--c-border)", backgroundColor: "#FAFAF9" }}>
          {[
            { color: "#DC2626", label: "জরুরি" },
            { color: "#EA580C", label: "হাই" },
            { color: "#CA8A04", label: "মিডিয়াম" },
            { color: "#10B981", label: "সম্পন্ন" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Task Panel for selected day ── */}
      <div
        className="rounded-2xl border overflow-hidden sticky top-4"
        style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}
      >
        {selectedDate ? (
          <>
            {/* Panel header */}
            <div
              className="px-4 py-3.5 border-b"
              style={{
                borderColor: "var(--c-border)",
                backgroundColor: selectedTasks.length > 0 ? "var(--c-primary-light)" : "#F7F6F2",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: "var(--c-primary)" }} />
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
                    {selectedDate.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedTasks.length > 0 ? "var(--c-primary)" : "var(--c-border)",
                    color: selectedTasks.length > 0 ? "white" : "var(--c-text-muted)",
                  }}
                >
                  {selectedTasks.length}
                </span>
              </div>
            </div>

            {/* Task list */}
            <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
              {selectedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: "var(--c-border)" }}
                  >
                    <CalendarDays size={18} style={{ color: "var(--c-text-muted)" }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--c-text-muted)" }}>এই দিনে কোনো টাস্ক নেই</p>
                </div>
              ) : (
                selectedTasks.map(task => {
                  const priority = getPriorityStyle(task.priority);
                  return (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:opacity-80"
                      style={{ borderLeftColor: priority.color, borderLeftWidth: 3 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{
                            color: "var(--c-text)",
                            textDecoration: task.status === "done" ? "line-through" : "none",
                            opacity: task.status === "done" ? 0.6 : 1,
                          }}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: priority.bg, color: priority.color }}
                          >
                            {priority.label}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                            {STATUS_LABELS[task.status] ?? task.status}
                          </span>
                          {task.assignedTo && (
                            <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                              · {task.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: "var(--c-primary-light)" }}
            >
              <CalendarDays size={22} style={{ color: "var(--c-primary)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>একটি তারিখ বেছে নিন</p>
            <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>সেই দিনের টাস্কগুলো দেখা যাবে</p>
          </div>
        )}
      </div>
    </div>
  );
}
