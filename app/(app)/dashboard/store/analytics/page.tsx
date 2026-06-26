"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart2, Eye, ShoppingBag, TrendingUp, ArrowUpRight, Package, Loader2 } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import { PageShell, StatCard, Card, Tabs, EmptyState, SectionTitle, Button } from "@/components/ui";

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

const RANGE_TABS = [
  { key: "7d", label: "৭ দিন" },
  { key: "30d", label: "৩০ দিন" },
  { key: "custom", label: "কাস্টম" },
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

  return (
    <PageShell
      title="স্টোর অ্যানালিটিক্স"
      subtitle="আপনার স্টোরের পারফরম্যান্স দেখুন"
      className="max-w-4xl"
      actions={
        <div className="flex flex-col gap-2 items-end">
          <Tabs tabs={RANGE_TABS} active={range} onChange={(k) => setRange(k as RangeMode)} />
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <DatePicker
                value={customFrom}
                onChange={v => setCustomFrom(v)}
                className="text-xs rounded-lg border px-2 py-1.5 outline-none"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
                max={customTo}
              />
              <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>—</span>
              <DatePicker
                value={customTo}
                onChange={v => setCustomTo(v)}
                className="text-xs rounded-lg border px-2 py-1.5 outline-none"
                style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}
                min={customFrom}
                max={toInputDate(today)}
              />
              <Button size="sm" onClick={fetchAnalytics} disabled={!customFrom || !customTo}>দেখুন</Button>
            </div>
          )}
        </div>
      }
      stats={
        <>
          <StatCard label="মোট ভিজিট" value={loading ? "—" : (analytics?.totalVisits?.toLocaleString("en-IN") ?? "—")} icon={Eye} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--icon-blue-text)" />
          <StatCard label="মোট অর্ডার" value={loading ? "—" : (analytics?.totalOrders?.toLocaleString("en-IN") ?? "—")} icon={ShoppingBag} accent="green" />
          <StatCard label="মোট রাজস্ব" value={loading ? "—" : (analytics ? formatBDT(analytics.totalRevenue) : "—")} icon={TrendingUp} accent="green" />
          <StatCard label="গড় অর্ডার মূল্য" value={loading ? "—" : (analytics ? formatBDT(analytics.aov) : "—")} icon={ArrowUpRight} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--icon-amber-text)" />
          <StatCard label="রূপান্তর হার" value={loading ? "—" : (analytics ? `${analytics.conversionRate.toFixed(1)}%` : "—")} icon={BarChart2} accent="blue" iconBg="var(--icon-purple-bg)" iconColor="var(--icon-purple-text)" />
        </>
      }
    >
      <Card>
        <SectionTitle title="দৈনিক ভিজিট ও অর্ডার" className="mb-4" />
        {loading
          ? <div className="h-36 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-primary)" }} />
            </div>
          : <SVGLineChart data={analytics?.daily ?? []} />
        }
      </Card>

      <Card>
        <SectionTitle title="শীর্ষ পণ্য (বিক্রয় অনুযায়ী)" action={{ label: "সব পণ্য →", href: "/store/products" }} />
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg animate-pulse" style={{ backgroundColor: "var(--c-border)" }} />
                <div className="flex-1 h-4 rounded animate-pulse" style={{ backgroundColor: "var(--c-border)" }} />
              </div>
            ))}
          </div>
        ) : !analytics?.topProducts?.length ? (
          <EmptyState icon={Package} title="এখনো কোনো অর্ডার নেই" className="py-8" />
        ) : (
          <div className="space-y-2">
            {analytics.topProducts.map((p, i) => {
              const maxQty = analytics.topProducts[0]?.qty ?? 1;
              const pct = Math.round((p.qty / Math.max(maxQty, 1)) * 100);
              return (
                <div key={p.productId ?? i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{p.name}</p>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{p.qty}টি</span>
                        <span className="text-[11px] font-semibold" style={{ color: "var(--c-text)" }}>{formatBDT(p.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-border)" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "var(--c-primary)" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
