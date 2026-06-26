"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import AdminCard from "../../components/AdminCard";
import AdminTable, { AdminTableRow, AdminTableCell } from "../../components/AdminTable";

interface MessageLog {
  id: string;
  toPhone: string;
  message: string;
  channel: string;
  smsType: string | null;
  status: string;
  sentAt: string;
  user: { id: string; name: string; email: string };
}

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/sms/message-logs?page=${page}`);
    if (r.ok) {
      const d = await r.json();
      setLogs(d.logs);
      setPages(d.pages);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/admin/sms-credits" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> SMS Credits
        </Link>
        <button onClick={load} className="rounded-xl border border-gray-200 p-2 active:scale-95">
          <RefreshCw size={14} className="text-gray-500" />
        </button>
      </div>

      <AdminCard title="SMS Usage Logs" subtitle="All outbound SMS messages" hover={false}>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">লোড হচ্ছে...</p>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">কোনো log নেই</p>
        ) : (
          <>
            <AdminTable headers={["User", "Phone", "Type", "Status", "Sent At"]}>
              {logs.map((log) => (
                <AdminTableRow key={log.id}>
                  <AdminTableCell>
                    <p className="text-sm font-medium">{log.user.name}</p>
                    <p className="text-xs text-gray-500">{log.user.email}</p>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">{log.toPhone}</AdminTableCell>
                  <AdminTableCell className="text-xs uppercase">{log.smsType ?? log.channel}</AdminTableCell>
                  <AdminTableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${log.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {log.status}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="text-xs text-gray-500">
                    {new Date(log.sentAt).toLocaleString("bn-BD")}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
            {pages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 text-xs text-gray-500">{page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </AdminCard>
    </div>
  );
}
