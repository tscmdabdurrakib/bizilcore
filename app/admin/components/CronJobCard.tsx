"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import AdminCard from "./AdminCard";

interface CronJobCardProps {
  jobName?: string;
  title?: string;
  subtitle?: string;
  schedule?: string;
  lastRun?: string | null;
  onComplete?: () => void;
  compact?: boolean;
}

export default function CronJobCard({
  jobName = "check-subscriptions",
  title = "Subscription Cron Job",
  subtitle = "Expired subscriptions-কে Free plan-এ ফিরিয়ে আনে।",
  schedule,
  lastRun,
  onComplete,
  compact = false,
}: CronJobCardProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runCron() {
    setRunning(true);
    setResult(null);
    const r = await fetch("/api/admin/cron/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobName }),
    });
    const d = await r.json();
    setRunning(false);
    if (r.ok) {
      setResult(typeof d.result === "object" ? JSON.stringify(d.result).slice(0, 120) : String(d.result));
      onComplete?.();
    } else {
      setResult(d.error ?? "Cron failed.");
    }
  }

  const formattedLastRun = lastRun
    ? new Date(lastRun).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <AdminCard title={title} subtitle={subtitle} hover={!compact}>
      {schedule && <p className="text-xs text-gray-400 -mt-2 mb-3">Schedule: {schedule}</p>}
      <div className="rounded-xl bg-[#1a1a2e] p-4 font-mono text-xs leading-relaxed">
        <span className="text-emerald-400">GET</span>{" "}
        <span className="text-gray-300">/api/cron/{jobName}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={runCron}
          disabled={running}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60"
        >
          {running && <Loader2 size={14} className="animate-spin" />}
          {running ? "চালানো হচ্ছে..." : "এখনই চালান"}
        </button>
        {result && (
          <span className={`text-sm break-all ${result.includes("failed") ? "text-red-500" : "text-emerald-600"}`}>
            {!result.includes("failed") && "✓ "}{result}
          </span>
        )}
      </div>
      {formattedLastRun && (
        <p className="mt-3 text-xs text-gray-500">সর্বশেষ চালানো: {formattedLastRun}</p>
      )}
    </AdminCard>
  );
}
