import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { formatBDT, formatBanglaDate, getStatusStyle } from "@/lib/utils";
import SalesBarChart from "@/components/SalesBarChart";
import Link from "next/link";
import {
  Package, ShoppingBag, Users, AlertTriangle, Truck, Target,
  Plus, FileText, TrendingDown, ArrowUpRight, ArrowDownRight,
  Star, TrendingUp, Calendar, CheckSquare, Clock, Store,
} from "lucide-react";
import TaskQuickComplete from "./TaskQuickComplete";
import GamificationWidget from "@/components/GamificationWidget";
import CommunityTipsWidget from "@/components/CommunityTipsWidget";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import DashboardRestaurant from "@/components/dashboards/DashboardRestaurant";
import DashboardPharmacy   from "@/components/dashboards/DashboardPharmacy";
import DashboardRetail     from "@/components/dashboards/DashboardRetail";
import DashboardSalon      from "@/components/dashboards/DashboardSalon";
import DashboardTailor     from "@/components/dashboards/DashboardTailor";

export default async function DashboardPage() {
  const { user, shop } = await requireShop();

  const businessType = shop.businessType ?? "fcommerce";

  if (businessType !== "fcommerce") {
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    if (businessType === "tailor") {
      const [todayAgg, todayTx, activeOrders, todayDeliveries] = await Promise.all([
        prisma.tailorOrder.aggregate({
          where: { shopId: shop.id, createdAt: { gte: today, lt: tomorrow } },
          _sum: { advanceAmount: true }, _count: true,
        }),
        prisma.transaction.findMany({
          where: { userId: user.id, date: { gte: today, lt: tomorrow } },
          select: { type: true, amount: true },
        }),
        prisma.tailorOrder.count({ where: { shopId: shop.id, status: { not: "delivered" } } }),
        prisma.tailorOrder.findMany({
          where: {
            shopId: shop.id,
            status: { not: "delivered" },
            deliveryDate: { gte: today, lt: tomorrow },
          },
          select: {
            id: true, customerName: true, description: true,
            totalAmount: true, advanceAmount: true, dueAmount: true,
            deliveryDate: true, status: true,
          },
          orderBy: { deliveryDate: "asc" },
          take: 10,
        }),
      ]);

      const todaySales      = todayAgg._sum.advanceAmount ?? 0;
      const todayOrderCount = todayAgg._count;
      const todayIncome     = todayTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
      const todayExpense    = todayTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
      const todayProfit     = todayIncome - todayExpense;

      return <DashboardTailor
        shopName={shop.name}
        userName={user.name ?? ""}
        userGender={(user as { gender?: string }).gender ?? null}
        todaySales={todaySales}
        todayOrderCount={todayOrderCount}
        todayProfit={todayProfit}
        pendingCount={activeOrders}
        activeOrders={activeOrders}
        todayDeliveries={todayDeliveries.map((d: any) => ({
          id: d.id,
          client: d.customerName,
          item: d.description,
          advance: d.advanceAmount,
          total: d.totalAmount,
          due: d.dueAmount,
        }))}
      />;
    }

    const [todayAgg, todayTx, pendingCount] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: user.id, createdAt: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true }, _count: true,
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, date: { gte: today, lt: tomorrow } },
        select: { type: true, amount: true },
      }),
      prisma.order.count({ where: { userId: user.id, status: "pending" } }),
    ]);

    const todaySales      = todayAgg._sum.totalAmount ?? 0;
    const todayOrderCount = todayAgg._count;
    const todayIncome     = todayTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
    const todayExpense    = todayTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);
    const todayProfit     = todayIncome - todayExpense;

    const sharedProps = {
      shopName:   shop.name,
      userName:   user.name ?? "",
      userGender: (user as { gender?: string }).gender ?? null,
      todaySales,
      todayOrderCount,
      todayProfit,
      pendingCount,
    };

    if (businessType === "restaurant") return <DashboardRestaurant {...sharedProps} />;
    if (businessType === "pharmacy")   return <DashboardPharmacy   {...sharedProps} />;
    if (businessType === "retail")     return <DashboardRetail     {...sharedProps} />;
    if (businessType === "salon")      return <DashboardSalon      {...sharedProps} />;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const hasTasks = subscription?.plan === "pro" || subscription?.plan === "business";
  const hasStore = shop.storeEnabled;

  const [
    todayAgg, monthAgg, lastMonthAgg,
    todayOrderCount, monthOrderCount,
    pendingCount, allCustomers,
    allProducts, recentOrders,
    weekOrders, todayTx,
    codWithCourier, codCollectedMonth,
    newCustomersMonth, topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: monthStart }, status: { not: "returned" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, status: { not: "returned" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { userId: user.id, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.count({ where: { userId: user.id, createdAt: { gte: monthStart }, status: { not: "returned" } } }),
    prisma.order.count({ where: { userId: user.id, status: "pending" } }),
    prisma.customer.findMany({ where: { shopId: shop.id }, select: { dueAmount: true } }),
    prisma.product.findMany({ where: { shopId: shop.id }, select: { id: true, name: true, stockQty: true, lowStockAt: true } }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: {
        customer: { select: { name: true } },
        items: { include: { product: { select: { name: true } }, combo: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: today, lt: tomorrow } },
      select: { type: true, amount: true },
    }),
    prisma.order.findMany({
      where: { userId: user.id, codStatus: "with_courier" },
      select: { totalAmount: true, dueAmount: true },
    }),
    prisma.order.aggregate({
      where: { userId: user.id, codStatus: "collected", createdAt: { gte: monthStart } },
      _sum: { totalAmount: true }, _count: true,
    }),
    prisma.customer.count({ where: { shopId: shop.id, createdAt: { gte: monthStart } } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { userId: user.id, createdAt: { gte: monthStart } }, productId: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const todaySales = todayAgg._sum.totalAmount ?? 0;
  const monthSales = monthAgg._sum.totalAmount ?? 0;
  const lastMonthSales = lastMonthAgg._sum.totalAmount ?? 0;
  const monthGrowth = lastMonthSales > 0
    ? Math.round(((monthSales - lastMonthSales) / lastMonthSales) * 100)
    : null;
  const salesTarget: number = ((shop.notifSettings as Record<string, unknown> | null)?.salesTarget as number) ?? 0;
  const totalDue = allCustomers.reduce((s, c) => s + c.dueAmount, 0);
  const lowStockProducts = allProducts.filter((p) => p.stockQty <= p.lowStockAt);

  let storeStats: { totalOrders: number; monthRevenue: number; totalVisits: number } | null = null;
  if (hasStore) {
    const [storeMonthOrders, storeMonthAgg] = await Promise.all([
      prisma.storeOrder.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } }),
      prisma.storeOrder.aggregate({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } }, _sum: { totalAmount: true } }),
    ]);
    storeStats = {
      totalOrders: storeMonthOrders,
      monthRevenue: storeMonthAgg._sum.totalAmount ?? 0,
      totalVisits: shop.storeVisits ?? 0,
    };
  }

  let taskStats: { overdue: number; dueToday: number; inProgress: number; doneToday: number; upcoming: Array<{ id: string; title: string; priority: string; status: string; dueDate: Date | null }> } | null = null;
  if (hasTasks) {
    const [taskOverdue, taskDueToday, taskInProgress, taskDoneToday, taskUpcoming] = await Promise.all([
      prisma.task.count({ where: { shopId: shop.id, status: { not: "done" }, dueDate: { lt: today } } }),
      prisma.task.count({ where: { shopId: shop.id, status: { not: "done" }, dueDate: { gte: today, lte: tomorrow } } }),
      prisma.task.count({ where: { shopId: shop.id, status: "in_progress" } }),
      prisma.task.count({ where: { shopId: shop.id, status: "done", completedAt: { gte: today, lt: tomorrow } } }),
      prisma.task.findMany({
        where: { shopId: shop.id, status: { not: "done" }, dueDate: { gte: today } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 5,
        select: { id: true, title: true, priority: true, status: true, dueDate: true },
      }),
    ]);
    taskStats = { overdue: taskOverdue, dueToday: taskDueToday, inProgress: taskInProgress, doneToday: taskDoneToday, upcoming: taskUpcoming };
  }

  const chartMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    chartMap.set(d.toISOString().split("T")[0], 0);
  }
  for (const o of weekOrders) {
    const key = o.createdAt.toISOString().split("T")[0];
    chartMap.set(key, (chartMap.get(key) ?? 0) + o.totalAmount);
  }
  const chartData = Array.from(chartMap.entries()).map(([date, total]) => ({ date, total }));

  const todayIncome = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const todayExpense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const todayProfit = todayIncome - todayExpense;

  const codWithCourierAmount = codWithCourier.reduce((s, o) => s + (o.dueAmount > 0 ? o.dueAmount : o.totalAmount), 0);
  const codCollectedAmount = codCollectedMonth._sum.totalAmount ?? 0;
  const codCollectedCount = codCollectedMonth._count;

  const topProductIds = topProducts.map((t) => t.productId).filter((id): id is string => id !== null);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sellPrice: true },
  });
  const topProductsWithDetails = topProducts
    .filter((t) => t.productId !== null)
    .map((t) => {
      const detail = topProductDetails.find((p) => p.id === t.productId);
      return { name: detail?.name ?? "Unknown", qty: t._sum.quantity ?? 0, price: detail?.sellPrice ?? 0 };
    }).filter((t) => t.qty > 0);

  const greeting =
    user.gender === "আপু" ? `আপু, আস-সালামু আলাইকুম (ٱلسَّلَامُ عَلَيْكُمْ)!` :
    user.gender === "ভাই" ? `ভাইয়া, আস-সালামু আলাইকুম (ٱلسَّلَامُ عَلَيْكُمْ)!` :
    `আস-সালামু আলাইকুম (ٱلسَّلَامُ عَلَيْكُمْ)!`;

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    primary: "var(--c-primary)",
    primaryLight: "var(--c-primary-light)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 55%, #083D31 100%)" }}
      >
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">{formatBanglaDate(new Date())}</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{user.name} — {shop.name}</p>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের বিক্রি</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি অর্ডার</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের লাভ</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todayProfit)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান"}</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">Pending</p>
              <p className="text-white text-2xl font-bold leading-none">{pendingCount}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">অর্ডার বাকি</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/orders/new",    icon: ShoppingBag,  label: "নতুন অর্ডার", color: "var(--icon-green-text)",  bg: "var(--icon-green-bg)" },
          { href: "/inventory/new", icon: Package,      label: "পণ্য যোগ",   color: "var(--icon-blue-text)",   bg: "var(--icon-blue-bg)" },
          { href: "/customers/new", icon: Users,        label: "গ্রাহক যোগ", color: "var(--icon-purple-text)", bg: "var(--icon-purple-bg)" },
          { href: "/invoices/new",  icon: FileText,     label: "ইনভয়েস",     color: "var(--icon-amber-text)",  bg: "var(--icon-amber-bg)" },
          { href: "/expenses/new",  icon: TrendingDown, label: "খরচ যোগ",   color: "var(--icon-red-text)",    bg: "var(--icon-red-bg)" },
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
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: S.secondary }}>
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── 5 Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            icon: TrendingUp, label: "মাসিক বিক্রি", value: formatBDT(monthSales),
            sub: monthGrowth !== null
              ? (monthGrowth >= 0 ? `↑ ${monthGrowth}% গত মাসের চেয়ে` : `↓ ${Math.abs(monthGrowth)}% গত মাসের চেয়ে`)
              : `${monthOrderCount}টি অর্ডার`,
            color: "var(--icon-blue-text)", bg: "var(--icon-blue-bg)",
            subColor: monthGrowth !== null ? (monthGrowth >= 0 ? "var(--bg-success-text)" : "var(--bg-danger-text)") : undefined,
          },
          {
            icon: ShoppingBag, label: "Pending অর্ডার", value: `${pendingCount}টি`,
            sub: "এখনো শিপ হয়নি", color: "var(--bg-warning-text)", bg: "var(--bg-warning-soft)",
          },
          {
            icon: Users, label: "বাকি পাওনা", value: formatBDT(totalDue),
            sub: "কাস্টমারদের কাছে", color: "var(--icon-purple-text)", bg: "var(--icon-purple-bg)",
          },
          {
            icon: AlertTriangle, label: "কম স্টক", value: `${lowStockProducts.length}টি`,
            sub: "পণ্য কম আছে", color: "var(--bg-danger-text)", bg: "var(--bg-danger-soft)",
          },
          {
            icon: Calendar, label: "নতুন গ্রাহক", value: `${newCustomersMonth}জন`,
            sub: "এই মাসে যোগ দিয়েছেন", color: "var(--bg-success-text)", bg: "var(--bg-success-soft)",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-[11px] mb-1" style={{ color: S.muted }}>{stat.label}</p>
            <p className="text-lg font-bold" style={{ color: S.text }}>{stat.value}</p>
            {stat.sub && (
              <p className="text-[10px] mt-0.5" style={{ color: (stat as { subColor?: string }).subColor ?? S.muted }}>
                {stat.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Sales Target ─────────────────────────────────────────── */}
      {salesTarget > 0 && (() => {
        const pct = Math.min(100, Math.round((monthSales / salesTarget) * 100));
        const remaining = Math.max(0, salesTarget - monthSales);
        return (
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: pct >= 100 ? "var(--bg-success-soft)" : "var(--bg-warning-soft)" }}>
                  <Target size={17} style={{ color: pct >= 100 ? "var(--bg-success-text)" : "var(--bg-warning-text)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>মাসিক বিক্রির লক্ষ্যমাত্রা</p>
                  <p className="text-xs" style={{ color: S.muted }}>{formatBDT(monthSales)} অর্জিত, লক্ষ্য {formatBDT(salesTarget)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: pct >= 100 ? "#0F6E56" : S.text }}>{pct}%</p>
                <p className="text-xs" style={{ color: S.muted }}>{pct >= 100 ? "🎉 লক্ষ্য অর্জিত!" : `আরো ${formatBDT(remaining)}`}</p>
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-border)" }}>
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${pct}%`, background: pct >= 100 ? "linear-gradient(90deg,#0F6E56,#13A67E)" : pct >= 75 ? "linear-gradient(90deg,#EF9F27,#F5BD5D)" : "linear-gradient(90deg,#2B7CE9,#60A5FA)" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px]" style={{ color: S.muted }}>৳ ০</span>
              <Link href="/settings?tab=account" className="text-[10px] hover:underline" style={{ color: S.muted }}>লক্ষ্য পরিবর্তন →</Link>
              <span className="text-[10px]" style={{ color: S.muted }}>{formatBDT(salesTarget)}</span>
            </div>
          </div>
        );
      })()}

      {/* ── Chart + Today Hisab ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>গত ৭ দিনের বিক্রি</h3>
            <Link href="/reports" className="text-xs font-medium" style={{ color: S.primary }}>বিস্তারিত →</Link>
          </div>
          <SalesBarChart data={chartData} />
        </div>

        <div className="rounded-2xl p-5 border flex flex-col" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>আজকের হিসাব</h3>
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--bg-success-soft)" }}>
              <div className="flex items-center gap-2">
                <ArrowUpRight size={15} style={{ color: "var(--bg-success-text)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--bg-success-text)" }}>মোট আয়</span>
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--bg-success-text)" }}>{formatBDT(todayIncome)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--bg-danger-soft)" }}>
              <div className="flex items-center gap-2">
                <ArrowDownRight size={15} style={{ color: "var(--bg-danger-text)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--bg-danger-text)" }}>মোট খরচ</span>
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--bg-danger-text)" }}>{formatBDT(todayExpense)}</span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: S.border }}>
              <span className="text-sm font-bold" style={{ color: S.text }}>আজকের লাভ</span>
              <span className="text-lg font-bold" style={{ color: todayProfit >= 0 ? "var(--bg-success-text)" : "var(--bg-danger-text)" }}>
                {formatBDT(todayProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: S.muted }}>আজকের অর্ডার</span>
              <span className="font-bold text-sm" style={{ color: S.text }}>{todayOrderCount}টি</span>
            </div>
          </div>
          <Link href="/hisab" className="mt-4 block text-center text-xs font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity"
            style={{ backgroundColor: S.primaryLight, color: S.primary }}>
            হিসাব বই দেখুন →
          </Link>
        </div>
      </div>

      {/* ── Recent Orders + Top Products + COD ──────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>সাম্প্রতিক অর্ডার</h3>
            <Link href="/orders" className="text-xs font-semibold" style={{ color: S.primary }}>সব দেখুন →</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "var(--bg-success-soft)" }}>
                <ShoppingBag size={22} style={{ color: "var(--bg-success-text)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: S.text }}>এখনো কোনো অর্ডার নেই</p>
              <p className="text-xs mt-1 mb-3" style={{ color: S.muted }}>প্রথম অর্ডারটি যোগ করুন!</p>
              <Link href="/orders/new"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
                style={{ backgroundColor: "var(--bg-success-soft)", color: "var(--bg-success-text)" }}>
                <Plus size={13} /> নতুন অর্ডার
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentOrders.map((order) => {
                const st = getStatusStyle(order.status);
                const summary = order.items.slice(0, 2).map((i) =>
                  i.comboId ? (i.combo?.name ?? "কমবো") : (i.product?.name ?? "পণ্য")
                ).join(", ") + (order.items.length > 2 ? ` +${order.items.length - 2}` : "");
                const initial = (order.customer?.name ?? "?")[0].toUpperCase();
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--c-bg-alt, var(--c-surface))" }}>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: S.primary }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{order.customer?.name ?? "অজানা"}</p>
                      <p className="text-[11px] truncate" style={{ color: S.muted }}>{summary}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(order.totalAmount)}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Top Products + COD */}
        <div className="space-y-4">

          {/* Top Products */}
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-warning-soft)" }}>
                <Star size={14} style={{ color: "var(--bg-warning-text)" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>শীর্ষ পণ্য</h3>
              <span className="text-[10px] ml-auto" style={{ color: S.muted }}>এই মাসে</span>
            </div>

            {topProductsWithDetails.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: S.muted }}>এখনো কোনো বিক্রি নেই</p>
            ) : (
              <div className="space-y-2.5">
                {topProductsWithDetails.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        backgroundColor: i === 0 ? "var(--bg-warning-soft)" : i === 1 ? "var(--c-surface)" : "var(--c-border)",
                        color: i === 0 ? "var(--bg-warning-text)" : S.muted,
                      }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs font-medium flex-1 truncate" style={{ color: S.text }}>{p.name}</p>
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: S.muted }}>{p.qty}টি</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COD Summary */}
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-warning-soft)" }}>
                <Truck size={14} style={{ color: "var(--bg-warning-text)" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>COD Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 rounded-xl" style={{ backgroundColor: "var(--bg-warning-soft)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: S.text }}>Courier এ আছে</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>{codWithCourier.length}টি অর্ডার</p>
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--bg-warning-text)" }}>{formatBDT(codWithCourierAmount)}</p>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl" style={{ backgroundColor: "var(--bg-success-soft)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: S.text }}>Collected (মাস)</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>{codCollectedCount}টি অর্ডার</p>
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--bg-success-text)" }}>{formatBDT(codCollectedAmount)}</p>
              </div>
            </div>
            <Link href="/orders?codStatus=with_courier"
              className="mt-4 block text-center text-xs font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "var(--bg-warning-soft)", color: "var(--bg-warning-text)" }}>
              Pending COD দেখুন →
            </Link>
          </div>

          {/* Low Stock */}
          {lowStockProducts.length > 0 && (
            <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-danger-soft)" }}>
                    <AlertTriangle size={14} style={{ color: "var(--bg-danger-text)" }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: S.text }}>কম স্টক</h3>
                </div>
                <Link href="/inventory" className="text-[10px] font-medium" style={{ color: S.primary }}>দেখুন →</Link>
              </div>
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 4).map((p) => {
                  const pct = p.lowStockAt > 0 ? Math.min(100, (p.stockQty / (p.lowStockAt * 3)) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between mb-1">
                        <p className="text-xs font-medium truncate" style={{ color: S.text }}>{p.name}</p>
                        <p className="text-[10px] flex-shrink-0 ml-2 font-bold" style={{ color: p.stockQty === 0 ? "var(--bg-danger-text)" : "var(--bg-warning-text)" }}>
                          {p.stockQty === 0 ? "স্টক শেষ" : `${p.stockQty}টি`}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--c-border)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: p.stockQty === 0 ? "var(--bg-danger-text)" : "var(--bg-warning-text)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── আজকের টাস্ক Widget ──────────────────────────────────── */}
      {hasTasks && taskStats && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-success-soft)" }}>
                <CheckSquare size={17} style={{ color: "var(--bg-success-text)" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>আজকের টাস্ক</h3>
            </div>
            <Link href="/tasks" className="text-xs font-semibold" style={{ color: S.primary }}>
              সব টাস্ক দেখুন →
            </Link>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "মেয়াদোত্তীর্ণ", value: taskStats.overdue,    color: "var(--bg-danger-text)",  bg: "var(--bg-danger-soft)" },
              { label: "আজ বাকি",        value: taskStats.dueToday,   color: "var(--bg-warning-text)", bg: "var(--bg-warning-soft)" },
              { label: "চলছে",           value: taskStats.inProgress, color: "var(--icon-blue-text)",  bg: "var(--icon-blue-bg)" },
              { label: "আজ সম্পন্ন",    value: taskStats.doneToday,  color: "var(--bg-success-text)", bg: "var(--bg-success-soft)" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: stat.bg }}>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: stat.color }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Upcoming tasks with quick complete */}
          {taskStats.upcoming.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>আসন্ন টাস্ক</p>
              <TaskQuickComplete tasks={taskStats.upcoming} />
            </div>
          )}

          {taskStats.upcoming.length === 0 && taskStats.overdue === 0 && taskStats.dueToday === 0 && (
            <TaskQuickComplete tasks={[]} emptyMessage={true} />
          )}
        </div>
      )}

      {/* ── স্টোর সারসংক্ষেপ ─────────────────────────────────── */}
      {hasStore && storeStats && (
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0F6E56,#0A5442)" }}>
                <Store size={17} color="#fff" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: S.text }}>আমার স্টোর — এই মাস</h3>
                <p className="text-xs" style={{ color: S.muted }}>অনলাইন স্টোর পারফরম্যান্স</p>
              </div>
            </div>
            <Link href="/dashboard/store/analytics" className="text-xs font-semibold" style={{ color: S.primary }}>
              বিস্তারিত →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "মোট ভিজিট", value: storeStats.totalVisits.toLocaleString("en-IN"), color: "var(--icon-blue-text)", bg: "var(--icon-blue-bg)" },
              { label: "এই মাসের অর্ডার", value: `${storeStats.totalOrders}টি`, color: "var(--bg-success-text)", bg: "var(--bg-success-soft)" },
              { label: "এই মাসের রাজস্ব", value: formatBDT(storeStats.monthRevenue), color: "var(--icon-green-text)", bg: "var(--icon-green-bg)" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3" style={{ backgroundColor: stat.bg }}>
                <p className="text-[11px] font-medium mb-1" style={{ color: stat.color }}>{stat.label}</p>
                <p className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gamification, Leaderboard & Community Tips ─────── */}
      <GamificationWidget />
      <LeaderboardWidget />
      <CommunityTipsWidget />
    </div>
  );
}
