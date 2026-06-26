"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import AdminCard from "../components/AdminCard";
import StatsCard from "../components/StatsCard";
import { TrendingUp, TrendingDown, Users, ThumbsDown } from "lucide-react";

interface NpsData {
  npsScore: number;
  recentNps: number;
  total: number;
  breakdown: { promoters: number; passives: number; detractors: number };
  trend: { month: string; avgScore: number; count: number }[];
  lowScores: {
    id: string;
    score: number;
    reason: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string; shop: { name: string; businessType: string | null } | null };
  }[];
}

const BREAKDOWN_COLORS = ["#10B981", "#F59E0B", "#EF4444"];

export default function AdminNpsPage() {
  const [data, setData] = useState<NpsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/nps")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const breakdownChart = data ? [
    { name: "Promoters (9-10)", value: data.breakdown.promoters },
    { name: "Passives (7-8)", value: data.breakdown.passives },
    { name: "Detractors (0-6)", value: data.breakdown.detractors },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">NPS Dashboard</h2>
        <p className="text-sm text-gray-500">Net Promoter Score ও user satisfaction</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="Overall NPS" value={data.npsScore} icon={TrendingUp} color="emerald" />
            <StatsCard title="Last 30 Days NPS" value={data.recentNps} icon={TrendingDown} color="blue" />
            <StatsCard title="Total Responses" value={data.total} icon={Users} color="purple" />
            <StatsCard title="Detractors" value={data.breakdown.detractors} icon={ThumbsDown} color="amber" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard title="Score Breakdown" hover={false}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value">
                      {breakdownChart.map((_, i) => (
                        <Cell key={i} fill={BREAKDOWN_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>

            <AdminCard title="Monthly Avg Score" hover={false}>
              {data.trend.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">কোনো data নেই</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="avgScore" fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </AdminCard>
          </div>

          <AdminCard title="Recent Detractors (Score ≤ 6)" hover={false}>
            {data.lowScores.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">কোনো detractor নেই</p>
            ) : (
              <div className="space-y-3">
                {data.lowScores.map((s) => (
                  <div key={s.id} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{s.user.name}</span>
                      <span className="text-lg font-bold text-red-600">{s.score}/10</span>
                    </div>
                    <p className="text-xs text-gray-500">{s.user.email}</p>
                    {s.reason && <p className="text-sm mt-2 text-gray-700">{s.reason}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(s.createdAt).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </>
      )}
    </div>
  );
}
