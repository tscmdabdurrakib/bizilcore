import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import { Package, Users, TrendingUp, Zap, AlertTriangle, ArrowRight, DollarSign } from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todaySales: number;
  todayOrderCount: number;
  todayProfit: number;
  pendingCount: number;
}

const mockLowStock = [
  { name: "বাসমতি চাল ৫কেজি",  stock:  3, unit: "বস্তা"  },
  { name: "সয়াবিন তেল ১লিটার", stock:  8, unit: "বোতল"  },
  { name: "চিনি ১কেজি",        stock:  5, unit: "প্যাকেট" },
  { name: "মসুর ডাল ৫০০গ্রাম", stock: 12, unit: "প্যাকেট" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardRetail({ shopName, userName, userGender, todaySales, todayOrderCount, todayProfit, pendingCount }: Props) {
  const greeting =
    userGender === "আপু" ? `আপু, স্বাগতম!` :
    userGender === "ভাই" ? `ভাইয়া, স্বাগতম!` :
    `স্বাগতম!`;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 55%, #B45309 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">রিটেইল ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের বিক্রি</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি লেনদেন</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের লাভ</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todayProfit)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান"}</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">কম স্টক</p>
              <p className="text-white text-2xl font-bold leading-none">{mockLowStock.length}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">পণ্য</p>
            </div>
          </div>
        </div>
      </div>

      {/* POS CTA — most prominent */}
      <Link
        href="/pos"
        className="block rounded-2xl p-6 transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <Zap size={28} color="white" />
            </div>
            <div>
              <p className="text-white text-xl font-bold">দ্রুত বিক্রয় শুরু করুন</p>
              <p className="text-white/80 text-sm mt-0.5">POS — Point of Sale সিস্টেম</p>
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <ArrowRight size={20} color="white" />
          </div>
        </div>
      </Link>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "আজকের বিক্রি",   value: formatBDT(todaySales),             sub: `${todayOrderCount}টি লেনদেন`,            color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Pending অর্ডার", value: `${pendingCount}টি`,               sub: "ডেলিভারি বাকি",                          color: "#3B82F6", bg: "#EFF6FF" },
          { label: "কম স্টক",        value: `${mockLowStock.length}টি`,        sub: "পণ্য রিঅর্ডার করুন",                    color: "#EF4444", bg: "#FEF2F2" },
          { label: "আজকের লাভ",      value: formatBDT(todayProfit),            sub: todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান", color: "#10B981", bg: "#ECFDF5" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: stat.bg }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
            </div>
            <p className="text-[11px] mb-1" style={{ color: S.muted }}>{stat.label}</p>
            <p className="text-lg font-bold" style={{ color: S.text }}>{stat.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions + Low Stock */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Quick Actions */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>দ্রুত কাজ</h3>
          <div className="space-y-2.5">
            {[
              { href: "/pos",            icon: Zap,          label: "POS বিক্রয়",         sub: "সরাসরি বিক্রয় শুরু",        color: "#1D4ED8", bg: "#EFF6FF"  },
              { href: "/cash-register",  icon: DollarSign,   label: "Cash Register",       sub: "নগদ খুলুন বা বন্ধ করুন",  color: "#F59E0B", bg: "#FFFBEB"  },
              { href: "/inventory/new",  icon: Package,      label: "নতুন পণ্য যোগ",      sub: "স্টকে নতুন পণ্য আনুন",      color: "#8B5CF6", bg: "#F5F3FF"  },
              { href: "/reports",        icon: TrendingUp,   label: "রিপোর্ট দেখুন",      sub: "বিক্রয় ও লাভের বিশ্লেষণ",  color: "#10B981", bg: "#ECFDF5"  },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:opacity-80"
                style={{ backgroundColor: "var(--c-bg-alt, var(--c-surface))", borderColor: S.border }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{item.label}</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>{item.sub}</p>
                </div>
                <ArrowRight size={14} style={{ color: S.muted }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
                <AlertTriangle size={16} style={{ color: "#EF4444" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>কম স্টক পণ্য</h3>
            </div>
            <Link href="/inventory" className="text-xs font-medium" style={{ color: "#F59E0B" }}>সব দেখুন →</Link>
          </div>
          <div className="space-y-2">
            {mockLowStock.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
                    <Package size={14} style={{ color: "#D97706" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{item.name}</p>
                    <p className="text-[11px]" style={{ color: S.muted }}>বাকি: {item.stock} {item.unit}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EF4444", color: "#fff" }}>
                  কম
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] mt-3 pt-3 border-t" style={{ color: S.muted, borderColor: S.border }}>
            * Mock data — real stock data শীঘ্রই যুক্ত হবে
          </p>
        </div>
      </div>
    </div>
  );
}
