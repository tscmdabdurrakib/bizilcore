"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Users, Truck, Repeat, Wallet, Crown } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { PageShell, StatCard, Card, Badge, EmptyState, SectionTitle } from "@/components/ui";

interface ProductRow { name: string; units: number; revenue: number; profit: number; }
interface OrderRow { id: string; revenue: number; profit: number; date: string; customer: string | null; }
interface CustomerRow { name: string; phone: string | null; orders: number; spend: number; recencyDays: number; segment: string; }
interface CourierRow { courier: string; total: number; delivered: number; returned: number; successRate: number; }

interface Insights {
  days: number;
  summary: { totalRevenue: number; totalProfit: number; margin: number; repeatRate: number; avgLTV: number; buyers: number };
  profit: { topProfitable: ProductRow[]; lossMaking: ProductRow[]; topOrders: OrderRow[] };
  rfm: { segments: Record<string, number>; topCustomers: CustomerRow[] };
  courierPerformance: CourierRow[];
}

const SEGMENT_LABEL: Record<string, { label: string; variant: "success" | "info" | "warning" | "danger" | "default" | "purple" }> = {
  champions: { label: "চ্যাম্পিয়ন", variant: "success" },
  loyal:     { label: "অনুগত", variant: "info" },
  new:       { label: "নতুন", variant: "warning" },
  at_risk:   { label: "ঝুঁকিতে", variant: "warning" },
  lost:      { label: "হারানো", variant: "danger" },
  others:    { label: "অন্যান্য", variant: "default" },
};

const COURIER_LABEL: Record<string, string> = {
  pathao: "Pathao", steadfast: "Steadfast", redx: "RedX", paperfly: "Paperfly", delivery_tiger: "Delivery Tiger", other: "ম্যানুয়াল",
};

