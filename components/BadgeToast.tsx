"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Badge {
  key: string;
  title: string;
  desc: string;
  icon: string;
  xp: number;
}

const LS_KEY = "gam_earned_badges_v1";

function fireConfetti() {
  const script = document.getElementById("confetti-script");
  const run = () => {
    const confetti = (window as unknown as { confetti?: (opts: object) => void }).confetti;
    if (!confetti) return;
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.8 }, colors: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899"] });
  };
  if (script) { run(); return; }
  const s = document.createElement("script");
  s.id = "confetti-script";
  s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
  s.onload = run;
  document.head.appendChild(s);
}

export default function BadgeToast() {
  const router = useRouter();
  const [queue, setQueue] = useState<Badge[]>([]);
  const [visible, setVisible] = useState<Badge | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const polledRef = useRef(false);

  useEffect(() => {
    if (polledRef.current) return;
    polledRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/gamification");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.earnedBadges) return;

        const known: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
        const newBadges: Badge[] = (data.earnedBadges as Badge[]).filter(
          (b: Badge) => !known.includes(b.key)
        );

        if (newBadges.length > 0) {
          const allKeys = (data.earnedBadges as Badge[]).map((b: Badge) => b.key);
          localStorage.setItem(LS_KEY, JSON.stringify(allKeys));
          setQueue(newBadges);
        } else {
          const allKeys = (data.earnedBadges as Badge[]).map((b: Badge) => b.key);
          localStorage.setItem(LS_KEY, JSON.stringify(allKeys));
        }
      } catch {
      }
    };

    poll();
    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (visible || queue.length === 0) return;
    const [next, ...rest] = queue;
    setVisible(next);
    setQueue(rest);
    fireConfetti();

    timerRef.current = setTimeout(() => {
      setVisible(null);
    }, 5000);
  }, [queue, visible]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(null);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 w-80 max-w-[calc(100vw-2rem)]"
      style={{ animation: "slideUp 0.4s ease" }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div
        className="rounded-2xl shadow-2xl border-2 overflow-hidden cursor-pointer"
        style={{ backgroundColor: "#ECFDF5", borderColor: "#10B981" }}
        onClick={() => { dismiss(); router.push("/settings/achievements"); }}
      >
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="text-3xl leading-none mt-0.5">{visible.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#047857" }}>
              🏆 নতুন পদক অর্জন!
            </p>
            <p className="font-bold text-sm mt-0.5" style={{ color: "#064E3B" }}>{visible.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "#065F46" }}>{visible.desc}</p>
            <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#D1FAE5", color: "#047857" }}>
              +{visible.xp} XP
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); dismiss(); }}
            className="p-1 rounded-full hover:bg-green-100 transition-colors shrink-0"
          >
            <X size={14} style={{ color: "#047857" }} />
          </button>
        </div>

        {/* Progress bar auto-dismiss */}
        <div className="h-1" style={{ backgroundColor: "#D1FAE5" }}>
          <div
            className="h-full"
            style={{ backgroundColor: "#10B981", width: "100%", animation: "shrink 5s linear forwards" }}
          />
        </div>
        <style>{`
          @keyframes shrink { from { width: 100%; } to { width: 0%; } }
        `}</style>
      </div>
    </div>
  );
}
