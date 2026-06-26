import { prisma } from "@/lib/prisma";
import { formatBDT, getOrderItemDisplayName, getStatusStyle } from "@/lib/utils";
import {
  SalesBarChartLazy,
  SalesTargetWaveLazy,
  AccountingSummaryWidgetLazy,
} from "@/components/dashboard/lazy-charts";
import Link from "next/link";
import {
  ShoppingBag, Users, AlertTriangle, Truck,
  Plus, ArrowUpRight, ArrowDownRight,
  Star, TrendingUp, Calendar, CheckSquare, Store, ShieldX,
} from "lucide-react";
import TaskQuickComplete from "./TaskQuickComplete";
import SmartInsightBanner from "@/components/dashboard/SmartInsightBanner";
import OrderFunnelWidget from "@/components/dashboard/OrderFunnelWidget";
import BranchKpisPanel from "@/components/dashboard/BranchKpisPanel";
import DueCollectionWidget from "@/components/dashboard/DueCollectionWidget";
import ReturnsHealthWidget from "@/components/dashboard/ReturnsHealthWidget";
import CustomerInsightWidget from "@/components/dashboard/CustomerInsightWidget";
import PayablePLWidget from "@/components/dashboard/PayablePLWidget";
import QuickActionsWidget from "@/components/dashboard/QuickActionsWidget";
import GamificationWidget from "@/components/GamificationWidget";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import CommunityTipsWidget from "@/components/CommunityTipsWidget";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { T } from "@/lib/theme";

type Shop = NonNullable<Awaited<ReturnType<typeof import("@/lib/getShop").getShopContext>>["shop"]>;
type User = NonNullable<Awaited<ReturnType<typeof import("@/lib/getShop").getShopContext>>["user"]>;
type Subscription = Awaited<ReturnType<typeof import("@/lib/getShop").getShopContext>>["subscription"];

export type FcommerceHeroStats = {
  todaySales: number;
  todayProfit: number;
  todayIncome: number;
  todayExpense: number;
  pendingCount: number;
  todayOrderCount: number;
  salesGrowth: number | null;
  profitGrowth: number | null;
};

type Props = {
  user: User;
  shop: Shop;
  subscription: Subscription;
  heroStats: FcommerceHeroStats;
};

