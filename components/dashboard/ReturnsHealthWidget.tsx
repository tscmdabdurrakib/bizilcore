import { PackageCheck, RotateCcw } from "lucide-react";
import Card from "@/components/ui/Card";

interface Props {
  delivered: number;
  returned: number;
  totalMonth: number;
}

function healthColor(pct: number, good: number, ok: number, invert = false) {
  const pass = invert ? pct <= good : pct >= good;
  const mid = invert ? pct <= ok : pct >= ok;
  if (pass) return "var(--c-primary)";
  if (mid) return "var(--bg-warning-text)";
  return "var(--bg-danger-text)";
}

export default function ReturnsHealthWidget({ delivered, returned, totalMonth }: Props) {
  if (totalMonth === 0) return null;

  const completed = delivered + returned;
  const deliverySuccess = completed > 0 ? Math.round((delivered / completed) * 100) : 0;
  const returnRate = totalMonth > 0 ? Math.round((returned / totalMonth) * 100) : 0;

  const successColor = healthColor(deliverySuccess, 85, 60);
  const returnColor = healthColor(returnRate, 5, 15, true);

  return (
    <Card className="h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--icon-green-bg)" }}>
          <PackageCheck size={15} style={{ color: "var(--icon-green-text)" }} />
        </div>
        <h3 className="font-bold text-sm font-display" style={{ color: "var(--c-text)" }}>ডেলিভারি স্বাস্থ্য</h3>
        <span className="text-[10px] ml-auto" style={{ color: "var(--c-text-muted)" }}>এই মাসে</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--c-text)" }}>
              <PackageCheck size={13} style={{ color: successColor }} /> ডেলিভারি সফলতা
            </span>
            <span className="text-sm font-bold" style={{ color: successColor }}>{deliverySuccess}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-border)" }}>
            <div className="h-2 rounded-full" style={{ width: `${deliverySuccess}%`, backgroundColor: successColor }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--c-text-muted)" }}>{delivered}টি সফল ডেলিভারি</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--c-text)" }}>
              <RotateCcw size={13} style={{ color: returnColor }} /> রিটার্ন রেট
            </span>
            <span className="text-sm font-bold" style={{ color: returnColor }}>{returnRate}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-border)" }}>
            <div className="h-2 rounded-full" style={{ width: `${Math.min(100, returnRate)}%`, backgroundColor: returnColor }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--c-text-muted)" }}>{returned}টি রিটার্ন / মোট {totalMonth}টি অর্ডার</p>
        </div>
      </div>
    </Card>
  );
}
