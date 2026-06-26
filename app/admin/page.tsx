"use client";

import { useEffect, useState } from "react";
import { Users, Store, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import StatsCard from "./components/StatsCard";
import SubscriptionDonut from "./components/SubscriptionDonut";
import RecentUsers from "./components/RecentUsers";
import PendingPayments from "./components/PendingPayments";
import TopShopsList from "./components/TopShopsList";
import CronJobCard from "./components/CronJobCard";
import PaymentNoteModal from "./components/PaymentNoteModal";
import RecentActivityWidget from "./activity/components/RecentActivityWidget";
import { AdminStats, Payment } from "./components/constants";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<(AdminStats & { pendingPaymentsPreview?: Payment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<{ paymentId: string; action: "approve" | "reject" } | null>(null);

  async function loadStats() {
    setLoading(true);
    const r = await fetch("/api/admin/stats");
    if (r.ok) setStats(await r.json());
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, []);

  async function handlePaymentAction(paymentId: string, action: "approve" | "reject", note?: string) {
    await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: note }),
    });
    setNoteModal(null);
    loadStats();
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-gray-200" />)}
        </div>
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!stats) return <p className="py-20 text-center text-gray-500">ডেটা লোড করা যায়নি।</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button onClick={loadStats} className="rounded-xl border border-gray-200 p-2 transition hover:bg-white active:scale-95">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="মোট Users" value={stats.totalUsers} icon={Users} color="blue" trend={stats.userTrendWeek !== undefined ? { value: stats.userTrendWeek, label: "this week" } : undefined} />
        <StatsCard title="মোট Shops" value={stats.totalShops} icon={Store} color="purple" />
        <StatsCard title="মোট Orders" value={stats.totalOrders} icon={ShoppingCart} color="amber" />
        <StatsCard title="মোট Revenue" value={formatBDT(stats.totalRevenue)} icon={TrendingUp} color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SubscriptionDonut planCounts={stats.planCounts} />
        </div>
        <div className="lg:col-span-2">
          <RecentUsers users={stats.recentUsers ?? []} />
        </div>
      </div>

      <CronJobCard lastRun={stats.lastCronRun} compact />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PendingPayments
          payments={stats.pendingPaymentsPreview ?? []}
          onApprove={(id) => setNoteModal({ paymentId: id, action: "approve" })}
          onReject={(id) => setNoteModal({ paymentId: id, action: "reject" })}
        />
        <TopShopsList shops={stats.topShopsByOrders ?? []} />
      </div>

      <RecentActivityWidget />

      {noteModal && (
        <PaymentNoteModal
          paymentId={noteModal.paymentId}
          action={noteModal.action}
          onClose={() => setNoteModal(null)}
          onConfirm={handlePaymentAction}
        />
      )}
    </div>
  );
}
