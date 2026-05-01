"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChevronRight, Sparkles } from "lucide-react";
import { SETUP_TASKS, type SetupProgress } from "@/lib/setupTasks";

declare global {
  interface Window { confetti?: (opts: Record<string, unknown>) => void }
}

function loadConfetti() {
  if (typeof window === "undefined" || window.confetti) return;
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
  s.async = true;
  document.head.appendChild(s);
}

export default function SetupChecklist() {
  const router = useRouter();
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [hidden, setHidden] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebratedRef = useRef(false);

  useEffect(() => { loadConfetti(); }, []);

  useEffect(() => {
    fetch("/api/onboarding/progress").then(r => r.json()).then(d => {
      if (!d.error) setProgress(d as SetupProgress);
    }).catch(() => {});
  }, []);

  if (!progress) return null;
  if (progress.dismissed) return null;

  if (progress.snoozedUntil && new Date(progress.snoozedUntil) > new Date()) return null;

  const done = SETUP_TASKS.filter(t => progress[t.key]).length;
  const total = SETUP_TASKS.length;
  const percent = Math.round((done / total) * 100);

  if (percent === 100 && !celebrating && !celebratedRef.current) {
    celebratedRef.current = true;
    setCelebrating(true);
    setTimeout(() => {
      if (window.confetti) {
        window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
    }, 200);
    setTimeout(() => setHidden(true), 5000);
  }

  if (hidden) return null;

  const xpTotal = SETUP_TASKS.filter(t => progress[t.key]).reduce((s, t) => s + t.xp, 0);
  const maxXp = SETUP_TASKS.reduce((s, t) => s + t.xp, 0);

  async function snooze() {
    await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snooze: true }),
    }).catch(() => {});
    setHidden(true);
  }

  async function dismiss() {
    await fetch("/api/onboarding/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismiss: true }),
    }).catch(() => {});
    setHidden(true);
  }

  if (celebrating) {
    return (
      <div className="rounded-2xl border p-6 text-center shadow-md animate-pulse"
        style={{ backgroundColor: "var(--c-surface)", borderColor: "#86EFAC" }}>
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="text-base font-extrabold mb-1" style={{ color: "var(--c-text)" }}>
          Setup সম্পন্ন! আপনি এখন প্রস্তুত।
        </h3>
        <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
          মোট {maxXp} XP অর্জিত হয়েছে। আপনার ব্যবসা চালু করুন!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden"
      style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
        <div className="flex items-center gap-2.5">
          <Sparkles size={18} color="#fff" />
          <div>
            <h3 className="text-sm font-extrabold text-white">Setup সম্পন্ন করুন</h3>
            <p className="text-[11px] font-medium text-green-200">{xpTotal}/{maxXp} XP অর্জিত</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-extrabold text-lg">{percent}%</span>
          <button onClick={snooze}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            title="এখন না (২৪ ঘণ্টা)">
            <X size={14} color="#fff" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5" style={{ backgroundColor: "var(--c-bg)" }}>
        <div className="h-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%`, background: "linear-gradient(90deg, #0F6E56, #10B981)" }} />
      </div>

      {/* Tasks */}
      <div className="divide-y" style={{ borderColor: "var(--c-border)" }}>
        {SETUP_TASKS.map(task => {
          const done = progress[task.key];
          return (
            <div key={task.key}
              className="flex items-center gap-3 px-5 py-3.5 transition-all"
              style={{ backgroundColor: done ? "var(--c-bg)" : "var(--c-surface)", opacity: done ? 0.75 : 1 }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  backgroundColor: done ? "#0F6E56" : "transparent",
                  border: done ? "none" : "2px solid var(--c-border)",
                }}>
                {done && <Check size={13} color="#fff" strokeWidth={3} />}
              </div>
              <p className="flex-1 text-sm font-medium"
                style={{
                  color: done ? "var(--c-text-muted)" : "var(--c-text)",
                  textDecoration: done ? "line-through" : "none",
                }}>
                {task.label}
              </p>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: done ? "#DCFCE7" : "#E8F5F0",
                  color: done ? "#15803D" : "#0F6E56",
                }}>
                +{task.xp} XP
              </span>
              {!done && task.link && (
                <button onClick={() => router.push(task.link!)}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all hover:opacity-80 flex-shrink-0"
                  style={{ backgroundColor: "var(--c-primary)", color: "#fff" }}>
                  করুন <ChevronRight size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {percent >= 70 && (
        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: "var(--c-border)" }}>
          <button onClick={dismiss}
            className="text-xs font-semibold hover:underline transition-colors"
            style={{ color: "var(--c-text-muted)" }}>
            Dismiss (আর দেখাবে না)
          </button>
        </div>
      )}
    </div>
  );
}
