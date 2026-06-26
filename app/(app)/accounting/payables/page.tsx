"use client";



import { useEffect, useState } from "react";

import PageHint from "@/components/PageHint";

import APAgingTable from "@/components/accounting/APAgingTable";

import { PageShell, Button, Card } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";



export default function PayablesPage() {

  const [bills, setBills] = useState([]);

  const [payModal, setPayModal] = useState<{ id: string; balance: number } | null>(null);

  const [payForm, setPayForm] = useState({ amount: "", paymentMethod: "cash" });



  async function load() {

    const r = await fetch("/api/accounting/payables");

    const d = await r.json();

    setBills(d.bills ?? []);

  }



  useEffect(() => { load(); }, []);



  async function recordPayment() {

    if (!payModal) return;

    await fetch("/api/accounting/payables", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        supplierBillId: payModal.id,

        amount: payForm.amount,

        paymentMethod: payForm.paymentMethod,

      }),

    });

    setPayModal(null);

    load();

  }



  return (

    <PageShell

      title={ACC.payables}

      subtitle="দেনা হিসাব"

      breadcrumbs={[{ label: "Accounting", href: "/accounting" }, { label: "Payables" }]}

    >

      <PageHint page="accounting" text="Accounts Payable — supplier bills and payments." />

      <APAgingTable

        bills={bills}

        onRecordPayment={(b) => setPayModal({ id: b.id, balance: b.balance })}

      />

      {payModal && (

        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <Card padding="lg" className="max-w-sm w-full space-y-3">

            <h3 className="font-bold">Record Payment</h3>

            <input

              type="number"

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


