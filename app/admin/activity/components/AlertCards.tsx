"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  severity: "warning" | "danger";
  title: string;
  detail: string;
  userId?: string;
}

interface AlertCardsProps {
  onSelectUser?: (userId: string) => void;
}

export default function AlertCards({ onSelectUser }: AlertCardsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/activity/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => {});
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Suspicious Activity</h2>
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${
            alert.severity === "danger"
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex gap-3">
            <AlertTriangle
              size={18}
              className={alert.severity === "danger" ? "text-red-600" : "text-amber-600"}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
              <p className="mt-0.5 text-sm text-gray-600">{alert.detail}</p>
              {alert.userId && onSelectUser && (
                <button
                  type="button"
                  onClick={() => onSelectUser(alert.userId!)}
                  className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
                >
                  Timeline দেখুন →
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed((s) => new Set(s).add(alert.id))}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/80"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
