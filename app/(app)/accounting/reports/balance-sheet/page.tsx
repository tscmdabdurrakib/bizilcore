"use client";



import { useEffect, useState } from "react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import DatePicker from "@/components/ui/DatePicker";

import { PageShell, StatCard, Card, SectionTitle } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";

import { Landmark, Scale, BookOpen } from "lucide-react";



export default function BalanceSheetPage() {

  const [data, setData] = useState<{

    assets: Array<{ name: string; amount: number }>;

    totalAssets: number;

    liabilities: Array<{ name: string; amount: number }>;

    totalLiabilities: number;

    equity: Array<{ name: string; amount: number }>;

    totalEquity: number;

    totalLiabilitiesAndEquity: number;

    isBalanced: boolean;

  } | null>(null);

  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);



  useEffect(() => {

    fetch(`/api/accounting/reports/balance-sheet?as_of_date=${asOf}`)

      .then((r) => r.json())

      .then(setData);

  }, [asOf]);



  if (!data) return <div className="p-8 text-center" style={{ color: "var(--c-text-muted)" }}>{ACC.loading}</div>;



  return (

    <PageShell

      title={ACC.balanceSheet}

      subtitle="ব্যালেন্স শিট"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Reports", href: "/accounting/reports" },

        { label: "Balance Sheet" },

      ]}

      className="max-w-4xl"

      stats={

        <>

          <StatCard label={ACC.totalAssets} value={formatBDT(data.totalAssets)} icon={Landmark} accent="green" />

          <StatCard label={ACC.totalLiabilities} value={formatBDT(data.totalLiabilities)} icon={Scale} accent="red" iconBg="var(--icon-red-bg)" iconColor="var(--icon-red-text)" />

          <StatCard label={ACC.totalEquity} value={formatBDT(data.totalEquity)} icon={BookOpen} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--icon-blue-text)" />

          <StatCard label="L + E" value={formatBDT(data.totalLiabilitiesAndEquity)} icon={Scale} accent={data.isBalanced ? "green" : "red"} />

        </>

      }

      actions={

        <DatePicker value={asOf} onChange={setAsOf} className="h-10 border rounded-xl px-3 text-sm print:hidden" />

      }

    >

      <PageHint page="accounting" text="Balance sheet as of selected date." />

      {!data.isBalanced && (

        <Card padding="md" className="border-l-[3px] border-l-[var(--bg-danger-text)]">

          <p className="text-sm font-bold" style={{ color: "var(--bg-danger-text)" }}>

            Warning: Assets ≠ Liabilities + Equity

          </p>

        </Card>

      )}

      <Card padding="lg" className="grid md:grid-cols-2 gap-8">

        <div>

          <SectionTitle title={ACC.assets} />

          {data.assets.map((a) => (

            <div key={a.name} className="flex justify-between text-sm py-1">

              <span>{a.name}</span><span>{formatBDT(a.amount)}</span>

            </div>

          ))}

          <div className="flex justify-between font-bold border-t pt-2 mt-2" style={{ borderColor: "var(--c-border)" }}>

            <span>Total Assets</span><span>{formatBDT(data.totalAssets)}</span>

          </div>

        </div>

        <div>

          <SectionTitle title={ACC.liabilities} />

          {data.liabilities.map((l) => (

            <div key={l.name} className="flex justify-between text-sm py-1">

              <span>{l.name}</span><span>{formatBDT(l.amount)}</span>

            </div>

          ))}

          <div className="flex justify-between font-bold border-t pt-2 mt-2 mb-4" style={{ borderColor: "var(--c-border)" }}>

            <span>Total Liabilities</span><span>{formatBDT(data.totalLiabilities)}</span>

          </div>

          <SectionTitle title={ACC.equity} />

          {data.equity.map((e) => (

            <div key={e.name} className="flex justify-between text-sm py-1">

              <span>{e.name}</span><span>{formatBDT(e.amount)}</span>

            </div>

          ))}

          <div className="flex justify-between font-bold border-t pt-2 mt-2" style={{ borderColor: "var(--c-border)" }}>

            <span>Total L + E</span><span>{formatBDT(data.totalLiabilitiesAndEquity)}</span>

          </div>

        </div>

      </Card>

    </PageShell>

  );

}


