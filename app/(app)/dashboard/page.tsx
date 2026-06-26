import { Suspense } from "react";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import Link from "next/link";
import {
  Package, ShoppingBag, Users,
  FileText, TrendingDown,
} from "lucide-react";
import FcommerceSecondary, { FcommerceSecondarySkeleton, type FcommerceHeroStats } from "./FcommerceSecondary";
import SetupChecklist from "@/components/SetupChecklist";
import DemoDataBanner from "@/components/DemoDataBanner";
import { T } from "@/lib/theme";
import { loadBusinessDashboard } from "@/lib/dashboard-loaders";

async function renderBusinessDashboard(
  businessType: string,
  props: Record<string, unknown>,
) {
  const Dashboard = await loadBusinessDashboard(businessType);
  if (!Dashboard) return null;
  return <Dashboard {...props} />;
}

export default async function DashboardPage() {
  const { user, shop, subscription } = await requireShop();

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

      return await renderBusinessDashboard("tailor", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
        todaySales,
        todayOrderCount,
        todayProfit,
        pendingCount: activeOrders,
        activeOrders,
        todayDeliveries: todayDeliveries.map((d: any) => ({
          id: d.id,
          client: d.customerName,
          item: d.description,
          advance: d.advanceAmount,
          total: d.totalAmount,
          due: d.dueAmount,
        })),
      });
    }

    if (businessType === "hotel") {
      return await renderBusinessDashboard("hotel", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "garage") {
      return await renderBusinessDashboard("garage", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "lab") {
      return await renderBusinessDashboard("lab", {
        shopName: shop.name,
        userName: user.name ?? "",
      });
    }

    if (businessType === "convention") {
      return await renderBusinessDashboard("convention", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "school") {
      return await renderBusinessDashboard("school", {});
    }

    if (businessType === "farm") {
      return await renderBusinessDashboard("farm", {});
    }

    if (businessType === "hospital") {
      return await renderBusinessDashboard("hospital", {});
    }

    if (businessType === "travel") {
      return await renderBusinessDashboard("travel", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "gym") {
      return await renderBusinessDashboard("gym", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "photography") {
      return await renderBusinessDashboard("photography", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "printing") {
      return await renderBusinessDashboard("printing", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "realestate") {
      return await renderBusinessDashboard("realestate", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "petshop") {
      return await renderBusinessDashboard("petshop", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "electronics") {
      return await renderBusinessDashboard("electronics", {
        shopName: shop.name,
        userName: user.name ?? "",
      });
    }

    if (businessType === "kindergarten") {
      return await renderBusinessDashboard("kindergarten", {});
    }

    if (businessType === "carrental") {
      return await renderBusinessDashboard("carrental", {});
    }

    if (businessType === "legal") {
      return await renderBusinessDashboard("legal", {});
    }

    if (businessType === "spa") {
      return await renderBusinessDashboard("spa", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "catering") {
      return await renderBusinessDashboard("catering", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
      });
    }

    if (businessType === "freelance") {
      return await renderBusinessDashboard("freelance", {});
    }

    if (businessType === "laundry") {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

      const [todayOrderRows, statusRows, todayPayRows, readyOrderRows] = await Promise.all([
        prisma.$queryRaw<{ cnt: bigint }[]>`
          SELECT COUNT(*) AS cnt FROM "LaundryOrder"
          WHERE "shopId" = ${shop.id} AND "createdAt" >= ${todayStart} AND "createdAt" <= ${todayEnd}
        `,
        prisma.$queryRaw<{ status: string; cnt: bigint }[]>`
          SELECT status, COUNT(*) AS cnt FROM "LaundryOrder"
          WHERE "shopId" = ${shop.id} AND status NOT IN ('delivered','cancelled')
          GROUP BY status
        `,
        prisma.$queryRaw<{ total: number }[]>`
          SELECT COALESCE(SUM(lp.amount), 0) AS total
          FROM "LaundryPayment" lp
          JOIN "LaundryOrder" lo ON lo.id = lp."orderId"
          WHERE lo."shopId" = ${shop.id} AND lp."paidAt" >= ${todayStart} AND lp."paidAt" <= ${todayEnd}
        `,
        prisma.$queryRaw<any[]>`
          SELECT id, "orderNumber", "clientName", "clientPhone", "dueAmount", "totalAmount"
          FROM "LaundryOrder"
          WHERE "shopId" = ${shop.id} AND status = 'ready'
          ORDER BY "createdAt" ASC LIMIT 10
        `,
      ]);

      const todayOrders = Number(todayOrderRows[0]?.cnt ?? 0);
      const todayRevenue = Number(todayPayRows[0]?.total ?? 0);
      const getCount = (s: string) => Number(statusRows.find(r => r.status === s)?.cnt ?? 0);

      return await renderBusinessDashboard("laundry", {
        shopName: shop.name,
        userName: user.name ?? "",
        userGender: (user as { gender?: string }).gender ?? null,
        todayOrders,
        inProcessCount: getCount("in_process"),
        readyCount: getCount("ready"),
        todayRevenue,
        receivedCount: getCount("received"),
        outForDeliveryCount: getCount("out_for_delivery"),
        readyOrders: readyOrderRows.map(r => ({
          id: String(r.id), orderNumber: String(r.orderNumber),
          clientName: String(r.clientName), clientPhone: String(r.clientPhone),
          dueAmount: Number(r.dueAmount), totalAmount: Number(r.totalAmount),
        })),
      });
    }

    const baseProps = {
      shopName: shop.name,
      userName: user.name ?? "",
      userGender: (user as { gender?: string }).gender ?? null,
    };

    if (businessType === "restaurant" || businessType === "salon") {
      return await renderBusinessDashboard(businessType, baseProps);
    }

    if (businessType === "pharmacy" || businessType === "retail") {
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

      const todaySales = todayAgg._sum.totalAmount ?? 0;
      const todayOrderCount = todayAgg._count;
      const todayIncome = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const todayExpense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const todayProfit = todayIncome - todayExpense;

      return await renderBusinessDashboard(businessType, {
        ...baseProps,
        todaySales,
        todayOrderCount,
        todayProfit,
        pendingCount,
      });
    }
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <FcommerceBody user={user} shop={shop} subscription={subscription} />
    </Suspense>
  );
}

type DashboardCtx = Awaited<ReturnType<typeof requireShop>>;

async function FcommerceBody({
  user,
  shop,
  subscription,
}: Pick<DashboardCtx, "user" | "shop" | "subscription">) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const [
    todayAgg,
    yesterdayAgg,
    todayTx,
    yesterdayTx,
    pendingCount,
    todayOrderCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { userId: user.id, createdAt: { gte: yesterday, lt: today } },
      _sum: { totalAmount: true }, _count: true,
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: today, lt: tomorrow } },
      select: { type: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: yesterday, lt: today } },
      select: { type: true, amount: true },
    }),
    prisma.order.count({ where: { userId: user.id, status: "pending" } }),
    prisma.order.count({ where: { userId: user.id, createdAt: { gte: today, lt: tomorrow } } }),
  ]);

  const todaySales = todayAgg._sum.totalAmount ?? 0;
  const todayIncome = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const todayExpense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const todayProfit = todayIncome - todayExpense;
  const yesterdaySales = yesterdayAgg._sum.totalAmount ?? 0;
  const yesterdayIncome = yesterdayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const yesterdayExpense = yesterdayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const yesterdayProfit = yesterdayIncome - yesterdayExpense;
  const pctChange = (curr: number, prev: number): number | null =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
  const salesGrowth = pctChange(todaySales, yesterdaySales);
  const profitGrowth = pctChange(todayProfit, yesterdayProfit);

  const heroStats: FcommerceHeroStats = {
    todaySales,
    todayProfit,
    todayIncome,
    todayExpense,
    pendingCount,
    todayOrderCount,
    salesGrowth,
    profitGrowth,
  };

  const greeting =
    user.gender === "আপু" ? `আপু, আস-সালামু আলাইকুম (ٱلسَّلَامُ عَلَيْكُمْ)!` :
    user.gender === "ভাই" ? `ভাইয়া, আস-সালামু আলাইকুম (ٱلسَّلَامُ عَلَيْكُمْ)!` :
    `আস-সালামু আলাইকুম (ٱلسَّلَامُ عَلَيْكُمْ)!`;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* ── Onboarding Setup Checklist ───────────────────────────── */}
      <SetupChecklist />

      {/* ── Demo Data Banner ────────────────────────────────────── */}
      <DemoDataBanner />

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden card-premium"
        style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 45%, #083D31 75%, rgba(212,168,83,0.25) 100%)" }}
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
              {salesGrowth !== null ? (
                <p className="text-[11px] mt-1.5 font-bold" style={{ color: salesGrowth >= 0 ? "#A7F3D0" : "#FECACA" }}>
                  {salesGrowth >= 0 ? "↑" : "↓"} {Math.abs(salesGrowth)}% গতকাল থেকে
                </p>
              ) : (
                <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি অর্ডার</p>
              )}
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের লাভ</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todayProfit)}</p>
              {profitGrowth !== null ? (
                <p className="text-[11px] mt-1.5 font-bold" style={{ color: profitGrowth >= 0 ? "#A7F3D0" : "#FECACA" }}>
                  {profitGrowth >= 0 ? "↑" : "↓"} {Math.abs(profitGrowth)}% গতকাল থেকে
                </p>
              ) : (
                <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান"}</p>
              )}
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">অপেক্ষমান</p>
              <p className="text-white text-2xl font-bold leading-none">{pendingCount}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">অর্ডার বাকি</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {([
          { href: "/orders/new",    icon: ShoppingBag,  label: "নতুন অর্ডার", tint: T.success },
          { href: "/inventory/new", icon: Package,      label: "পণ্য যোগ",    tint: T.info },
          { href: "/customers/new", icon: Users,        label: "গ্রাহক যোগ",  tint: T.purple },
          { href: "/invoices?create=1",  icon: FileText,     label: "ইনভয়েস",      tint: T.warning },
          { href: "/expenses/new",  icon: TrendingDown, label: "খরচ যোগ",    tint: T.danger },
        ] as const).map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl flex-shrink-0 transition-all hover:scale-[1.03] hover:shadow-[var(--shadow-elevated)] active:scale-95 card-stat"
            style={{ minWidth: "88px" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: a.tint.iconBg }}
            >
              <a.icon size={20} style={{ color: a.tint.iconText }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: "var(--c-text)" }}>
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      <Suspense fallback={<FcommerceSecondarySkeleton />}>
        <FcommerceSecondary
          user={user}
          shop={shop}
          subscription={subscription}
          heroStats={heroStats}
        />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  const card = "rounded-2xl border animate-pulse";
  const cardStyle = { backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" };
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* Hero */}
      <div className="rounded-2xl h-36 animate-pulse" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 55%, #083D31 100%)", opacity: 0.5 }} />
      {/* Quick actions */}
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl h-20 w-[88px] flex-shrink-0 animate-pulse" style={cardStyle} />
        ))}
      </div>
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${card} h-24 p-4`} style={cardStyle} />
        ))}
      </div>
      {/* Chart + hisab */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className={`${card} lg:col-span-2 h-64`} style={cardStyle} />
        <div className={`${card} h-64`} style={cardStyle} />
      </div>
      {/* 3-up widgets */}
      <div className="grid lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${card} h-48`} style={cardStyle} />
        ))}
      </div>
    </div>
  );
}
