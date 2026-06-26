"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Phone, Trash2, Loader2 } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";
import StatsCard from "../components/StatsCard";

interface Overview {
  totalReports: number;
  totalBlacklist: number;
  highRiskOrders: number;
  flaggedOrders: number;
  crossShopCount: number;
  crossShopPhones: { phone: string; shopCount: number }[];
}

interface BlacklistEntry {
  id: string;
  phone: string;
  reason: string | null;
  blockedBy: string;
  createdAt: string;
  shop: { id: string; name: string };
}

interface ReportEntry {
  id: string;
  phone: string;
  reason: string | null;
  createdAt: string;
  shop: { id: string; name: string };
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "blacklist", label: "Blacklist" },
  { key: "reports", label: "Reports" },
];

export default function AdminFraudPage() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/fraud?tab=${tab}`);
      if (!res.ok) return;
      const data = await res.json();
      if (tab === "overview") setOverview(data);
      else if (tab === "blacklist") setBlacklist(data.entries ?? []);
      else setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function removeBlacklist(id: string) {
    if (!confirm("Blacklist entry সরাবেন?")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/fraud?id=${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Fraud & Fake Orders</h2>
        <p className="text-sm text-gray-500">Cross-shop fraud patterns ও phone blacklist</p>
      </div>

      <AdminPillTabs tabs={TABS} active={tab} onChange={setTab} />

      {loading ? (
        <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
      ) : tab === "overview" && overview ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="Fake Reports" value={overview.totalReports} icon={ShieldAlert} color="amber" />
            <StatsCard title="Blacklisted Phones" value={overview.totalBlacklist} icon={Phone} color="purple" />
            <StatsCard title="High Risk Orders" value={overview.highRiskOrders} icon={ShieldAlert} color="purple" />
            <StatsCard title="Cross-Shop Flags" value={overview.crossShopCount} icon={Phone} color="blue" />
          </div>
          <AdminCard title="Cross-Shop Flagged Phones (2+ shops)" hover={false}>
            {overview.crossShopPhones.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">কোনো cross-shop flag নেই</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4">Phone</th>
                      <th className="pb-2">Shops Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.crossShopPhones.map((p) => (
                      <tr key={p.phone} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 font-mono">{p.phone}</td>
                        <td className="py-2.5">{p.shopCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </>
      ) : tab === "blacklist" ? (
        <AdminCard hover={false}>
          {blacklist.length === 0 ? (
            <p className="py-12 text-center text-gray-500">Blacklist empty</p>
          ) : (
            <div className="space-y-2">
              {blacklist.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <p className="font-mono font-semibold text-sm">{e.phone}</p>
                    <p className="text-xs text-gray-500">{e.shop.name} · {e.blockedBy}</p>
                    {e.reason && <p className="text-xs text-gray-600 mt-0.5">{e.reason}</p>}
                  </div>
                  <button onClick={() => removeBlacklist(e.id)} disabled={busy === e.id}
                    className="p-2 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    {busy === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} className="text-red-600" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      ) : (
        <AdminCard hover={false}>
          {reports.length === 0 ? (
            <p className="py-12 text-center text-gray-500">কোনো report নেই</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-sm">{r.phone}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("bn-BD")}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.shop.name}</p>
                  {r.reason && <p className="text-sm text-gray-700 mt-1">{r.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
}
