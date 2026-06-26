"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import StatsCard from "../components/StatsCard";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";
import { Users, Store, TrendingUp, DollarSign } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface DataPoint {
  period: string;
  count: number;
  total?: number;
}

interface ExtendedData {
  mrr: number;
  activePaidUsers: number;
  businessTypeAdoption: { type: string; count: number }[];
  onboardingFunnel: {
    totalUsers: number;
    onboarded: number;
    steps: { key: string; label: string; completed: number }[];
  };
  revenueSplit: { subscription: number; sms: number };
  mrrTrend: { month: string; revenue: number; payments: number }[];
}

const BIZ_COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function AdminAnalyticsPage() {
  const [metric, setMetric] = useState("signups");
  const [granularity, setGranularity] = useState("day");
  const [data, setData] = useState<DataPoint[]>([]);
  const [extended, setExtended] = useState<ExtendedData | null>(null);
  const [stats, setStats] = useState<{ signupsToday?: number; signupsThisWeek?: number; activeShops?: number; inactiveShops?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/analytics?metric=${metric}&granularity=${granularity}`).then((r) => r.ok ? r.json() : null),
      fetch("/api/admin/stats").then((r) => r.ok ? r.json() : null),
      fetch("/api/admin/analytics/extended").then((r) => r.ok ? r.json() : null),
    ]).then(([analytics, s, ext]) => {
      if (analytics?.data) setData(analytics.data);
      if (s) setStats(s);
      if (ext) setExtended(ext);
      setLoading(false);
    });
  }, [metric, granularity]);

  const chartData = data.map((d) => ({
    label: new Date(d.period).toLocaleDateString("bn-BD", {
      month: granularity === "month" ? "short" : "numeric",
      day: granularity !== "month" ? "numeric" : undefined,
    }),
    value: metric === "revenue" ? (d.total ?? 0) : d.count,
  }));

  const funnelData = extended?.onboardingFunnel.steps.map((s) => ({
    name: s.label.slice(0, 20),
    completed: s.completed,
    pct: extended.onboardingFunnel.totalUsers > 0
      ? Math.round((s.completed / extended.onboardingFunnel.totalUsers) * 100)
      : 0,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="আজ Signups" value={stats?.signupsToday ?? 0} icon={Users} color="blue" />
        <StatsCard title="এই সপ্তাহ Signups" value={stats?.signupsThisWeek ?? 0} icon={TrendingUp} color="emerald" />
        <StatsCard title="Active Shops" value={stats?.activeShops ?? 0} icon={Store} color="purple" />
        <StatsCard title="MRR" value={extended ? `৳${extended.mrr.toLocaleString("bn-BD")}` : "—"} icon={DollarSign} color="amber" />
      </div>

      {extended && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard title="Paid Subscribers" value={extended.activePaidUsers} icon={Users} color="emerald" />
          <StatsCard title="Onboarded Users" value={extended.onboardingFunnel.onboarded} icon={Users} color="blue" />
          <StatsCard title="Sub Revenue" value={formatBDT(extended.revenueSplit.subscription)} icon={DollarSign} color="purple" />
          <StatsCard title="SMS Revenue" value={formatBDT(extended.revenueSplit.sms)} icon={DollarSign} color="amber" />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <AdminPillTabs
          tabs={[
            { key: "signups", label: "Signups" },
            { key: "orders", label: "Orders" },
            { key: "revenue", label: "Revenue" },
          ]}
          active={metric}
          onChange={setMetric}
        />
        <AdminPillTabs
          tabs={[
            { key: "day", label: "Daily" },
            { key: "week", label: "Weekly" },
            { key: "month", label: "Monthly" },
          ]}
          active={granularity}
          onChange={setGranularity}
        />
      </div>

      <AdminCard title="Growth Chart" subtitle={`${metric} over time`} hover={false}>
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ) : chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">কোনো data নেই</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => metric === "revenue" ? `৳${v}` : String(v)} />
                <Tooltip formatter={(v) => [metric === "revenue" ? formatBDT(Number(v)) : v, metric]} />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </AdminCard>

      {extended && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AdminCard title="Business Type Adoption" hover={false}>
            {extended.businessTypeAdoption.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">কোনো data নেই</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={extended.businessTypeAdoption.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count">
                      {extended.businessTypeAdoption.slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={BIZ_COLORS[i % BIZ_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </AdminCard>

          <AdminCard title="Onboarding Funnel" hover={false}>
            {funnelData.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">কোনো data নেই</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, _n, p) => [`${v} (${(p.payload as { pct: number }).pct}%)`, "Completed"]} />
                    <Bar dataKey="completed" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </AdminCard>

          <AdminCard title="Monthly Subscription Revenue" hover={false} className="lg:col-span-2">
            {extended.mrrTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">কোনো data নেই</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={extended.mrrTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${v}`} />
                    <Tooltip formatter={(v) => [formatBDT(Number(v)), "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </AdminCard>
        </div>
      )}
    </div>
  );
}
