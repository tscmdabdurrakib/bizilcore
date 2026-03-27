"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, CheckCircle, AlertCircle, TrendingUp, Download, RefreshCw, Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import Link from "next/link";

const COURIER_LABELS: Record<string, string> = {
  pathao: "Pathao",
  ecourier: "eCourier",
  steadfast: "Steadfast",
  redx: "RedX",
  sundarban: "Sundarban (SCS)",
  paperfly: "Paperfly",
  carrybee: "CarryBee",
  delivery_tiger: "Delivery Tiger",
  karatoa: "Karatoa (KCS)",
  janani: "Janani Express",
  sheba: "Sheba Delivery",
  sa_paribahan: "SA Paribahan",
  other: "Manual",
};

interface CodOrder {
  id: string;
  status: string;
  codStatus: string | null;
  codRemitted: boolean;
  codRemittedAt: string | null;
  courierName: string | null;
  courierTrackId: string | null;
  courierStatus: string | null;
  totalAmount: number;
  deliveryCharge: number;
  createdAt: string;
  courierBookedAt: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
}

interface CourierSummary {
  courier: string;
  totalOrders: number;
  totalPending: number;
  totalRemitted: number;
  overdueAmount: number;
}

interface CodData {
  kpis: {
    totalPending: number;
    collectedThisMonth: number;
    overdueAmount: number;
    totalOrders: number;
  };
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
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    return { from: start.toISOString().split("T")[0], to: toStr };
  }
  if (preset === "month") {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to: toStr };
  }
  if (preset === "30days") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: start.toISOString().split("T")[0], to: toStr };
  }
  return { from: "", to: "" };
}

interface RemittanceModalProps {
  order: CodOrder;
  onClose: () => void;
  onConfirm: (orderId: string, date: string) => void;
  S: Record<string, string>;
}

function RemittanceModal({ order, onClose, onConfirm, S }: RemittanceModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-xs w-full" style={{ backgroundColor: "var(--c-surface-raised)" }} onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-base mb-1" style={{ color: S.text }}>রেমিটেন্স তারিখ নির্ধারণ</h3>
        <p className="text-xs mb-4" style={{ color: S.muted }}>
          অর্ডার #{order.id.slice(-6).toUpperCase()} — {formatBDT(order.totalAmount)}
        </p>
        <label className="block text-xs font-medium mb-1.5" style={{ color: S.text }}>প্রাপ্তির তারিখ</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border text-sm outline-none mb-4"
          style={{ borderColor: S.border, color: S.text }} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
          <button onClick={() => onConfirm(order.id, date)}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "var(--c-primary)" }}>নিশ্চিত করুন</button>
        </div>
      </div>
    </div>
  );
}

