import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import {
  buildExpenseWhere,
  expenseBaseWhere,
  getShopForUser,
  monthKey,
  pctChange,
} from "@/lib/expenses/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const baseWhere = expenseBaseWhere(shop.id, session.user.id);
  const filteredWhere = buildExpenseWhere(shop.id, session.user.id, { category, from, to });

  const [
    thisMonthAgg,
    lastMonthAgg,
    filteredAgg,
    filteredCount,
    allExpenses,
    monthIncomeAgg,
    budgets,
    categoryGroups,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, date: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: filteredWhere,
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: filteredWhere }),
    prisma.transaction.findMany({
      where: baseWhere,
      select: { amount: true, category: true, date: true },
      orderBy: { date: "desc" },
      take: 500,
    }),
    prisma.transaction.aggregate({
      where: {
        type: "income",
        OR: [{ shopId: shop.id }, { shopId: null, userId: session.user.id }],
        date: { gte: thisMonthStart },
      },
      _sum: { amount: true },
    }),
    prisma.expenseBudget.findMany({
      where: { shopId: shop.id, month: monthKey(now) },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      where: filteredWhere,
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const thisMonthTotal = thisMonthAgg._sum.amount ?? 0;
  const lastMonthTotal = lastMonthAgg._sum.amount ?? 0;
  const monthIncome = monthIncomeAgg._sum.amount ?? 0;

  const monthlyMap: Record<string, number> = {};
  for (const e of allExpenses) {
    const k = monthKey(new Date(e.date));
    monthlyMap[k] = (monthlyMap[k] ?? 0) + e.amount;
  }
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month: month.slice(5), total: Math.round(total) }));

  const topCat = categoryGroups[0];
  const spentByCategory: Record<string, number> = {};
  for (const e of allExpenses) {
    if (new Date(e.date) >= thisMonthStart) {
      const cat = e.category ?? "other";
      spentByCategory[cat] = (spentByCategory[cat] ?? 0) + e.amount;
    }
  }

  const budgetAlerts = budgets
    .map(b => {
      const spent = spentByCategory[b.category] ?? 0;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return { category: b.category, spent, budget: b.amount, pct };
    })
    .filter(b => b.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  return NextResponse.json({
    thisMonthTotal,
    lastMonthTotal,
    monthChangePct: pctChange(thisMonthTotal, lastMonthTotal),
    filteredTotal: filteredAgg._sum.amount ?? 0,
    filteredCount,
    topCategory: topCat?.category ?? null,
    topCategoryAmount: topCat?._sum.amount ?? 0,
    monthIncome,
    monthProfit: monthIncome - thisMonthTotal,
    monthlyTrend,
    categoryBreakdown: categoryGroups.map(g => ({
      category: g.category ?? "other",
      total: g._sum.amount ?? 0,
    })),
    budgetAlerts,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { category, amount, month } = body;
  if (!category || !amount || !month) {
    return NextResponse.json({ error: "category, amount, month required" }, { status: 400 });
  }

  const budget = await prisma.expenseBudget.upsert({
    where: { shopId_category_month: { shopId: shop.id, category, month } },
    create: { shopId: shop.id, category, amount: parseFloat(amount), month },
    update: { amount: parseFloat(amount) },
  });

  return NextResponse.json(budget);
}