export function FcommerceSecondarySkeleton() {
  const card = "rounded-2xl card-premium animate-pulse";
  return (
    <div className="space-y-5">
      <div className={`${card} h-16`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${card} h-24`} />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className={`${card} lg:col-span-2 h-64`} />
        <div className={`${card} h-64`} />
      </div>
    </div>
  );
}

export default async function FcommerceSecondary({
  user,
  shop,
  subscription,
  heroStats,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 90);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

  const hasTasks = subscription?.plan === "pro" || subscription?.plan === "business";
  const hasStore = shop.storeEnabled;

  // Kick off the secondary batches up-front so they run concurrently with the
  // main batch instead of in sequential waterfall stages.
  const protectionPromise = (async () => {
    const blacklistCount = await prisma.phoneBlacklist.count({ where: { shopId: shop.id } });
    try {
      const [blockedToday, flaggedThisMonth] = await Promise.all([
        prisma.order.count({ where: { userId: user.id, riskScore: { gte: 80 }, createdAt: { gte: today } } }),
        prisma.order.count({ where: { userId: user.id, riskScore: { gte: 20 }, createdAt: { gte: monthStart } } }),
      ]);
      return [blacklistCount, blockedToday, flaggedThisMonth] as const;
    } catch {
      return [blacklistCount, 0, 0] as const;
    }
  })();

  const storePromise = hasStore
    ? Promise.all([
        prisma.storeOrder.count({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } } }),
        prisma.storeOrder.aggregate({ where: { shopId: shop.id, createdAt: { gte: monthStart }, status: { not: "cancelled" } }, _sum: { totalAmount: true } }),
      ])
    : Promise.resolve(null);

  const taskPromise = hasTasks
    ? Promise.all([
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
      ])
    : Promise.resolve(null);

  const {
    todaySales,
    todayProfit,
    todayIncome,
    todayExpense,
    pendingCount,
    todayOrderCount,
    salesGrowth,
    profitGrowth,
  } = heroStats;

  const [
    monthAgg, lastMonthAgg,
    monthOrderCount, customerDueAgg, debtorCountResult,
    lowStockProducts, recentOrders,
    weekOrders,
    codWithCourier, codCollectedMonth,
    newCustomersMonth, topProducts,
    orderStatusGroup, topDebtors,
    monthStatusGroup, returnsThisMonth,
    inactiveCustomers, customerOrderGroup,
    supplierDueAgg, monthTx,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: monthStart }, status: { not: "returned" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, status: { not: "returned" } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { userId: user.id, createdAt: { gte: monthStart }, status: { not: "returned" } } }),
    prisma.customer.aggregate({
      where: { shopId: shop.id },
      _sum: { dueAmount: true },
    }),
    prisma.customer.count({ where: { shopId: shop.id, dueAmount: { gt: 0 } } }),
    prisma.product.findMany({
      where: { shopId: shop.id, stockQty: { lte: 10 } },
      select: { id: true, name: true, stockQty: true, lowStockAt: true },
      take: 50,
    }).then((rows) => rows.filter((p) => p.stockQty <= p.lowStockAt).slice(0, 20)),
    prisma.order.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        customer: { select: { name: true } },
        items: {
          select: {
            product: { select: { name: true } },
            comboSnapshot: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
      select: { totalAmount: true, createdAt: true },
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
    prisma.order.groupBy({
      by: ["status"],
      where: { userId: user.id, createdAt: { gte: ninetyDaysAgo } },
      _count: true,
    }),
    prisma.customer.findMany({
      where: { shopId: shop.id, dueAmount: { gt: 0 } },
      select: { id: true, name: true, phone: true, dueAmount: true },
      orderBy: { dueAmount: "desc" },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { userId: user.id, createdAt: { gte: monthStart } },
      _count: true,
    }),
    prisma.orderReturn.count({ where: { userId: user.id, createdAt: { gte: monthStart } } }),
    prisma.customer.findMany({
      where: { shopId: shop.id, lastOrderAt: { not: null, lt: thirtyDaysAgo } },
      select: { id: true, name: true, phone: true, lastOrderAt: true },
      orderBy: { lastOrderAt: "asc" },
      take: 4,
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { userId: user.id, customerId: { not: null }, createdAt: { gte: ninetyDaysAgo } },
      _count: true,
    }),
    prisma.supplier.aggregate({ where: { shopId: shop.id }, _sum: { dueAmount: true } }),
    Promise.all([
      prisma.transaction.aggregate({
        where: { userId: user.id, date: { gte: monthStart }, type: "income" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, date: { gte: monthStart }, type: "expense" },
        _sum: { amount: true },
      }),
    ]),
  ]);

  const monthSales = monthAgg._sum.totalAmount ?? 0;
  const lastMonthSales = lastMonthAgg._sum.totalAmount ?? 0;
  const monthGrowth = lastMonthSales > 0
    ? Math.round(((monthSales - lastMonthSales) / lastMonthSales) * 100)
    : null;
  const salesTarget: number = ((shop.notifSettings as Record<string, unknown> | null)?.salesTarget as number) ?? 0;
  const totalDue = customerDueAgg._sum.dueAmount ?? 0;
  const debtorCount = debtorCountResult;
  const lowStockProductsFiltered = lowStockProducts;

  const [blacklistCount, blockedToday, flaggedThisMonth] = await protectionPromise;

  const storeRes = await storePromise;
  let storeStats: { totalOrders: number; monthRevenue: number; totalVisits: number } | null = null;
  if (storeRes) {
    const [storeMonthOrders, storeMonthAgg] = storeRes;
    storeStats = {
      totalOrders: storeMonthOrders,
      monthRevenue: storeMonthAgg._sum.totalAmount ?? 0,
      totalVisits: shop.storeVisits ?? 0,
    };
  }

  const taskRes = await taskPromise;
  let taskStats: { overdue: number; dueToday: number; inProgress: number; doneToday: number; upcoming: Array<{ id: string; title: string; priority: string; status: string; dueDate: Date | null }> } | null = null;
  if (taskRes) {
    const [taskOverdue, taskDueToday, taskInProgress, taskDoneToday, taskUpcoming] = taskRes;
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

  // ── Order funnel + month status counts ──
  const funnelCounts: Record<string, number> = {};
  for (const g of orderStatusGroup) funnelCounts[g.status] = g._count;
  const monthStatusCounts: Record<string, number> = {};
  for (const g of monthStatusGroup) monthStatusCounts[g.status] = g._count;
  const monthTotalOrders = monthStatusGroup.reduce((s, g) => s + g._count, 0);
  const deliveredThisMonth = monthStatusCounts.delivered ?? 0;

  // ── Customer insight: repeat customers (lifetime) ──
  const customersWithOrders = customerOrderGroup.length;
  const repeatCustomers = customerOrderGroup.filter((g) => g._count >= 2).length;

  // ── Supplier payable + monthly P&L ──
  const supplierDue = supplierDueAgg._sum.dueAmount ?? 0;
  const monthIncome = monthTx[0]._sum.amount ?? 0;
  const monthExpense = monthTx[1]._sum.amount ?? 0;

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
    <div className="space-y-5">

      {/* ── Smart Insight Banner ────────────────────────────────── */}
      <SmartInsightBanner
        dayGrowth={salesGrowth}
        monthGrowth={monthGrowth}
        totalDue={totalDue}
        debtorCount={debtorCount}
        lowStockCount={lowStockProductsFiltered.length}
        pendingCount={pendingCount}
        inactiveCount={inactiveCustomers.length}
      />

      {/* ── 4 Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="মাসিক বিক্রি"
          value={formatBDT(monthSales)}
          trend={monthGrowth !== null
            ? { value: `${monthGrowth >= 0 ? "↑" : "↓"} ${Math.abs(monthGrowth)}% গত মাসের তুলনায়`, up: monthGrowth >= 0 }
            : { value: `${monthOrderCount}টি অর্ডার` }}
          accent="green"
        />
        <StatCard
          icon={ShoppingBag}
          label="অপেক্ষমান অর্ডার"
          value={`${pendingCount}টি`}
          trend={{ value: "প্রসেসিং বাকি" }}
          accent="gold"
        />
        <StatCard
          icon={Users}
          label="বাকি পাওনা"
          value={formatBDT(totalDue)}
          trend={{ value: `${debtorCount} জন গ্রাহকের কাছে` }}
          accent="red"
        />
        <StatCard
          icon={Calendar}
          label="নতুন গ্রাহক"
          value={`${newCustomersMonth}জন`}
          trend={{ value: "এই মাসে যোগ হয়েছে" }}
          accent="blue"
        />
      </div>

      {/* ── Fake Order Protection Widget ─────────────────────────── */}
      {(blacklistCount > 0 || blockedToday > 0 || flaggedThisMonth > 0) && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-4 border" style={{ backgroundColor: T.danger.bg, borderColor: T.danger.border }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: T.danger.iconBg }}>
            <ShieldX size={18} style={{ color: T.danger.iconText }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: T.danger.text }}>ফেক অর্ডার সুরক্ষা সক্রিয়</p>
            <p className="text-xs mt-0.5" style={{ color: T.danger.text, opacity: 0.85 }}>
              {blacklistCount > 0 && `${blacklistCount}টি ব্লকলিস্টেড`}
              {blockedToday > 0 && `${blacklistCount > 0 ? " · " : ""}আজ ${blockedToday}টি উচ্চ-ঝুঁকি`}
              {flaggedThisMonth > 0 && `${(blacklistCount > 0 || blockedToday > 0) ? " · " : ""}এ মাসে ${flaggedThisMonth}টি সন্দেহজনক`}
            </p>
          </div>
          <Link href="/settings?tab=blacklist" className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: T.danger.iconBg, color: T.danger.text }}>
            পরিচালনা →
          </Link>
        </div>
      )}

      {/* ── Sales Target ─────────────────────────────────────────── */}
      {salesTarget > 0 && (() => {
        const pct = Math.min(100, Math.round((monthSales / salesTarget) * 100));
        return (
          <div
            className="rounded-2xl relative overflow-hidden border"
            style={{
              background: "var(--target-card-bg)",
              borderColor: T.success.border,
              minHeight: 130,
            }}
          >
            {/* Area chart fills full card */}
            <SalesTargetWaveLazy data={chartData} />

            {/* Content on top */}
            <div className="relative flex items-center justify-between px-5 py-4 h-full">
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--c-primary-text)" }}>মাসিক বিক্রির লক্ষ্যমাত্রা</p>
                <p className="text-xs mt-1" style={{ color: "var(--c-text-sub)" }}>
                  {formatBDT(monthSales)} বিক্রি, লক্ষ্য {formatBDT(salesTarget)}
                </p>
                <Link href="/settings?tab=account" className="text-[10px] mt-1.5 inline-block hover:underline" style={{ color: "var(--c-primary)" }}>
                  লক্ষ্য পরিবর্তন →
                </Link>
              </div>
              <div className="text-right">
                <p
                  className="font-black leading-none font-display"
                  style={{
                    fontSize: 36,
                    color: pct >= 100 ? "var(--c-primary)" : "var(--c-primary-text)",
                  }}
                >
                  {pct}%
                </p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--c-text-sub)" }}>
                  {pct >= 100 ? "লক্ষ্য পূর্ণ হয়েছে 🎉" : "লক্ষ্য পূরণের হার"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Order Pipeline Funnel ────────────────────────────────── */}
      <OrderFunnelWidget counts={funnelCounts} />

      {/* ── Chart + Today Hisab ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>মাসিক বিক্রির লক্ষ্যমাত্রা</h3>
              <p className="text-[11px] mt-0.5" style={{ color: S.muted }}>{formatBDT(monthSales)} বিক্রি, লক্ষ্য {formatBDT(salesTarget > 0 ? salesTarget : monthSales)}</p>
            </div>
            <Link href="/reports" className="text-xs font-medium" style={{ color: S.primary }}>বিস্তারিত →</Link>
          </div>
          <SalesBarChartLazy data={chartData} height={210} />
        </Card>

        <Card className="flex flex-col">
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>আজকের বিবরণ</h3>
          <div className="space-y-2.5 flex-1">
            {/* আয় */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: T.success.bg }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.success.text }}>মোট আয়</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: T.success.text }}>{formatBDT(todayIncome)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.success.iconBg }}>
                <ArrowUpRight size={18} style={{ color: T.success.iconText }} />
              </div>
            </div>

            {/* খরচ */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: T.danger.bg }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.danger.text }}>মোট খরচ</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: T.danger.text }}>{formatBDT(todayExpense)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.danger.iconBg }}>
                <ArrowDownRight size={18} style={{ color: T.danger.iconText }} />
              </div>
            </div>

            {/* লাভ */}
            <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: S.border }}>
              <span className="text-sm font-bold" style={{ color: S.text }}>আজকের লাভ</span>
              <span className="text-xl font-bold" style={{ color: todayProfit >= 0 ? "var(--c-primary)" : T.danger.text }}>
                {formatBDT(todayProfit)}
              </span>
            </div>

            {/* অর্ডার */}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: S.muted }}>আজকের অর্ডার সংখ্যা</span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: T.success.bg, color: T.success.text }}>
                {todayOrderCount}টি
              </span>
            </div>
          </div>
          <Link href="/accounting"
            className="mt-4 block text-center text-xs font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity"
            style={{ backgroundColor: T.success.bg, color: T.success.text }}>
            বিবরণ দেখুন →
          </Link>
        </Card>
      </div>

      {/* ── Due Collection + Delivery Health / Quick Actions + Customer Insight ──── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <DueCollectionWidget totalDue={totalDue} shopName={shop.name} debtors={topDebtors} />
        {monthTotalOrders > 0 ? (
          <ReturnsHealthWidget delivered={deliveredThisMonth} returned={returnsThisMonth} totalMonth={monthTotalOrders} />
        ) : (
          <QuickActionsWidget pendingCount={pendingCount} />
        )}
        <CustomerInsightWidget
          newCustomers={newCustomersMonth}
          repeatCustomers={repeatCustomers}
          customersWithOrders={customersWithOrders}
          shopName={shop.name}
          inactiveCustomers={inactiveCustomers}
        />
      </div>

      {/* ── Supplier Payable + Monthly P&L ───────────────────────── */}
      <PayablePLWidget supplierDue={supplierDue} monthIncome={monthIncome} monthExpense={monthExpense} />
      <AccountingSummaryWidgetLazy />

      {/* ── Multi-branch overview (lower on dashboard) ───────────── */}
      <BranchKpisPanel />

      {/* ── Recent Orders + Top Products + COD ──────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: S.text }}>গত ৭ দিনের বিক্রি</h3>
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
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const st = getStatusStyle(order.status);
                const summary = order.items.slice(0, 2).map((i) =>
                  getOrderItemDisplayName(i)
                ).join(", ") + (order.items.length > 2 ? ` +${order.items.length - 2}` : "");
                const initial = (order.customer?.name ?? "?")[0].toUpperCase();
                const avatarColors = ["#0F6E56","#3B82F6","#8B5CF6","#EF9F27","#EF4444"];
                const avatarBg = avatarColors[initial.charCodeAt(0) % avatarColors.length];
                return (
                  <Link key={order.id} href={`/orders/${order.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl border hover:shadow-md transition-all hover:scale-[1.005]"
                    style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{order.customer?.name ?? "অজানা"}</p>
                      <p className="text-[11px] truncate" style={{ color: S.muted }}>{summary}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold mb-1" style={{ color: S.text }}>{formatBDT(order.totalAmount)}</p>
                      <Badge status={order.status}>{st.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Top Products + COD */}
        <div className="space-y-4">

          {/* Top Products */}
          <Card>
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
              <div className="space-y-3">
                {(() => {
                  const maxQty = Math.max(...topProductsWithDetails.map(p => p.qty), 1);
                  const rankColors = ["#EF9F27","#A8A69E","#CD7F32"];
                  return topProductsWithDetails.map((p, i) => (
                    <div key={p.name}>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 text-white"
                          style={{ backgroundColor: rankColors[i] ?? "#A8A69E" }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-xs font-medium flex-1 truncate" style={{ color: S.text }}>{p.name}</p>
                        <span className="text-[10px] font-bold flex-shrink-0" style={{ color: S.muted }}>{p.qty}টি</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden ml-7" style={{ backgroundColor: "var(--c-border)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.round((p.qty / maxQty) * 100)}%`, backgroundColor: rankColors[i] ?? "#A8A69E" }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </Card>

          {/* COD Summary */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.warning.iconBg }}>
                <Truck size={14} style={{ color: T.warning.iconText }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>COD Summary</h3>
            </div>
            <div className="space-y-2.5">
              <div className="rounded-2xl p-3" style={{ backgroundColor: T.warning.bg }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.warning.text }}>Courier এ আছে</p>
                    <p className="text-base font-bold mt-0.5" style={{ color: T.warning.text }}>{formatBDT(codWithCourierAmount)}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--c-surface-raised)", color: T.warning.text }}>
                    {codWithCourier.length}টি
                  </span>
                </div>
              </div>
              <div className="rounded-2xl p-3" style={{ backgroundColor: T.success.bg }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: T.success.text }}>Collected (মাস)</p>
                    <p className="text-base font-bold mt-0.5" style={{ color: T.success.text }}>{formatBDT(codCollectedAmount)}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--c-surface-raised)", color: T.success.text }}>
                    {codCollectedCount}টি
                  </span>
                </div>
              </div>
            </div>
            <Link href="/orders?codStatus=with_courier"
              className="mt-3 block text-center text-xs font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity"
              style={{ backgroundColor: T.warning.bg, color: T.warning.text }}>
              অপেক্ষমান COD দেখুন →
            </Link>
          </Card>

          {/* Low Stock */}
          {lowStockProductsFiltered.length > 0 && (
            <Card>
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
                {lowStockProductsFiltered.slice(0, 4).map((p) => {
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
            </Card>
          )}
        </div>
      </div>

      {/* ── আজকের টাস্ক Widget ──────────────────────────────────── */}
      {hasTasks && taskStats && (
        <Card>
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
        </Card>
      )}

      {/* ── স্টোর সারসংক্ষেপ ─────────────────────────────────── */}
      {hasStore && storeStats && (
        <Card>
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
        </Card>
      )}

      {/* ── Gamification, Leaderboard & Community Tips ─────── */}
      <GamificationWidget />
      <LeaderboardWidget />
      <CommunityTipsWidget />
    </div>
  );
}