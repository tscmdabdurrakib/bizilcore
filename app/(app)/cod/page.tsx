"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Wallet, CheckCircle2, AlertCircle, TrendingUp, Download, RefreshCw,
  Check, ChevronDown, ChevronUp, X, Search, Loader2, Package,
} from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import Link from "next/link";
import DatePicker from "@/components/ui/DatePicker";
import { PageShell, StatCard, Card, FilterBar, EmptyState, Badge, Button } from "@/components/ui";

const COURIER_LABELS: Record<string, string> = {
  pathao: "Pathao",
  redx: "RedX",
  paperfly: "Paperfly",
  steadfast: "Steadfast",
  delivery_tiger: "Delivery Tiger",
  other: "Manual",
};

interface CodOrder {
  id: string; status: string; codStatus: string | null;
  codRemitted: boolean; codRemittedAt: string | null;
  courierName: string | null; courierTrackId: string | null;
  courierStatus: string | null; totalAmount: number;
  deliveryCharge: number; createdAt: string;
  courierBookedAt: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
}

interface CourierSummary {
  courier: string; totalOrders: number;
  totalPending: number; totalRemitted: number; overdueAmount: number;
}

interface CodData {
  kpis: { totalPending: number; collectedThisMonth: number; overdueAmount: number; totalOrders: number };
  courierSummary: CourierSummary[];
  orders: CodOrder[];
  total: number;
}

const DATE_PRESETS = [
  { label: "এই সপ্তাহ", value: "week" },
  { label: "এই মাস", value: "month" },
  { label: "গত ৩০ দিন", value: "30days" },
  { label: "কাস্টম", value: "custom" },
];

function getPresetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const toStr = now.toISOString().split("T")[0];
  if (preset === "week") {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return { from: start.toISOString().split("T")[0], to: toStr };
  }
  if (preset === "month") {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: toStr };
  }
  if (preset === "30days") {
    const start = new Date(now.getTime() - 30 * 86400000);
    return { from: start.toISOString().split("T")[0], to: toStr };
  }
  return { from: "", to: "" };
}

