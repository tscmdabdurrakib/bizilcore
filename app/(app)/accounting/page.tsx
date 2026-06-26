"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import {

  BookOpen, FileText, Landmark, Receipt, TrendingUp, AlertTriangle,

  Plus, ArrowRightLeft,

} from "lucide-react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import { PageShell, StatCard, Card, SectionTitle, Badge } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";



export default function AccountingOverviewPage() {

  const [stats, setStats] = useState({

    revenueMtd: 0,

    expensesMtd: 0,

    netProfit: 0,

    cashBalance: 0,

    arBalance: 0,

  });

  const [recent, setRecent] = useState<Array<{

    id: string;

    entryNumber: string;

    entryDate: string;

    description: string;

    status: string;

    debitTotal: number;

  }>>([]);

  const [alerts, setAlerts] = useState<string[]>([]);



  useEffect(() => {

    const now = new Date();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const today = now.toISOString().split("T")[0];



    Promise.all([

      fetch(`/api/accounting/reports/profit-loss?start_date=${monthStart}&end_date=${today}`).then((r) => r.json()),

      fetch("/api/accounting/bank-accounts").then((r) => r.json()),

      fetch("/api/accounting/journals?limit=10").then((r) => r.json()),

      fetch("/api/accounting/accounts?type=asset").then((r) => r.json()),

      fetch("/api/accounting/receivables?type=aging").then((r) => r.json()),

    ]).then(([pl, banks, journals, assets, aging]) => {

      const cashBal = (banks.accounts ?? []).reduce(

        (s: number, a: { currentBalance: number }) => s + (a.currentBalance ?? 0),

        0,

      );

      const arBal = Object.values(aging.buckets ?? {}).reduce(

        (s: number, v) => s + (v as number),

        0,

      );

      setStats({

        revenueMtd: pl.totalRevenue ?? 0,

        expensesMtd: pl.totalExpenses ?? 0,

        netProfit: pl.netProfit ?? 0,

        cashBalance: cashBal,

        arBalance: arBal,

      });

      setRecent(journals.entries ?? []);



      const msgs: string[] = [];

      const drafts = (journals.entries ?? []).filter(

        (e: { status: string; debitTotal: number; creditTotal?: number }) =>

          e.status === "draft",

      );

      if (drafts.length) msgs.push(ACC.alerts.draftJournals(drafts.length));

      if (arBal > 0) msgs.push(ACC.alerts.arOutstanding(formatBDT(arBal)));

      if (now.getDate() >= 28) msgs.push(ACC.alerts.monthEnd);

      setAlerts(msgs);

    });

  }, []);



  return (

    <PageShell

      title={ACC.title}

      subtitle={ACC.subtitle}

      stats={

        <>

          <StatCard label={ACC.revenueMtd} value={formatBDT(stats.revenueMtd)} icon={TrendingUp} accent="green" />

          <StatCard label={ACC.expensesMtd} value={formatBDT(stats.expensesMtd)} icon={Receipt} accent="red" iconBg="var(--icon-red-bg)" iconColor="var(--icon-red-text)" />

          <StatCard label={ACC.netProfitMtd} value={formatBDT(stats.netProfit)} icon={BookOpen} accent={stats.netProfit >= 0 ? "green" : "red"} iconBg={stats.netProfit >= 0 ? "var(--icon-green-bg)" : "var(--icon-red-bg)"} iconColor={stats.netProfit >= 0 ? "var(--icon-green-text)" : "var(--icon-red-text)"} />

          <StatCard label={ACC.cashAndBank} value={formatBDT(stats.cashBalance)} icon={Landmark} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--icon-blue-text)" />

        </>

      }

    >

      <PageHint page="accounting" text={ACC.hint} />



      {alerts.length > 0 && (

        <Card padding="md" className="border-l-[3px] border-l-[var(--accent-warm)]">

          {alerts.map((a, i) => (

            <p key={i} className="text-sm flex items-center gap-2" style={{ color: "var(--bg-warning-text)" }}>

              <AlertTriangle size={14} /> {a}

            </p>

          ))}

        </Card>

      )}



      <SectionTitle title="দ্রুত অ্যাকশন" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {[

          { href: "/accounting/journals/new", label: "নতুন জার্নাল", icon: Plus },

          { href: "/accounting/expenses", label: "খরচ রেকর্ড", icon: Receipt },

          { href: "/accounting/bank", label: "ব্যাংক স্থানান্তর", icon: ArrowRightLeft },

          { href: "/accounting/reports", label: ACC.reports, icon: FileText },

        ].map((a) => (

          <Link key={a.href} href={a.href}>

            <Card padding="md" className="flex items-center gap-2 hover:shadow-md transition-shadow">

              <a.icon size={16} style={{ color: "var(--c-primary)" }} />

              <span className="text-sm font-bold">{a.label}</span>

            </Card>

          </Link>

        ))}

      </div>



      <Card padding="none">

        <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: "1px solid var(--c-border)" }}>

          <SectionTitle title="সাম্প্রতিক জার্নাল" className="mb-0" action={{ label: "সব দেখুন", href: "/accounting/journals" }} />

        </div>

        {recent.length === 0 ? (

          <p className="py-10 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>এখনো কোনো জার্নাল এন্ট্রি নেই</p>

        ) : (

          recent.map((e) => (

            <div key={e.id} className="flex items-center justify-between px-5 py-3 last:border-0" style={{ borderBottom: "1px solid var(--c-border)" }}>

              <div>

                <p className="font-semibold text-sm">{e.entryNumber}</p>

                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{e.description}</p>

              </div>

              <div className="text-right">

                <p className="text-sm font-bold">{formatBDT(e.debitTotal)}</p>

                <Badge status={e.status}>{e.status}</Badge>

              </div>

            </div>

          ))

        )}

      </Card>



      {stats.arBalance > 0 && (

        <Card padding="md" className="flex justify-between items-center">

          <div>

            <p className="text-sm font-bold">গ্রাহক পাওনা</p>

            <p className="text-xl font-bold" style={{ color: "var(--bg-danger-text)" }}>{formatBDT(stats.arBalance)}</p>

          </div>

          <Link href="/accounting/receivables" className="text-sm font-bold" style={{ color: "var(--c-primary)" }}>পাওনা দেখুন →</Link>

        </Card>

      )}

    </PageShell>

  );

}


