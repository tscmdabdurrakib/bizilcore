"use client";

import { useEffect, useState } from "react";
import { Activity, Database, MessageSquare, Clock, RefreshCw } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminTable, { AdminTableRow, AdminTableCell } from "../components/AdminTable";

interface Health {
  db: { ok: boolean; latencyMs: number };
  sms: { platformBalance: number | null };
  cron: { lastRun: string | null };
  timestamp: string;
}

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  async function load() {
    setLoading(true);
    const [h, l] = await Promise.all([
      fetch("/api/admin/health").then((r) => r.ok ? r.json() : null),
      fetch("/api/admin/audit-log").then((r) => r.ok ? r.json() : null),
    ]);
    setHealth(h);
    setLogs(l?.logs ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function runBackup() {
    setBackingUp(true);
    await fetch("/api/admin/backup", { method: "POST" });
    setBackingUp(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={load} className="rounded-xl border border-gray-200 p-2 hover:bg-white active:scale-95">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${health?.db.ok ? "bg-emerald-50" : "bg-red-50"}`}>
              <Database size={18} className={health?.db.ok ? "text-emerald-600" : "text-red-600"} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Database</p>
              <p className="text-xs text-gray-500">
                {loading ? "..." : health?.db.ok ? `${health.db.latencyMs}ms latency` : "Unreachable"}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <MessageSquare size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">SMS Platform</p>
              <p className="text-xs text-gray-500">
                Balance: {health?.sms.platformBalance != null ? `৳${health.sms.platformBalance}` : "N/A"}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Last Cron Run</p>
              <p className="text-xs text-gray-500">
                {health?.cron.lastRun
                  ? new Date(health.cron.lastRun).toLocaleString("bn-BD")
                  : "Never"}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="Database Backup" subtitle="Manual SQL backup trigger" hover={false}>
        <button
          onClick={runBackup}
          disabled={backingUp}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
        >
          {backingUp ? "Running..." : "Run Backup Now"}
        </button>
      </AdminCard>

      <AdminCard title="Audit Log" subtitle="Recent admin actions" hover={false}>
        {logs.length === 0 ? (
          <div className="py-8 text-center">
            <Activity size={28} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No audit logs yet</p>
          </div>
        ) : (
          <AdminTable headers={["Action", "Target", "Admin", "Time"]}>
            {logs.map((log) => (
              <AdminTableRow key={log.id}>
                <AdminTableCell className="font-medium">{log.action}</AdminTableCell>
                <AdminTableCell className="text-xs text-gray-500">
                  {log.targetType ? `${log.targetType}:${log.targetId?.slice(-8) ?? ""}` : "—"}
                </AdminTableCell>
                <AdminTableCell className="text-xs">{log.adminId.slice(-8)}</AdminTableCell>
                <AdminTableCell className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString("bn-BD")}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </div>
  );
}
