"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Edit2, Check } from "lucide-react";

const PLAN_COLOR: Record<string, { bg: string; text: string }> = {
  free:     { bg: "#F0F0F0", text: "#666" },
  pro:      { bg: "#E1F5EE", text: "#0F6E56" },
  business: { bg: "#FFF3DC", text: "#EF9F27" },
};

interface AffiliateRow {
  id: string;
  slug: string;
  status: string;
  commissionRate: number;
  totalClicks: number;
  totalSignups: number;
  totalEarnings: number;
  pendingPayout: number;
  bkashNumber: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; createdAt: string; subscription: { plan: string } | null };
  payouts: { id: string; amount: number; status: string; paidAt: string | null; createdAt: string }[];
  _count: { clicks: number };
}

interface Totals {
  totalAffiliates: number;
  pending: number;
  approved: number;
  totalEarnings: number;
  pendingPayouts: number;
  totalSignups: number;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: "Pending",  color: "#D97706", bg: "#FEF3C7", icon: Clock },
  approved: { label: "Approved", color: "#059669", bg: "#ECFDF5", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEE2E2", icon: XCircle },
};

export default function AdminAffiliatesPage() {
  const [data, setData] = useState<{ affiliates: AffiliateRow[]; totals: Totals } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function load() {
    setLoading(true);
    fetch(`/api/admin/affiliates?status=${filterStatus}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filterStatus]);

  async function doAction(action: string, affiliateId: string, extra: Record<string, unknown> = {}) {
    setActionLoading(affiliateId + action);
    const res = await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, affiliateId, ...extra }),
    });
    const d = await res.json();
    setActionLoading(null);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return false; }
    showToast("success", action === "approve" ? "Approved!" : action === "reject" ? "Rejected!" : "আপডেট হয়েছে");
    load();
    return true;
  }

  const totals = data?.totals;
  const affiliates = data?.affiliates ?? [];

  return (
    <div className="space-y-6">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">সব affiliates দেখুন, approve/reject করুন, payout manage করুন</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "#E5E7EB" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Users,      label: "মোট Affiliates", value: totals.totalAffiliates, color: "#3B82F6" },
            { icon: Clock,      label: "Pending",         value: totals.pending,         color: "#D97706" },
            { icon: CheckCircle,label: "Approved",        value: totals.approved,        color: "#059669" },
            { icon: TrendingUp, label: "মোট Signups",    value: totals.totalSignups,    color: "#7C3AED" },
            { icon: DollarSign, label: "মোট Earnings",   value: `৳${totals.totalEarnings.toFixed(0)}`, color: "#0F6E56" },
            { icon: DollarSign, label: "Pending Payout",  value: `৳${totals.pendingPayouts.toFixed(0)}`, color: "#DC2626" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} style={{ color: s.color }} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: filterStatus === s ? "#1A1A18" : "#F0F0EE",
              color: filterStatus === s ? "#fff" : "#555",
            }}>
            {s === "all" ? "সব" : s === "pending" ? "Pending" : s === "approved" ? "Approved" : "Rejected"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Affiliate</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Plan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Clicks</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Signups</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Earnings</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Pending</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Commission</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">bKash</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400 text-sm">লোড হচ্ছে...</td></tr>
              )}
              {!loading && affiliates.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-gray-400 text-sm">কোনো affiliate নেই</td></tr>
              )}
              {affiliates.map(aff => {
                const si = STATUS_INFO[aff.status] ?? STATUS_INFO.pending;
                const planInfo = PLAN_COLOR[aff.user.subscription?.plan ?? "free"];
                const isActioning = actionLoading?.startsWith(aff.id);
                return (
                  <tr key={aff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{aff.user.name}</p>
                      <p className="text-xs text-gray-400">{aff.user.email}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">/{aff.slug}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: si.bg, color: si.color }}>
                        <si.icon size={11} /> {si.label}
                      </span>
                      {aff.rejectedReason && <p className="text-[10px] text-red-400 mt-1">{aff.rejectedReason}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: planInfo.bg, color: planInfo.text }}>
                        {aff.user.subscription?.plan ?? "free"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium">{aff.totalClicks}</td>
                    <td className="px-5 py-4 text-right font-medium">{aff.totalSignups}</td>
                    <td className="px-5 py-4 text-right font-semibold text-green-700">৳{aff.totalEarnings.toFixed(0)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-orange-600">৳{aff.pendingPayout.toFixed(0)}</td>
                    <td className="px-5 py-4">
                      {editingRate === aff.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={rateValue} onChange={e => setRateValue(e.target.value)}
                            className="w-16 h-7 px-2 rounded border text-xs" step="0.01" min="0" max="1" />
                          <button onClick={async () => {
                            const ok = await doAction("setCommission", aff.id, { commissionRate: parseFloat(rateValue) });
                            if (ok) setEditingRate(null);
                          }} className="p-1 rounded bg-green-100 text-green-700"><Check size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingRate(aff.id); setRateValue(String(aff.commissionRate)); }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
                          {(aff.commissionRate * 100).toFixed(0)}% <Edit2 size={10} />
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-mono">{aff.bkashNumber ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        {aff.status === "pending" && (
                          <>
                            <button onClick={() => doAction("approve", aff.id)} disabled={!!isActioning}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#059669" }}>
                              Approve
                            </button>
                            <button onClick={() => setRejectingId(aff.id)} disabled={!!isActioning}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
                              Reject
                            </button>
                          </>
                        )}
                        {aff.status === "approved" && (
                          <button onClick={() => doAction("reject", aff.id, { reason: "Suspended by admin" })} disabled={!!isActioning}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#6B7280" }}>
                            Suspend
                          </button>
                        )}
                        {aff.status === "rejected" && (
                          <button onClick={() => doAction("approve", aff.id)} disabled={!!isActioning}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#059669" }}>
                            Re-approve
                          </button>
                        )}

                        {aff.payouts.filter(p => p.status === "requested").map(payout => (
                          <button key={payout.id} onClick={() => doAction("markPaid", aff.id, { payoutId: payout.id })} disabled={!!isActioning}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#7C3AED" }}>
                            Pay ৳{payout.amount.toFixed(0)}
                          </button>
                        ))}
                      </div>

                      {rejectingId === aff.id && (
                        <div className="mt-2 flex gap-1">
                          <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="কারণ লিখুন" className="flex-1 h-7 px-2 rounded border text-xs" />
                          <button onClick={async () => {
                            const ok = await doAction("reject", aff.id, { reason: rejectReason });
                            if (ok) { setRejectingId(null); setRejectReason(""); }
                          }} className="px-2 py-1 rounded bg-red-600 text-white text-xs">OK</button>
                          <button onClick={() => setRejectingId(null)} className="px-2 py-1 rounded bg-gray-200 text-xs">✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
