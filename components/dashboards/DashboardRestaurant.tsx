import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import { UtensilsCrossed, ShoppingBag, TrendingUp, Clock } from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todaySales: number;
  todayOrderCount: number;
  todayProfit: number;
  pendingCount: number;
}

const mockTables = [
  { id: 1, label: "T-01", occupied: true,  guests: 4 },
  { id: 2, label: "T-02", occupied: false, guests: 0 },
  { id: 3, label: "T-03", occupied: true,  guests: 2 },
  { id: 4, label: "T-04", occupied: true,  guests: 6 },
  { id: 5, label: "T-05", occupied: false, guests: 0 },
  { id: 6, label: "T-06", occupied: false, guests: 0 },
  { id: 7, label: "T-07", occupied: true,  guests: 3 },
  { id: 8, label: "T-08", occupied: false, guests: 0 },
  { id: 9, label: "T-09", occupied: true,  guests: 2 },
];

const mockRecentOrders = [
  { id: "1", table: "T-01", items: "চিকেন বিরিয়ানি × ২, সফট ড্রিংক × ২", total: 680, status: "পরিবেশন করা হচ্ছে" },
  { id: "2", table: "T-03", items: "ভুনা খিচুড়ি × ১, লাচ্ছি × ১",         total: 290, status: "রান্না হচ্ছে"       },
  { id: "3", table: "T-07", items: "মাটন তেহারি × ২, জুস × ১",             total: 820, status: "অর্ডার নেওয়া হয়েছে" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  primary: "var(--c-primary)",
  primaryLight: "var(--c-primary-light)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardRestaurant({ shopName, userName, userGender, todaySales, todayOrderCount, todayProfit, pendingCount }: Props) {
  const greeting =
    userGender === "আপু" ? `আপু, স্বাগতম!` :
    userGender === "ভাই" ? `ভাইয়া, স্বাগতম!` :
    `স্বাগতম!`;

  const openTables  = mockTables.filter(t => t.occupied).length;
  const closedTables = mockTables.length - openTables;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 55%, #991B1B 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">রেস্তোরাঁ ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের বিক্রি</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি অর্ডার</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">খোলা টেবিল</p>
              <p className="text-white text-2xl font-bold leading-none">{openTables}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{closedTables}টি ফাঁকা</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">Pending</p>
              <p className="text-white text-2xl font-bold leading-none">{pendingCount}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">অর্ডার বাকি</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/orders/new",  icon: ShoppingBag,     label: "নতুন অর্ডার",   color: "#EF4444", bg: "#FEF2F2" },
          { href: "/tables",      icon: UtensilsCrossed, label: "টেবিল ম্যানেজ", color: "#F59E0B", bg: "#FFFBEB" },
          { href: "/kitchen",     icon: Clock,           label: "কিচেন ভিউ",     color: "#10B981", bg: "#ECFDF5" },
          { href: "/reports",     icon: TrendingUp,      label: "রিপোর্ট",       color: "#3B82F6", bg: "#EFF6FF" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border flex-shrink-0 transition-all hover:scale-[1.04] hover:shadow-md active:scale-95"
            style={{ backgroundColor: S.surface, borderColor: S.border, minWidth: "90px" }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: a.bg }}>
              <a.icon size={19} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: S.muted }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "আজকের বিক্রি",   value: formatBDT(todaySales),              sub: `${todayOrderCount}টি অর্ডার`,            color: "#EF4444", bg: "#FEF2F2"  },
          { label: "খোলা টেবিল",     value: `${openTables}টি`,                  sub: `${closedTables}টি ফাঁকা আছে`,           color: "#F59E0B", bg: "#FFFBEB"  },
          { label: "Pending অর্ডার", value: `${pendingCount}টি`,                 sub: "রান্না / পরিবেশন বাকি",                 color: "#3B82F6", bg: "#EFF6FF"  },
          { label: "আজকের লাভ",      value: formatBDT(todayProfit),             sub: todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান", color: "#10B981", bg: "#ECFDF5"  },
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

      {/* Table Grid + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Table Map */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>টেবিল ম্যাপ</h3>
            <Link href="/tables" className="text-xs font-medium" style={{ color: "#EF4444" }}>সব টেবিল →</Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {mockTables.map((table) => (
              <div
                key={table.id}
                className="rounded-xl p-3 text-center border"
                style={{
                  backgroundColor: table.occupied ? "#FEF2F2" : "#F0FDF4",
                  borderColor:     table.occupied ? "#FECACA" : "#BBF7D0",
                }}
              >
                <div className="flex items-center justify-center mb-1">
                  <UtensilsCrossed size={16} style={{ color: table.occupied ? "#EF4444" : "#10B981" }} />
                </div>
                <p className="text-xs font-bold" style={{ color: table.occupied ? "#EF4444" : "#10B981" }}>{table.label}</p>
                <p className="text-[10px]" style={{ color: table.occupied ? "#B91C1C" : "#059669" }}>
                  {table.occupied ? `${table.guests} জন` : "ফাঁকা"}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-[11px]" style={{ color: S.muted }}>Occupied ({openTables})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-[11px]" style={{ color: S.muted }}>ফাঁকা ({closedTables})</span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>চলমান অর্ডার</h3>
            <Link href="/orders" className="text-xs font-medium" style={{ color: "#EF4444" }}>সব দেখুন →</Link>
          </div>
          <div className="space-y-2.5">
            {mockRecentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ backgroundColor: "var(--c-bg-alt, var(--c-surface))", borderColor: S.border }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FEF2F2" }}>
                  <UtensilsCrossed size={16} style={{ color: "#EF4444" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: S.text }}>{order.table}</p>
                  <p className="text-[11px] truncate" style={{ color: S.muted }}>{order.items}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(order.total)}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] mt-3 pt-3 border-t" style={{ color: S.muted, borderColor: S.border }}>
            * চলমান অর্ডার — mock data (real API শীঘ্রই)
          </p>
        </div>
      </div>
    </div>
  );
}
