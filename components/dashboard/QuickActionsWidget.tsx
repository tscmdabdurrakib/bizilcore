import Link from "next/link";
import { Plus, Package, Users, Receipt, Zap, Clock } from "lucide-react";
import { T, type TintName } from "@/lib/theme";
import Card from "@/components/ui/Card";

const ACTIONS: { href: string; label: string; desc: string; icon: typeof Plus; tint: TintName }[] = [
  { href: "/orders/new", label: "নতুন অর্ডার", desc: "বিক্রি রেকর্ড", icon: Plus, tint: "success" },
  { href: "/inventory/new", label: "পণ্য যোগ", desc: "স্টকে যোগ", icon: Package, tint: "info" },
  { href: "/customers/new", label: "গ্রাহক যোগ", desc: "নতুন কাস্টমার", icon: Users, tint: "purple" },
  { href: "/accounting", label: "হিসাব লিখুন", desc: "আয়-খরচ", icon: Receipt, tint: "warning" },
];

interface Props {
  pendingCount?: number;
}

export default function QuickActionsWidget({ pendingCount = 0 }: Props) {
  return (
    <Card className="h-full card-premium transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.success.iconBg }}>
          <Zap size={15} style={{ color: T.success.iconText }} />
        </div>
        <h3 className="font-bold text-sm font-display" style={{ color: "var(--c-text)" }}>দ্রুত কাজ</h3>
      </div>

      {pendingCount > 0 && (
        <Link
          href="/orders?status=pending"
          className="flex items-center gap-2.5 p-3 rounded-xl mb-3 border transition-opacity hover:opacity-90"
          style={{ backgroundColor: T.warning.bg, borderColor: T.warning.border }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: T.warning.iconBg }}>
            <Clock size={14} style={{ color: T.warning.iconText }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: T.warning.text }}>{pendingCount}টি পেন্ডিং অর্ডার</p>
            <p className="text-[10px]" style={{ color: T.warning.text, opacity: 0.85 }}>প্রসেস করতে ট্যাপ করুন</p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map(({ href, label, desc, icon: Icon, tint }) => {
          const colors = T[tint];
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-start gap-2 p-3 rounded-xl border card-premium transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
              style={{ borderColor: "var(--c-border)" }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.iconBg }}>
                <Icon size={15} style={{ color: colors.iconText }} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--c-text)" }}>{label}</p>
                <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
