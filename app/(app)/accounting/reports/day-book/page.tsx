"use client";



import { useEffect, useState } from "react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import DatePicker from "@/components/ui/DatePicker";

import { PageShell, Card, StatCard } from "@/components/ui";

import { BookOpen } from "lucide-react";



export default function DayBookPage() {

  const [from, setFrom] = useState(new Date().toISOString().split("T")[0]);

  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  const [data, setData] = useState<{

    grouped: Array<{ date: string; entries: Array<{ entryNumber: string; description: string; debitTotal: number; creditTotal: number }> }>;

    summary: { transactionCount: number; totalDebit: number; totalCredit: number };

  } | null>(null);



  useEffect(() => {

    fetch(`/api/accounting/reports/day-book?start_date=${from}&end_date=${to}`)

      .then((r) => r.json())

      .then(setData);

  }, [from, to]);



  return (

    <PageShell

      title="Day Book"

      subtitle="ডে বুক"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Reports", href: "/accounting/reports" },

        { label: "Day Book" },

      ]}

      className="max-w-5xl"

      stats={data ? (

        <>

          <StatCard label="Transactions" value={data.summary.transactionCount} icon={BookOpen} accent="green" />

          <StatCard label="Total Debit" value={formatBDT(data.summary.totalDebit)} icon={BookOpen} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--icon-blue-text)" />

          <StatCard label="Total Credit" value={formatBDT(data.summary.totalCredit)} icon={BookOpen} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--icon-amber-text)" />

        </>

      ) : undefined}

      actions={

        <div className="flex gap-2">

          <DatePicker value={from} onChange={setFrom} className="h-10 border rounded-xl px-3 text-sm" />

          <DatePicker value={to} onChange={setTo} className="h-10 border rounded-xl px-3 text-sm" />

        </div>

      }

    >

      <PageHint page="accounting" text="Day book — all journal entries grouped by date." />

      {data?.grouped.map((g) => (

        <Card key={g.date} padding="none">

          <p className="px-5 py-3 font-bold text-sm" style={{ backgroundColor: "var(--shell-surface)", borderBottom: "1px solid var(--c-border)" }}>{g.date}</p>

          {g.entries.map((e, i) => (

            <div key={i} className="flex justify-between px-5 py-3 text-sm last:border-0" style={{ borderBottom: "1px solid var(--c-border)" }}>

              <div>

                <span className="font-mono text-xs" style={{ color: "var(--c-text-muted)" }}>{e.entryNumber}</span>

                <p>{e.description}</p>

              </div>

              <div className="text-right text-xs">

                <p>Dr {formatBDT(e.debitTotal)}</p>

                <p>Cr {formatBDT(e.creditTotal)}</p>

              </div>

            </div>

          ))}

        </Card>

      ))}

    </PageShell>

  );

}


