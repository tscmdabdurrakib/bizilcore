import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import {
  getAccountBalancesBatch,
  getBankAccountBalancesBatch,
} from "@/lib/accounting/balance";
import { roundMoney } from "@/types/accounting";
import { withTiming } from "@/lib/perf";
import { cachedFetch } from "@/lib/redis-cache";
import { CK, TTL } from "@/lib/cache";

const BN_WEEKDAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function dayBounds(dateStr: string): { from: Date; to: Date } {
  const from = new Date(dateStr);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

async function plForRange(
  shopId: string,
  accounts: Array<{ id: string; accountType: string }>,
  from: Date,
  to: Date,
) {
  const balances = await getAccountBalancesBatch(
    accounts.map((a) => a.id),
    shopId,
    from,
    to,
  );
  let totalRevenue = 0;
  let totalExpenses = 0;
  for (const a of accounts) {
    const bal = balances.get(a.id) ?? 0;
    if (Math.abs(bal) < 0.01) continue;
    if (a.accountType === "revenue") totalRevenue += bal;
    else if (a.accountType === "expense") totalExpenses += bal;
  }
  return {
    totalRevenue: roundMoney(totalRevenue),
    netProfit: roundMoney(totalRevenue - totalExpenses),
  };
}

export async function GET() {
  return withTiming("accounting/dashboard-summary", async () => {
    const ctx = await requireAccountingShop();
    if ("error" in ctx) return ctx.error;
    const { shop } = ctx;

    const cacheKey = `${CK.dashboard(shop.id)}:accounting-summary`;
    const payload = await cachedFetch(cacheKey, TTL.ORDERS, async () => {
      const today = new Date();
      const todayStr = isoDate(today);
      const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

      const accounts = await prisma.account.findMany({
        where: { shopId: shop.id, isActive: true },
        select: { id: true, accountType: true },
      });

      const dayRanges = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return isoDate(d);
      });

      const monthFrom = new Date(monthStartStr);
      monthFrom.setHours(0, 0, 0, 0);
      const monthTo = new Date();
      monthTo.setHours(23, 59, 59, 999);

      const todayBounds = dayBounds(todayStr);

      const [todayPl, monthPl, ...dailyPls] = await Promise.all([
        plForRange(shop.id, accounts, todayBounds.from, todayBounds.to),
        plForRange(shop.id, accounts, monthFrom, monthTo),
        ...dayRanges.map((dateStr) => {
          const { from, to } = dayBounds(dateStr);
          return plForRange(shop.id, accounts, from, to);
        }),
      ]);

      const bankAccounts = await prisma.accountingBankAccount.findMany({
        where: { shopId: shop.id },
        select: { id: true },
      });
      const bankBalances = await getBankAccountBalancesBatch(
        bankAccounts.map((b) => b.id),
        shop.id,
      );
      const cashBalance = Array.from(bankBalances.values()).reduce((s, v) => s + v, 0);

      const chart = dayRanges.map((dateStr, i) => {
        const d = new Date(dateStr);
        return {
          day: BN_WEEKDAYS[d.getDay()] ?? dateStr,
          revenue: dailyPls[i]?.totalRevenue ?? 0,
        };
      });

      return {
        todayRevenue: todayPl.totalRevenue,
        monthRevenue: monthPl.totalRevenue,
        monthProfit: monthPl.netProfit,
        cashBalance: roundMoney(cashBalance),
        chart,
      };
    });

    return NextResponse.json(payload);
  });
}
