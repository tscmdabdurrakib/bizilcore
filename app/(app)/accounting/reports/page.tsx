"use client";

import Link from "next/link";
import { FileText, Scale, BookOpen, List, Calendar } from "lucide-react";
import PageHint from "@/components/PageHint";
import { PageShell, Card, SectionTitle } from "@/components/ui";
import { ACC } from "@/lib/i18n/accounting";

const REPORTS = [
  { href: "/accounting/reports/profit-loss", label: ACC.profitLoss, icon: FileText },
  { href: "/accounting/reports/balance-sheet", label: ACC.balanceSheet, icon: Scale },
  { href: "/accounting/reports/trial-balance", label: ACC.trialBalance, icon: List },
  { href: "/accounting/reports/general-ledger", label: ACC.generalLedger, icon: BookOpen },
  { href: "/accounting/reports/day-book", label: ACC.dayBook, icon: Calendar },
  { href: "/accounting/reports/vat-report", label: ACC.vatReport, icon: FileText },
];

export default function ReportsHubPage() {
  return (
    <PageShell
      title={ACC.reports}
      subtitle="আর্থিক রিপোর্ট"
      breadcrumbs={[{ label: ACC.title, href: "/accounting" }, { label: ACC.reports }]}
    >
      <PageHint page="accounting" text={ACC.reportsHint} />
      <SectionTitle title={ACC.availableReports} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card padding="md" className="flex items-center gap-3 hover:shadow-md transition-shadow">
              <r.icon size={20} style={{ color: "var(--c-primary)" }} />
              <span className="font-bold text-sm">{r.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
