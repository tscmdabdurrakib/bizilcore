"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, RefreshCw, Store } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";
import AdminTable, { AdminTableRow, AdminTableCell } from "../components/AdminTable";
import PlanSetModal from "../components/PlanSetModal";
import { PLAN_COLOR, SHOP_STATUS_STYLE, ShopRow } from "../components/constants";

export default function AdminShopsPage() {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planModal, setPlanModal] = useState<{ userId: string; name: string; currentPlan: string } | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ shopId: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`/api/admin/shops?${params}`);
    if (r.ok) {
      const d = await r.json();
      setShops(d.shops);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function handleStatusChange(shopId: string, shopStatus: string, reason?: string) {
    setActionLoading(shopId);
    await fetch(`/api/admin/shops/${shopId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopStatus, statusReason: reason }),
    });
    setActionLoading(null);
    setSuspendModal(null);
    setSuspendReason("");
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shop বা owner খুঁজুন..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <button onClick={load} className="rounded-xl border border-gray-200 p-2.5 hover:bg-white active:scale-95">
          <RefreshCw size={16} className="text-gray-500" />
        </button>
      </div>

      <AdminPillTabs
        tabs={[
          { key: "", label: "সব" },
          { key: "active", label: "Active" },
          { key: "suspended", label: "Suspended" },
          { key: "trial", label: "Trial" },
        ]}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-200" />)}
        </div>
      ) : shops.length === 0 ? (
        <AdminCard hover={false}>
          <div className="py-12 text-center">
            <Store size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">কোনো shop নেই</p>
          </div>
        </AdminCard>
      ) : (
        <AdminTable headers={["Shop", "Owner", "Status", "Plan", "Products", "Customers", "Actions"]}>
          {shops.map((shop) => {
            const plan = shop.user.subscription?.plan ?? "free";
            const planStyle = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
            const shopStatus = shop.shopStatus ?? "active";
            const statusStyle = SHOP_STATUS_STYLE[shopStatus] ?? SHOP_STATUS_STYLE.active;
            return (
              <AdminTableRow key={shop.id}>
                <AdminTableCell>
                  <p className="font-medium text-gray-900">{shop.name}</p>
                  <p className="text-xs text-gray-500">{shop.id.slice(-8)}</p>
                </AdminTableCell>
                <AdminTableCell>
                  <p className="text-sm">{shop.user.name}</p>
                  <p className="text-xs text-gray-500">{shop.user.email}</p>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                    {statusStyle.label}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium uppercase" style={{ backgroundColor: planStyle.bg, color: planStyle.text }}>
                    {plan}
                  </span>
                </AdminTableCell>
                <AdminTableCell>{shop._count.products}</AdminTableCell>
                <AdminTableCell>{shop._count.customers}</AdminTableCell>
                <AdminTableCell>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPlanModal({ userId: shop.user.id, name: shop.user.name, currentPlan: plan })}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 active:scale-95"
                    >
                      Plan
                    </button>
                    {shopStatus !== "suspended" ? (
                      <button
                        onClick={() => setSuspendModal({ shopId: shop.id, name: shop.name })}
                        disabled={actionLoading === shop.id}
                        className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 active:scale-95"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(shop.id, "active")}
                        disabled={actionLoading === shop.id}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 active:scale-95"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </AdminTable>
      )}

      {planModal && (
        <PlanSetModal
          userId={planModal.userId}
          name={planModal.name}
          currentPlan={planModal.currentPlan}
          onClose={() => setPlanModal(null)}
          onSuccess={load}
        />
      )}

      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900">Shop Suspend করুন</h3>
            <p className="mb-3 mt-1 text-xs text-gray-500">{suspendModal.name}</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="কারণ (ঐচ্ছিক)"
              rows={3}
              className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setSuspendModal(null)} className="flex-1 rounded-xl border py-2.5 text-sm">বাতিল</button>
              <button
                onClick={() => handleStatusChange(suspendModal.shopId, "suspended", suspendReason)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white"
              >
                Suspend করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
