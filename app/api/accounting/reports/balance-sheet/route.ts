import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getAccountBalance } from "@/lib/accounting/balance";
import { roundMoney } from "@/types/accounting";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const asOf = new Date(req.nextUrl.searchParams.get("as_of_date") ?? Date.now());

  const accounts = await prisma.account.findMany({
    where: { shopId: shop.id, isActive: true },
    orderBy: { code: "asc" },
  });

  const assets: Array<{ code: string; name: string; amount: number }> = [];
  const liabilities: Array<{ code: string; name: string; amount: number }> = [];
  const equity: Array<{ code: string; name: string; amount: number }> = [];

  for (const a of accounts) {
    const bal = await getAccountBalance(a.id, shop.id, null, asOf);
    if (Math.abs(bal) < 0.01) continue;
    const row = { code: a.code, name: a.name, amount: roundMoney(bal) };
    if (a.accountType === "asset") assets.push(row);
    else if (a.accountType === "liability") liabilities.push(row);
    else if (a.accountType === "equity") equity.push(row);
  }

  const totalAssets = roundMoney(assets.reduce((s, r) => s + r.amount, 0));
  const totalLiabilities = roundMoney(liabilities.reduce((s, r) => s + r.amount, 0));
  const totalEquity = roundMoney(equity.reduce((s, r) => s + r.amount, 0));
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  return NextResponse.json({
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    totalEquity,
    totalLiabilitiesAndEquity: roundMoney(totalLiabilities + totalEquity),
    isBalanced,
    asOfDate: asOf.toISOString().split("T")[0],
  });
}
