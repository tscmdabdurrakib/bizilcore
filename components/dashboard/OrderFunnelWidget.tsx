import Link from "next/link";
import { GitBranch, ChevronRight } from "lucide-react";
import { STATUS_MAP } from "@/lib/utils";
import Card from "@/components/ui/Card";

const STAGES = ["pending", "confirmed", "shipped", "delivered", "returned"] as const;

interface Props {
  counts: Record<string, number>;
}

export default function OrderFunnelWidget({ counts }: Props) {
  const stages = STAGES.map((s) => ({ status: s, count: counts[s] ?? 0 }));
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch size={15} style={{ color: "var(--c-primary)" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--c-text)" }}>অর্ডার পাইপলাইন</h3>
        </div>
        <p className="text-xs py-4 text-center" style={{ color: "var(--c-text-muted)" }}>
          এখনো কোনো অর্ডার নেই — প্রথম অর্ডার যোগ করলে পাইপলাইন এখানে দেখা যাবে
        </p>
        <Link href="/orders/new" className="block text-center text-xs font-semibold py-2 rounded-xl cursor-pointer" style={{ color: "var(--c-primary)" }}>
          নতুন অর্ডার →
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0F6E56, #0A5442)" }}
          >
            <GitBranch size={15} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm font-display leading-tight" style={{ color: "var(--c-text)" }}>
              অর্ডার পাইপলাইন
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--c-text-muted)" }}>
              মোট {total}টি অর্ডার · স্ট্যাটাস অনুযায়ী
            </p>
          </div>
        </div>
        <Link href="/orders" className="text-xs font-semibold" style={{ color: "var(--c-primary)" }}>
          সব দেখুন →
        </Link>
      </div>

      {/* Stacked distribution bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-5" style={{ backgroundColor: "var(--c-border)" }}>
        {stages.map((s) => {
          if (s.count === 0) return null;
          const st = STATUS_MAP[s.status];
          const share = (s.count / total) * 100;
          return (
            <Link
              key={s.status}
              href={`/orders?status=${s.status}`}
              className="h-full transition-opacity hover:opacity-80 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${share}%`,
                backgroundColor: st.text,
                minWidth: share > 0 ? "4px" : 0,
              }}
              title={`${st.label}: ${s.count}টি`}
            />
          );
        })}
      </div>

      {/* Horizontal step pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {stages.map((s, i) => {
          const st = STATUS_MAP[s.status];
          const share = total > 0 ? Math.round((s.count / total) * 100) : 0;
          const isLast = i === stages.length - 1;

          return (
            <div key={s.status} className="relative flex flex-col">
              <Link
                href={`/orders?status=${s.status}`}
                className="group flex flex-col rounded-2xl p-3 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: st.bg,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: st.text }}
                  />
                  {!isLast && (
                    <ChevronRight
                      size={12}
                      className="hidden lg:block opacity-30 group-hover:opacity-60 transition-opacity"
                      style={{ color: st.text }}
                    />
                  )}
                </div>

                <p
                  className="text-2xl font-black leading-none tabular-nums"
                  style={{ color: st.text }}
                >
                  {s.count}
                </p>

                <p className="text-[11px] font-bold mt-1.5 leading-tight" style={{ color: st.text }}>
                  {st.label}
                </p>

                {/* Mini arc progress under count */}
                <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(share, s.count > 0 ? 6 : 0)}%`, backgroundColor: st.text }}
                  />
                </div>

                <p className="text-[9px] font-semibold mt-1 opacity-70" style={{ color: st.text }}>
                  {share}% মোটের
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
