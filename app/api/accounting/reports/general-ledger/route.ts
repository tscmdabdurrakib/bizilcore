import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getAccountBalance } from "@/lib/accounting/balance";
import { roundMoney } from "@/types/accounting";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const accountId = req.nextUrl.searchParams.get("account_id");
  const startDate = req.nextUrl.searchParams.get("start_date");
  const endDate = req.nextUrl.searchParams.get("end_date");
  if (!accountId) return NextResponse.json({ error: "account_id required" }, { status: 400 });

  const account = await prisma.account.findFirst({
    where: { id: accountId, shopId: shop.id },
  });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const from = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const to = endDate ? new Date(endDate) : new Date();

  const openingBalance = await getAccountBalance(
    accountId,
    shop.id,
    null,
    new Date(from.getTime() - 86400000),
  );

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      shopId: shop.id,
      accountId,
      journalEntry: {
        status: "posted",
        entryDate: { gte: from, lte: to },
      },
    },
    include: {
      journalEntry: { select: { entryNumber: true, entryDate: true, description: true } },
    },
    orderBy: { journalEntry: { entryDate: "asc" } },
  });

  let running = openingBalance;
  const rows = lines.map((l) => {
    const delta =
      account.normalBalance === "debit"
        ? l.debitAmount - l.creditAmount
        : l.creditAmount - l.debitAmount;
    running = roundMoney(running + delta);
    return {
      date: l.journalEntry.entryDate.toISOString().split("T")[0],
      entryNumber: l.journalEntry.entryNumber,
      description: l.description ?? l.journalEntry.description,
      debit: l.debitAmount,
      credit: l.creditAmount,
      runningBalance: running,
    };
  });

  return NextResponse.json({
    account: { code: account.code, name: account.name, normalBalance: account.normalBalance },
    openingBalance: roundMoney(openingBalance),
    rows,
    closingBalance: running,
  });
}
