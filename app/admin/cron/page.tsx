"use client";

import { useEffect, useState, useCallback } from "react";
import CronJobCard from "../components/CronJobCard";
import AdminCard from "../components/AdminCard";

const CRON_JOBS = [
  { jobName: "check-subscriptions", title: "Subscription Check", subtitle: "Expired subscriptions-কে Free plan-এ ফিরিয়ে আনে", schedule: "Every 6 hours" },
  { jobName: "referrer-rewards", title: "Referrer Rewards", subtitle: "7+ দিন পুরানো referral-এ reward দেয়", schedule: "Daily 2:30 AM" },
  { jobName: "refresh-social-tokens", title: "Refresh Social Tokens", subtitle: "Facebook/social token refresh", schedule: "Daily 3:00 AM" },
  { jobName: "abandoned-cart", title: "Abandoned Cart", subtitle: "Abandoned cart reminders", schedule: "Every 30 min" },
  { jobName: "publish-posts", title: "Publish Posts", subtitle: "Scheduled social posts publish", schedule: "Every 15 min" },
  { jobName: "daily-backup", title: "Daily Backup", subtitle: "Database backup", schedule: "Daily 6:00 PM UTC" },
  { jobName: "invoice-overdue", title: "Invoice Overdue", subtitle: "Mark overdue invoices", schedule: "Daily 1:00 AM" },
  { jobName: "recurring-invoices", title: "Recurring Invoices", subtitle: "Generate recurring invoices", schedule: "Daily 2:00 AM" },
  { jobName: "recurring-expenses", title: "Recurring Expenses", subtitle: "Process recurring expenses", schedule: "Daily 2:00 AM" },
  { jobName: "po-reminders", title: "PO Reminders", subtitle: "Purchase order reminders", schedule: "Daily 4:00 AM" },
  { jobName: "sms-drip", title: "SMS Drip", subtitle: "Onboarding SMS drip campaign", schedule: "Manual / scheduled" },
];

interface CronLog {
  id: string;
  jobName: string;
  result: unknown;
  ranAt: string;
}

interface JobSummary {
  jobName: string;
  _max: { ranAt: string | null };
  _count: { _all: number };
}

export default function AdminCronPage() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [jobSummary, setJobSummary] = useState<JobSummary[]>([]);
  const [filterJob, setFilterJob] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterJob) params.set("jobName", filterJob);
      const r = await fetch(`/api/admin/cron/log?${params}`);
      if (r.ok) {
        const d = await r.json();
        setLogs(d.logs);
        setJobSummary(d.jobSummary ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filterJob]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function lastRunFor(jobName: string) {
    const entry = jobSummary.find((j) => j.jobName === jobName);
    return entry?._max?.ranAt ?? null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Cron Jobs</h2>
        <p className="text-sm text-gray-500">Scheduled jobs manually trigger করুন</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CRON_JOBS.map((job) => (
          <CronJobCard
            key={job.jobName}
            {...job}
            lastRun={lastRunFor(job.jobName)}
            onComplete={loadLogs}
          />
        ))}
      </div>

      <AdminCard title="Run History" subtitle="CronRunLog" hover={false}>
        <div className="mb-4">
          <select value={filterJob} onChange={(e) => setFilterJob(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500">
            <option value="">All jobs</option>
            {CRON_JOBS.map((j) => (
              <option key={j.jobName} value={j.jobName}>{j.title}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">কোনো log নেই</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Job</th>
                  <th className="pb-2 pr-4">Ran At</th>
                  <th className="pb-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4 font-mono text-xs">{log.jobName}</td>
                    <td className="py-2.5 pr-4 text-xs whitespace-nowrap">
                      {new Date(log.ranAt).toLocaleString("bn-BD")}
                    </td>
                    <td className="py-2.5 text-xs text-gray-600 max-w-md truncate">
                      {log.result ? JSON.stringify(log.result).slice(0, 100) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
