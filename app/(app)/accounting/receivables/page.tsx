"use client";



import { useEffect, useState } from "react";

import PageHint from "@/components/PageHint";

import ARAgingTable from "@/components/accounting/ARAgingTable";

import { PageShell, Button, Card, Tabs } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";



export default function ReceivablesPage() {

  const [invoices, setInvoices] = useState([]);

  const [aging, setAging] = useState<{

    buckets: Record<string, number>;

    byCustomer: Array<{ name: string; buckets: Record<string, number> }>;

  } | undefined>();

  const [tab, setTab] = useState<"list" | "aging">("list");

  const [payModal, setPayModal] = useState<{ id: string; balance: number } | null>(null);

  const [payForm, setPayForm] = useState({ amount: "", paymentMethod: "cash" });



  async function load() {

    const [invR, agingR] = await Promise.all([

      fetch("/api/accounting/receivables").then((r) => r.json()),

      fetch("/api/accounting/receivables?type=aging").then((r) => r.json()),

    ]);

    setInvoices(invR.invoices ?? []);

    setAging(agingR);

  }



  useEffect(() => { load(); }, []);



  async function recordPayment() {

    if (!payModal) return;

    await fetch("/api/accounting/receivables", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        invoiceId: payModal.id,

        amount: payForm.amount,

        paymentMethod: payForm.paymentMethod,

      }),

    });

    setPayModal(null);

    load();

  }



  return (

    <PageShell

      title={ACC.receivables}

      subtitle="প্রাপ্য হিসাব"

      breadcrumbs={[{ label: "Accounting", href: "/accounting" }, { label: "Receivables" }]}

      actions={

        <Tabs

          tabs={[

            { key: "list", label: "Invoices" },

            { key: "aging", label: "Aging" },

          ]}

          active={tab}

          onChange={(k) => setTab(k as "list" | "aging")}

        />

      }

    >

      <PageHint page="accounting" text="Accounts Receivable — customer invoices and payments." />

      <ARAgingTable

        invoices={invoices}

        aging={tab === "aging" ? aging : undefined}

        onRecordPayment={(inv) => setPayModal({ id: inv.id, balance: inv.balance })}

      />

      {payModal && (

        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <Card padding="lg" className="max-w-sm w-full space-y-3">

            <h3 className="font-bold">Record Payment</h3>

            <input

              type="number"

              placeholder={`Max ${payModal.balance}`}

              className="w-full h-11 border rounded-xl px-3"

              style={{ borderColor: "var(--c-border)" }}

              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}

            />

            <select

              className="w-full h-11 border rounded-xl px-3"

              style={{ borderColor: "var(--c-border)" }}

              onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))}

            >

              <option value="cash">Cash</option>

              <option value="bkash">bKash</option>

              <option value="nagad">Nagad</option>

            </select>

            <div className="flex gap-2">

              <Button variant="outline" className="flex-1" onClick={() => setPayModal(null)}>{ACC.cancel}</Button>

              <Button className="flex-1" onClick={recordPayment}>{ACC.save}</Button>

            </div>

          </Card>

        </div>

      )}

    </PageShell>

  );

}


