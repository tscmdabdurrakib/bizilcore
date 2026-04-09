import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { formatBDT, formatBanglaDate, getStatusStyle } from "@/lib/utils";
import SalesBarChart from "@/components/SalesBarChart";
import SalesTargetWave from "@/components/SalesTargetWave";
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
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/orders/new",    icon: ShoppingBag,  label: "নতুন অর্ডার", color: "#0F6E56",  bg: "#E1F5EE" },
          { href: "/inventory/new", icon: Package,      label: "পণ্য যোগ",    color: "#3B82F6",  bg: "#EFF6FF" },
          { href: "/customers/new", icon: Users,        label: "গ্রাহক যোগ",  color: "#8B5CF6",  bg: "#F5F3FF" },
          { href: "/invoices/new",  icon: FileText,     label: "ইনভয়েস",      color: "#EF9F27",  bg: "#FFF3DC" },
          { href: "/expenses/new",  icon: TrendingDown, label: "খরচ যোগ",    color: "#EF4444",  bg: "#FEE2E2" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl flex-shrink-0 transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95"
            style={{ backgroundColor: a.bg, minWidth: "88px" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/60">
              <a.icon size={20} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: a.color }}>
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── 4 Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* মাসিক বিক্রি */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E1F5EE" }}>
              <TrendingUp size={15} style={{ color: "#0F6E56" }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: S.muted }}>মাসিক বিক্রি</p>
          </div>
          <p className="text-xl font-bold" style={{ color: "#0F6E56" }}>{formatBDT(monthSales)}</p>
          {monthGrowth !== null ? (
            <p className="text-[11px] mt-1 font-semibold" style={{ color: monthGrowth >= 0 ? "var(--bg-success-text)" : "var(--bg-danger-text)" }}>
              {monthGrowth >= 0 ? "↑" : "↓"} {Math.abs(monthGrowth)}% গত মাসের তুলনায়
            </p>
          ) : (
            <p className="text-[11px] mt-1" style={{ color: S.muted }}>{monthOrderCount}টি অর্ডার</p>
          )}
        </div>

        {/* Pending অর্ডার */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF3DC" }}>
              <ShoppingBag size={15} style={{ color: "#EF9F27" }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: S.muted }}>Pending অর্ডার</p>
          </div>
          <p className="text-xl font-bold" style={{ color: "#EF9F27" }}>{pendingCount}টি</p>
          <p className="text-[11px] mt-1" style={{ color: S.muted }}>২০২৫ সালের বর্তমান</p>
        </div>

        {/* বাকি পাওনা */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
              <Users size={15} style={{ color: "#EF4444" }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: S.muted }}>বাকি পাওনা</p>
          </div>
          <p className="text-xl font-bold" style={{ color: "#EF4444" }}>{formatBDT(totalDue)}</p>
          <p className="text-[11px] mt-1" style={{ color: S.muted }}>২০২৫ সালের বর্তমান</p>
        </div>

        {/* নতুন গ্রাহক */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EFF6FF" }}>
              <Calendar size={15} style={{ color: "#3B82F6" }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: S.muted }}>নতুন গ্রাহক</p>
          </div>
          <p className="text-xl font-bold" style={{ color: "#3B82F6" }}>{newCustomersMonth}জন</p>
          <p className="text-[11px] mt-1" style={{ color: S.muted }}>২০২৫ সালের বর্তমান</p>
        </div>
      </div>

      {/* ── Sales Target ─────────────────────────────────────────── */}
      {salesTarget > 0 && (() => {
        const pct = Math.min(100, Math.round((monthSales / salesTarget) * 100));
        return (
          <div
            className="rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #E8F5F0 0%, #D0EDE3 100%)",
              minHeight: 88,
            }}
          >
            {/* Area chart fills full card */}
            <SalesTargetWave data={chartData} />

            {/* Content on top */}
            <div className="relative flex items-center justify-between px-5 py-4 h-full">
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: "#0A4033" }}>মাসিক বিক্রির লক্ষ্যমাত্রা</p>
                <p className="text-xs mt-1" style={{ color: "#2D7A65" }}>
                  {formatBDT(monthSales)} বিক্রি, লক্ষ্য {formatBDT(salesTarget)}
                </p>
                <Link href="/settings?tab=account" className="text-[10px] mt-1.5 inline-block hover:underline" style={{ color: "#4CA98B" }}>
                  লক্ষ্য পরিবর্তন →
                </Link>
              </div>
              <div className="text-right">
                <p
                  className="font-black leading-none"
                  style={{
                    fontSize: 36,
                    color: pct >= 100 ? "#0F6E56" : "#0A4033",
                    textShadow: "0 1px 8px rgba(255,255,255,0.5)",
                  }}
                >
                  {pct}%
                </p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: "#2D7A65" }}>
                  {pct >= 100 ? "লক্ষ্য পূর্ণ হয়েছে 🎉" : "লক্ষ্য পূরণের হার"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Chart + Today Hisab ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>মাসিক বিক্রির লক্ষ্যমাত্রা</h3>
              <p className="text-[11px] mt-0.5" style={{ color: S.muted }}>{formatBDT(monthSales)} বিক্রি, লক্ষ্য {formatBDT(salesTarget > 0 ? salesTarget : monthSales)}</p>
            </div>
            <Link href="/reports" className="text-xs font-medium" style={{ color: S.primary }}>বিস্তারিত →</Link>
          </div>
          <SalesBarChart data={chartData} height={210} />
        </div>

        <div className="rounded-2xl p-5 border flex flex-col" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: S.text }}>আজকের বিবরণ</h3>
          <div className="space-y-2.5 flex-1">
            {/* আয় */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: "#E8F5F0" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#2D7A65" }}>মোট আয়</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: "#0F6E56" }}>{formatBDT(todayIncome)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(15,110,86,0.15)" }}>
                <ArrowUpRight size={18} style={{ color: "#0F6E56" }} />
              </div>
            </div>

            {/* খরচ */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: "#FEF2F2" }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#B91C1C" }}>মোট খরচ</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: "#EF4444" }}>{formatBDT(todayExpense)}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                <ArrowDownRight size={18} style={{ color: "#EF4444" }} />
              </div>
            </div>

            {/* লাভ */}
            <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: S.border }}>
              <span className="text-sm font-bold" style={{ color: S.text }}>নাটকের নাট (লাভ)</span>
              <span className="text-xl font-bold" style={{ color: todayProfit >= 0 ? "#0F6E56" : "#EF4444" }}>
                {formatBDT(todayProfit)}
              </span>
            </div>

            {/* অর্ডার */}
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: S.muted }}>আজকের অর্ডার সংখ্যা</span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                {todayOrderCount}টি
              </span>
            </div>
          </div>
          <Link href="/hisab"
            className="mt-4 block text-center text-xs font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#E8F5F0", color: "#0F6E56" }}>
            বিবরণ দেখুন →
          </Link>
        </div>
      </div>

      {/* ── Recent Orders + Top Products + COD ──────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
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
                  i.comboId ? (i.combo?.name ?? "কমবো") : (i.product?.name ?? "পণ্য")
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
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
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
          </div>

          {/* COD Summary */}
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF3DC" }}>
                <Truck size={14} style={{ color: "#EF9F27" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>COD Summary</h3>
            </div>
            <div className="space-y-2.5">
              <div className="rounded-2xl p-3" style={{ backgroundColor: "#FFF3DC" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#B45309" }}>Courier এ আছে</p>
                    <p className="text-base font-bold mt-0.5" style={{ color: "#EF9F27" }}>{formatBDT(codWithCourierAmount)}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white" style={{ color: "#EF9F27" }}>
                    {codWithCourier.length}টি
                  </span>
                </div>
              </div>
              <div className="rounded-2xl p-3" style={{ backgroundColor: "#E8F5F0" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#2D7A65" }}>Collected (মাস)</p>
                    <p className="text-base font-bold mt-0.5" style={{ color: "#0F6E56" }}>{formatBDT(codCollectedAmount)}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white" style={{ color: "#0F6E56" }}>
                    {codCollectedCount}টি
                  </span>
                </div>
              </div>
            </div>
            <Link href="/orders?codStatus=with_courier"
              className="mt-3 block text-center text-xs font-semibold py-2.5 rounded-xl hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#FFF3DC", color: "#EF9F27" }}>
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
