"use client";



import { useEffect, useState } from "react";

import { Plus, ArrowRightLeft } from "lucide-react";

import PageHint from "@/components/PageHint";

import BankAccountCard from "@/components/accounting/BankAccountCard";

import TransactionList from "@/components/accounting/TransactionList";

import type { BankAccountSummary } from "@/types/accounting";

import { PageShell, Button, Card, SectionTitle } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";



export default function BankPage() {

  const [accounts, setAccounts] = useState<BankAccountSummary[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Array<{

    id: string;

    transactionDate: string;

    transactionType: string;

    amount: number;

    description: string;

    referenceNumber: string | null;

    isReconciled: boolean;

  }>>([]);

  const [modal, setModal] = useState<"add" | "deposit" | "withdraw" | "transfer" | null>(null);

  const [coaAccounts, setCoaAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const [form, setForm] = useState<Record<string, string>>({});



  async function loadAccounts() {

    const r = await fetch("/api/accounting/bank-accounts");

    const d = await r.json();

    setAccounts(d.accounts ?? []);

  }



  async function loadTx(bankAccountId: string) {

    const r = await fetch(`/api/accounting/bank-transactions?bank_account_id=${bankAccountId}`);

    const d = await r.json();

    setTransactions(d.transactions ?? []);

  }



  useEffect(() => {

    loadAccounts();

    fetch("/api/accounting/accounts?type=asset")

      .then((r) => r.json())

      .then((d) => setCoaAccounts(d.accounts ?? []));

  }, []);



  useEffect(() => {

    if (selectedId) loadTx(selectedId);

  }, [selectedId]);



  async function submitModal() {

    if (modal === "add") {

      await fetch("/api/accounting/bank-accounts", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(form),

      });

    } else if (modal === "deposit") {

      await fetch("/api/accounting/bank-transactions/deposit", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ ...form, bankAccountId: selectedId ?? form.bankAccountId }),

      });

    } else if (modal === "withdraw") {

      await fetch("/api/accounting/bank-transactions/withdrawal", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ ...form, bankAccountId: selectedId ?? form.bankAccountId }),

      });

    } else if (modal === "transfer") {

      await fetch("/api/accounting/bank-transactions/transfer", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(form),

      });

    }

    setModal(null);

    setForm({});

    loadAccounts();

    if (selectedId) loadTx(selectedId);

  }



  async function toggleReconciled(id: string, value: boolean) {

    await fetch("/api/accounting/bank-transactions", {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ id, isReconciled: value }),

    });

    if (selectedId) loadTx(selectedId);

  }



  return (

    <PageShell

      title={ACC.bankAndCash}

      subtitle="ব্যাংক ও নগদ হিসাব"

      breadcrumbs={[{ label: "Accounting", href: "/accounting" }, { label: "Bank" }]}

      actions={

        <>

          <Button variant="outline" icon={ArrowRightLeft} onClick={() => setModal("transfer")}>Transfer</Button>

          <Button icon={Plus} onClick={() => setModal("add")}>Add Account</Button>

        </>

      }

    >

      <PageHint page="accounting" text="Bank & cash accounts — deposits, withdrawals, transfers." />



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {accounts.map((a) => (

          <BankAccountCard

            key={a.id}

            account={a}

            onDeposit={() => { setSelectedId(a.id); setModal("deposit"); }}

            onWithdraw={() => { setSelectedId(a.id); setModal("withdraw"); }}

            onViewTransactions={() => setSelectedId(a.id)}

          />

        ))}

      </div>



      {selectedId && (

        <div>

          <SectionTitle title={ACC.transactions} />

          <TransactionList transactions={transactions} onToggleReconciled={toggleReconciled} />

        </div>

      )}



      {modal && (

        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <Card padding="lg" className="max-w-md w-full space-y-3">

            <h3 className="font-bold capitalize">{modal} Account</h3>

            {modal === "add" && (

              <>

                <input placeholder="Name" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

                <select className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value }))}>

                  <option value="cash">Cash</option>

                  <option value="bank">Bank</option>

                  <option value="mobile_banking">Mobile Banking</option>

                </select>

                <select className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}>

                  <option value="">Link COA Account</option>

                  {coaAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}

                </select>

                <input placeholder="Opening Balance" type="number" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))} />

              </>

            )}

            {(modal === "deposit" || modal === "withdraw") && (

              <>

                <input placeholder="Amount" type="number" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />

                <input placeholder="Description" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

              </>

            )}

            {modal === "transfer" && (

              <>

                <select className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, fromAccountId: e.target.value }))}>

                  <option value="">From</option>

                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}

                </select>

                <select className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, toAccountId: e.target.value }))}>

                  <option value="">To</option>

                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}

                </select>

                <input placeholder="Amount" type="number" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />

                <input placeholder="Description" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

              </>

            )}

            <div className="flex gap-2 pt-2">

              <Button variant="outline" className="flex-1" onClick={() => setModal(null)}>{ACC.cancel}</Button>

              <Button className="flex-1" onClick={submitModal}>{ACC.save}</Button>

            </div>

          </Card>

        </div>

      )}

    </PageShell>

  );

}


