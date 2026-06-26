"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { actionBadgeClass, timeAgo, type ActivityLogRow } from "@/app/admin/activity/components/utils";
import AdminCard from "@/app/admin/components/AdminCard";

export default function RecentActivityWidget() {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/activity/feed")
      .then((r) => r.json())
      .then((d) => setLogs((d.logs ?? []).slice(0, 10)))
      .catch(() => {});
  }, []);

  return (
    <AdminCard
      title="Recent Activity"
      action={
        <Link href="/admin/activity" className="text-xs font-medium text-emerald-700 hover:underline">
          সব দেখুন →
        </Link>
      }
    >
      {logs.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">কোনো activity নেই</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">
                  {log.actionLabel ?? log.actionType}
                </p>
                <p className="text-xs text-gray-400">
                  {log.shop?.name ?? "—"} · {timeAgo(log.createdAt)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${actionBadgeClass(log.actionType)}`}>
                {log.actionType.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
