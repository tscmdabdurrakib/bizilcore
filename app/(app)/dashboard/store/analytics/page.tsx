"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { BarChart2, Eye, ShoppingBag, TrendingUp, ArrowUpRight, Package } from "lucide-react";

interface DailyPoint { date: string; visits: number; orders: number; revenue: number; }
interface TopProduct { productId: string | null; name: string; qty: number; revenue: number; }
interface Analytics {
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  aov: number;
  conversionRate: number;
  daily: DailyPoint[];
  topProducts: TopProduct[];
}

type RangeMode = "7d" | "30d" | "custom";

const RANGE_OPTIONS: { label: string; value: RangeMode }[] = [
  { label: "৭ দিন", value: "7d" },
  { label: "৩০ দিন", value: "30d" },
  { label: "কাস্টম", value: "custom" },
];

function formatBDT(n: number) {
  return "৳" + Math.round(n).toLocaleString("en-IN");
}

function toInputDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function SVGLineChart({ data, height = 140 }: { data: DailyPoint[]; height?: number }) {
  if (!data.length) return <div className="flex items-center justify-center h-36 text-xs text-gray-400">কোনো ডেটা নেই</div>;

  const maxVisits = Math.max(...data.map(d => d.visits), 1);
  const maxOrders = Math.max(...data.map(d => d.orders), 1);
  const W = 600;
  const H = height;
  const pad = { top: 10, right: 10, bottom: 28, left: 36 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const xPos = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const yVisits = (v: number) => pad.top + chartH - (v / maxVisits) * chartH;
  const yOrders = (v: number) => pad.top + chartH - (v / maxOrders) * chartH;

  const visitPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yVisits(d.visits)}`).join(" ");
  const orderPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yOrders(d.orders)}`).join(" ");

  const visitFill = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yVisits(d.visits)}`).join(" ")
    + ` L${xPos(data.length - 1)},${pad.top + chartH} L${pad.left},${pad.top + chartH} Z`;
  const orderFill = data.map((d, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yOrders(d.orders)}`).join(" ")
    + ` L${xPos(data.length - 1)},${pad.top + chartH} L${pad.left},${pad.top + chartH} Z`;

  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount }, (_, i) => Math.round((maxVisits / (tickCount - 1)) * i));
  const showEvery = Math.ceil(data.length / 7);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
        <defs>
          <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F6E56" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0F6E56" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => {
          const y = pad.top + chartH - (v / maxVisits) * chartH;
          return (
            <g key={i}>
              <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
              <text x={pad.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.5">{v}</text>
            </g>
          );
        })}

        <path d={visitFill} fill="url(#visitGrad)" />
        <path d={orderFill} fill="url(#orderGrad)" />
        <path d={visitPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />
        <path d={orderPath} fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinejoin="round" />

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xPos(i)} cy={yVisits(d.visits)} r="3" fill="#3B82F6" />
            <circle cx={xPos(i)} cy={yOrders(d.orders)} r="3" fill="#0F6E56" />
            {i % showEvery === 0 && (
              <text x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">
                {formatDate(d.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex gap-4 mt-1 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-blue-500" />
          <span className="text-[10px] opacity-60">ভিজিট</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full" style={{ backgroundColor: "#0F6E56" }} />
          <span className="text-[10px] opacity-60">অর্ডার</span>
        </div>
      </div>
    </div>
  );
}

export default function StoreAnalyticsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [range, setRange] = useState<RangeMode>("30d");
  const [customFrom, setCustomFrom] = useState(toInputDate(thirtyDaysAgo));
  const [customTo, setCustomTo] = useState(toInputDate(today));
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
    primaryLight: "var(--c-primary-light)",
  };

  const fetchAnalytics = useCallback(() => {
    setLoading(true);
    let url = `/api/dashboard/store-analytics?range=${range}`;
    if (range === "custom" && customFrom && customTo) {
      url = `/api/dashboard/store-analytics?from=${customFrom}&to=${customTo}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (range !== "custom") {
      fetchAnalytics();
    }
  }, [range, fetchAnalytics]);

  const stats = [
    {
      icon: Eye, label: "মোট ভিজিট", value: analytics?.totalVisits?.toLocaleString("en-IN") ?? "—",
      color: "var(--icon-blue-text)", bg: "var(--icon-blue-bg)",
    },
    {
      icon: ShoppingBag, label: "মোট অর্ডার", value: analytics?.totalOrders?.toLocaleString("en-IN") ?? "—",
      color: "var(--bg-success-text)", bg: "var(--bg-success-soft)",
    },
    {
      icon: TrendingUp, label: "মোট রাজস্ব", value: analytics ? formatBDT(analytics.totalRevenue) : "—",
      color: "var(--icon-green-text)", bg: "var(--icon-green-bg)",
    },
    {
      icon: ArrowUpRight, label: "গড় অর্ডার মূল্য", value: analytics ? formatBDT(analytics.aov) : "—",
      color: "var(--icon-amber-text)", bg: "var(--icon-amber-bg)",
    },
    {
      icon: BarChart2, label: "রূপান্তর হার", value: analytics ? `${analytics.conversionRate.toFixed(1)}%` : "—",
      color: "var(--icon-purple-text)", bg: "var(--icon-purple-bg)",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0F6E56,#0A5442)" }}>
            <BarChart2 size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>স্টোর অ্যানালিটিক্স</h1>
            <p className="text-xs" style={{ color: S.muted }}>আপনার স্টোরের পারফরম্যান্স দেখুন</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-1 rounded-xl p-1 border self-start" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            {RANGE_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setRange(o.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: range === o.value ? S.primary : "transparent",
                  color: range === o.value ? "#fff" : S.muted,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

          {range === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={e => setCustomFrom(e.target.value)}
                className="text-xs rounded-lg border px-2 py-1.5 outline-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              />
              <span className="text-xs" style={{ color: S.muted }}>—</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={toInputDate(today)}
                onChange={e => setCustomTo(e.target.value)}
                className="text-xs rounded-lg border px-2 py-1.5 outline-none"
                style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
              />
              <button
                onClick={fetchAnalytics}
                disabled={!customFrom || !customTo}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: S.primary }}
              >
                দেখুন
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-[11px] mb-1" style={{ color: S.muted }}>{stat.label}</p>
            <p className="text-lg font-bold" style={{ color: S.text }}>
              {loading
                ? <span className="inline-block w-12 h-4 rounded animate-pulse" style={{ backgroundColor: S.border }} />
                : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: S.text }}>দৈনিক ভিজিট ও অর্ডার</h2>
        {loading
          ? <div className="h-36 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: S.primary, borderTopColor: "transparent" }} />
            </div>
          : <SVGLineChart data={analytics?.daily ?? []} />
        }
      </div>

      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm" style={{ color: S.text }}>শীর্ষ পণ্য (বিক্রয় অনুযায়ী)</h2>
          <Link href="/store/products" className="text-xs font-semibold" style={{ color: S.primary }}>সব পণ্য →</Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg animate-pulse" style={{ backgroundColor: S.border }} />
                <div className="flex-1 h-4 rounded animate-pulse" style={{ backgroundColor: S.border }} />
              </div>
            ))}
          </div>
        ) : !analytics?.topProducts?.length ? (
          <div className="text-center py-8">
            <Package size={32} className="mx-auto mb-2 opacity-30" style={{ color: S.muted }} />
            <p className="text-sm" style={{ color: S.muted }}>এখনো কোনো অর্ডার নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {analytics.topProducts.map((p, i) => {
              const maxQty = analytics.topProducts[0]?.qty ?? 1;
              const pct = Math.round((p.qty / Math.max(maxQty, 1)) * 100);
              return (
                <div key={p.productId ?? i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: S.primaryLight, color: S.primary }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate" style={{ color: S.text }}>{p.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[11px]" style={{ color: S.muted }}>{p.qty}টি</span>
                        <span className="text-[11px] font-semibold" style={{ color: S.text }}>{formatBDT(p.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: S.border }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: S.primary }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