function RemittanceModal({
  order, onClose, onConfirm,
}: { order: CodOrder; onClose: () => void; onConfirm: (id: string, date: string) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <Check size={22} className="text-emerald-600" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">রেমিটেন্স তারিখ</h3>
        <p className="text-sm text-gray-500 mb-4">
          অর্ডার <span className="font-bold text-gray-800">#{order.id.slice(-6).toUpperCase()}</span> — {formatBDT(order.totalAmount)}
        </p>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">প্রাপ্তির তারিখ</label>
        <DatePicker
  value={date}
  onChange={v => setDate(v)}
  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 mb-6 bg-gray-50"
/>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
          <button onClick={() => onConfirm(order.id, date)}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}>
            নিশ্চিত করুন
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CodPage() {
  const [data, setData] = useState<CodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [remittedFilter, setRemittedFilter] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [remittanceModal, setRemittanceModal] = useState<CodOrder | null>(null);
  const [collapsedCouriers, setCollapsedCouriers] = useState<Set<string>>(new Set());

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    const range = preset === "custom" ? { from: customFrom, to: customTo } : getPresetRange(preset);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    if (courierFilter) params.set("courier", courierFilter);
    if (remittedFilter !== "") params.set("remitted", remittedFilter);
    try {
      const r = await fetch(`/api/cod?${params}`);
      if (r.ok) setData(await r.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [preset, customFrom, customTo, courierFilter, remittedFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function confirmRemitted(orderId: string, date: string) {
    setRemittanceModal(null);
    setTogglingId(orderId);
    try {
      const r = await fetch(`/api/cod/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codRemitted: true, codRemittedAt: date }),
      });
      if (r.ok) { showToast("success", "রেমিটেন্স পাওয়া গেছে চিহ্নিত ✓"); await fetchData(); }
      else showToast("error", "আপডেট করা যায়নি।");
    } catch { showToast("error", "নেটওয়ার্ক সমস্যা।"); }
    setTogglingId(null);
  }

  async function unmarkRemitted(orderId: string) {
    setTogglingId(orderId);
    try {
      const r = await fetch(`/api/cod/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codRemitted: false }),
      });
      if (r.ok) { showToast("success", "রেমিটেন্স চিহ্ন সরানো হয়েছে"); await fetchData(); }
      else showToast("error", "আপডেট করা যায়নি।");
    } catch { showToast("error", "নেটওয়ার্ক সমস্যা।"); }
    setTogglingId(null);
  }

  function handleToggleClick(order: CodOrder) {
    if (order.codRemitted) unmarkRemitted(order.id);
    else setRemittanceModal(order);
  }

  function exportCsv() {
    setExporting(true);
    const orders = data?.orders ?? [];
    const rows = [
      ["অর্ডার ID", "কাস্টমার", "ফোন", "Courier", "Tracking ID", "পরিমাণ", "শিপ তারিখ", "অর্ডার স্ট্যাটাস", "Remitted?", "Remitted তারিখ"],
      ...orders.map(o => [
        `#${o.id.slice(-6).toUpperCase()}`, o.customer?.name ?? "", o.customer?.phone ?? "",
        COURIER_LABELS[o.courierName ?? ""] ?? o.courierName ?? "", o.courierTrackId ?? "",
        String(o.totalAmount), (o.courierBookedAt ?? o.createdAt).split("T")[0],
        o.status, o.codRemitted ? "হ্যাঁ" : "না",
        o.codRemittedAt ? o.codRemittedAt.split("T")[0] : "",
      ]),
    ];
    const csv = "\uFEFF" + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `cod-reconciliation-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function toggleCourierCollapse(courier: string) {
    setCollapsedCouriers(prev => {
      const next = new Set(prev);
      if (next.has(courier)) next.delete(courier); else next.add(courier);
      return next;
    });
  }

  const kpis = data?.kpis;
  const now = Date.now();
  const sevenDaysMs = 7 * 86400000;

  // Group orders by courier
  const groupedByCourier = useMemo(() => {
    const map = new Map<string, CodOrder[]>();
    const orders = data?.orders ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? orders.filter(o =>
          (o.customer?.name ?? "").toLowerCase().includes(q) ||
          (o.customer?.phone ?? "").includes(q) ||
          (o.courierTrackId ?? "").toLowerCase().includes(q) ||
          o.id.slice(-6).toLowerCase().includes(q)
        )
      : orders;
    for (const o of filtered) {
      const c = o.courierName ?? "other";
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(o);
    }
    return map;
  }, [data, search]);

  const totalFilteredOrders = useMemo(() =>
    Array.from(groupedByCourier.values()).reduce((s, arr) => s + arr.length, 0),
    [groupedByCourier]
  );

  return (
    <PageShell
      title="COD ট্র্যাকার"
      subtitle="Courier রেমিটেন্স পেমেন্ট ট্র্যাক করুন"
      className="max-w-6xl"
      actions={
        <>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchData} loading={loading}>রিফ্রেশ</Button>
          <Button variant="outline" size="sm" icon={Download} onClick={exportCsv} disabled={!data?.orders.length}>CSV</Button>
        </>
      }
      stats={
        loading ? undefined : (
          <>
            <StatCard label="মোট বকেয়া (সকল)" value={kpis ? formatBDT(kpis.totalPending) : "—"} icon={Wallet} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--icon-amber-text)" />
            <StatCard label="এই মাসে রেমিট হয়েছে" value={kpis ? formatBDT(kpis.collectedThisMonth) : "—"} icon={TrendingUp} accent="green" />
            <StatCard label="Overdue (৭+ দিন)" value={kpis ? formatBDT(kpis.overdueAmount) : "—"} icon={AlertCircle} accent="red" iconBg="var(--icon-red-bg)" iconColor="var(--icon-red-text)" />
            <StatCard label="মোট COD অর্ডার" value={kpis ? `${kpis.totalOrders}টি` : "—"} icon={CheckCircle2} accent="green" />
          </>
        )
      }
    >
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl flex items-center gap-2"
          style={{ backgroundColor: toast.type === "success" ? "#059669" : "#DC2626" }}>
          {toast.type === "success" ? <Check size={14} /> : <X size={14} />} {toast.msg}
        </div>
      )}

      {remittanceModal && (
        <RemittanceModal order={remittanceModal} onClose={() => setRemittanceModal(null)} onConfirm={confirmRemitted} />
      )}

      <p className="text-[10px] px-1" style={{ color: "var(--c-text-muted)" }}>* KPI সংখ্যাগুলো সব সময়ের সামগ্রিক (ফিল্টার নির্বিশেষে)</p>

      {data?.courierSummary && data.courierSummary.length > 0 && (
        <Card padding="none">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <h2 className="font-bold text-sm">Courier অনুযায়ী সারাংশ</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.courierSummary.map(c => {
              const total = c.totalPending + c.totalRemitted;
              const remittedPct = total > 0 ? Math.round((c.totalRemitted / total) * 100) : 0;
              return (
                <div key={c.courier} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Package size={14} className="text-emerald-600" />
                      </div>
                      <span className="font-bold text-sm text-gray-800">{COURIER_LABELS[c.courier] ?? c.courier}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{c.totalOrders}টি</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">বকেয়া</span>
                      <span className="font-bold text-amber-600">{formatBDT(c.totalPending)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">পাওয়া গেছে</span>
                      <span className="font-bold text-emerald-700">{formatBDT(c.totalRemitted)}</span>
                    </div>
                    {c.overdueAmount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-red-500">Overdue</span>
                        <span className="font-bold text-red-500">{formatBDT(c.overdueAmount)}</span>
                      </div>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${remittedPct}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{remittedPct}% রেমিট হয়েছে</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card padding="md">
        <FilterBar
          tabs={DATE_PRESETS.map((p) => ({ key: p.value, label: p.label }))}
          activeTab={preset}
          onTabChange={setPreset}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="কাস্টমার, ট্র্যাকিং ID..."
          filters={
            <>
              {preset === "custom" && (
                <div className="flex items-center gap-2">
                  <DatePicker value={customFrom} onChange={setCustomFrom} className="h-9 px-3 rounded-xl border text-xs" />
                  <span style={{ color: "var(--c-text-muted)" }}>→</span>
                  <DatePicker value={customTo} onChange={setCustomTo} className="h-9 px-3 rounded-xl border text-xs" />
                </div>
              )}
              <select value={courierFilter} onChange={e => setCourierFilter(e.target.value)} className="h-9 px-3 rounded-xl border text-xs min-w-[120px]" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                <option value="">সব Courier</option>
                {Object.entries(COURIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={remittedFilter} onChange={e => setRemittedFilter(e.target.value)} className="h-9 px-3 rounded-xl border text-xs min-w-[100px]" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                <option value="">সব স্ট্যাটাস</option>
                <option value="0">বকেয়া</option>
                <option value="1">পাওয়া গেছে</option>
              </select>
            </>
          }
        />
      </Card>

      {loading ? (
        <Card padding="md" className="space-y-3 animate-pulse">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: "var(--shell-surface)" }} />)}
        </Card>
      ) : totalFilteredOrders === 0 ? (
        <EmptyState icon={Wallet} title="কোনো COD অর্ডার পাওয়া যায়নি" description="ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন" />
      ) : (
        <div className="space-y-3">
          {Array.from(groupedByCourier.entries()).map(([courierKey, orders]) => {
            const collapsed = collapsedCouriers.has(courierKey);
            const groupPending  = orders.filter(o => !o.codRemitted).reduce((s, o) => s + o.totalAmount, 0);
            const groupRemitted = orders.filter(o =>  o.codRemitted).reduce((s, o) => s + o.totalAmount, 0);
            const overdueCount  = orders.filter(o => !o.codRemitted && o.status === "delivered" && new Date(o.courierBookedAt ?? o.createdAt).getTime() < now - sevenDaysMs).length;

            return (
              <Card key={courierKey} padding="none">
                {/* Courier header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors"
                  onClick={() => toggleCourierCollapse(courierKey)}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-emerald-600" />
                    </div>
                    <span className="font-bold text-sm">{COURIER_LABELS[courierKey] ?? courierKey}</span>
                    <Badge variant="success">{orders.length}টি অর্ডার</Badge>
                    {groupPending > 0 && (
                      <Badge variant="warning">বকেয়া {formatBDT(groupPending)}</Badge>
                    )}
                    {groupRemitted > 0 && (
                      <Badge variant="success">পাওয়া {formatBDT(groupRemitted)}</Badge>
                    )}
                    {overdueCount > 0 && (
                      <Badge variant="danger">{overdueCount}টি Overdue</Badge>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                    {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  </div>
                </button>

                {!collapsed && (
                  <div className="border-t border-gray-50 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {["অর্ডার", "কাস্টমার", "Tracking ID", "পরিমাণ", "শিপ তারিখ", "ডেলিভারি", "রেমিটেন্স"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map(order => {
                          const isOverdue = !order.codRemitted
                            && order.status === "delivered"
                            && new Date(order.courierBookedAt ?? order.createdAt).getTime() < now - sevenDaysMs;
                          const shipDate = order.courierBookedAt ?? order.createdAt;

                          return (
                            <tr key={order.id} className="hover:bg-gray-50/40 transition-colors">
                              <td className="px-4 py-3">
                                <Link href={`/orders/${order.id}`}
                                  className="font-mono font-black text-emerald-700 hover:underline">
                                  #{order.id.slice(-6).toUpperCase()}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-800">{order.customer?.name ?? "—"}</div>
                                {order.customer?.phone && <div className="text-xs text-gray-400">{order.customer.phone}</div>}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-gray-500">{order.courierTrackId ?? "—"}</td>
                              <td className="px-4 py-3">
                                <span className="font-black text-gray-900">{formatBDT(order.totalAmount)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-gray-500">{formatBanglaDate(shipDate)}</span>
                                {isOverdue && (
                                  <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-600">
                                    <AlertCircle size={8} /> Overdue
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge status={order.status === "delivered" ? "delivered" : "shipped"}>
                                  {order.status === "delivered" ? "ডেলিভারড" : "পাঠানো"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleToggleClick(order)}
                                  disabled={togglingId === order.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-60"
                                  style={{
                                    backgroundColor: order.codRemitted ? "#ECFDF5" : "transparent",
                                    borderColor: order.codRemitted ? "#6EE7B7" : "#E5E7EB",
                                    color: order.codRemitted ? "#059669" : "#6B7280",
                                  }}>
                                  {togglingId === order.id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : order.codRemitted ? <Check size={12} /> : null}
                                  {order.codRemitted ? "পাওয়া গেছে" : "বকেয়া"}
                                </button>
                                {order.codRemitted && order.codRemittedAt && (
                                  <div className="text-[10px] text-gray-400 mt-0.5 pl-1">
                                    {order.codRemittedAt.split("T")[0]}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* Group footer */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">{orders.length}টি অর্ডার</span>
                      <div className="flex gap-4">
                        {groupPending > 0 && <span className="font-bold text-amber-700">বকেয়া: {formatBDT(groupPending)}</span>}
                        {groupRemitted > 0 && <span className="font-bold text-emerald-700">পাওয়া: {formatBDT(groupRemitted)}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          <Card padding="md" className="flex items-center justify-between">
            <span className="text-sm text-gray-500">সর্বমোট {totalFilteredOrders}টি অর্ডার</span>
            <div className="flex gap-5">
              <div className="text-right">
                <p className="text-[10px] text-gray-400">বকেয়া</p>
                <p className="font-black text-amber-700">{formatBDT(Array.from(groupedByCourier.values()).flat().filter(o => !o.codRemitted).reduce((s, o) => s + o.totalAmount, 0))}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">পাওয়া গেছে</p>
                <p className="font-black text-emerald-700">{formatBDT(Array.from(groupedByCourier.values()).flat().filter(o => o.codRemitted).reduce((s, o) => s + o.totalAmount, 0))}</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
