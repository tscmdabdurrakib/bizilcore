"use client";

import { useEffect, useState } from "react";
import { Download, Clock } from "lucide-react";
import { actionBadgeClass, type ActivityLogRow } from "./utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

interface UserTimelineProps {
  initialShopId?: string | null;
  initialUserId?: string;
}

export default function UserTimeline({ initialShopId, initialUserId }: UserTimelineProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userId, setUserId] = useState(initialUserId ?? "");
  const [shopId, setShopId] = useState(initialShopId ?? "");
  const [grouped, setGrouped] = useState<Record<string, ActivityLogRow[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : d.users ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialShopId) setShopId(initialShopId);
  }, [initialShopId]);

  useEffect(() => {
    if (initialUserId) setUserId(initialUserId);
  }, [initialUserId]);

  useEffect(() => {
    if (!userId && !shopId) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (shopId) params.set("shopId", shopId);
    fetch(`/api/admin/activity/timeline?${params}`)
      .then((r) => r.json())
      .then((d) => setGrouped(d.grouped ?? {}))
      .finally(() => setLoading(false));
  }, [userId, shopId]);

  function exportCsv() {
    if (!userId) return;
    window.open(`/api/admin/activity/export?userId=${userId}`, "_blank");
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-900">Per-User Timeline</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">User নির্বাচন...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {userId && (
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[480px] overflow-y-auto p-5">
        {loading ? (
          <p className="text-center text-sm text-gray-400">লোড হচ্ছে...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-center text-sm text-gray-400">User বা shop নির্বাচন করুন</p>
        ) : (
          Object.entries(grouped).map(([label, events]) => (
            <div key={label} className="mb-8 last:mb-0">
              <h3 className="mb-4 text-sm font-bold text-gray-500">{label}</h3>
              <div className="relative space-y-0 border-l-2 border-emerald-200 pl-6">
                {events.map((ev) => (
                  <div key={ev.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
                      <Clock size={8} className="text-white" />
                    </span>
                    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${actionBadgeClass(ev.actionType)}`}>
                          {ev.actionType}
                        </span>
                        {ev.durationSeconds != null && (
                          <span className="text-xs text-gray-400">{ev.durationSeconds}s on page</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-800">{ev.actionLabel ?? ev.actionType}</p>
                      {ev.pagePath && (
                        <p className="mt-1 text-xs text-gray-400">{ev.pagePath}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
