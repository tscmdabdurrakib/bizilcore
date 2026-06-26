"use client";



import { useEffect, useState } from "react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import DatePicker from "@/components/ui/DatePicker";

import { PageShell, StatCard, DataTable } from "@/components/ui";

import { Receipt } from "lucide-react";



export default function VatReportPage() {

  const [from, setFrom] = useState(() => {

    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

  });

  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  const [data, setData] = useState<{

    outputVat: number;

    inputVat: number;

    netVatPayable: number;

    rows: Array<{ date: string; orderId: string; customer: string; totalAmount: number; vatAmount: number; vatRate: number }>;

  } | null>(null);



  useEffect(() => {

    fetch(`/api/accounting/reports/vat?start_date=${from}&end_date=${to}`)

      .then((r) => r.json())

      .then(setData);

  }, [from, to]);



  return (

    <PageShell

      title="VAT Report"

      subtitle="ভ্যাট রিপোর্ট"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Reports", href: "/accounting/reports" },

        { label: "VAT Report" },

      ]}

      className="max-w-5xl"

      stats={data ? (

        <>

          <StatCard label="Output VAT" value={formatBDT(data.outputVat)} icon={Receipt} accent="green" />

          <StatCard label="Input VAT" value={formatBDT(data.inputVat)} icon={Receipt} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--icon-blue-text)" />

          <StatCard label="Net Payable" value={formatBDT(data.netVatPayable)} icon={Receipt} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--icon-amber-text)" />

        </>

      ) : undefined}

      actions={

        <div className="flex gap-2">

          <DatePicker value={from} onChange={setFrom} className="h-10 border rounded-xl px-3 text-sm" />

          <DatePicker value={to} onChange={setTo} className="h-10 border rounded-xl px-3 text-sm" />

        </div>

      }

    >

      <PageHint page="accounting" text="VAT report for NBR filing." />

      {data && (

        <DataTable

          columns={[

            { key: "date", header: "Date", render: (r) => r.date },

            { key: "order", header: "Order #", render: (r) => <span className="font-mono">{r.orderId}</span> },

            { key: "customer", header: "Customer", render: (r) => r.customer },

            { key: "total", header: "Total", className: "text-right", headerClassName: "text-right", render: (r) => formatBDT(r.totalAmount) },

            { key: "vat", header: "VAT", className: "text-right", headerClassName: "text-right", render: (r) => formatBDT(r.vatAmount) },

          ]}

          data={data.rows}

          keyExtractor={(_, i) => String(i)}

        />

      )}

    </PageShell>

  );

}


