"use client";



import { useEffect, useState } from "react";

import { Plus } from "lucide-react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import { PageShell, Button, Card, EmptyState } from "@/components/ui";



export default function AccountingExpensesPage() {

  const [expenses, setExpenses] = useState<Array<{

    id: string;

    expenseDate: string;

    amount: number;

    description: string;

    vendorName: string | null;

    expenseCategory: { name: string };

  }>>([]);

  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const [banks, setBanks] = useState<Array<{ id: string; name: string }>>([]);

  const [modal, setModal] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});



  async function load() {

    const r = await fetch("/api/accounting/expenses");

    const d = await r.json();

    setExpenses(d.expenses ?? []);

    setCategories(d.categories ?? []);

  }



  useEffect(() => {

    load();

    fetch("/api/accounting/bank-accounts").then((r) => r.json()).then((d) => setBanks(d.accounts ?? []));

  }, []);



  async function save() {

    await fetch("/api/accounting/expenses", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(form),

    });

    setModal(false);

    setForm({});

    load();

  }



  return (

    <PageShell

      title="Expenses"

      subtitle="খরচ রেকর্ড"

      breadcrumbs={[{ label: "Accounting", href: "/accounting" }, { label: "Expenses" }]}

      actions={

        <Button variant="danger" icon={Plus} onClick={() => setModal(true)}>Record Expense</Button>

      }

    >

      <PageHint page="accounting" text="Record business expenses with automatic journal entries." />



      <Card padding="none">

        {expenses.length === 0 ? (

          <EmptyState title="No expenses recorded" />

        ) : (

          expenses.map((e) => (

            <div key={e.id} className="flex justify-between px-5 py-4 last:border-0" style={{ borderBottom: "1px solid var(--c-border)" }}>

              <div>

                <p className="font-semibold text-sm">{e.description}</p>

                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{e.expenseCategory?.name} · {e.expenseDate?.split("T")[0]}</p>

              </div>

              <p className="font-bold" style={{ color: "var(--bg-danger-text)" }}>{formatBDT(e.amount)}</p>

            </div>

          ))

        )}

      </Card>



      {modal && (

        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <Card padding="lg" className="max-w-md w-full space-y-3">

            <h3 className="font-bold">Record Expense</h3>

            <select className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, expenseCategoryId: e.target.value }))}>

              <option value="">Category</option>

              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}

            </select>

            <select className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, bankAccountId: e.target.value }))}>

              <option value="">Pay from</option>

              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}

            </select>

            <input placeholder="Amount" type="number" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />

            <input placeholder="Description" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

            <input placeholder="Vendor" className="w-full h-11 border rounded-xl px-3" style={{ borderColor: "var(--c-border)" }} onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))} />

            <div className="flex gap-2">

              <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>

              <Button variant="danger" className="flex-1" onClick={save}>Save</Button>

            </div>

          </Card>

        </div>

      )}

    </PageShell>

  );

}


