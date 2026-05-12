"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, ShoppingBag, Loader2, Clock, UtensilsCrossed, CreditCard, Printer, CalendarDays, BarChart2, UserCheck } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface HeatmapRow {
  dow: number;
  dowLabel: string;
  hours: { hour: number; count: number }[];
}

interface ReportData {
  monthlyChart: { month: string; revenue: number; orders: number }[];
  bestSellers: { name: string; category: string; qty: number; revenue: number }[];
  categoryRevenue: { category: string; revenue: number }[];
  peakHours: { hour: number; count: number }[];
  heatmapData: HeatmapRow[];
  orderTypeBreakdown: { type: string; count: number }[];
  paymentMethodBreakdown: { method: string; count: number; amount: number }[];
  totalRevenue: number;
  totalVat: number;
  totalService: number;
  totalOrders: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  starter: "স্টার্টার", main: "মেইন", drink: "পানীয়", dessert: "ডেজার্ট",
  snack: "স্ন্যাকস", soup: "স্যুপ", rice: "ভাত/বিরিয়ানি", bread: "রুটি/নান", other: "অন্যান্য",
};
const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "ডাইন ইন", takeaway: "টেকঅ্যাওয়ে", delivery: "ডেলিভারি",
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "ক্যাশ", card: "কার্ড", bkash: "bKash", nagad: "Nagad",
};
const PAY_COLORS: Record<string, string> = {
  cash: "#10B981", card: "#3B82F6", bkash: "#E91E8C", nagad: "#F97316",
};
const MONTH_BN = ["জানু","ফেব্রু","মার্চ","এপ্রি","মে","জুন","জুলা","আগস্ট","সেপ্টে","অক্টো","নভে","ডিসে"];
const PIE_COLORS = ["#EA580C","#D97706","#059669","#3B82F6","#7C3AED","#EC4899","#0891B2","#DC2626"];

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "#EA580C", bg: "var(--c-bg)",
};

function formatMonth(key: string) {
  const [, m] = key.split("-");
  return MONTH_BN[parseInt(m, 10) - 1] ?? key;
}
function formatHour(h: number) {
  if (h === 0) return "রাত ১২";
  if (h < 12) return `সকাল ${h}`;
  if (h === 12) return "দুপুর ১২";
  return `বিকাল ${h - 12}`;
}

function HeatmapCell({ count, max }: { count: number; max: number }) {
  const intensity = max > 0 ? count / max : 0;
  const bg =
    intensity === 0 ? "var(--c-border)" :
    intensity < 0.25 ? "#FDBA74" :
    intensity < 0.5  ? "#F97316" :
    intensity < 0.75 ? "#EA580C" : "#9A3412";
  return (
    <div
      className="w-5 h-5 rounded-sm flex-shrink-0 cursor-default"
      style={{ backgroundColor: bg }}
      title={`${count}টি অর্ডার`}
    />
  );
}

interface DailyClosingOrder {
  id: string; orderNumber?: string; type: string; status: string;
  totalAmount: number; paymentMethod?: string; customerName?: string;
  tableNumber?: number; createdAt: string;
  items: { quantity: number; menuItem: { name: string; price: number } }[];
}
interface DailyClosingData {
  gross: number; vat: number; serviceCharge: number; discount: number;
  net: number; orderCount: number; totalTips?: number;
  paymentMethodBreakdown: { method: string; amount: number }[];
  orderTypeBreakdown: { dineIn: number; takeaway: number; delivery: number };
  orders: DailyClosingOrder[];
}

interface WaiterStat {
  id: string; name: string; jobTitle?: string | null;
  totalOrders: number; totalRevenue: number; totalTips: number;
  avgOrderValue: number; tablesServed: number;
}


function RestaurantReportsPageInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"analytics" | "closing" | "waiters">(
    searchParams.get("tab") === "closing" ? "closing" :
    searchParams.get("tab") === "waiters" ? "waiters" : "analytics"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "closing" || tab === "analytics" || tab === "waiters") setActiveTab(tab as "analytics" | "closing" | "waiters");
  }, [searchParams]);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingDate, setClosingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [closingData, setClosingData] = useState<DailyClosingData | null>(null);
  const [closingLoading, setClosingLoading] = useState(false);
  const [waiterStats, setWaiterStats] = useState<WaiterStat[]>([]);
  const [waiterLoading, setWaiterLoading] = useState(false);
  const [waiterFrom, setWaiterFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [waiterTo, setWaiterTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/reports");
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  const loadClosing = useCallback(async (date: string) => {
    setClosingLoading(true);
    try {
      const res = await fetch(`/api/restaurant/reports?type=closing&date=${date}`);
      if (res.ok) setClosingData(await res.json());
    } catch {}
    setClosingLoading(false);
  }, []);

  const loadWaiters = useCallback(async (from: string, to: string) => {
    setWaiterLoading(true);
    try {
      const res = await fetch(`/api/restaurant/waiters?from=${from}&to=${to}`);
      if (res.ok) setWaiterStats(await res.json());
    } catch {}
    setWaiterLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeTab === "closing") loadClosing(closingDate); }, [activeTab, closingDate, loadClosing]);
  useEffect(() => { if (activeTab === "waiters") loadWaiters(waiterFrom, waiterTo); }, [activeTab, waiterFrom, waiterTo, loadWaiters]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );
  if (!data) return (
    <div className="flex justify-center items-center h-64 text-sm" style={{ color: S.muted }}>
      ডেটা লোড করা যায়নি
    </div>
  );

  const monthlyChartData = data.monthlyChart.map(m => ({ ...m, month: formatMonth(m.month) }));
  const peakHoursFiltered = data.peakHours.filter(h => h.count > 0);
  const topPeakHours = [...data.peakHours]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(h => ({ ...h, label: formatHour(h.hour) }));
  const heatmapMax = data.heatmapData
    ? Math.max(1, ...data.heatmapData.flatMap(r => r.hours.map(h => h.count)))
    : 1;

  const HOUR_LABELS = [0,6,9,12,15,18,21].map(h => ({ h, label: formatHour(h) }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">

      {/* Header + Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>রেস্তোরাঁ রিপোর্ট</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>গত ৬ মাসের বিশ্লেষণ ও দৈনিক ক্লোজিং</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          {([
            ["analytics", "বিশ্লেষণ", BarChart2],
            ["closing", "দৈনিক ক্লোজিং", CalendarDays],
            ["waiters", "ওয়েটার পারফরম্যান্স", UserCheck],
          ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === key ? S.primary : "transparent",
                color: activeTab === key ? "#fff" : S.muted,
              }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Closing Tab */}
      {activeTab === "closing" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <CalendarDays size={15} style={{ color: S.muted }} />
              <input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)}
                className="outline-none text-sm bg-transparent" style={{ color: S.text }} />
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}>
              <Printer size={14} /> প্রিন্ট করুন
            </button>
          </div>

          {closingLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 size={24} className="animate-spin" style={{ color: S.primary }} />
            </div>
          ) : !closingData ? (
            <div className="text-center py-16 text-sm" style={{ color: S.muted }}>ডেটা লোড করা যায়নি</div>
          ) : (
            <>
              {/* Closing Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {[
                  { label: "Gross রাজস্ব",   value: formatBDT(closingData.gross),                 color: S.primary,  bg: "#FFF7ED" },
                  { label: "Net রাজস্ব",     value: formatBDT(closingData.net),                   color: "#059669",  bg: "#ECFDF5" },
                  { label: "মোট অর্ডার",    value: `${closingData.orderCount}টি`,                 color: "#3B82F6",  bg: "#EFF6FF" },
                  { label: "VAT",            value: formatBDT(closingData.vat),                   color: "#7C3AED",  bg: "#F5F3FF" },
                  { label: "সার্ভিস চার্জ", value: formatBDT(closingData.serviceCharge),         color: "#8B5CF6",  bg: "#F5F3FF" },
                  { label: "ডিসকাউন্ট",     value: formatBDT(closingData.discount),              color: "#EF4444",  bg: "#FEF2F2" },
                  { label: "মোট টিপ",        value: formatBDT(closingData.totalTips ?? 0),        color: "#D97706",  bg: "#FFFBEB" },
                ].map(card => (
                  <div key={card.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <p className="text-xs mb-2" style={{ color: S.muted }}>{card.label}</p>
                    <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Payment Method Breakdown */}
                <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>পেমেন্ট পদ্ধতি</h3>
                  {closingData.paymentMethodBreakdown.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: S.muted }}>কোনো ডেটা নেই</p>
                  ) : (
                    <div className="space-y-3">
                      {closingData.paymentMethodBreakdown.sort((a, b) => b.amount - a.amount).map(pm => {
                        const total = closingData.paymentMethodBreakdown.reduce((s, p) => s + p.amount, 0);
                        const pct = total > 0 ? (pm.amount / total) * 100 : 0;
                        const color = PAY_COLORS[pm.method] ?? S.primary;
                        return (
                          <div key={pm.method}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-xs font-semibold" style={{ color: S.text }}>{PAYMENT_METHOD_LABELS[pm.method] ?? pm.method}</span>
                              </div>
                              <span className="text-xs font-bold" style={{ color: S.text }}>{formatBDT(pm.amount)}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: S.border }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Order Type Breakdown */}
                <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>অর্ডার ধরন</h3>
                  {(() => {
                    const otb = closingData.orderTypeBreakdown;
                    const rows = [
                      { type: "dine_in",   label: ORDER_TYPE_LABELS.dine_in,   count: otb.dineIn,   color: S.primary },
                      { type: "takeaway",  label: ORDER_TYPE_LABELS.takeaway,  count: otb.takeaway, color: "#3B82F6" },
                      { type: "delivery",  label: ORDER_TYPE_LABELS.delivery,  count: otb.delivery, color: "#10B981" },
                    ].filter(r => r.count > 0);
                    const total = rows.reduce((s, r) => s + r.count, 0);
                    if (rows.length === 0) return (
                      <p className="text-sm text-center py-8" style={{ color: S.muted }}>কোনো ডেটা নেই</p>
                    );
                    return (
                      <div className="space-y-3">
                        {rows.map(r => {
                          const pct = total > 0 ? (r.count / total) * 100 : 0;
                          return (
                            <div key={r.type}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                                  <span className="text-xs font-semibold" style={{ color: S.text }}>{r.label}</span>
                                </div>
                                <span className="text-xs font-bold" style={{ color: S.text }}>{r.count}টি ({pct.toFixed(0)}%)</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: S.border }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>অর্ডার তালিকা ({closingData.orders.length}টি)</h3>
                </div>
                {closingData.orders.length === 0 ? (
                  <div className="text-center py-12 text-sm" style={{ color: S.muted }}>এই তারিখে কোনো অর্ডার নেই</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: S.bg }}>
                          {["অর্ডার নং", "ধরন", "টেবিল/কাস্টমার", "আইটেম", "মোট", "পেমেন্ট", "সময়"].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {closingData.orders.map((o, idx) => (
                          <tr key={o.id} style={{ borderBottom: idx < closingData.orders.length - 1 ? `1px solid ${S.border}` : "none" }}>
                            <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: S.text }}>{o.orderNumber ?? o.id.slice(-6)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{ORDER_TYPE_LABELS[o.type] ?? o.type}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.text }}>
                              {o.tableNumber ? `T${o.tableNumber}` : (o.customerName ?? "—")}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>
                              {o.items.reduce((s, i) => s + i.quantity, 0)}টি
                            </td>
                            <td className="px-4 py-3 text-xs font-bold" style={{ color: S.primary }}>{formatBDT(o.totalAmount)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{PAYMENT_METHOD_LABELS[o.paymentMethod ?? ""] ?? (o.paymentMethod ?? "—")}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>
                              {new Date(o.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: `2px solid ${S.border}`, backgroundColor: S.bg }}>
                          <td colSpan={4} className="px-4 py-3 text-xs font-bold" style={{ color: S.text }}>সর্বমোট</td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: S.primary }}>{formatBDT(closingData.gross)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Waiter Performance Tab */}
      {activeTab === "waiters" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: S.muted }}>থেকে:</span>
              <input type="date" value={waiterFrom} onChange={e => setWaiterFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: S.muted }}>পর্যন্ত:</span>
              <input type="date" value={waiterTo} onChange={e => setWaiterTo(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
            </div>
          </div>

          {waiterLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 size={24} className="animate-spin" style={{ color: S.primary }} />
            </div>
          ) : waiterStats.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <UserCheck size={36} className="mx-auto mb-3" style={{ color: S.muted }} />
              <p className="text-sm" style={{ color: S.muted }}>এই সময়কালে কোনো ওয়েটার ডেটা নেই</p>
              <p className="text-xs mt-1" style={{ color: S.muted }}>প্রথমে স্টাফ যোগ করুন এবং অর্ডারে ওয়েটার নির্বাচন করুন</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: "মোট ওয়েটার",
                    value: `${waiterStats.length} জন`,
                    color: S.primary, bg: "#FFF7ED",
                    icon: UserCheck,
                  },
                  {
                    label: "মোট অর্ডার পরিবেশিত",
                    value: `${waiterStats.reduce((s, w) => s + w.totalOrders, 0)}টি`,
                    color: "#3B82F6", bg: "#EFF6FF",
                    icon: ShoppingBag,
                  },
                  {
                    label: "মোট রাজস্ব",
                    value: formatBDT(waiterStats.reduce((s, w) => s + w.totalRevenue, 0)),
                    color: "#059669", bg: "#ECFDF5",
                    icon: TrendingUp,
                  },
                  {
                    label: "মোট টিপ",
                    value: formatBDT(waiterStats.reduce((s, w) => s + w.totalTips, 0)),
                    color: "#D97706", bg: "#FFFBEB",
                    icon: CreditCard,
                  },
                ].map(card => (
                  <div key={card.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: card.bg }}>
                      <card.icon size={18} style={{ color: card.color }} />
                    </div>
                    <p className="text-xs mb-1" style={{ color: S.muted }}>{card.label}</p>
                    <p className="text-xl font-bold" style={{ color: S.text }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Waiter Performance Table */}
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: S.border }}>
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>ওয়েটার পারফরম্যান্স র‍্যাংকিং</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: S.bg }}>
                        {["#", "ওয়েটার", "পদ", "অর্ডার", "মোট রাজস্ব", "গড় অর্ডার মূল্য", "টিপ", "টেবিল"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...waiterStats]
                        .sort((a, b) => b.totalRevenue - a.totalRevenue)
                        .map((w, idx) => (
                          <tr key={w.id} style={{ borderBottom: idx < waiterStats.length - 1 ? `1px solid ${S.border}` : "none" }}>
                            <td className="px-4 py-3">
                              <div className="w-7 h-7 rounded-xl text-white flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: idx < 3 ? S.primary : S.muted }}>
                                {idx + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                  style={{ backgroundColor: S.primary }}>
                                  {w.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold" style={{ color: S.text }}>{w.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{w.jobTitle ?? "—"}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: S.text }}>{w.totalOrders}টি</td>
                            <td className="px-4 py-3 text-sm font-bold" style={{ color: S.primary }}>{formatBDT(w.totalRevenue)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{formatBDT(w.avgOrderValue)}</td>
                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#D97706" }}>
                              {w.totalTips > 0 ? formatBDT(w.totalTips) : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{w.tablesServed}টি</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bar Chart - orders per waiter */}
              <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>ওয়েটার ভিত্তিক রাজস্ব তুলনা</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={waiterStats.map(w => ({ name: w.name.split(" ")[0], revenue: w.totalRevenue, tips: w.totalTips, orders: w.totalOrders }))}
                    margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: S.muted }} />
                    <YAxis tick={{ fontSize: 11, fill: S.muted }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number, n: string) => [
                        n === "revenue" ? formatBDT(v) : n === "tips" ? formatBDT(v) : `${v}টি`,
                        n === "revenue" ? "রাজস্ব" : n === "tips" ? "টিপ" : "অর্ডার",
                      ]}
                      contentStyle={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.surface, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" name="revenue" fill={S.primary} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="tips" name="tips" fill="#D97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "মোট রাজস্ব (৬ মাস)",    value: formatBDT(data.totalRevenue),                                                       icon: TrendingUp, color: S.primary,  bg: "#FFF7ED" },
          { label: "মোট অর্ডার",             value: `${data.totalOrders}টি`,                                                             icon: ShoppingBag, color: "#3B82F6", bg: "#EFF6FF" },
          { label: "গড় অর্ডার মূল্য",        value: data.totalOrders > 0 ? formatBDT(data.totalRevenue / data.totalOrders) : "৳০",     icon: TrendingUp, color: "#059669", bg: "#ECFDF5" },
          { label: "VAT + সার্ভিস চার্জ",    value: formatBDT((data.totalVat ?? 0) + (data.totalService ?? 0)),                         icon: CreditCard, color: "#7C3AED", bg: "#F5F3FF" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <p className="text-xs mb-1" style={{ color: S.muted }}>{stat.label}</p>
            <p className="text-xl font-bold" style={{ color: S.text }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>মাসিক রাজস্ব ও অর্ডার</h3>
        {monthlyChartData.every(m => m.revenue === 0) ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: S.muted }}>
            এখনো কোনো বিক্রয় ডেটা নেই
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: S.muted }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: S.muted }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: S.muted }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "revenue" ? formatBDT(value) : `${value}টি`,
                  name === "revenue" ? "রাজস্ব" : "অর্ডার",
                ]}
                contentStyle={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.surface, fontSize: 12 }}
              />
              <Bar yAxisId="left" dataKey="revenue" name="revenue" fill={S.primary} radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders"  name="orders"  fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Category Revenue Pie */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>ক্যাটাগরি অনুযায়ী রাজস্ব</h3>
          {data.categoryRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.categoryRevenue} dataKey="revenue" nameKey="category"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${CATEGORY_LABELS[name] ?? name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {data.categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [formatBDT(v), CATEGORY_LABELS[n] ?? n]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.surface, fontSize: 12 }}
                />
                <Legend formatter={(v: string) => CATEGORY_LABELS[v] ?? v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Type Breakdown */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={15} style={{ color: S.primary }} />
            <h3 className="font-bold text-sm" style={{ color: S.text }}>অর্ডার ধরন বিশ্লেষণ</h3>
          </div>
          {data.orderTypeBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.orderTypeBreakdown} dataKey="count" nameKey="type"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${ORDER_TYPE_LABELS[name] ?? name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {data.orderTypeBreakdown.map((_, i) => (
                    <Cell key={i} fill={[S.primary, "#3B82F6", "#10B981"][i % 3]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [`${v}টি`, ORDER_TYPE_LABELS[n] ?? n]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.surface, fontSize: 12 }}
                />
                <Legend formatter={(v: string) => ORDER_TYPE_LABELS[v] ?? v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Day-of-Week × Hour Heatmap */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} style={{ color: "#D97706" }} />
          <h3 className="font-bold text-sm" style={{ color: S.text }}>
            ব্যস্ত সময় হিটম্যাপ (বার × ঘণ্টা)
          </h3>
        </div>
        {!data.heatmapData || data.heatmapData.every(r => r.hours.every(h => h.count === 0)) ? (
          <div className="flex items-center justify-center h-32 text-sm" style={{ color: S.muted }}>
            কোনো ডেটা নেই
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Hour labels */}
              <div className="flex gap-1.5 mb-1.5 ml-14">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="w-5 text-center" style={{ fontSize: 9, color: S.muted }}>
                    {HOUR_LABELS.find(l => l.h === h)?.label.replace("সকাল ","").replace("বিকাল ","").replace("দুপুর ","").replace("রাত ","") ?? ""}
                  </div>
                ))}
              </div>
              {data.heatmapData.map(row => (
                <div key={row.dow} className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold w-12 text-right flex-shrink-0"
                    style={{ color: S.muted }}>
                    {row.dowLabel}
                  </span>
                  {row.hours.map(h => (
                    <HeatmapCell key={h.hour} count={h.count} max={heatmapMax} />
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 ml-14">
                <span className="text-[10px]" style={{ color: S.muted }}>কম</span>
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <div key={v} className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: v === 0 ? "var(--c-border)" : v < 0.25 ? "#FDBA74" : v < 0.5 ? "#F97316" : v < 0.75 ? "#EA580C" : "#9A3412" }} />
                ))}
                <span className="text-[10px]" style={{ color: S.muted }}>বেশি</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Peak Hours Bar */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} style={{ color: "#D97706" }} />
            <h3 className="font-bold text-sm" style={{ color: S.text }}>শীর্ষ ব্যস্ত সময় (Top 6)</h3>
          </div>
          {peakHoursFiltered.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topPeakHours} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={S.border} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: S.muted }} />
                <YAxis tick={{ fontSize: 10, fill: S.muted }} />
                <Tooltip
                  formatter={(v: number) => [`${v}টি অর্ডার`, "অর্ডার"]}
                  contentStyle={{ borderRadius: 12, border: `1px solid ${S.border}`, backgroundColor: S.surface, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} style={{ color: "#7C3AED" }} />
            <h3 className="font-bold text-sm" style={{ color: S.text }}>পেমেন্ট পদ্ধতি বিশ্লেষণ</h3>
          </div>
          {data.paymentMethodBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
          ) : (
            <div className="space-y-3 mt-2">
              {data.paymentMethodBreakdown
                .sort((a, b) => b.amount - a.amount)
                .map(pm => {
                  const grandTotal = data.paymentMethodBreakdown.reduce((s, p) => s + p.amount, 0);
                  const pct = grandTotal > 0 ? (pm.amount / grandTotal) * 100 : 0;
                  const color = PAY_COLORS[pm.method] ?? S.primary;
                  return (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold" style={{ color: S.text }}>
                            {PAYMENT_METHOD_LABELS[pm.method] ?? pm.method}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                            style={{ backgroundColor: color }}>
                            {pm.count}টি
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold" style={{ color: S.text }}>{formatBDT(pm.amount)}</span>
                          <span className="text-[10px] ml-1" style={{ color: S.muted }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: S.border }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              <div className="pt-2 border-t space-y-1" style={{ borderColor: S.border }}>
                <div className="flex justify-between text-xs" style={{ color: S.muted }}>
                  <span>মোট</span>
                  <span className="font-semibold" style={{ color: S.text }}>
                    {formatBDT(data.paymentMethodBreakdown.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Best Sellers */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>সেরা বিক্রয় আইটেম (Top 10)</h3>
        {data.bestSellers.length === 0 ? (
          <div className="flex items-center justify-center h-44 text-sm" style={{ color: S.muted }}>কোনো ডেটা নেই</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {data.bestSellers.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: idx < 3 ? S.primary : S.muted }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold truncate" style={{ color: S.text }}>{item.name}</p>
                    <p className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: S.primary }}>{item.qty}টি</p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: S.border }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.max(5, (item.qty / (data.bestSellers[0]?.qty ?? 1)) * 100)}%`,
                      backgroundColor: idx < 3 ? S.primary : "#D97706",
                    }} />
                  </div>
                </div>
                <p className="text-xs font-semibold flex-shrink-0" style={{ color: S.muted }}>{formatBDT(item.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>}
    </div>
  );
}

export default function RestaurantReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: "#EA580C" }} />
      </div>
    }>
      <RestaurantReportsPageInner />
    </Suspense>
  );
}
