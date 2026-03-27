import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import { Shirt, Ruler, Package, Clock, Navigation } from "lucide-react";

interface DeliveryItem {
  id: string;
  client: string;
  item: string;
  advance: number;
  total: number;
  due: number;
}

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todaySales: number;
  todayOrderCount: number;
  todayProfit: number;
  pendingCount: number;
  activeOrders: number;
  todayDeliveries: DeliveryItem[];
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardTailor({
  shopName, userName, userGender,
  todaySales, todayOrderCount, todayProfit,
  activeOrders, todayDeliveries,
}: Props) {
  const greeting =
    userGender === "আপু" ? `আপু, স্বাগতম!` :
    userGender === "ভাই" ? `ভাইয়া, স্বাগতম!` :
    `স্বাগতম!`;

  const todayDeliveryCount = todayDeliveries.length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 55%, #6D28D9 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">দর্জি / বুটিক ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">চলমান অর্ডার</p>
              <p className="text-white text-2xl font-bold leading-none">{activeOrders}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">তৈরি হচ্ছে</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজ Delivery</p>
              <p className="text-white text-2xl font-bold leading-none">{todayDeliveryCount}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">দিতে হবে আজ</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের আয়</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/orders",       icon: Shirt,      label: "নতুন অর্ডার",  color: "#8B5CF6", bg: "#F5F3FF" },
          { href: "/measurements", icon: Ruler,      label: "মাপজোখ",      color: "#EC4899", bg: "#FDF2F8" },
          { href: "/inventory",    icon: Package,    label: "কাপড় স্টক",  color: "#F59E0B", bg: "#FFFBEB" },
          { href: "/delivery",     icon: Navigation, label: "ডেলিভারি",    color: "#10B981", bg: "#ECFDF5" },
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
          { label: "চলমান অর্ডার", value: `${activeOrders}টি`,          sub: "সেলাই হচ্ছে",                              color: "#8B5CF6", bg: "#F5F3FF" },
          { label: "আজ Delivery",   value: `${todayDeliveryCount}টি`,    sub: "আজ দিতে হবে",                             color: "#EF4444", bg: "#FEF2F2" },
          { label: "আজ নতুন",      value: `${todayOrderCount}টি`,       sub: "আজ নেওয়া অর্ডার",                        color: "#F59E0B", bg: "#FFFBEB" },
          { label: "আজকের আয়",    value: formatBDT(todaySales),        sub: todayProfit >= 0 ? "লাভজনক দিন" : "লোকসান", color: "#10B981", bg: "#ECFDF5" },
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

      {/* Today Delivery List */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
              <Clock size={16} style={{ color: "#EF4444" }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>আজ Delivery দিতে হবে</h3>
          </div>
          <Link href="/delivery" className="text-xs font-medium" style={{ color: "#8B5CF6" }}>সব ক্যালেন্ডার →</Link>
        </div>

        {todayDeliveries.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "#F5F3FF" }}>
              <Shirt size={20} style={{ color: "#8B5CF6" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: S.muted }}>আজ কোনো ডেলিভারি নেই</p>
            <p className="text-xs mt-1" style={{ color: S.muted }}>সব ডেলিভারি সময়মতো</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayDeliveries.map((order) => (
              <Link
                key={order.id}
                href={`/orders?highlight=${order.id}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border block transition-all hover:shadow-sm"
                style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FEE2E2" }}>
                  <Shirt size={16} style={{ color: "#EF4444" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{order.client}</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>{order.item}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(order.due > 0 ? order.due : order.total)}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EF4444", color: "#fff" }}>
                    আজ
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex gap-3" style={{ borderColor: S.border }}>
          <Link href="/orders" className="flex-1 text-center text-xs font-semibold py-2 rounded-xl" style={{ backgroundColor: "#F5F3FF", color: "#8B5CF6" }}>
            সব অর্ডার
          </Link>
          <Link href="/delivery" className="flex-1 text-center text-xs font-semibold py-2 rounded-xl" style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}>
            ডেলিভারি ক্যালেন্ডার
          </Link>
        </div>
      </div>
    </div>
  );
}
