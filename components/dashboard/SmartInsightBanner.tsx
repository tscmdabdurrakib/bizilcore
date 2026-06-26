import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  UserMinus, Clock, Sparkles, type LucideIcon,
} from "lucide-react";
import { T, type TintName } from "@/lib/theme";

interface Props {
  dayGrowth: number | null;
  monthGrowth: number | null;
  totalDue: number;
  debtorCount: number;
  lowStockCount: number;
  pendingCount: number;
  inactiveCount: number;
}

interface Insight {
  icon: LucideIcon;
  tint: TintName;
  text: string;
  href?: string;
}

export default function SmartInsightBanner({
  dayGrowth, monthGrowth, totalDue, debtorCount,
  lowStockCount, pendingCount, inactiveCount,
}: Props) {
  const insights: Insight[] = [];

  if (dayGrowth !== null && dayGrowth >= 10) {
    insights.push({
      icon: TrendingUp, tint: "success",
      text: `আজকের বিক্রি গতকালের চেয়ে ${dayGrowth}% বেশি — দারুণ যাচ্ছে! 🎉`,
    });
  } else if (dayGrowth !== null && dayGrowth <= -15) {
    insights.push({
      icon: TrendingDown, tint: "warning",
      text: `আজকের বিক্রি গতকালের চেয়ে ${Math.abs(dayGrowth)}% কম — একটু প্রচারণা চালান।`,
    });
  } else if (monthGrowth !== null && monthGrowth >= 10) {
    insights.push({
      icon: TrendingUp, tint: "success",
      text: `এই মাসের বিক্রি গত মাসের চেয়ে ${monthGrowth}% বেড়েছে! 📈`,
    });
  }

  if (debtorCount > 0 && totalDue > 0) {
    insights.push({
      icon: Wallet, tint: "danger",
      text: `${debtorCount} জন গ্রাহকের কাছে ${formatBDT(totalDue)} বাকি — রিমাইন্ডার পাঠান।`,
      href: "/customers?sort=due",
    });
  }

  if (pendingCount > 0) {
    insights.push({
      icon: Clock, tint: "warning",
      text: `${pendingCount}টি অর্ডার এখনো অপেক্ষমান — দ্রুত প্রসেস করুন।`,
      href: "/orders?status=pending",
    });
  }

  if (lowStockCount > 0) {
    insights.push({
      icon: AlertTriangle, tint: "danger",
      text: `${lowStockCount}টি পণ্যের স্টক কম — রিস্টক করার সময় হয়েছে।`,
      href: "/inventory",
    });
  }

  if (inactiveCount > 0) {
    insights.push({
      icon: UserMinus, tint: "purple",
      text: `${inactiveCount} জন গ্রাহক অনেকদিন অর্ডার করেননি — ফিরিয়ে আনুন।`,
      href: "/customers",
    });
  }

  if (insights.length === 0) {
    return (
      <div className="card-premium rounded-2xl p-4" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--c-primary)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>
            সব ঠিক আছে — আজকের জন্য কোনো বিশেষ সতর্কতা নেই
          </p>
        </div>
      </div>
    );
  }

  const top = insights.slice(0, 3);

  return (
    <div
      className="card-premium rounded-2xl p-5 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-warm) 18%, var(--c-surface)) 0%, color-mix(in srgb, var(--c-primary) 8%, var(--c-surface)) 45%, var(--c-surface) 100%)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent-warm), var(--bg-warning-text))" }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <h3 className="font-bold text-sm font-display" style={{ color: "var(--c-text)" }}>স্মার্ট ইনসাইট</h3>
        <span className="text-[10px] ml-auto" style={{ color: "var(--c-text-muted)" }}>আজকের জন্য পরামর্শ</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {top.map((ins, i) => {
          const tint = T[ins.tint];
          const Inner = (
            <div
              className="flex items-start gap-2.5 p-3 rounded-2xl h-full border"
              style={{ backgroundColor: tint.bg, borderColor: tint.border, color: tint.text }}
            >
              <ins.icon size={16} style={{ color: tint.text }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-snug">{ins.text}</p>
            </div>
          );
          return ins.href ? (
            <Link key={i} href={ins.href} className="block transition-transform hover:scale-[1.02]">{Inner}</Link>
          ) : (
            <div key={i}>{Inner}</div>
          );
        })}
      </div>
    </div>
  );
}
