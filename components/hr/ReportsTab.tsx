"use client";

import { useEffect, useState } from "react";
import { Download, BarChart2, Loader2, Users, Check, Calendar, DollarSign } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { MONTH_NAMES } from "@/lib/hr/types";
import { StatCard, Card, Button } from "@/components/ui";

interface Summary {
  month: number;
  year: number;
  staffCount: number;
  present: number;
  absent: number;
  leaveCount: number;
  totalPayroll: number;
  totalPaid: number;
  pendingPayroll: number;
}

interface Props {
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function ReportsTab({ month, year, onMonthChange, showToast }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hr/reports/export?type=summary&month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => { setSummary(d.summary ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, year]);

  async function exportCsv(type: string) {
    setExporting(type);
    const r = await fetch(`/api/hr/reports/export?type=${type}&month=${month}&year=${year}`);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      showToast("error", d.error ?? "Export failed");
      setExporting(null);
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hr-${type}-${year}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
    showToast("success", "CSV ডাউনলোড ✓");
  }

  const attendancePct = summary && (summary.present + summary.absent) > 0
    ? Math.round((summary.present / (summary.present + summary.absent)) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={month} onChange={e => onMonthChange(parseInt(e.target.value))}
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white font-medium">
          {MONTH_NAMES.map((name, idx) => <option key={idx} value={idx + 1}>{name} {year}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 size={28} className="animate-spin text-gray-400" /></div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="মোট কর্মী" value={summary.staffCount} icon={Users} accent="green" />
          <StatCard label="উপস্থিত %" value={`${attendancePct}%`} icon={Check} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--bg-info-text)" trend={{ value: `${summary.present} উপস্থিত`, up: true }} />
          <StatCard label="ছুটি" value={summary.leaveCount} icon={Calendar} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--accent-warm)" />
          <StatCard label="বেতন বাকি" value={formatBDT(summary.pendingPayroll)} icon={DollarSign} accent="red" iconBg="var(--bg-danger-soft)" iconColor="var(--bg-danger-text)" />
        </div>
      ) : null}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} style={{ color: "var(--c-primary)" }} />
          <p className="font-bold" style={{ color: "var(--c-text)" }}>CSV Export</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { type: "attendance", label: "উপস্থিতি রিপোর্ট" },
            { type: "leave", label: "ছুটি রিপোর্ট" },
            { type: "payroll", label: "বেতন রিপোর্ট" },
          ].map(({ type, label }) => (
            <Button key={type} variant="outline" onClick={() => exportCsv(type)} disabled={exporting === type} loading={exporting === type} icon={Download} className="w-full justify-center py-4 h-auto">
              {label}
            </Button>
          ))}
        </div>
        <p className="text-[10px] mt-3" style={{ color: "var(--c-text-muted)" }}>CSV export Pro+ প্ল্যানে available</p>
      </Card>
    </div>
  );
}
