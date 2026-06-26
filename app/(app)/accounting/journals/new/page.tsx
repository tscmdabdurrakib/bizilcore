"use client";



import { useEffect, useState } from "react";

import PageHint from "@/components/PageHint";

import JournalEntryForm from "@/components/accounting/JournalEntryForm";

import { PageShell } from "@/components/ui";



export default function NewJournalPage() {

  const [accounts, setAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);



  useEffect(() => {

    fetch("/api/accounting/accounts")

      .then((r) => r.json())

      .then((d) => setAccounts(d.accounts ?? []));

  }, []);



  return (

    <PageShell

      title="New Journal Entry"

      subtitle="নতুন জার্নাল এন্ট্রি"

      breadcrumbs={[

        { label: "Accounting", href: "/accounting" },

        { label: "Journals", href: "/accounting/journals" },

        { label: "New" },

      ]}

    >

      <PageHint page="accounting" text="Create a new manual journal entry." />

      <JournalEntryForm accounts={accounts} />

    </PageShell>

  );

}


