"use client";



import { useEffect, useState } from "react";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import DatePicker from "@/components/ui/DatePicker";

import { PageShell, StatCard, Card, SectionTitle, Button } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";

import { TrendingUp, Receipt, DollarSign } from "lucide-react";



export default function ProfitLossPage() {

  const [data, setData] = useState<{

    revenue: Array<{ name: string; amount: number }>;

    totalRevenue: number;

    cogs: number;

    grossProfit: number;

    grossMargin: number;

    expenses: Array<{ name: string; amount: number }>;

    totalExpenses: number;

    netProfit: number;

    monthlyTrend: Array<{ month: string; revenue: number; expense: number }>;

  } | null>(null);

  const [from, setFrom] = useState(() => {

    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

  });

  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);



  useEffect(() => {

    fetch(`/api/accounting/reports/profit-loss?start_date=${from}&end_date=${to}`)

      .then((r) => r.json())

      .then(setData);

  }, [from, to]);



  if (!data) return <div className="p-8 text-center" style={{ color: "var(--c-text-muted)" }}>{ACC.loading}</div>;



  return (

    <PageShell

      title={ACC.profitLoss}

      subtitle="লাভ-ক্ষতি বিবরণী"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Reports", href: "/accounting/reports" },

        { label: "P&L" },

      ]}

      className="max-w-4xl print:max-w-none"

      stats={

        <>

          <StatCard label={ACC.totalRevenue} value={formatBDT(data.totalRevenue)} icon={TrendingUp} accent="green" />

          <StatCard label={ACC.totalExpenses} value={formatBDT(data.totalExpenses)} icon={Receipt} accent="red" iconBg="var(--icon-red-bg)" iconColor="var(--icon-red-text)" />

          <StatCard label={ACC.grossProfit} value={formatBDT(data.grossProfit)} icon={DollarSign} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--icon-amber-text)" trend={{ value: `${data.grossMargin}%`, up: data.grossMargin >= 0 }} />

          <StatCard label={ACC.netProfit} value={formatBDT(data.netProfit)} icon={DollarSign} accent={data.netProfit >= 0 ? "green" : "red"} iconBg={data.netProfit >= 0 ? "var(--icon-green-bg)" : "var(--icon-red-bg)"} iconColor={data.netProfit >= 0 ? "var(--icon-green-text)" : "var(--icon-red-text)"} />

        </>

      }

      actions={

        <div className="flex gap-2 print:hidden">

          <DatePicker value={from} onChange={setFrom} className="h-10 border rounded-xl px-3 text-sm" />

          <DatePicker value={to} onChange={setTo} className="h-10 border rounded-xl px-3 text-sm" />

          <Button variant="outline" onClick={() => window.print()}>Print</Button>

        </div>

      }

    >

      <PageHint page="accounting" text="Profit & Loss statement for the selected period." />



      <Card padding="lg" className="space-y-4">

        <section>

          <SectionTitle title={ACC.revenue} />

          {data.revenue.map((r) => (

            <div key={r.name} className="flex justify-between py-1 text-sm">

              <span>{r.name}</span><span>{formatBDT(r.amount)}</span>

            </div>

          ))}

          <div className="flex justify-between font-bold border-t pt-2 mt-2" style={{ borderColor: "var(--c-border)" }}>

            <span>Total Revenue</span><span style={{ color: "var(--c-primary)" }}>{formatBDT(data.totalRevenue)}</span>

          </div>

        </section>



        <section>

          <SectionTitle title={ACC.cogs} />

          <div className="flex justify-between text-sm"><span>COGS</span><span>{formatBDT(data.cogs)}</span></div>

          <div className="flex justify-between font-bold mt-2">

            <span>Gross Profit ({data.grossMargin}%)</span>

            <span>{formatBDT(data.grossProfit)}</span>

          </div>

        </section>



        <section>

          <SectionTitle title={ACC.operatingExpenses} />

          {data.expenses.map((e) => (

            <div key={e.name} className="flex justify-between py-1 text-sm">

              <span>{e.name}</span><span>{formatBDT(e.amount)}</span>

            </div>

          ))}

          <div className="flex justify-between font-bold border-t pt-2 mt-2" style={{ borderColor: "var(--c-border)" }}>

            <span>Total Expenses</span><span style={{ color: "var(--bg-danger-text)" }}>{formatBDT(data.totalExpenses)}</span>

          </div>

        </section>



        <div className="flex justify-between text-lg font-bold border-t-2 pt-4" style={{ borderColor: "var(--c-border)" }}>

          <span>Net Profit / (Loss)</span>

          <span style={{ color: data.netProfit >= 0 ? "var(--c-primary)" : "var(--bg-danger-text)" }}>{formatBDT(data.netProfit)}</span>

        </div>

      </Card>



      <Card padding="md" className="h-64 print:hidden">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data.monthlyTrend}>

            <XAxis dataKey="month" tick={{ fontSize: 11 }} />

            <YAxis tick={{ fontSize: 11 }} />

            <Tooltip formatter={(v) => formatBDT(Number(v))} />

            <Legend />

            <Bar dataKey="revenue" fill="#10B981" name="Revenue" />

            <Bar dataKey="expense" fill="#EF4444" name="Expense" />

          </BarChart>

        </ResponsiveContainer>

      </Card>

    </PageShell>

  );

}


