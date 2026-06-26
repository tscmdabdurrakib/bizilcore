"use client";

import { useEffect, useState } from "react";
import { Eye, BarChart3, AlertTriangle, Trophy } from "lucide-react";
import StatsCard from "@/app/admin/components/StatsCard";

interface ActivityStats {
  activeUsersToday: number;
  errorCountToday: number;
  topFeatureThisWeek: { name: string; label: string; count: number } | null;
  mostActiveShop: { id: string; name: string; count: number } | null;
}

export default function ActivityStatsCards() {
  const [stats, setStats] = useState<ActivityStats | null>(null);

  useEffect(() => {
    fetch("/api/admin/activity/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatsCard
        title="Today's Active Users"
        value={stats.activeUsersToday}
        icon={Eye}
        color="blue"
      />
      <StatsCard
        title="Most Used Feature (Month)"
        value={stats.topFeatureThisWeek?.label ?? "—"}
        icon={BarChart3}
        color="purple"
      />
      <StatsCard
        title="Error Count Today"
        value={stats.errorCountToday}
        icon={AlertTriangle}
        color="amber"
      />
      <StatsCard
        title="Most Active Shop Today"
        value={stats.mostActiveShop?.name ?? "—"}
        icon={Trophy}
        color="emerald"
      />
    </div>
  );
}