export default function StoreInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(365);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/store/insights?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <PageShell
      title="অ্যাডভান্সড ইনসাইট"
      subtitle="প্রকৃত মুনাফা, কাস্টমার ভ্যালু ও কুরিয়ার পারফরম্যান্স"
      className="max-w-6xl"
      actions={
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-2 rounded-xl border text-xs font-medium" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" }}>
          <option value={30}>গত ৩০ দিন</option>
          <option value={90}>গত ৯০ দিন</option>
          <option value={180}>গত ১৮০ দিন</option>
          <option value={365}>গত ১ বছর</option>
        </select>
      }
      stats={data && !loading ? (
        <>
          <StatCard label="মোট আয়" value={formatBDT(data.summary.totalRevenue)} icon={Wallet} accent="blue" />
          <StatCard label="মোট মুনাফা" value={formatBDT(data.summary.totalProfit)} icon={TrendingUp} accent="green" />
          <StatCard label="মার্জিন" value={`${data.summary.margin}%`} icon={TrendingUp} accent="gold" />
          <StatCard label="রিপিট রেট" value={`${data.summary.repeatRate}%`} icon={Repeat} accent="blue" iconBg="var(--icon-purple-bg)" iconColor="var(--icon-purple-text)" />
          <StatCard label="গড় LTV" value={formatBDT(data.summary.avgLTV)} icon={Crown} accent="gold" />
          <StatCard label="ক্রেতা" value={data.summary.buyers} icon={Users} accent="blue" />
        </>
      ) : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
      ) : !data ? (
        <EmptyState icon={TrendingUp} title="ডেটা পাওয়া যায়নি।" />
      ) : (
        <div className="space-y-6">
          <Card>
            <SectionTitle title="কাস্টমার সেগমেন্ট (RFM)" className="mb-3" />
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(data.rfm.segments).map(([seg, count]) => {
                const cfg = SEGMENT_LABEL[seg] ?? SEGMENT_LABEL.others;
                return (
                  <Badge key={seg} variant={cfg.variant}>{cfg.label}: {count}</Badge>
                );
              })}
            </div>
            {data.rfm.topCustomers.length > 0 && (
              <InsightsTable head={["কাস্টমার", "অর্ডার", "মোট খরচ", "সর্বশেষ", "সেগমেন্ট"]}>
                {data.rfm.topCustomers.map((c, i) => {
                  const cfg = SEGMENT_LABEL[c.segment] ?? SEGMENT_LABEL.others;
                  return (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                      <td className="py-2 px-2">
                        <div className="font-medium" style={{ color: "var(--c-text)" }}>{c.name}</div>
                        {c.phone && <div className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>{c.phone}</div>}
                      </td>
                      <td className="py-2 px-2" style={{ color: "var(--c-text)" }}>{c.orders}</td>
                      <td className="py-2 px-2 font-semibold" style={{ color: "var(--c-text)" }}>{formatBDT(c.spend)}</td>
                      <td className="py-2 px-2" style={{ color: "var(--c-text-muted)" }}>{c.recencyDays > 1000 ? "—" : `${c.recencyDays} দিন আগে`}</td>
                      <td className="py-2 px-2"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                    </tr>
                  );
                })}
              </InsightsTable>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle title="সর্বাধিক লাভজনক পণ্য" className="mb-3" />
              {data.profit.topProfitable.length === 0 ? (
                <EmptyState title="কোনো ডেটা নেই।" className="py-6" />
              ) : (
                <InsightsTable head={["পণ্য", "বিক্রি", "আয়", "মুনাফা"]}>
                  {data.profit.topProfitable.map((p, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                      <td className="py-2 px-2 font-medium" style={{ color: "var(--c-text)" }}>{p.name}</td>
                      <td className="py-2 px-2" style={{ color: "var(--c-text-muted)" }}>{p.units}</td>
                      <td className="py-2 px-2" style={{ color: "var(--c-text)" }}>{formatBDT(p.revenue)}</td>
                      <td className="py-2 px-2 font-semibold" style={{ color: "#166534" }}>{formatBDT(p.profit)}</td>
                    </tr>
                  ))}
                </InsightsTable>
              )}
            </Card>
            <Card>
              <SectionTitle title="লোকসানের পণ্য" className="mb-3" />
              {data.profit.lossMaking.length === 0 ? (
                <EmptyState title="কোনো লোকসানের পণ্য নেই ✓" className="py-6" />
              ) : (
                <InsightsTable head={["পণ্য", "বিক্রি", "আয়", "মুনাফা"]}>
                  {data.profit.lossMaking.map((p, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                      <td className="py-2 px-2 font-medium" style={{ color: "var(--c-text)" }}>{p.name}</td>
                      <td className="py-2 px-2" style={{ color: "var(--c-text-muted)" }}>{p.units}</td>
                      <td className="py-2 px-2" style={{ color: "var(--c-text)" }}>{formatBDT(p.revenue)}</td>
                      <td className="py-2 px-2 font-semibold" style={{ color: "#991B1B" }}>{formatBDT(p.profit)}</td>
                    </tr>
                  ))}
                </InsightsTable>
              )}
            </Card>
          </div>

          <Card>
            <SectionTitle title="কুরিয়ার পারফরম্যান্স" className="mb-3" />
            {data.courierPerformance.length === 0 ? (
              <EmptyState title="কোনো ডেটা নেই।" className="py-6" />
            ) : (
              <InsightsTable head={["কুরিয়ার", "মোট", "ডেলিভারড", "রিটার্ন", "সফলতা"]}>
                {data.courierPerformance.map((c, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--c-border)" }}>
                    <td className="py-2 px-2 font-medium" style={{ color: "var(--c-text)" }}>{COURIER_LABEL[c.courier] ?? c.courier}</td>
                    <td className="py-2 px-2" style={{ color: "var(--c-text-muted)" }}>{c.total}</td>
                    <td className="py-2 px-2" style={{ color: "#166534" }}>{c.delivered}</td>
                    <td className="py-2 px-2" style={{ color: "#991B1B" }}>{c.returned}</td>
                    <td className="py-2 px-2 font-semibold" style={{ color: c.successRate >= 80 ? "#166534" : c.successRate >= 50 ? "#854D0E" : "#991B1B" }}>{c.successRate}%</td>
                  </tr>
                ))}
              </InsightsTable>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function InsightsTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="text-left py-1.5 px-2 font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
