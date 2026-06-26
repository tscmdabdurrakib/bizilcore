"use client";



import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Plus, Landmark, Scale, BookOpen, TrendingUp, Receipt } from "lucide-react";

import { formatBDT } from "@/lib/utils";

import PageHint from "@/components/PageHint";

import ChartOfAccountsTable, { AccountFormModal } from "@/components/accounting/ChartOfAccountsTable";

import type { AccountWithBalance } from "@/types/accounting";

import { PageShell, StatCard, Button, FilterBar } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";



export default function AccountsPage() {

  const router = useRouter();

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);

  const [summary, setSummary] = useState<Record<string, number>>({});

  const [typeFilter, setTypeFilter] = useState("");

  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<{ edit?: AccountWithBalance } | null>(null);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string }>>([]);



  async function load() {

    const params = new URLSearchParams();

    if (typeFilter) params.set("type", typeFilter);

    if (search) params.set("search", search);

    const r = await fetch(`/api/accounting/accounts?${params}`);

    const data = await r.json();

    setAccounts(data.accounts ?? []);

    setSummary(data.summary ?? {});

    type Cat = { id: string; name: string; type: string };

    const cats: Cat[] = [...new Map<string, Cat>(

      (data.accounts ?? []).map((a: AccountWithBalance & { category?: Cat }) =>

        [a.categoryId, a.category ?? { id: a.categoryId, name: "", type: a.accountType }],

      ),

    ).values()];

    setCategories(cats.filter((c): c is Cat => Boolean(c.id)));

  }



  useEffect(() => { load(); }, [typeFilter, search]);



  async function handleSave(form: Record<string, string>) {

    if (modal?.edit) {

      await fetch(`/api/accounting/accounts/${modal.edit.id}`, {

        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(form),

      });

    } else {

      await fetch("/api/accounting/accounts", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(form),

      });

    }

    setModal(null);

    load();

  }



  async function toggleActive(a: AccountWithBalance) {

    await fetch(`/api/accounting/accounts/${a.id}`, {

      method: "PATCH",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ isActive: !a.isActive }),

    });

    load();

  }



  const summaryCards = [

    { key: "asset", label: ACC.assets, accent: "green" as const, icon: Landmark },

    { key: "liability", label: ACC.liabilities, accent: "red" as const, icon: Scale, iconBg: "var(--icon-red-bg)", iconColor: "var(--icon-red-text)" },

    { key: "equity", label: ACC.equity, accent: "blue" as const, icon: BookOpen, iconBg: "var(--icon-blue-bg)", iconColor: "var(--icon-blue-text)" },

    { key: "revenue", label: ACC.revenue, accent: "gold" as const, icon: TrendingUp, iconBg: "var(--icon-purple-bg)", iconColor: "var(--icon-purple-text)" },

    { key: "expense", label: ACC.expense, accent: "red" as const, icon: Receipt, iconBg: "var(--icon-amber-bg)", iconColor: "var(--icon-amber-text)" },

  ];



  return (

    <PageShell

      title={ACC.chartOfAccounts}

      subtitle="হিসাবের তালিকা"

      breadcrumbs={[{ label: ACC.title, href: "/accounting" }, { label: ACC.chartOfAccounts }]}

      actions={

        <Button icon={Plus} onClick={() => setModal({})}>{ACC.addAccount}</Button>

      }

    >

      <PageHint page="accounting" text={ACC.accountsHint} />



      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        {summaryCards.map((c) => (

          <StatCard

            key={c.key}

            label={c.label}

            value={formatBDT(summary[c.key] ?? 0)}

            icon={c.icon}

            accent={c.accent}

            iconBg={c.iconBg}

            iconColor={c.iconColor}

          />

        ))}

      </div>



      <FilterBar

        search={search}

        onSearchChange={setSearch}

        searchPlaceholder={ACC.searchAccount}

        filters={

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 border rounded-xl px-3 text-sm" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>

            <option value="">{ACC.allTypes}</option>

            {summaryCards.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}

          </select>

        }

      />



      <ChartOfAccountsTable

        accounts={accounts}

        onEdit={(a) => setModal({ edit: a })}

        onToggleActive={toggleActive}

        onViewLedger={(a) => router.push(`/accounting/reports/general-ledger?account_id=${a.id}`)}

      />



      <AccountFormModal

        open={!!modal}

        onClose={() => setModal(null)}

        onSave={handleSave}

        categories={categories}

        initial={modal?.edit}

      />

    </PageShell>

  );

}


