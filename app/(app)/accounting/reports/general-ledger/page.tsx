"use client";



import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import DatePicker from "@/components/ui/DatePicker";

import { PageShell, Card, DataTable } from "@/components/ui";



export default function GeneralLedgerPage() {

  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const [accountId, setAccountId] = useState(searchParams.get("account_id") ?? "");

  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);

  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  const [data, setData] = useState<{

    openingBalance: number;

    closingBalance: number;

    rows: Array<{ date: string; entryNumber: string; description: string; debit: number; credit: number; runningBalance: number }>;

  } | null>(null);



  useEffect(() => {

    fetch("/api/accounting/accounts").then((r) => r.json()).then((d) => setAccounts(d.accounts ?? []));

  }, []);



  useEffect(() => {

    if (!accountId) return;

    fetch(`/api/accounting/reports/general-ledger?account_id=${accountId}&start_date=${from}&end_date=${to}`)

      .then((r) => r.json())

      .then(setData);

  }, [accountId, from, to]);



  return (

    <PageShell

      title="General Ledger"

      subtitle="জেনারেল লেজার"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Reports", href: "/accounting/reports" },

        { label: "General Ledger" },

      ]}

      className="max-w-5xl"

    >

      <PageHint page="accounting" text="General ledger with running balance per account." />

      <div className="flex gap-3 flex-wrap">

        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-10 border rounded-xl px-3 text-sm flex-1" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>

          <option value="">Select account</option>

          {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}

        </select>

        <DatePicker value={from} onChange={setFrom} className="h-10 border rounded-xl px-3 text-sm" />

        <DatePicker value={to} onChange={setTo} className="h-10 border rounded-xl px-3 text-sm" />

      </div>

      {data && (

        <Card padding="none">

          <div className="px-5 py-3 text-sm" style={{ borderBottom: "1px solid var(--c-border)" }}>

            Opening: <strong>{formatBDT(data.openingBalance)}</strong>

          </div>

          <DataTable

            columns={[

              { key: "date", header: "Date", render: (r) => r.date },

              { key: "entry", header: "Entry #", render: (r) => <span className="font-mono text-xs">{r.entryNumber}</span> },

              { key: "desc", header: "Description", render: (r) => r.description },

              { key: "debit", header: "Debit", className: "text-right", headerClassName: "text-right", render: (r) => r.debit ? formatBDT(r.debit) : "—" },

              { key: "credit", header: "Credit", className: "text-right", headerClassName: "text-right", render: (r) => r.credit ? formatBDT(r.credit) : "—" },

              { key: "balance", header: "Balance", className: "text-right", headerClassName: "text-right", render: (r) => <span className="font-bold">{formatBDT(r.runningBalance)}</span> },

            ]}

            data={data.rows}

            keyExtractor={(_, i) => String(i)}

            className="border-0 shadow-none rounded-none"

          />

          <div className="px-5 py-3 text-sm font-bold" style={{ borderTop: "1px solid var(--c-border)" }}>

            Closing: {formatBDT(data.closingBalance)}

          </div>

        </Card>

      )}

    </PageShell>

  );

}


