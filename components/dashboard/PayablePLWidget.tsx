import Link from "next/link";
import { Scale, ArrowUpRight, ArrowDownRight, Truck } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { T } from "@/lib/theme";
import Card from "@/components/ui/Card";

interface Props {
  supplierDue: number;
  monthIncome: number;
  monthExpense: number;
}

export default function PayablePLWidget({ supplierDue, monthIncome, monthExpense }: Props) {
  const monthProfit = monthIncome - monthExpense;

  if (supplierDue === 0 && monthIncome === 0 && monthExpense === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.success.iconBg }}>
            <Scale size={15} style={{ color: T.success.iconText }} />
          </div>
          <h3 className="font-bold text-sm font-display" style={{ color: "var(--c-text)" }}>মাসিক হিসাব ও পাওনা</h3>
        </div>
        <Link href="/accounting" className="text-xs font-semibold" style={{ color: "var(--c-primary)" }}>বিস্তারিত →</Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3" style={{ backgroundColor: T.success.bg }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.success.text }}>মাসিক আয়</p>
            <ArrowUpRight size={14} style={{ color: T.success.text }} />
          </div>
          <p className="text-base font-bold mt-1" style={{ color: T.success.text }}>{formatBDT(monthIncome)}</p>
        </div>

        <div className="rounded-2xl p-3" style={{ backgroundColor: T.danger.bg }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.danger.text }}>মাসিক খরচ</p>
            <ArrowDownRight size={14} style={{ color: T.danger.text }} />
          </div>
          <p className="text-base font-bold mt-1" style={{ color: T.danger.text }}>{formatBDT(monthExpense)}</p>
        </div>

        <div className="rounded-2xl p-3 card-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>মাসিক লাভ</p>
          <p className="text-base font-bold mt-1" style={{ color: monthProfit >= 0 ? "var(--c-primary)" : T.danger.text }}>
            {formatBDT(monthProfit)}
          </p>
        </div>

        <div className="rounded-2xl p-3" style={{ backgroundColor: T.warning.bg }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.warning.text }}>সাপ্লায়ার পাওনা</p>
            <Truck size={14} style={{ color: T.warning.text }} />
          </div>
          <p className="text-base font-bold mt-1" style={{ color: T.warning.text }}>{formatBDT(supplierDue)}</p>
        </div>
      </div>
    </Card>
  );
}
