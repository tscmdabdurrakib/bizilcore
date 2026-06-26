"use client";



import { useEffect, useState } from "react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import { PageShell, Button, DataTable } from "@/components/ui";



export default function TrialBalancePage() {

  const [rows, setRows] = useState<Array<{

    code: string; name: string; accountType: string;

    totalDebit: number; totalCredit: number; balance: number;

  }>>([]);

  const [grand, setGrand] = useState({ debit: 0, credit: 0 });



  useEffect(() => {

    fetch("/api/accounting/reports/trial-balance")

      .then((r) => r.json())

      .then((d) => {

        setRows(d.rows ?? []);

        setGrand({ debit: d.grandDebit ?? 0, credit: d.grandCredit ?? 0 });

      });

  }, []);



  function exportCsv() {

    const lines = [["Code", "Name", "Type", "Debit", "Credit", "Balance"]];

    rows.forEach((r) => lines.push([r.code, r.name, r.accountType, String(r.totalDebit), String(r.totalCredit), String(r.balance)]));

    const csv = lines.map((l) => l.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "trial-balance.csv";

    a.click();

  }



  return (

    <PageShell

      title="Trial Balance"

      subtitle="ট্রায়াল ব্যালেন্স"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Reports", href: "/accounting/reports" },

        { label: "Trial Balance" },

      ]}

      className="max-w-5xl"

      actions={<Button variant="outline" onClick={exportCsv}>Export CSV</Button>}

    >

      <PageHint page="accounting" text="Trial balance — verify debits equal credits." />

      <DataTable

        columns={[

          { key: "code", header: "Code", render: (r) => <span className="font-mono">{r.code}</span> },

          { key: "name", header: "Name", render: (r) => r.name },

          { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.accountType}</span> },

          { key: "debit", header: "Debit", className: "text-right", headerClassName: "text-right", render: (r) => formatBDT(r.totalDebit) },

          { key: "credit", header: "Credit", className: "text-right", headerClassName: "text-right", render: (r) => formatBDT(r.totalCredit) },

          { key: "balance", header: "Balance", className: "text-right", headerClassName: "text-right", render: (r) => <span className="font-bold">{formatBDT(r.balance)}</span> },

        ]}

        data={rows}

        keyExtractor={(r) => r.code}

      />

      <div className="flex justify-between font-bold px-4 py-3 text-sm card-premium rounded-2xl">

        <span>Grand Total</span>

        <div className="flex gap-8">

          <span>{formatBDT(grand.debit)}</span>

          <span>{formatBDT(grand.credit)}</span>

        </div>

      </div>

    </PageShell>

  );

}


