"use client";

import { useEffect, useState } from "react";
import { Gift, Users, Clock, CheckCircle, Loader2 } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";
import StatsCard from "../components/StatsCard";

interface ReferralRow {
  id: string;
  reward: string;
  rewardGiven: boolean;
  createdAt: string;
  referrer: { id: string; name: string; email: string; subscription: { plan: string } | null };
  referred: { id: string; name: string; email: string; createdAt: string };
}

interface LeaderRow {
  id: string;
  code: string;
  uses: number;
  earnings: number;
  user: { id: string; name: string; email: string };
}

const FILTERS = [
  { key: "all", label: "সব" },
  { key: "pending", label: "Pending Reward" },
  { key: "rewarded", label: "Rewarded" },
];

export default function AdminReferralsPage() {
  const [filter, setFilter] = useState("all");
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [stats, setStats] = useState({ totalReferrals: 0, pendingRewards: 0, rewardedCount: 0, totalCodes: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals);
        setLeaderboard(data.leaderboard);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleReward(id: string, rewardGiven: boolean) {
    setBusy(id);
    const res = await fetch("/api/admin/referrals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralId: id, rewardGiven }),
    });
    setBusy(null);
    if (res.ok) load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Referral Program</h2>
        <p className="text-sm text-gray-500">Peer referral tracking ও reward oversight</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total Referrals" value={stats.totalReferrals} icon={Users} color="blue" />
        <StatsCard title="Pending Rewards" value={stats.pendingRewards} icon={Clock} color="amber" />
        <StatsCard title="Rewarded" value={stats.rewardedCount} icon={CheckCircle} color="emerald" />
        <StatsCard title="Referral Codes" value={stats.totalCodes} icon={Gift} color="purple" />
      </div>

      <AdminCard title="Top Referrers" hover={false}>
        {leaderboard.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">কোনো referral code নেই</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Uses</th>
                  <th className="pb-2">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium">{l.user.name}</p>
                      <p className="text-xs text-gray-500">{l.user.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-emerald-700">{l.code}</td>
                    <td className="py-2.5 pr-4">{l.uses}</td>
                    <td className="py-2.5">৳{l.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminPillTabs tabs={FILTERS} active={filter} onChange={setFilter} />

      {loading ? (
        <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
      ) : referrals.length === 0 ? (
        <AdminCard hover={false}>
          <p className="py-12 text-center text-gray-500">কোনো referral নেই</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <AdminCard key={r.id} hover={false} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{r.referrer.name}</span>
                    <span className="text-gray-400 mx-2">→</span>
                    <span className="font-semibold">{r.referred.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.referrer.email} referred {r.referred.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("bn-BD")} · Reward: {r.reward}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.rewardGiven ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {r.rewardGiven ? "Rewarded" : "Pending"}
                  </span>
                  {!r.rewardGiven && (
                    <button onClick={() => toggleReward(r.id, true)} disabled={busy === r.id}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white disabled:opacity-50">
                      {busy === r.id ? <Loader2 size={12} className="animate-spin" /> : "Mark Rewarded"}
                    </button>
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
