"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Square } from "lucide-react";

interface TimerState {
  taskId: string | null;
  taskTitle: string;
  startedAt: number | null;
  elapsed: number;
}

interface TimerContextValue {
  timer: TimerState;
  startTimer: (taskId: string, taskTitle: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  isRunning: (taskId: string) => boolean;
  elapsedForTask: (taskId: string) => number;
}

const TimerContext = createContext<TimerContextValue | null>(null);

async function persistElapsed(taskId: string, startedAt: number) {
  const elapsedMinutes = Math.round((Date.now() - startedAt) / 60000);
  if (elapsedMinutes <= 0) return;
  try {
    const taskRes = await fetch(`/api/tasks/${taskId}`);
    if (taskRes.ok) {
      const taskData = await taskRes.json();
      const prevActual = taskData.actualMinutes ?? 0;
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualMinutes: prevActual + elapsedMinutes }),
      });
    }
  } catch {}
}

export function TaskTimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<TimerState>({
    taskId: null,
    taskTitle: "",
    startedAt: null,
    elapsed: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef(timer);
  timerRef.current = timer;

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (timer.startedAt !== null) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.startedAt === null) return prev;
          return { ...prev, elapsed: Math.floor((Date.now() - prev.startedAt) / 1000) };
        });
      }, 1000);
    }
    return clearTick;
  }, [timer.startedAt, clearTick]);

  const stopTimer = useCallback(async () => {
    const { taskId, startedAt } = timerRef.current;
    if (!taskId || !startedAt) return;
    clearTick();
    setTimer({ taskId: null, taskTitle: "", startedAt: null, elapsed: 0 });
    await persistElapsed(taskId, startedAt);
  }, [clearTick]);

  const startTimer = useCallback(async (taskId: string, taskTitle: string) => {
    const current = timerRef.current;
    if (current.taskId && current.startedAt) {
      clearTick();
      const prevId = current.taskId;
      const prevStartedAt = current.startedAt;
      setTimer({ taskId: null, taskTitle: "", startedAt: null, elapsed: 0 });
      await persistElapsed(prevId, prevStartedAt);
    }
    setTimer({ taskId, taskTitle, startedAt: Date.now(), elapsed: 0 });
  }, [clearTick]);

  const isRunning = useCallback((taskId: string) => timerRef.current.taskId === taskId && timerRef.current.startedAt !== null, []);
  const elapsedForTask = useCallback((taskId: string) => timerRef.current.taskId === taskId ? timerRef.current.elapsed : 0, []);

  return (
    <TimerContext.Provider value={{ timer, startTimer, stopTimer, isRunning, elapsedForTask }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTaskTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTaskTimer must be used inside TaskTimerProvider");
  return ctx;
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FloatingTimer() {
  const { timer, stopTimer } = useTaskTimer();

  if (!timer.taskId || timer.startedAt === null) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(15,110,86,0.25)",
        boxShadow: "0 8px 32px rgba(15,110,86,0.18), 0 2px 8px rgba(0,0,0,0.08)",
        minWidth: 230,
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: "#10B981" }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "#10B981" }} />
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#10B981" }}>চলছে</span>
          <span className="text-xs font-medium truncate leading-tight" style={{ color: "var(--c-text)", maxWidth: 120 }}>{timer.taskTitle}</span>
        </div>
      </div>
      <span className="text-base font-bold font-mono flex-shrink-0 tabular-nums" style={{ color: "var(--c-primary)" }}>
        {formatElapsed(timer.elapsed)}
      </span>
      <button
        onClick={stopTimer}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ backgroundColor: "#E24B4A", color: "white" }}
      >
        <Square size={10} />
        থামান
      </button>
    </div>
  );
}
