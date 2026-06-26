"use client";

import { useEffect, useState, useCallback } from "react";
import { actionBadgeClass, timeAgo, userInitial, type ActivityLogRow } from "./utils";

interface LiveFeedProps {
  useSse?: boolean;
}

export default function LiveFeed({ useSse = true }: LiveFeedProps) {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    const r = await fetch("/api/admin/activity/feed");
    if (r.ok) {
      const data = await r.json();
      setLogs(data.logs ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 15000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  useEffect(() => {
    if (!useSse) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/sse/activity");
      es.onopen = () => setLive(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "ACTIVITY" && data.log) {
            setLogs((prev) => [data.log, ...prev].slice(0, 50));
            setLive(true);
          }
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => es?.close();
  }, [useSse]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-900">Live Activity Feed</h2>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-500" : "bg-gray-300"}`}
          />
          {live ? "Live" : "Polling"}
        </span>
      </div>
      <div className="max-h-[420px] divide-y divide-gray-50 overflow-y-auto">
        {loading && logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">লোড হচ্ছে...</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">কোনো activity নেই</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/80">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                {userInitial(log.user?.name, log.user?.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {log.shop?.name ?? "—"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${actionBadgeClass(log.actionType)}`}>
                    {log.actionType}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-600">
                  {log.actionLabel ?? log.actionType}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {log.pagePath ? `${log.pagePath} · ` : ""}
                  {timeAgo(log.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
