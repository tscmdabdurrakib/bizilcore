import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getAccountBalancesBatch } from "@/lib/accounting/balance";
import { roundMoney } from "@/types/accounting";
import { withTiming } from "@/lib/perf";

export async function GET(req: NextRequest) {
  return withTiming("accounting/profit-loss", async () => {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const skipTrend = searchParams.get("skip_trend") === "1";
  const from = startDate ? new Date(startDate) : null;
  const to = endDate ? new Date(endDate) : null;

  const accounts = await prisma.account.findMany({
    where: { shopId: shop.id, isActive: true },
    orderBy: { code: "asc" },
  });

  const balances = await getAccountBalancesBatch(
    accounts.map((a) => a.id),
    shop.id,
    from,
    to,
  );

  const revenue: Array<{ code: string; name: string; amount: number }> = [];
  const expenses: Array<{ code: string; name: string; amount: number }> = [];
  let cogs = 0;

  for (const a of accounts) {
    const bal = balances.get(a.id) ?? 0;
    if (Math.abs(bal) < 0.01) continue;
    const row = { code: a.code, name: a.name, amount: roundMoney(bal) };
    if (a.accountType === "revenue") revenue.push(row);
    else if (a.accountType === "expense") {
      if (a.code === "5000") cogs = bal;
      else expenses.push(row);
    }
  }

  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) + cogs;
  const grossProfit = totalRevenue - cogs;
  const grossMargin = totalRevenue > 0 ? roundMoney((grossProfit / totalRevenue) * 100) : 0;
  const netProfit = totalRevenue - totalExpenses;

  const monthlyTrend: Array<{ month: string; revenue: number; expense: number }> = [];
  if (!skipTrend) {
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthBalances = await getAccountBalancesBatch(
        accounts.map((a) => a.id),
        shop.id,
        mStart,
        mEnd,
      );
      let rev = 0;
      let exp = 0;
      for (const a of accounts) {
        const bal = monthBalances.get(a.id) ?? 0;
        if (a.accountType === "revenue") rev += bal;
        if (a.accountType === "expense") exp += bal;
      }
      monthlyTrend.push({
        month: mStart.toLocaleDateString("en", { month: "short", year: "2-digit" }),
        revenue: roundMoney(rev),
        expense: roundMoney(exp),
      });
    }
  }

  return NextResponse.json({
    revenue,
    totalRevenue: roundMoney(totalRevenue),
    cogs: roundMoney(cogs),
    grossProfit: roundMoney(grossProfit),
    grossMargin,
    expenses,
    totalExpenses: roundMoney(totalExpenses),
    netProfit: roundMoney(netProfit),
    monthlyTrend,
  });
  });
}