export default function CodPage() {
  const S = {
    surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
    secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)", primary: "var(--c-primary)",
    bg: "var(--c-bg)",
  };

  const [data, setData] = useState<CodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [remittedFilter, setRemittedFilter] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [remittanceModal, setRemittanceModal] = useState<CodOrder | null>(null);
  const [collapsedCouriers, setCollapsedCouriers] = useState<Set<string>>(new Set());

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
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

  function handleToggleClick(order: CodOrder) {
    if (order.codRemitted) {
      unmarkRemitted(order.id);
    } else {
      setRemittanceModal(order);
    }
  }

  async function confirmRemitted(orderId: string, date: string) {
    setRemittanceModal(null);
    setTogglingId(orderId);
    try {
      const r = await fetch(`/api/cod/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codRemitted: true, codRemittedAt: date }),
      });
      if (r.ok) {
        showToast("success", "রেমিটেন্স পাওয়া গেছে চিহ্নিত ✓");
        await fetchData();
      } else {
        showToast("error", "আপডেট করা যায়নি।");
      }
    } catch {
      showToast("error", "নেটওয়ার্ক সমস্যা।");
    }
    setTogglingId(null);
  }

  async function unmarkRemitted(orderId: string) {
    setTogglingId(orderId);
    try {
      const r = await fetch(`/api/cod/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codRemitted: false }),
      });
      if (r.ok) {
        showToast("success", "রেমিটেন্স চিহ্ন সরানো হয়েছে");
        await fetchData();
      } else {
        showToast("error", "আপডেট করা যায়নি।");
      }
    } catch {
      showToast("error", "নেটওয়ার্ক সমস্যা।");
    }
    setTogglingId(null);
  }

  function exportCsv() {
    setExporting(true);
    const orders = data?.orders ?? [];
    const rows = [
      ["অর্ডার ID", "কাস্টমার", "ফোন", "Courier", "Tracking ID", "পরিমাণ", "শিপ তারিখ", "অর্ডার স্ট্যাটাস", "Remitted?", "Remitted তারিখ"],
      ...orders.map(o => [
        `#${o.id.slice(-6).toUpperCase()}`,
        o.customer?.name ?? "",
        o.customer?.phone ?? "",
        COURIER_LABELS[o.courierName ?? ""] ?? o.courierName ?? "",
        o.courierTrackId ?? "",
        String(o.totalAmount),
        (o.courierBookedAt ?? o.createdAt).split("T")[0],
        o.status,
        o.codRemitted ? "হ্যাঁ" : "না",
        o.codRemittedAt ? o.codRemittedAt.split("T")[0] : "",
      ]),
    ];
    const BOM = "\uFEFF";
    const csv = BOM + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cod-reconciliation-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function toggleCourierCollapse(courier: string) {
    setCollapsedCouriers(prev => {
      const next = new Set(prev);
      if (next.has(courier)) next.delete(courier);
      else next.add(courier);
      return next;
    });
  }

  const kpis = data?.kpis;

  const groupedByCourier: Map<string, CodOrder[]> = new Map();
  for (const order of (data?.orders ?? [])) {
    const c = order.courierName ?? "other";
    if (!groupedByCourier.has(c)) groupedByCourier.set(c, []);
    groupedByCourier.get(c)!.push(order);
  }

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-6xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {remittanceModal && (
        <RemittanceModal
          order={remittanceModal}
          onClose={() => setRemittanceModal(null)}
          onConfirm={confirmRemitted}
          S={S}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
            <Wallet size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>COD ট্র্যাকার</h1>
            <p className="text-xs" style={{ color: S.muted }}>Courier রেমিটেন্স পেমেন্ট ট্র্যাক করুন</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-60"
            style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
          <button onClick={exportCsv} disabled={exporting || !data?.orders.length}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium disabled:opacity-60"
            style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}>
            <Download size={14} />
            {exporting ? "..." : "CSV Export"}
          </button>
        </div>
      </div>

      {/* KPI Bar — all-time / all COD orders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {[
          { label: "মোট বকেয়া (সকল)", value: kpis ? formatBDT(kpis.totalPending) : "—", color: "#EF9F27", bg: "#FFF3DC", icon: Wallet },
          { label: "এই মাসে রেমিট হয়েছে", value: kpis ? formatBDT(kpis.collectedThisMonth) : "—", color: "var(--c-primary)", bg: "var(--c-primary-light)", icon: TrendingUp },
          { label: "Overdue (৭+ দিন)", value: kpis ? formatBDT(kpis.overdueAmount) : "—", color: "#E24B4A", bg: "#FFE8E8", icon: AlertCircle },
          { label: "মোট COD অর্ডার", value: kpis ? kpis.totalOrders.toString() : "—", color: "var(--c-primary)", bg: "var(--c-primary-light)", icon: CheckCircle },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.bg }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <p className="text-xs leading-tight" style={{ color: S.muted }}>{kpi.label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] mb-5 px-1" style={{ color: S.muted }}>* KPI সংখ্যাগুলো সব সময়ের সামগ্রিক (ফিল্টার নির্বিশেষে)</p>

      {/* Courier Summary Cards */}
      {data?.courierSummary && data.courierSummary.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: S.text }}>Courier অনুযায়ী সারাংশ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.courierSummary.map(c => (
              <div key={c.courier} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm" style={{ color: S.text }}>
                    {COURIER_LABELS[c.courier] ?? c.courier}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>
                    {c.totalOrders} অর্ডার
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: S.muted }}>বকেয়া</span>
                    <span className="font-semibold" style={{ color: "#EF9F27" }}>{formatBDT(c.totalPending)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: S.muted }}>পাওয়া গেছে</span>
                    <span className="font-semibold" style={{ color: "var(--c-primary)" }}>{formatBDT(c.totalRemitted)}</span>
                  </div>
                  {c.overdueAmount > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: "#E24B4A" }}>Overdue</span>
                      <span className="font-semibold" style={{ color: "#E24B4A" }}>{formatBDT(c.overdueAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border p-4 mb-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1.5 flex-wrap">
            {DATE_PRESETS.map(p => (
              <button key={p.value} onClick={() => setPreset(p.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{
                  backgroundColor: preset === p.value ? S.primary : "transparent",
                  color: preset === p.value ? "#fff" : S.secondary,
                  border: `1px solid ${preset === p.value ? S.primary : S.border}`,
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="h-8 px-2 rounded-xl border text-xs outline-none"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              <span style={{ color: S.muted }}>→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="h-8 px-2 rounded-xl border text-xs outline-none"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            </div>
          )}

          <select value={courierFilter} onChange={e => setCourierFilter(e.target.value)}
            className="h-8 px-2 rounded-xl border text-xs outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
            <option value="">সব Courier</option>
            {Object.entries(COURIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <select value={remittedFilter} onChange={e => setRemittedFilter(e.target.value)}
            className="h-8 px-2 rounded-xl border text-xs outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
            <option value="">সব স্ট্যাটাস</option>
            <option value="0">বকেয়া</option>
            <option value="1">পাওয়া গেছে</option>
          </select>
        </div>
      </div>

      {/* Orders Table — grouped by courier */}
      {loading ? (
        <div className="rounded-2xl border p-6 space-y-3 animate-pulse" style={{ borderColor: S.border }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      ) : !data?.orders.length ? (
        <div className="rounded-2xl border text-center py-16" style={{ borderColor: S.border, backgroundColor: S.surface }}>
          <Wallet size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm" style={{ color: S.muted }}>এই সময়ে কোনো COD অর্ডার নেই।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedByCourier.entries()).map(([courierKey, orders]) => {
            const collapsed = collapsedCouriers.has(courierKey);
            const groupPending = orders.filter(o => !o.codRemitted).reduce((s, o) => s + o.totalAmount, 0);
            const groupRemitted = orders.filter(o => o.codRemitted).reduce((s, o) => s + o.totalAmount, 0);
            return (
              <div key={courierKey} className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3 border-b transition-colors hover:bg-gray-50"
                  style={{ backgroundColor: S.bg, borderColor: S.border }}
                  onClick={() => toggleCourierCollapse(courierKey)}>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm" style={{ color: S.text }}>
                      {COURIER_LABELS[courierKey] ?? courierKey}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>
                      {orders.length} অর্ডার
                    </span>
                    {groupPending > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#FFF3DC", color: "#EF9F27" }}>
                        বকেয়া {formatBDT(groupPending)}
                      </span>
                    )}
                    {groupRemitted > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>
                        পাওয়া {formatBDT(groupRemitted)}
                      </span>
                    )}
                  </div>
                  {collapsed ? <ChevronDown size={16} style={{ color: S.muted }} /> : <ChevronUp size={16} style={{ color: S.muted }} />}
                </button>

                {!collapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                          {["অর্ডার", "কাস্টমার", "Tracking ID", "পরিমাণ", "শিপ তারিখ", "স্ট্যাটাস", "রেমিটেন্স"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, i) => {
                          const isOverdue = !order.codRemitted
                            && order.status === "delivered"
                            && new Date(order.courierBookedAt ?? order.createdAt).getTime() < now - sevenDaysMs;
                          const shipDate = order.courierBookedAt ?? order.createdAt;
                          return (
                            <tr key={order.id} style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: i % 2 === 0 ? S.surface : S.bg }}>
                              <td className="px-4 py-3">
                                <Link href={`/orders/${order.id}`} className="font-mono font-semibold hover:underline" style={{ color: S.primary }}>
                                  #{order.id.slice(-6).toUpperCase()}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                <div style={{ color: S.text }}>{order.customer?.name ?? "—"}</div>
                                {order.customer?.phone && <div className="text-xs" style={{ color: S.muted }}>{order.customer.phone}</div>}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono" style={{ color: S.muted }}>
                                {order.courierTrackId ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold" style={{ color: S.text }}>{formatBDT(order.totalAmount)}</span>
                              </td>
                              <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>
                                {formatBanglaDate(shipDate)}
                                {isOverdue && (
                                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#FFE8E8", color: "#E24B4A" }}>
                                    Overdue
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: order.status === "delivered" ? "var(--c-primary-light)" : "#FFF3DC",
                                    color: order.status === "delivered" ? "var(--c-primary)" : "#EF9F27",
                                  }}>
                                  {order.status === "delivered" ? "ডেলিভারড" : "পাঠানো"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleToggleClick(order)}
                                  disabled={togglingId === order.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-60"
                                  style={{
                                    backgroundColor: order.codRemitted ? "var(--c-primary-light)" : "transparent",
                                    borderColor: order.codRemitted ? "var(--c-primary)" : S.border,
                                    color: order.codRemitted ? "var(--c-primary)" : S.secondary,
                                  }}>
                                  {togglingId === order.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : order.codRemitted ? (
                                    <Check size={12} />
                                  ) : null}
                                  {order.codRemitted ? "পাওয়া গেছে" : "বকেয়া"}
                                </button>
                                {order.codRemitted && order.codRemittedAt && (
                                  <div className="text-[10px] mt-0.5" style={{ color: S.muted }}>
                                    {order.codRemittedAt.split("T")[0]}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
