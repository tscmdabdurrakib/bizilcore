"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { Plus } from "lucide-react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import JournalEntryDetail from "@/components/accounting/JournalEntryDetail";

import type { JournalEntryWithLines, JournalStatus } from "@/types/accounting";

import { PageShell, Button, FilterBar, DataTable, Badge } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";



export default function JournalsPage() {

  const [entries, setEntries] = useState<Array<{

    id: string;

    entryNumber: string;

    entryDate: string;

    description: string;

    referenceType: string | null;

    status: JournalStatus;

    debitTotal: number;

    creditTotal: number;

  }>>([]);

  const [statusFilter, setStatusFilter] = useState("");

  const [search, setSearch] = useState("");

  const [detail, setDetail] = useState<JournalEntryWithLines | null>(null);



  async function load() {

    const params = new URLSearchParams();

    if (statusFilter) params.set("status", statusFilter);

    if (search) params.set("search", search);

    const r = await fetch(`/api/accounting/journals?${params}`);

    const data = await r.json();

    setEntries(data.entries ?? []);

  }



  useEffect(() => { load(); }, [statusFilter, search]);



  async function openDetail(id: string) {

    const r = await fetch(`/api/accounting/journals/${id}`);

    const data = await r.json();

    setDetail(data);

  }



  async function postEntry(id: string) {

    await fetch(`/api/accounting/journals/${id}/post`, { method: "PATCH" });

    setDetail(null);

    load();

  }



  async function reverseEntry(id: string) {

    await fetch(`/api/accounting/journals/${id}/reverse`, { method: "POST" });

    setDetail(null);

    load();

  }



  return (

    <PageShell

      title={ACC.journalEntries}

      subtitle="জার্নাল এন্ট্রি"

      breadcrumbs={[{ label: ACC.title, href: "/accounting" }, { label: ACC.journals }]}

      actions={

        <Link href="/accounting/journals/new">

          <Button icon={Plus}>{ACC.newEntry}</Button>

        </Link>

      }

    >

      <PageHint page="accounting" text={ACC.journalHint} />



      <FilterBar

        search={search}

        onSearchChange={setSearch}

        searchPlaceholder={ACC.search}

        filters={

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 border rounded-xl px-3 text-sm" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>

            <option value="">{ACC.allStatus}</option>

            <option value="draft">{ACC.draft}</option>

            <option value="posted">{ACC.posted}</option>

            <option value="reversed">{ACC.reversed}</option>

          </select>

        }

      />



      <DataTable

        columns={[

          { key: "entry", header: ACC.entryNumber, render: (e) => <span className="font-mono font-semibold">{e.entryNumber}</span> },

          { key: "date", header: ACC.date, render: (e) => e.entryDate?.split("T")[0] },

          { key: "desc", header: ACC.description, render: (e) => e.description },

          { key: "ref", header: ACC.reference, render: (e) => <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{e.referenceType ?? "—"}</span> },

          { key: "debit", header: ACC.debit, className: "text-right", headerClassName: "text-right", render: (e) => formatBDT(e.debitTotal) },

          { key: "credit", header: ACC.credit, className: "text-right", headerClassName: "text-right", render: (e) => formatBDT(e.creditTotal) },

          { key: "status", header: ACC.status, render: (e) => <Badge status={e.status}>{e.status}</Badge> },

        ]}

        data={entries}

        keyExtractor={(e) => e.id}

        onRowClick={(e) => openDetail(e.id)}

        emptyMessage={ACC.noJournalEntries}

      />



      {detail && (

        <JournalEntryDetail

          entry={detail}

          onClose={() => setDetail(null)}

          onPost={detail.status === "draft" ? () => postEntry(detail.id) : undefined}

          onReverse={detail.status === "posted" ? () => reverseEntry(detail.id) : undefined}

        />

      )}

    </PageShell>

  );

}


